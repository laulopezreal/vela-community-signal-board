import crypto from 'node:crypto';
import path from 'node:path';
import express from 'express';
import { createDb, makeId, nowTs, slugify } from './db.js';

const app = express();
const db = createDb();
const PORT = Number(process.env.PORT || 5173);
const MAGIC_LINK_TTL_MS = 15 * 60 * 1000;
const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000;

app.use(express.json());

function ensureUserAndOrg(email, orgName = 'Default Organization') {
  const ts = nowTs();
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) throw new Error('email is required');

  let user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);
  if (!user) {
    const userId = makeId('usr');
    db.prepare('INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)').run(userId, normalizedEmail, ts);
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  }

  const orgSlug = slugify(orgName);
  let org = db.prepare('SELECT * FROM organizations WHERE slug = ?').get(orgSlug);
  if (!org) {
    const orgId = makeId('org');
    db.prepare('INSERT INTO organizations (id, slug, name, created_at) VALUES (?, ?, ?, ?)').run(orgId, orgSlug, orgName, ts);
    org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(orgId);
  }

  const existingMembership = db
    .prepare('SELECT id FROM memberships WHERE organization_id = ? AND user_id = ?')
    .get(org.id, user.id);
  if (!existingMembership) {
    db.prepare('INSERT INTO memberships (id, organization_id, user_id, role, created_at) VALUES (?, ?, ?, ?, ?)').run(
      makeId('mbr'),
      org.id,
      user.id,
      'admin',
      ts,
    );
  }

  return { user, org };
}

app.post('/api/auth/request-link', (req, res) => {
  try {
    const { email, orgName } = req.body || {};
    const { user, org } = ensureUserAndOrg(email, orgName);
    const token = crypto.randomBytes(24).toString('hex');
    const ts = nowTs();
    db.prepare('INSERT INTO auth_magic_tokens (token, user_id, organization_id, expires_at, created_at) VALUES (?, ?, ?, ?, ?)').run(
      token,
      user.id,
      org.id,
      ts + MAGIC_LINK_TTL_MS,
      ts,
    );

    res.json({
      ok: true,
      token,
      expiresAt: ts + MAGIC_LINK_TTL_MS,
      note: 'In production this token would be emailed as a magic link.',
    });
  } catch (error) {
    res.status(400).json({ ok: false, error: error.message });
  }
});

app.post('/api/auth/verify', (req, res) => {
  const { token } = req.body || {};
  const row = db.prepare('SELECT * FROM auth_magic_tokens WHERE token = ?').get(String(token || ''));
  if (!row || row.expires_at < nowTs()) {
    return res.status(401).json({ ok: false, error: 'invalid_or_expired_token' });
  }

  db.prepare('DELETE FROM auth_magic_tokens WHERE token = ?').run(row.token);
  const sessionToken = crypto.randomBytes(32).toString('hex');
  const ts = nowTs();
  db.prepare('INSERT INTO auth_sessions (token, user_id, organization_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?)').run(
    sessionToken,
    row.user_id,
    row.organization_id,
    ts,
    ts + SESSION_TTL_MS,
  );

  return res.json({ ok: true, sessionToken, userId: row.user_id, organizationId: row.organization_id });
});

function auth(req, res, next) {
  const bearer = req.headers.authorization || '';
  const token = bearer.startsWith('Bearer ') ? bearer.slice(7).trim() : '';
  const session = db.prepare('SELECT * FROM auth_sessions WHERE token = ?').get(token);
  if (!session || session.expires_at < nowTs()) return res.status(401).json({ ok: false, error: 'unauthorized' });

  const membership = db
    .prepare('SELECT * FROM memberships WHERE organization_id = ? AND user_id = ?')
    .get(session.organization_id, session.user_id);
  if (!membership) return res.status(403).json({ ok: false, error: 'membership_required' });

  req.auth = { userId: session.user_id, organizationId: session.organization_id };
  next();
}

function signalScore(signal) {
  return signal.urgency * 2 + signal.relevance + signal.confidence;
}

app.get('/api/me', auth, (req, res) => {
  const user = db.prepare('SELECT id, email, display_name FROM users WHERE id = ?').get(req.auth.userId);
  const org = db.prepare('SELECT id, slug, name FROM organizations WHERE id = ?').get(req.auth.organizationId);
  res.json({ ok: true, user, organization: org });
});

app.get('/api/signals', auth, (req, res) => {
  const { category, minUrgency = 0, search = '', sortBy = 'score', order = 'desc' } = req.query;
  const rows = db
    .prepare('SELECT * FROM signals WHERE organization_id = ?')
    .all(req.auth.organizationId)
    .filter((row) => (!category || category === 'all' ? true : row.category === category))
    .filter((row) => Number(row.urgency) >= Number(minUrgency || 0))
    .filter((row) => {
      const q = String(search || '').trim().toLowerCase();
      if (!q) return true;
      return row.title.toLowerCase().includes(q) || row.source.toLowerCase().includes(q) || row.owner.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const dir = String(order).toLowerCase() === 'asc' ? 1 : -1;
      if (sortBy === 'createdAt') return dir * (a.created_at - b.created_at);
      if (sortBy === 'urgency') return dir * (a.urgency - b.urgency);
      if (sortBy === 'relevance') return dir * (a.relevance - b.relevance);
      if (sortBy === 'confidence') return dir * (a.confidence - b.confidence);
      return dir * (signalScore(a) - signalScore(b));
    });

  res.json({ ok: true, items: rows.map((row) => ({ ...row, score: signalScore(row) })) });
});

app.get('/api/signals/filters', auth, (req, res) => {
  const categories = db
    .prepare('SELECT DISTINCT category FROM signals WHERE organization_id = ? ORDER BY category ASC')
    .all(req.auth.organizationId)
    .map((r) => r.category);
  res.json({ ok: true, categories, sortOptions: ['score', 'createdAt', 'urgency', 'relevance', 'confidence'] });
});

app.post('/api/signals', auth, (req, res) => {
  const payload = req.body || {};
  if (!payload.title || !payload.source) return res.status(400).json({ ok: false, error: 'title_and_source_required' });
  const ts = nowTs();
  const signal = {
    id: makeId('sig'),
    organization_id: req.auth.organizationId,
    title: String(payload.title).trim(),
    source: String(payload.source).trim(),
    category: String(payload.category || 'Opportunity').trim(),
    urgency: Math.max(1, Math.min(5, Number(payload.urgency || 3))),
    relevance: Math.max(1, Math.min(5, Number(payload.relevance || 3))),
    confidence: Math.max(1, Math.min(5, Number(payload.confidence || 3))),
    owner: String(payload.owner || 'Unassigned').trim() || 'Unassigned',
    created_at: ts,
    updated_at: ts,
    created_by_user_id: req.auth.userId,
  };

  db.prepare(
    `INSERT INTO signals (id, organization_id, title, source, category, urgency, relevance, confidence, owner, created_at, updated_at, created_by_user_id)
     VALUES (@id, @organization_id, @title, @source, @category, @urgency, @relevance, @confidence, @owner, @created_at, @updated_at, @created_by_user_id)`,
  ).run(signal);
  db.prepare('INSERT INTO signal_actions (id, signal_id, organization_id, action_type, actor_user_id, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    makeId('act'),
    signal.id,
    req.auth.organizationId,
    'created',
    req.auth.userId,
    JSON.stringify(signal),
    ts,
  );

  res.status(201).json({ ok: true, item: { ...signal, score: signalScore(signal) } });
});

app.patch('/api/signals/:id', auth, (req, res) => {
  const existing = db
    .prepare('SELECT * FROM signals WHERE id = ? AND organization_id = ?')
    .get(req.params.id, req.auth.organizationId);
  if (!existing) return res.status(404).json({ ok: false, error: 'not_found' });

  const updates = {
    ...existing,
    ...req.body,
    updated_at: nowTs(),
  };
  db.prepare(
    `UPDATE signals
      SET title = ?, source = ?, category = ?, urgency = ?, relevance = ?, confidence = ?, owner = ?, updated_at = ?
      WHERE id = ? AND organization_id = ?`,
  ).run(
    String(updates.title).trim(),
    String(updates.source).trim(),
    String(updates.category || 'Opportunity').trim(),
    Math.max(1, Math.min(5, Number(updates.urgency || 3))),
    Math.max(1, Math.min(5, Number(updates.relevance || 3))),
    Math.max(1, Math.min(5, Number(updates.confidence || 3))),
    String(updates.owner || 'Unassigned').trim() || 'Unassigned',
    updates.updated_at,
    req.params.id,
    req.auth.organizationId,
  );

  db.prepare('INSERT INTO signal_actions (id, signal_id, organization_id, action_type, actor_user_id, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    makeId('act'),
    req.params.id,
    req.auth.organizationId,
    'updated',
    req.auth.userId,
    JSON.stringify(req.body || {}),
    nowTs(),
  );

  const row = db.prepare('SELECT * FROM signals WHERE id = ?').get(req.params.id);
  return res.json({ ok: true, item: { ...row, score: signalScore(row) } });
});

app.delete('/api/signals/:id', auth, (req, res) => {
  const existing = db
    .prepare('SELECT id FROM signals WHERE id = ? AND organization_id = ?')
    .get(req.params.id, req.auth.organizationId);
  if (!existing) return res.status(404).json({ ok: false, error: 'not_found' });

  db.prepare('DELETE FROM signals WHERE id = ? AND organization_id = ?').run(req.params.id, req.auth.organizationId);
  db.prepare('INSERT INTO signal_actions (id, signal_id, organization_id, action_type, actor_user_id, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    makeId('act'),
    req.params.id,
    req.auth.organizationId,
    'deleted',
    req.auth.userId,
    '{}',
    nowTs(),
  );
  res.json({ ok: true });
});

function buildDigestLines(items, date = new Date().toISOString().slice(0, 10)) {
  return [
    `# Community Signal Digest (${date})`,
    '',
    ...items.map((item, idx) => `${idx + 1}. [${item.category}] ${item.title} — owner ${item.owner} (score ${signalScore(item)})`),
  ];
}

app.post('/api/digests/generate', auth, (req, res) => {
  const format = req.body?.format || 'markdown';
  const items = db
    .prepare('SELECT * FROM signals WHERE organization_id = ? ORDER BY created_at DESC')
    .all(req.auth.organizationId);
  const lines = buildDigestLines(items);
  const content = format === 'json' ? JSON.stringify({ items }, null, 2) : lines.join('\n');
  const ts = nowTs();
  const exportId = makeId('dgt');

  db.prepare(
    'INSERT INTO digest_exports (id, organization_id, generated_by_user_id, format, content, metadata_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(exportId, req.auth.organizationId, req.auth.userId, format, content, JSON.stringify({ count: items.length }), ts);

  res.json({ ok: true, exportId, format, content });
});

app.use(express.static(path.join(process.cwd(), 'app')));

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Signal Board server listening on http://localhost:${PORT}`);
});

import fs from 'node:fs';
import path from 'node:path';
import { createDb, makeId, nowTs, slugify } from '../db.js';

const fileArg = process.argv[2];
if (!fileArg) {
  console.error('Usage: npm run import:local-export -- <path-to-local-export.json> [org-name] [user-email]');
  process.exit(1);
}

const orgName = process.argv[3] || 'Imported Organization';
const userEmail = (process.argv[4] || 'importer@local.dev').toLowerCase();
const filePath = path.resolve(process.cwd(), fileArg);
const raw = fs.readFileSync(filePath, 'utf8');
const parsed = JSON.parse(raw);
const items = Array.isArray(parsed) ? parsed : Array.isArray(parsed.items) ? parsed.items : [];

const db = createDb();
const ts = nowTs();

let user = db.prepare('SELECT * FROM users WHERE email = ?').get(userEmail);
if (!user) {
  const userId = makeId('usr');
  db.prepare('INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)').run(userId, userEmail, ts);
  user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
}

const orgSlug = slugify(orgName);
let org = db.prepare('SELECT * FROM organizations WHERE slug = ?').get(orgSlug);
if (!org) {
  const orgId = makeId('org');
  db.prepare('INSERT INTO organizations (id, slug, name, created_at) VALUES (?, ?, ?, ?)').run(orgId, orgSlug, orgName, ts);
  org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(orgId);
}

const membership = db.prepare('SELECT id FROM memberships WHERE organization_id = ? AND user_id = ?').get(org.id, user.id);
if (!membership) {
  db.prepare('INSERT INTO memberships (id, organization_id, user_id, role, created_at) VALUES (?, ?, ?, ?, ?)').run(
    makeId('mbr'),
    org.id,
    user.id,
    'admin',
    ts,
  );
}

const insertSignal = db.prepare(
  `INSERT INTO signals (id, organization_id, title, source, category, urgency, relevance, confidence, owner, created_at, updated_at, created_by_user_id)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
);

let inserted = 0;
for (const item of items) {
  const title = String(item.title || '').trim();
  const source = String(item.source || '').trim();
  if (!title || !source) continue;

  const createdAt = Number.isFinite(Number(item.createdAt)) ? Number(item.createdAt) : ts;
  insertSignal.run(
    makeId('sig'),
    org.id,
    title,
    source,
    String(item.category || 'Opportunity'),
    Math.max(1, Math.min(5, Number(item.urgency || 3))),
    Math.max(1, Math.min(5, Number(item.relevance || 3))),
    Math.max(1, Math.min(5, Number(item.confidence || 3))),
    String(item.owner || 'Unassigned'),
    createdAt,
    ts,
    user.id,
  );
  inserted += 1;
}

console.log(`Imported ${inserted} signal(s) into org '${org.name}' (${org.id}) from ${filePath}`);
db.close();

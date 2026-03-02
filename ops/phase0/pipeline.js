const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const STORE_PATH = path.resolve(__dirname, '../../data/phase0/store.json');
const OWNER_BY_DIM = {
  Revenue: 'Growth lead',
  Product: 'Product lead',
  Risk: 'Operations lead',
  Leverage: 'Community lead',
};

function hash(input) {
  return crypto.createHash('sha256').update(String(input)).digest('hex');
}

function clamp(value, min = 1, max = 5, fallback = 1) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function containsAny(text, words) {
  const t = String(text || '').toLowerCase();
  return words.some((w) => t.includes(w));
}

function scoreRubric(content, reactionCount = 0) {
  let revenue = 2;
  let product = 2;
  let risk = 1;
  let leverage = 2;

  if (containsAny(content, ['grant', 'sponsor', 'paid', 'revenue', 'client', 'deal', 'intro'])) revenue += 2;
  if (containsAny(content, ['bug', 'roadmap', 'release', 'integration', 'product', 'feature', 'parser', 'schema'])) product += 2;
  if (containsAny(content, ['risk', 'blocked', 'pause', 'incident', 'urgent', 'outage', 'deadline', 'asap'])) risk += 2;
  if (containsAny(content, ['template', 'automation', 'playbook', 'process', 'repeatable', 'scale'])) leverage += 2;
  if (Number(reactionCount) >= 5) leverage += 1;

  revenue = clamp(revenue);
  product = clamp(product);
  risk = clamp(risk);
  leverage = clamp(leverage);

  const urgency = risk;
  const relevance = Math.max(revenue, product);
  const confidence = clamp(2 + (Number(reactionCount) >= 3 ? 1 : 0) + (Number(reactionCount) >= 6 ? 1 : 0));

  const score = urgency * 2 + relevance + confidence;
  const weighted = Number((revenue * 0.35 + product * 0.25 + risk * 0.25 + leverage * 0.15).toFixed(2));

  return { revenue, product, risk, leverage, urgency, relevance, confidence, score, weighted };
}

function primaryDimension(rubric) {
  return [
    ['Revenue', rubric.revenue],
    ['Product', rubric.product],
    ['Risk', rubric.risk],
    ['Leverage', rubric.leverage],
  ].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
}

function normalizeDiscordRawEvent(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = String(raw.id || '').trim();
  const content = String(raw.content || '').trim();
  const createdAtMs = new Date(raw.createdAt).getTime();
  if (!id || !content || !Number.isFinite(createdAtMs)) return null;

  const rubric = scoreRubric(content, raw.reactionCount || 0);
  const dim = primaryDimension(rubric);

  return {
    signalId: `sig_${hash(id).slice(0, 12)}`,
    externalId: `discord:${id}`,
    threadId: String(raw.threadId || id),
    source: String(raw.channel || 'Discord #unknown'),
    title: content.length > 120 ? `${content.slice(0, 117)}...` : content,
    content,
    createdAt: new Date(createdAtMs).toISOString(),
    owner: OWNER_BY_DIM[dim],
    ...rubric,
  };
}

function buildDecisions(rankedSignals) {
  const now = Date.now();
  return rankedSignals.slice(0, 5).map((s, idx) => ({
    decisionId: `dec_${s.signalId}`,
    signalId: s.signalId,
    owner: s.owner,
    action: s.risk >= 4
      ? 'Open mitigation thread and assign fallback owner'
      : s.revenue >= 4
        ? 'Send outreach and secure decision call'
        : s.product >= 4
          ? 'Create implementation ticket with acceptance criteria'
          : 'Triage in standup and monitor for escalation',
    deadline: new Date(now + (idx + 1) * 2 * 60 * 60 * 1000).toISOString(),
    expectedMetric: s.risk >= 4 ? 'missed-critical-risk alerts: down' : 'qualified opportunities/week: up',
    weightedScore: s.weighted,
  }));
}

function ensureStoreDir() {
  fs.mkdirSync(path.dirname(STORE_PATH), { recursive: true });
}

function loadStore() {
  ensureStoreDir();
  if (!fs.existsSync(STORE_PATH)) {
    return { ingestedAt: null, events: [], normalizedSignals: [], board: { rankedSignals: [], decisions: [] } };
  }
  return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
}

function saveStore(store) {
  ensureStoreDir();
  fs.writeFileSync(STORE_PATH, `${JSON.stringify(store, null, 2)}\n`, 'utf8');
}

function ingestDiscordEvents(rawEvents) {
  const incoming = Array.isArray(rawEvents) ? rawEvents : [rawEvents];
  const validEvents = incoming.filter(Boolean);

  const store = loadStore();
  const mergedEvents = [...store.events, ...validEvents];

  const seen = new Set();
  const normalizedSignals = [];
  for (const event of mergedEvents) {
    const normalized = normalizeDiscordRawEvent(event);
    if (!normalized) continue;
    if (seen.has(normalized.externalId)) continue;
    seen.add(normalized.externalId);
    normalizedSignals.push(normalized);
  }

  const rankedSignals = normalizedSignals.sort((a, b) => b.weighted - a.weighted || b.score - a.score || b.createdAt.localeCompare(a.createdAt));
  const decisions = buildDecisions(rankedSignals);

  const nextStore = {
    ingestedAt: new Date().toISOString(),
    events: mergedEvents,
    normalizedSignals,
    board: { rankedSignals, decisions },
  };

  saveStore(nextStore);

  return {
    accepted: validEvents.length,
    normalized: normalizedSignals.length,
    ranked: rankedSignals.length,
    decisions: decisions.length,
  };
}

module.exports = {
  STORE_PATH,
  loadStore,
  ingestDiscordEvents,
};

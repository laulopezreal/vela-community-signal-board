const crypto = require('crypto');

const OWNER_MAP = {
  Revenue: 'Growth lead',
  Product: 'Product lead',
  Risk: 'Operations lead',
  Leverage: 'Community lead',
};

const STOP_WORDS = new Set(['the', 'a', 'an', 'for', 'to', 'and', 'of', 'in', 'on', 'is', 'are', 'with', 'by']);

function clamp(value, min = 1, max = 5, fallback = 1) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function toIsoSafe(v) {
  const t = new Date(v).getTime();
  if (!Number.isFinite(t)) return null;
  return new Date(t).toISOString();
}

function hash(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex');
}

function cleanText(text) {
  return String(text || '').replace(/\s+/g, ' ').trim();
}

function tokenize(text) {
  return cleanText(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((x) => x && !STOP_WORDS.has(x));
}

function fingerprint(text) {
  const tokens = [...new Set(tokenize(text))].sort();
  return tokens.slice(0, 10).join(' ');
}

function containsAny(text, words) {
  const t = text.toLowerCase();
  return words.some((w) => t.includes(w));
}

function scoreRubric(title, content, reactions = 0) {
  const text = `${title} ${content}`.toLowerCase();

  let revenue = 2;
  let product = 2;
  let risk = 1;
  let leverage = 2;

  if (containsAny(text, ['grant', 'sponsor', 'paid', 'revenue', 'client', 'deal', 'intro'])) revenue += 2;
  if (containsAny(text, ['bug', 'roadmap', 'release', 'integration', 'product', 'feature'])) product += 2;
  if (containsAny(text, ['risk', 'blocked', 'pause', 'incident', 'urgent', 'outage', 'deadline'])) risk += 2;
  if (containsAny(text, ['template', 'automation', 'playbook', 'process', 'repeatable', 'scale'])) leverage += 2;

  if (reactions >= 5) leverage += 1;
  if (containsAny(text, ['today', 'tonight', 'now', 'asap'])) risk += 1;

  revenue = clamp(revenue);
  product = clamp(product);
  risk = clamp(risk);
  leverage = clamp(leverage);

  const weighted = Number((revenue * 0.35 + product * 0.25 + risk * 0.25 + leverage * 0.15).toFixed(2));
  const weighted100 = Number((weighted * 20).toFixed(1));

  return { revenue, product, risk, leverage, weighted, weighted100 };
}

function findPrimaryDimension(s) {
  const dims = [
    ['Revenue', s.revenue],
    ['Product', s.product],
    ['Risk', s.risk],
    ['Leverage', s.leverage],
  ].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return dims[0][0];
}

function chooseAction(signal) {
  if (signal.risk >= 4) return 'Open mitigation thread and assign fallback owner';
  if (signal.revenue >= 4) return 'Send outreach and secure decision call';
  if (signal.product >= 4) return 'Create implementation ticket with acceptance criteria';
  if (signal.leverage >= 4) return 'Turn into repeatable SOP and broadcast to operators';
  return 'Triage in standup and monitor for escalation';
}

function expectedMetric(signal) {
  if (signal.risk >= 4) return 'missed-critical-risk alerts: down';
  if (signal.revenue >= 4) return 'qualified opportunities/week: up';
  if (signal.product >= 4) return 'decision-to-delivery lead time: down';
  if (signal.leverage >= 4) return 'repeatable decisions reused/week: up';
  return 'triage latency: down';
}

function buildDecisions(ranked, now = new Date()) {
  return ranked.slice(0, 5).map((s, idx) => {
    const deadline = new Date(now.getTime() + (idx + 1) * 2 * 60 * 60 * 1000).toISOString();
    return {
      decisionId: `dec_${s.signalId}`,
      signalId: s.signalId,
      owner: s.ownerHint || OWNER_MAP[s.primaryDimension] || 'Unassigned',
      action: chooseAction(s),
      deadline,
      expectedMetric: expectedMetric(s),
      weightedScore: s.weighted,
      rubric: {
        revenue: s.revenue,
        product: s.product,
        risk: s.risk,
        leverage: s.leverage,
      },
    };
  });
}

module.exports = {
  OWNER_MAP,
  clamp,
  toIsoSafe,
  hash,
  cleanText,
  fingerprint,
  scoreRubric,
  findPrimaryDimension,
  chooseAction,
  expectedMetric,
  buildDecisions,
};

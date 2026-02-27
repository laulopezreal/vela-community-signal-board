const STORAGE_KEY = 'community-signal-board-v1';
const FORM_DRAFT_KEY = 'community-signal-board-form-draft-v1';

const TEMPLATE_PRESETS = {
  startup: {
    source: 'Founder Slack',
    category: 'Opportunity',
    urgency: 4,
    relevance: 4,
    confidence: 3,
    owner: 'Growth lead',
  },
  oss: {
    source: 'GitHub + Discord',
    category: 'Tool',
    urgency: 3,
    relevance: 5,
    confidence: 4,
    owner: 'Maintainer on-call',
  },
  'local-org': {
    source: 'Meetup + WhatsApp',
    category: 'Event',
    urgency: 4,
    relevance: 3,
    confidence: 3,
    owner: 'Community manager',
  },
};

const DEMO_SCENARIO_ITEMS = [
  {
    title: 'Grant call closes tonight for community tooling',
    source: 'Email digest',
    category: 'Funding',
    urgency: 5,
    relevance: 4,
    confidence: 4,
    owner: 'Ops lead',
    createdAt: Date.parse('2026-02-27T09:10:00Z'),
  },
  {
    title: 'AI safety workshop requests 2 startup mentors',
    source: 'Founder Slack',
    category: 'Opportunity',
    urgency: 4,
    relevance: 5,
    confidence: 4,
    owner: 'Partnerships',
    createdAt: Date.parse('2026-02-27T08:50:00Z'),
  },
  {
    title: 'Partner community opening senior ML role',
    source: 'WhatsApp group',
    category: 'Hiring',
    urgency: 4,
    relevance: 4,
    confidence: 3,
    owner: 'Talent lead',
    createdAt: Date.parse('2026-02-27T08:20:00Z'),
  },
  {
    title: 'Open-source observability tool launches beta',
    source: 'X/Twitter',
    category: 'Tool',
    urgency: 3,
    relevance: 4,
    confidence: 3,
    owner: 'Tech lead',
    createdAt: Date.parse('2026-02-27T07:50:00Z'),
  },
];

function safeLoadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = JSON.parse(raw || '[]');
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => ({
        id: typeof item.id === 'string' ? item.id : `legacy-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: cleanText(String(item.title || '')),
        source: cleanText(String(item.source || '')),
        category: ['Opportunity', 'Funding', 'Event', 'Tool', 'Hiring'].includes(item.category)
          ? item.category
          : 'Opportunity',
        urgency: clampInt(item.urgency, 1, 5, 3),
        relevance: clampInt(item.relevance, 1, 5, 3),
        confidence: clampInt(item.confidence, 1, 5, 3),
        owner: cleanText(String(item.owner || '')) || 'Unassigned',
        createdAt: Number.isFinite(Number(item.createdAt)) ? Number(item.createdAt) : Date.now(),
      }))
      .filter((item) => item.title && item.source);
  } catch {
    return [];
  }
}

const state = {
  items: safeLoadItems(),
  filterCategory: 'all',
  filterUrgency: 0,
  search: '',
};

const els = {
  form: document.getElementById('signal-form'),
  title: document.getElementById('title'),
  source: document.getElementById('source'),
  category: document.getElementById('category'),
  urgency: document.getElementById('urgency'),
  relevance: document.getElementById('relevance'),
  confidence: document.getElementById('confidence'),
  owner: document.getElementById('owner'),
  template: document.getElementById('community-template'),
  applyTemplate: document.getElementById('apply-template'),
  search: document.getElementById('search'),
  filterCategory: document.getElementById('filter-category'),
  filterUrgency: document.getElementById('filter-urgency'),
  clearFilters: document.getElementById('clear-filters'),
  loadDemo: document.getElementById('load-demo'),
  list: document.getElementById('signal-list'),
  empty: document.getElementById('empty'),
  emptyCopy: document.getElementById('empty-copy'),
  exportBtn: document.getElementById('export-digest'),
  briefBtn: document.getElementById('generate-brief'),
  copyBriefBtn: document.getElementById('copy-brief'),
  runHealthBtn: document.getElementById('run-health-check'),
  healthStatus: document.getElementById('health-status'),
  tpl: document.getElementById('item-template'),
  statTotal: document.getElementById('stat-total'),
  statHigh: document.getElementById('stat-high'),
  statAvg: document.getElementById('stat-avg'),
  statAssigned: document.getElementById('stat-assigned'),
  toast: document.getElementById('toast'),
};

function score(item) {
  return item.urgency * 2 + item.relevance + item.confidence;
}

function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function cleanText(value) {
  return value.trim().replace(/\s+/g, ' ');
}

function formatRelativeTime(ts) {
  const deltaMs = Date.now() - Number(ts || 0);
  const mins = Math.max(1, Math.floor(deltaMs / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function loadFormDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(FORM_DRAFT_KEY) || '{}');
    if (!draft || typeof draft !== 'object') return;
    els.title.value = typeof draft.title === 'string' ? draft.title : '';
    els.source.value = typeof draft.source === 'string' ? draft.source : '';
    els.category.value = typeof draft.category === 'string' ? draft.category : 'Opportunity';
    els.urgency.value = String(clampInt(draft.urgency, 1, 5, 3));
    els.relevance.value = String(clampInt(draft.relevance, 1, 5, 3));
    els.confidence.value = String(clampInt(draft.confidence, 1, 5, 3));
    els.owner.value = typeof draft.owner === 'string' ? draft.owner : '';
  } catch {
    localStorage.removeItem(FORM_DRAFT_KEY);
  }
}

function saveFormDraft() {
  const draft = {
    title: els.title.value,
    source: els.source.value,
    category: els.category.value,
    urgency: els.urgency.value,
    relevance: els.relevance.value,
    confidence: els.confidence.value,
    owner: els.owner.value,
  };
  localStorage.setItem(FORM_DRAFT_KEY, JSON.stringify(draft));
}

let toastTimer;
function showToast(text) {
  if (!els.toast) return;
  els.toast.textContent = text;
  els.toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    els.toast.classList.remove('show');
  }, 1500);
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
}

function sortedFilteredItems() {
  const q = state.search.trim().toLowerCase();

  return state.items
    .filter((i) => state.filterCategory === 'all' || i.category === state.filterCategory)
    .filter((i) => i.urgency >= state.filterUrgency)
    .filter((i) => !q || i.title.toLowerCase().includes(q) || i.source.toLowerCase().includes(q))
    .sort((a, b) => score(b) - score(a) || b.createdAt - a.createdAt);
}

function renderStats() {
  const total = state.items.length;
  const highUrgency = state.items.filter((x) => x.urgency >= 4).length;
  const avgScore = total ? (state.items.reduce((acc, x) => acc + score(x), 0) / total).toFixed(1) : '0.0';
  const assigned = state.items.filter((x) => x.owner && x.owner !== 'Unassigned').length;

  if (els.statTotal) els.statTotal.textContent = String(total);
  if (els.statHigh) els.statHigh.textContent = String(highUrgency);
  if (els.statAvg) els.statAvg.textContent = String(avgScore);
  if (els.statAssigned) els.statAssigned.textContent = String(assigned);
}

function scoreBand(item) {
  const total = score(item);
  if (total >= 16) return 'critical';
  if (total >= 13) return 'high';
  if (total >= 10) return 'medium';
  return 'low';
}

function render() {
  const items = sortedFilteredItems();
  els.list.innerHTML = '';

  const showEmpty = !items.length;
  els.empty.style.display = showEmpty ? 'block' : 'none';
  if (showEmpty && els.emptyCopy) {
    const noItems = state.items.length === 0;
    els.emptyCopy.textContent = noItems
      ? 'Add your first high-signal update to start ranking opportunities.'
      : 'No signals match the current filters. Clear filters or adjust search terms.';
  }

  items.forEach((item) => {
    const node = els.tpl.content.cloneNode(true);
    node.querySelector('.item-title').textContent = item.title;
    node.querySelector('.item-meta').textContent = `${item.category} • ${item.source} • owner ${item.owner}`;
    node.querySelector('.item-metrics').textContent = `Urgency ${item.urgency} • Relevance ${item.relevance} • Confidence ${item.confidence} • ${formatRelativeTime(item.createdAt)}`;

    const scoreEl = node.querySelector('.score');
    scoreEl.textContent = `Score ${score(item)}`;
    scoreEl.classList.add(`score-${scoreBand(item)}`);

    const deleteBtn = node.querySelector('.delete');
    deleteBtn.title = `Delete signal: ${item.title}`;
    deleteBtn.setAttribute('aria-label', `Delete signal: ${item.title}`);
    deleteBtn.addEventListener('click', () => {
      state.items = state.items.filter((x) => x.id !== item.id);
      persist();
      render();
      showToast('Signal removed');
    });
    els.list.appendChild(node);
  });

  renderStats();
}

function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function applyTemplatePreset() {
  const key = els.template?.value;
  if (!key) {
    showToast('Select a template first');
    return;
  }

  const preset = TEMPLATE_PRESETS[key];
  if (!preset) {
    showToast('Template not found');
    return;
  }

  els.source.value = preset.source;
  els.category.value = preset.category;
  els.urgency.value = String(preset.urgency);
  els.relevance.value = String(preset.relevance);
  els.confidence.value = String(preset.confidence);
  els.owner.value = preset.owner;
  showToast('Template applied');
}

function loadDemoScenario() {
  state.items = DEMO_SCENARIO_ITEMS.map((item, idx) => ({
    ...item,
    id: `demo-${idx + 1}`,
  }));

  state.search = '';
  state.filterCategory = 'all';
  state.filterUrgency = 0;
  els.search.value = '';
  els.filterCategory.value = 'all';
  els.filterUrgency.value = '0';

  localStorage.removeItem(FORM_DRAFT_KEY);
  persist();
  render();
  showToast('Demo scenario loaded');
}

function addItem(evt) {
  evt.preventDefault();
  const item = {
    id: makeId(),
    title: cleanText(els.title.value),
    source: cleanText(els.source.value),
    category: els.category.value,
    urgency: clampInt(els.urgency.value, 1, 5, 3),
    relevance: clampInt(els.relevance.value, 1, 5, 3),
    confidence: clampInt(els.confidence.value, 1, 5, 3),
    owner: cleanText(els.owner.value) || 'Unassigned',
    createdAt: Date.now(),
  };

  if (!item.title || !item.source) {
    showToast('Title and source are required');
    return;
  }

  const isDuplicate = state.items.some(
    (x) => x.title.toLowerCase() === item.title.toLowerCase() && x.source.toLowerCase() === item.source.toLowerCase(),
  );

  if (isDuplicate) {
    showToast('Similar signal already exists');
    return;
  }

  state.items.push(item);
  persist();
  els.form.reset();
  els.urgency.value = 3;
  els.relevance.value = 3;
  els.confidence.value = 3;
  localStorage.removeItem(FORM_DRAFT_KEY);
  render();
  showToast('Signal added');
}

function recommendationFor(item) {
  if (item.urgency >= 5) return 'Act now: assign owner and post to core channel in the next 30 minutes.';
  if (item.category === 'Funding') return 'Check eligibility and draft application notes before end of day.';
  if (item.category === 'Hiring') return 'Share with hiring lead and capture candidate/referral deadline.';
  if (item.category === 'Event') return 'Confirm attendance window and who will represent the community.';
  if (item.category === 'Opportunity') return 'Validate fit and send outreach while signal is still fresh.';
  return 'Log next step and owner for tomorrow morning standup.';
}

function buildBriefLines(items) {
  const date = new Date().toISOString().slice(0, 10);
  const topItems = items.slice(0, 5);
  const lines = [
    `# Daily Community Brief (${date})`,
    '',
    '## Priority Signals',
    ...topItems.map((item, idx) => `${idx + 1}. **${item.title}** (${item.category})\n   - Source: ${item.source}\n   - Owner: ${item.owner}\n   - Score: ${score(item)} (Urgency ${item.urgency} • Relevance ${item.relevance} • Confidence ${item.confidence})`),
    '',
    '## Recommended Actions',
    ...topItems.map((item, idx) => `${idx + 1}. ${recommendationFor(item)}`),
  ];

  return { date, lines };
}

function generateDailyBrief() {
  const items = sortedFilteredItems();
  if (!items.length) {
    showToast('No signals available for brief');
    return;
  }

  const { date, lines } = buildBriefLines(items);
  const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `community-daily-brief-${date}.md`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Daily brief generated');
}

async function copyTopActions() {
  const items = sortedFilteredItems();
  if (!items.length) {
    showToast('No signals available to copy');
    return;
  }

  const text = buildBriefLines(items).lines.join('\n');
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      showToast('Top actions copied');
      return;
    }
  } catch {
    // fallback below
  }

  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  showToast('Top actions copied');
}

function exportDigest() {
  const items = sortedFilteredItems();
  if (!items.length) {
    showToast('No signals to export');
    return;
  }

  const date = new Date().toISOString().slice(0, 10);
  const lines = [
    `# Community Signal Digest (${date})`,
    '',
    ...items.map((item, idx) => `${idx + 1}. **${item.title}** (${item.category})\n   - Source: ${item.source}\n   - Owner: ${item.owner}\n   - Urgency: ${item.urgency} | Relevance: ${item.relevance} | Confidence: ${item.confidence} | Score: ${score(item)}`),
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `community-signal-digest-${date}.md`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Digest exported');
}

function setHealthStatus(text, level = 'pass') {
  if (!els.healthStatus) return;
  els.healthStatus.textContent = text;
  els.healthStatus.classList.remove('is-pass', 'is-warn', 'is-fail');
  els.healthStatus.classList.add(`is-${level}`);
}

function runHealthCheck() {
  const checks = [];

  try {
    const key = '__csb_health__';
    localStorage.setItem(key, 'ok');
    const ok = localStorage.getItem(key) === 'ok';
    localStorage.removeItem(key);
    checks.push({ name: 'Storage roundtrip', ok });
  } catch {
    checks.push({ name: 'Storage roundtrip', ok: false });
  }

  const demoTop = [...DEMO_SCENARIO_ITEMS].sort((a, b) => score(b) - score(a) || b.createdAt - a.createdAt)[0]?.title;
  checks.push({ name: 'Deterministic demo ranking', ok: demoTop === 'Grant call closes tonight for community tooling' });

  checks.push({ name: 'Export capability', ok: typeof Blob !== 'undefined' && typeof URL?.createObjectURL === 'function' });
  checks.push({ name: 'Core crypto/id support', ok: !!(globalThis.crypto?.randomUUID || globalThis.crypto?.getRandomValues) });

  const passCount = checks.filter((x) => x.ok).length;
  const corePass = passCount === checks.length;
  const level = corePass ? 'pass' : passCount >= checks.length - 1 ? 'warn' : 'fail';

  setHealthStatus(`Health ${corePass ? 'PASS' : 'ATTENTION'} • ${passCount}/${checks.length} checks passed`, level);
  showToast(corePass ? 'Health check passed' : 'Health check found issues');
}

els.form.addEventListener('submit', addItem);
els.form.addEventListener('input', saveFormDraft);
els.search.addEventListener('input', (e) => {
  state.search = e.target.value;
  render();
});
els.filterCategory.addEventListener('change', (e) => {
  state.filterCategory = e.target.value;
  render();
});
els.filterUrgency.addEventListener('change', (e) => {
  state.filterUrgency = Number(e.target.value);
  render();
});
els.clearFilters.addEventListener('click', () => {
  state.search = '';
  state.filterCategory = 'all';
  state.filterUrgency = 0;
  els.search.value = '';
  els.filterCategory.value = 'all';
  els.filterUrgency.value = '0';
  render();
  showToast('Filters reset');
});
els.applyTemplate?.addEventListener('click', applyTemplatePreset);
els.loadDemo?.addEventListener('click', loadDemoScenario);
els.exportBtn.addEventListener('click', exportDigest);
els.briefBtn.addEventListener('click', generateDailyBrief);
els.copyBriefBtn?.addEventListener('click', copyTopActions);
els.runHealthBtn?.addEventListener('click', runHealthCheck);

loadFormDraft();
persist();
render();

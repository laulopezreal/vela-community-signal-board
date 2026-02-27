const STORAGE_KEY = 'community-signal-board-v1';

const state = {
  items: JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'),
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
  search: document.getElementById('search'),
  filterCategory: document.getElementById('filter-category'),
  filterUrgency: document.getElementById('filter-urgency'),
  clearFilters: document.getElementById('clear-filters'),
  list: document.getElementById('signal-list'),
  empty: document.getElementById('empty'),
  exportBtn: document.getElementById('export-digest'),
  briefBtn: document.getElementById('generate-brief'),
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

function render() {
  const items = sortedFilteredItems();
  els.list.innerHTML = '';
  els.empty.style.display = items.length ? 'none' : 'block';

  items.forEach((item) => {
    const node = els.tpl.content.cloneNode(true);
    node.querySelector('.item-title').textContent = item.title;
    node.querySelector('.item-meta').textContent = `${item.category} • ${item.source} • owner ${item.owner} • urgency ${item.urgency} • relevance ${item.relevance} • confidence ${item.confidence}`;
    node.querySelector('.score').textContent = `Score ${score(item)}`;
    node.querySelector('.delete').addEventListener('click', () => {
      state.items = state.items.filter((x) => x.id !== item.id);
      persist();
      render();
      showToast('Signal removed');
    });
    els.list.appendChild(node);
  });

  renderStats();
}

function addItem(evt) {
  evt.preventDefault();
  const item = {
    id: crypto.randomUUID(),
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

function generateDailyBrief() {
  const items = sortedFilteredItems();
  if (!items.length) {
    showToast('No signals available for brief');
    return;
  }

  const date = new Date().toISOString().slice(0, 10);
  const topItems = items.slice(0, 5);
  const lines = [
    `# Daily Community Brief (${date})`,
    '',
    '## Priority Signals',
    ...topItems.map((item, idx) => `${idx + 1}. **${item.title}** (${item.category})\n   - Source: ${item.source}\n   - Score: ${score(item)} (Urgency ${item.urgency} • Relevance ${item.relevance})`),
    '',
    '## Recommended Actions',
    ...topItems.map((item, idx) => `${idx + 1}. ${recommendationFor(item)}`),
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `community-daily-brief-${date}.md`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Daily brief generated');
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

els.form.addEventListener('submit', addItem);
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
els.exportBtn.addEventListener('click', exportDigest);
els.briefBtn.addEventListener('click', generateDailyBrief);

render();

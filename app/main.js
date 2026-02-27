const STORAGE_KEY = 'community-signal-board-v1';

const state = {
  items: JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'),
  filterCategory: 'all',
  filterUrgency: 0,
};

const els = {
  form: document.getElementById('signal-form'),
  title: document.getElementById('title'),
  source: document.getElementById('source'),
  category: document.getElementById('category'),
  urgency: document.getElementById('urgency'),
  relevance: document.getElementById('relevance'),
  filterCategory: document.getElementById('filter-category'),
  filterUrgency: document.getElementById('filter-urgency'),
  list: document.getElementById('signal-list'),
  empty: document.getElementById('empty'),
  exportBtn: document.getElementById('export-digest'),
  tpl: document.getElementById('item-template'),
  statTotal: document.getElementById('stat-total'),
  statHigh: document.getElementById('stat-high'),
  statAvg: document.getElementById('stat-avg'),
};

function score(item) {
  return item.urgency * 2 + item.relevance;
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
}

function sortedFilteredItems() {
  return state.items
    .filter((i) => state.filterCategory === 'all' || i.category === state.filterCategory)
    .filter((i) => i.urgency >= state.filterUrgency)
    .sort((a, b) => score(b) - score(a) || b.createdAt - a.createdAt);
}

function renderStats() {
  const total = state.items.length;
  const highUrgency = state.items.filter((x) => x.urgency >= 4).length;
  const avgScore = total ? (state.items.reduce((acc, x) => acc + score(x), 0) / total).toFixed(1) : '0.0';

  if (els.statTotal) els.statTotal.textContent = String(total);
  if (els.statHigh) els.statHigh.textContent = String(highUrgency);
  if (els.statAvg) els.statAvg.textContent = String(avgScore);
}

function render() {
  const items = sortedFilteredItems();
  els.list.innerHTML = '';
  els.empty.style.display = items.length ? 'none' : 'block';

  items.forEach((item) => {
    const node = els.tpl.content.cloneNode(true);
    node.querySelector('.item-title').textContent = item.title;
    node.querySelector('.item-meta').textContent = `${item.category} • ${item.source} • urgency ${item.urgency} • relevance ${item.relevance}`;
    node.querySelector('.score').textContent = `Score ${score(item)}`;
    node.querySelector('.delete').addEventListener('click', () => {
      state.items = state.items.filter((x) => x.id !== item.id);
      persist();
      render();
    });
    els.list.appendChild(node);
  });

  renderStats();
}

function addItem(evt) {
  evt.preventDefault();
  const item = {
    id: crypto.randomUUID(),
    title: els.title.value.trim(),
    source: els.source.value.trim(),
    category: els.category.value,
    urgency: Number(els.urgency.value),
    relevance: Number(els.relevance.value),
    createdAt: Date.now(),
  };

  if (!item.title || !item.source) return;
  state.items.push(item);
  persist();
  els.form.reset();
  els.urgency.value = 3;
  els.relevance.value = 3;
  render();
}

function exportDigest() {
  const items = sortedFilteredItems();
  const date = new Date().toISOString().slice(0, 10);
  const lines = [
    `# Community Signal Digest (${date})`,
    '',
    ...items.map((item, idx) => `${idx + 1}. **${item.title}** (${item.category})\n   - Source: ${item.source}\n   - Urgency: ${item.urgency} | Relevance: ${item.relevance} | Score: ${score(item)}`),
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `community-signal-digest-${date}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

els.form.addEventListener('submit', addItem);
els.filterCategory.addEventListener('change', (e) => {
  state.filterCategory = e.target.value;
  render();
});
els.filterUrgency.addEventListener('change', (e) => {
  state.filterUrgency = Number(e.target.value);
  render();
});
els.exportBtn.addEventListener('click', exportDigest);

render();

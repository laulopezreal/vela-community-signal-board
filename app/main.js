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

const CANONICAL_EVIDENCE_DATE = '2026-02-27';
const CANONICAL_EXPECTED_MANIFEST = {
  version: 'v1',
  date: CANONICAL_EVIDENCE_DATE,
  files: {
    brief: { lines: 30, sha256: '44d4d9ad7cb7681f409eb29be43aca1b52e94c5e80dc7f395982d15b754e6da9' },
    digest: { lines: 27, sha256: '7441c02fcda270697b335d09c0f0b91c4079b6e67125fce7b41419b8bc2cc3ca' },
  },
};

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
  submissionMode: false,
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
  formError: document.getElementById('form-error'),
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
  canonicalEvidenceBtn: document.getElementById('generate-canonical-evidence'),
  judgeSnapshotBtn: document.getElementById('generate-judge-snapshot'),
  judgeFastPathBtn: document.getElementById('run-judge-fast-path'),
  demoMacroBtn: document.getElementById('run-demo-reset-health'),
  finalBundleBtn: document.getElementById('generate-final-evidence-bundle'),
  submissionToggleBtn: document.getElementById('toggle-submission-mode'),
  submissionSpotlight: document.getElementById('submission-spotlight'),
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

function scoreBreakdown(item) {
  return `${item.urgency}*2 + ${item.relevance} + ${item.confidence} = ${score(item)}`;
}

function clampInt(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function cleanText(value) {
  return value.trim().replace(/\s+/g, ' ');
}

function safeSetLocal(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeGetLocal(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeRemoveLocal(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
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
    const draft = JSON.parse(safeGetLocal(FORM_DRAFT_KEY) || '{}');
    if (!draft || typeof draft !== 'object') return;
    els.title.value = typeof draft.title === 'string' ? draft.title : '';
    els.source.value = typeof draft.source === 'string' ? draft.source : '';
    els.category.value = typeof draft.category === 'string' ? draft.category : 'Opportunity';
    els.urgency.value = String(clampInt(draft.urgency, 1, 5, 3));
    els.relevance.value = String(clampInt(draft.relevance, 1, 5, 3));
    els.confidence.value = String(clampInt(draft.confidence, 1, 5, 3));
    els.owner.value = typeof draft.owner === 'string' ? draft.owner : '';
  } catch {
    safeRemoveLocal(FORM_DRAFT_KEY);
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
  safeSetLocal(FORM_DRAFT_KEY, JSON.stringify(draft));
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
  const ok = safeSetLocal(STORAGE_KEY, JSON.stringify(state.items));
  if (!ok) showToast('Storage unavailable: data will not persist after refresh');
  return ok;
}

function setFieldInvalid(field, invalid) {
  if (!field) return;
  field.setAttribute('aria-invalid', invalid ? 'true' : 'false');
}

function clearFormError() {
  if (els.formError) {
    els.formError.hidden = true;
    els.formError.textContent = '';
  }
  setFieldInvalid(els.title, false);
  setFieldInvalid(els.source, false);
}

function showFormError(message, focusField) {
  if (els.formError) {
    els.formError.hidden = false;
    els.formError.textContent = message;
  }
  if (focusField) focusField.focus();
}

function sortedFilteredItems() {
  const q = state.search.trim().toLowerCase();

  return state.items
    .filter((i) => state.filterCategory === 'all' || i.category === state.filterCategory)
    .filter((i) => i.urgency >= state.filterUrgency)
    .filter((i) => !q || i.title.toLowerCase().includes(q) || i.source.toLowerCase().includes(q))
    .sort((a, b) => score(b) - score(a) || b.createdAt - a.createdAt || a.title.localeCompare(b.title));
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
    const itemEl = node.querySelector('.signal-item');
    itemEl.dataset.itemId = item.id;
    itemEl.tabIndex = 0;

    node.querySelector('.item-title').textContent = item.title;
    node.querySelector('.item-meta').textContent = `${item.category} • ${item.source} • owner ${item.owner}`;
    node.querySelector('.item-metrics').textContent = `Urgency ${item.urgency} • Relevance ${item.relevance} • Confidence ${item.confidence} • Formula ${scoreBreakdown(item)} • ${formatRelativeTime(item.createdAt)}`;
    node.querySelector('.item-action').textContent = `Next action: ${recommendationFor(item)}`;

    const scoreEl = node.querySelector('.score');
    scoreEl.textContent = `Score ${score(item)}`;
    scoreEl.title = `Score formula: ${scoreBreakdown(item)}`;
    scoreEl.setAttribute('aria-label', `Score ${score(item)}. Formula ${scoreBreakdown(item)}`);
    scoreEl.classList.add(`score-${scoreBand(item)}`);

    const deleteBtn = node.querySelector('.delete');
    deleteBtn.title = `Delete signal: ${item.title}`;
    deleteBtn.setAttribute('aria-label', `Delete signal: ${item.title}`);
    deleteBtn.addEventListener('click', (evt) => {
      const skipConfirm = evt.shiftKey;
      const approved = skipConfirm || window.confirm(`Delete this signal?\n\n${item.title}`);
      if (!approved) return;

      state.items = state.items.filter((x) => x.id !== item.id);
      persist();
      render();
      showToast(skipConfirm ? 'Signal removed (quick delete)' : 'Signal removed');
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

function clearFilters({ silent = false } = {}) {
  state.search = '';
  state.filterCategory = 'all';
  state.filterUrgency = 0;
  els.search.value = '';
  els.filterCategory.value = 'all';
  els.filterUrgency.value = '0';
  render();
  if (!silent) showToast('Filters reset');
}

function loadDemoScenario({ silent = false } = {}) {
  state.items = DEMO_SCENARIO_ITEMS.map((item, idx) => ({
    ...item,
    id: `demo-${idx + 1}`,
  }));

  clearFilters({ silent: true });
  safeRemoveLocal(FORM_DRAFT_KEY);
  persist();
  render();
  if (!silent) showToast('Demo scenario loaded');
}

function focusTopRankedCard() {
  const topCard = els.list.querySelector('.signal-item');
  if (!topCard) return false;

  els.list.querySelectorAll('.signal-item.is-demo-focus').forEach((el) => el.classList.remove('is-demo-focus'));
  topCard.classList.add('is-demo-focus');
  topCard.focus({ preventScroll: true });
  topCard.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  return true;
}

function runDemoResetHealthMacro({ silentToast = false } = {}) {
  if (!els.demoMacroBtn || els.demoMacroBtn.disabled) return true;

  let success = false;
  els.demoMacroBtn.disabled = true;
  try {
    loadDemoScenario({ silent: true });
    clearFilters({ silent: true });
    const health = runHealthCheck({ silent: true });
    const focused = focusTopRankedCard();

    if (!focused) throw new Error('Top-ranked card not found after demo reset');

    const healthLabel = health?.corePass ? 'PASS' : 'ATTENTION';
    if (!silentToast) showToast(`Demo reset complete • Health ${healthLabel} • Top card focused`);
    success = true;
  } catch {
    setHealthStatus('Health ATTENTION • Macro failed before completion', 'fail');
    showToast('Demo reset macro failed');
  } finally {
    els.demoMacroBtn.disabled = false;
  }

  return success;
}

async function runJudgeFastPath() {
  if (!els.judgeFastPathBtn || els.judgeFastPathBtn.disabled) return;

  els.judgeFastPathBtn.disabled = true;
  try {
    const resetOk = runDemoResetHealthMacro({ silentToast: true });
    if (!resetOk) return;
    await generateFinalEvidenceBundle({ silentToast: true });
    showToast('Judge fast path complete • Demo reset + final evidence bundle ready');
  } finally {
    els.judgeFastPathBtn.disabled = false;
  }
}

function setSubmissionMode(enabled) {
  state.submissionMode = !!enabled;
  document.body.classList.toggle('is-submission-mode', state.submissionMode);

  if (els.submissionToggleBtn) {
    els.submissionToggleBtn.textContent = `Submission Mode: ${state.submissionMode ? 'On' : 'Off'}`;
    els.submissionToggleBtn.setAttribute('aria-pressed', state.submissionMode ? 'true' : 'false');
  }

  if (els.submissionSpotlight) {
    els.submissionSpotlight.hidden = !state.submissionMode;
  }
}

function toggleSubmissionMode() {
  setSubmissionMode(!state.submissionMode);
  showToast(state.submissionMode ? 'Submission mode enabled' : 'Submission mode disabled');
}

async function generateFinalEvidenceBundle({ silentToast = false } = {}) {
  const items = sortedFilteredItems();
  if (!items.length) {
    showToast('No signals available for final evidence bundle');
    return;
  }
  if (!els.finalBundleBtn || els.finalBundleBtn.disabled) return;

  els.finalBundleBtn.disabled = true;
  try {
    const now = new Date();
    const date = now.toISOString().slice(0, 10);

    const brief = buildBriefLines(items, date).lines.join('\n');
    const digest = buildDigestLines(items, date).join('\n');
    const health = runHealthCheck({ silent: true });
    const judgeSnapshot = buildJudgeSnapshotMarkdown(items, health, now).markdown;
    const generatedFilenames = [
      `final-evidence-brief-${date}.md`,
      `final-evidence-digest-${date}.md`,
      `final-evidence-judge-snapshot-${date}.md`,
      `final-evidence-manifest-reference-${date}.md`,
      `judge-run-completion-receipt-${date}.md`,
    ];

    const manifestRef = [
      `# Final Evidence Bundle Manifest Reference (${date})`,
      '',
      'Bundle generated from current board state (no submission action).',
      '',
      'Included artifacts:',
      ...generatedFilenames.map((filename) => `- ${filename}`),
      '',
      'Canonical references:',
      '- docs/artifacts/canonical-evidence-manifest.md',
      '- docs/artifacts/sample-daily-brief.md',
      '- docs/artifacts/sample-digest.md',
      '- docs/artifacts/loop10-visual-proof-manifest.md',
      '',
      `Health status at bundle time: ${health.corePass ? 'PASS' : 'ATTENTION'} (${health.passCount}/${health.checks.length})`,
    ].join('\n');

    const receiptBody = [
      `# Judge Run Completion Receipt (${date})`,
      '',
      `Timestamp: ${now.toISOString()}`,
      `Health status: ${health.corePass ? 'PASS' : 'ATTENTION'} (${health.passCount}/${health.checks.length})`,
      '',
      'Generated filenames:',
      ...generatedFilenames.map((filename) => `- ${filename}`),
      '',
      `Deterministic storage path: docs/artifacts/judge-run-completion-receipt-${date}.md`,
      'Submission action: NOT PERFORMED',
    ].join('\n');

    const receiptSha = await sha256Hex(receiptBody);
    const receipt = [
      receiptBody,
      '',
      `Receipt SHA-256 (body): ${receiptSha || 'unavailable'}`,
    ].join('\n');

    tryDownloadText(generatedFilenames[0], brief);
    tryDownloadText(generatedFilenames[1], digest);
    tryDownloadText(generatedFilenames[2], judgeSnapshot);
    tryDownloadText(generatedFilenames[3], manifestRef);
    tryDownloadText(generatedFilenames[4], receipt);

    if (!silentToast) showToast('Final evidence bundle and judge receipt generated');
  } finally {
    els.finalBundleBtn.disabled = false;
  }
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

  clearFormError();

  if (!item.title) {
    setFieldInvalid(els.title, true);
    showFormError('Title is required. Use a specific action-oriented summary.', els.title);
    showToast('Fix required field: title');
    return;
  }

  if (!item.source) {
    setFieldInvalid(els.source, true);
    showFormError('Source is required so judges can verify signal origin quickly.', els.source);
    showToast('Fix required field: source');
    return;
  }

  const isDuplicate = state.items.some(
    (x) => x.title.toLowerCase() === item.title.toLowerCase() && x.source.toLowerCase() === item.source.toLowerCase(),
  );

  if (isDuplicate) {
    showFormError('A similar signal already exists. Edit the existing item or add a distinct source.', els.title);
    showToast('Similar signal already exists');
    return;
  }

  state.items.push(item);
  persist();
  els.form.reset();
  clearFormError();
  els.urgency.value = 3;
  els.relevance.value = 3;
  els.confidence.value = 3;
  safeRemoveLocal(FORM_DRAFT_KEY);
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

function buildBriefLines(items, date = new Date().toISOString().slice(0, 10)) {
  const topItems = items.slice(0, 5);
  const lines = [
    `# Daily Community Brief (${date})`,
    '',
    'Scoring formula: urgency * 2 + relevance + confidence',
    '',
    '## Priority Signals',
    ...topItems.map((item, idx) => `${idx + 1}. **${item.title}** (${item.category})\n   - Source: ${item.source}\n   - Owner: ${item.owner}\n   - Score: ${score(item)} (Urgency ${item.urgency} • Relevance ${item.relevance} • Confidence ${item.confidence})`),
    '',
    '## Recommended Actions',
    ...topItems.map((item, idx) => `${idx + 1}. ${recommendationFor(item)}`),
  ];

  return { date, lines };
}

function buildDigestLines(items, date = new Date().toISOString().slice(0, 10)) {
  return [
    `# Community Signal Digest (${date})`,
    '',
    'Scoring formula: urgency * 2 + relevance + confidence',
    '',
    ...items.map((item, idx) => `${idx + 1}. **${item.title}** (${item.category})\n   - Source: ${item.source}\n   - Owner: ${item.owner}\n   - Urgency: ${item.urgency} | Relevance: ${item.relevance} | Confidence: ${item.confidence} | Score: ${score(item)}\n   - Recommended action: ${recommendationFor(item)}`),
  ];
}

function canonicalDemoItems() {
  return [...DEMO_SCENARIO_ITEMS].sort((a, b) => score(b) - score(a) || b.createdAt - a.createdAt || a.title.localeCompare(b.title));
}

function buildCanonicalBriefLines(items) {
  const lines = [
    `# Daily Community Brief (${CANONICAL_EVIDENCE_DATE})`,
    '',
    'Scoring formula: urgency * 2 + relevance + confidence',
    '',
    '## Priority Signals',
    ...items.map((item, idx) => `${idx + 1}. **${item.title}** (${item.category})\n   - Source: ${item.source}\n   - Owner: ${item.owner}\n   - Score: ${score(item)} (Urgency ${item.urgency} • Relevance ${item.relevance} • Confidence ${item.confidence})`),
    '',
    '## Recommended Actions',
    ...items.map((item, idx) => `${idx + 1}. ${recommendationFor(item)}`),
    '',
    '---',
    'Canonical deterministic artifact from fixed demo dataset (`DEMO_SCENARIO_ITEMS`).',
  ];
  return lines;
}

function buildCanonicalDigestLines(items) {
  const lines = [
    `# Community Signal Digest (${CANONICAL_EVIDENCE_DATE})`,
    '',
    'Scoring formula: urgency * 2 + relevance + confidence',
    '',
    ...items.map((item, idx) => `${idx + 1}. **${item.title}** (${item.category})\n   - Source: ${item.source}\n   - Owner: ${item.owner}\n   - Urgency: ${item.urgency} | Relevance: ${item.relevance} | Confidence: ${item.confidence} | Score: ${score(item)}\n   - Recommended action: ${recommendationFor(item)}`),
    '',
    '---',
    'Canonical deterministic artifact from fixed demo dataset (`DEMO_SCENARIO_ITEMS`).',
  ];
  return lines;
}

function countLines(text) {
  return text.split('\n').length;
}

async function sha256Hex(text) {
  if (!globalThis.crypto?.subtle || typeof TextEncoder === 'undefined') return null;
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function generateCanonicalEvidenceArtifacts() {
  if (!els.canonicalEvidenceBtn || els.canonicalEvidenceBtn.disabled) return;

  els.canonicalEvidenceBtn.disabled = true;
  try {
    const items = canonicalDemoItems();
    const briefText = buildCanonicalBriefLines(items).join('\n');
    const digestText = buildCanonicalDigestLines(items).join('\n');

    const [briefSha, digestSha] = await Promise.all([sha256Hex(briefText), sha256Hex(digestText)]);

    if (!briefSha || !digestSha) {
      setHealthStatus('Health ATTENTION • Canonical evidence checksum unavailable in this browser', 'warn');
      showToast('Canonical evidence failed: checksum unavailable');
      return;
    }

    const briefLines = countLines(briefText);
    const digestLines = countLines(digestText);

    const pass =
      briefLines === CANONICAL_EXPECTED_MANIFEST.files.brief.lines &&
      digestLines === CANONICAL_EXPECTED_MANIFEST.files.digest.lines &&
      briefSha === CANONICAL_EXPECTED_MANIFEST.files.brief.sha256 &&
      digestSha === CANONICAL_EXPECTED_MANIFEST.files.digest.sha256;

    if (!pass) {
      setHealthStatus('Health ATTENTION • Canonical evidence mismatch (checksum/line-count)', 'warn');
      showToast('Canonical evidence mismatch detected');
      return;
    }

    const manifestText = [
      '# Canonical Evidence Manifest',
      '',
      `version: ${CANONICAL_EXPECTED_MANIFEST.version}`,
      `dataset_date: ${CANONICAL_EXPECTED_MANIFEST.date}`,
      '',
      `sample-daily-brief.md | lines=${briefLines} | sha256=${briefSha}`,
      `sample-digest.md | lines=${digestLines} | sha256=${digestSha}`,
      '',
      'status: PASS (checksums and line counts match expected canonical manifest)',
    ].join('\n');

    tryDownloadText('sample-daily-brief.md', briefText);
    tryDownloadText('sample-digest.md', digestText);
    tryDownloadText('canonical-evidence-manifest.md', manifestText);

    setHealthStatus('Health PASS • Canonical evidence artifacts validated (checksum + line-count)', 'pass');
    showToast('Canonical evidence artifacts generated');
  } finally {
    els.canonicalEvidenceBtn.disabled = false;
  }
}

function tryDownloadText(filename, text) {
  if (typeof Blob !== 'undefined' && typeof URL?.createObjectURL === 'function') {
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  }

  const dataUrl = `data:text/markdown;charset=utf-8,${encodeURIComponent(text)}`;
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
  return true;
}

function generateDailyBrief() {
  const items = sortedFilteredItems();
  if (!items.length) {
    showToast('No signals available for brief');
    return;
  }

  const { date, lines } = buildBriefLines(items);
  tryDownloadText(`community-daily-brief-${date}.md`, lines.join('\n'));
  showToast('Daily brief generated');
}

function buildJudgeSnapshotMarkdown(items, health, now = new Date()) {
  const date = now.toISOString().slice(0, 10);
  const topThree = items.slice(0, 3);
  const topTitle = topThree[0]?.title || 'N/A';
  const averageScore = state.items.length
    ? (state.items.reduce((acc, item) => acc + score(item), 0) / state.items.length).toFixed(1)
    : '0.0';

  const lines = [
    `# Judge Snapshot (${date})`,
    '',
    `Generated at: ${now.toISOString()}`,
    `Signals in scope: ${items.length}`,
    `Top-ranked signal: ${topTitle}`,
    '',
    '## Health Summary',
    `- Status: ${health.corePass ? 'PASS' : 'ATTENTION'}`,
    `- Checks passed: ${health.passCount}/${health.checks.length}`,
    health.failed.length ? `- Failing checks: ${health.failed.join(', ')}` : '- Failing checks: none',
    '',
    '## Board Metrics',
    `- Total signals: ${state.items.length}`,
    `- High urgency (4+): ${state.items.filter((item) => item.urgency >= 4).length}`,
    `- Assigned signals: ${state.items.filter((item) => item.owner && item.owner !== 'Unassigned').length}`,
    `- Average score: ${averageScore}`,
    '',
    '## Top 3 Signals',
    ...topThree.map(
      (item, index) =>
        `${index + 1}. **${item.title}** (${item.category})\n   - Score: ${score(item)}\n   - Source: ${item.source}\n   - Owner: ${item.owner}\n   - Next action: ${recommendationFor(item)}`,
    ),
    '',
    '## Determinism Note',
    '- Demo ranking anchor: Grant call closes tonight for community tooling',
    '- Canonical artifacts can be regenerated with: Generate Canonical Evidence Artifacts',
  ];

  return { date, markdown: lines.join('\n') };
}

async function generateJudgeSnapshot() {
  const items = sortedFilteredItems();
  if (!items.length) {
    showToast('No signals available for judge snapshot');
    return;
  }

  const health = runHealthCheck({ silent: true });
  const { date, markdown } = buildJudgeSnapshotMarkdown(items, health);
  tryDownloadText(`judge-snapshot-${date}.md`, markdown);

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(markdown);
      showToast('Judge snapshot generated and copied');
      return;
    }
  } catch {
    // fallback to download-only success
  }

  showToast('Judge snapshot generated');
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

  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  }

  document.body.removeChild(ta);
  showToast(copied ? 'Top actions copied' : 'Copy failed: use Generate Daily Brief instead');
}

function exportDigest() {
  const items = sortedFilteredItems();
  if (!items.length) {
    showToast('No signals to export');
    return;
  }

  const date = new Date().toISOString().slice(0, 10);
  const lines = buildDigestLines(items, date);
  tryDownloadText(`community-signal-digest-${date}.md`, lines.join('\n'));
  showToast('Digest exported');
}

function setHealthStatus(text, level = 'pass') {
  if (!els.healthStatus) return;
  els.healthStatus.textContent = text;
  els.healthStatus.classList.remove('is-pass', 'is-warn', 'is-fail');
  els.healthStatus.classList.add(`is-${level}`);
}

function runHealthCheck({ silent = false } = {}) {
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

  checks.push({
    name: 'Export capability',
    ok:
      (typeof Blob !== 'undefined' && typeof URL?.createObjectURL === 'function') ||
      ('download' in HTMLAnchorElement.prototype),
  });
  checks.push({ name: 'Core crypto/id support', ok: !!(globalThis.crypto?.randomUUID || globalThis.crypto?.getRandomValues) });

  const passCount = checks.filter((x) => x.ok).length;
  const failed = checks.filter((x) => !x.ok).map((x) => x.name);
  const corePass = passCount === checks.length;
  const level = corePass ? 'pass' : passCount >= checks.length - 1 ? 'warn' : 'fail';
  const suffix = failed.length ? ` • Failing: ${failed.join(', ')}` : '';

  setHealthStatus(`Health ${corePass ? 'PASS' : 'ATTENTION'} • ${passCount}/${checks.length} checks passed${suffix}`, level);
  if (!silent) showToast(corePass ? 'Health check passed' : 'Health check found issues');

  return { checks, corePass, passCount, level, failed };
}

els.form.addEventListener('submit', addItem);
els.form.addEventListener('input', (e) => {
  saveFormDraft();
  if (e.target === els.title || e.target === els.source) {
    setFieldInvalid(e.target, false);
    if (els.formError?.hidden === false) clearFormError();
  }
});
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
els.clearFilters.addEventListener('click', () => clearFilters());
els.applyTemplate?.addEventListener('click', applyTemplatePreset);
els.loadDemo?.addEventListener('click', () => loadDemoScenario());
els.exportBtn.addEventListener('click', exportDigest);
els.briefBtn.addEventListener('click', generateDailyBrief);
els.copyBriefBtn?.addEventListener('click', copyTopActions);
els.runHealthBtn?.addEventListener('click', () => runHealthCheck());
els.canonicalEvidenceBtn?.addEventListener('click', () => {
  generateCanonicalEvidenceArtifacts();
});
els.judgeSnapshotBtn?.addEventListener('click', () => {
  generateJudgeSnapshot();
});
els.judgeFastPathBtn?.addEventListener('click', () => {
  runJudgeFastPath();
});
els.demoMacroBtn?.addEventListener('click', runDemoResetHealthMacro);
els.finalBundleBtn?.addEventListener('click', () => {
  generateFinalEvidenceBundle();
});
els.submissionToggleBtn?.addEventListener('click', toggleSubmissionMode);

loadFormDraft();
setSubmissionMode(false);
persist();
render();

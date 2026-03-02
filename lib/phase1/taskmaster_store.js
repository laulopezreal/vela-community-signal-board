const fs = require('fs');
const path = require('path');

const STORE_PATH = path.resolve(__dirname, '../../data/phase1/taskmaster-store.json');
const EVENTS_PATH = path.resolve(__dirname, '../../data/phase1/taskmaster-events.jsonl');
const RETENTION_DAYS = 30;

const LANES = ['Backlog', 'Ready', 'In Progress', 'Blocked', 'Done'];

const seedTasks = [
  {
    id: 'tsk-101',
    title: 'Ship reliability replay command docs',
    lane: 'Ready',
    priority: 95,
    owner: 'Ops lead',
    reviewer: 'Tech lead',
    dueDate: '2026-03-02T14:00:00Z',
    tags: ['docs', 'release'],
    blockedReason: '',
    dependencies: [],
    updatedAt: '2026-03-02T04:30:00Z',
    version: 1,
  },
  {
    id: 'tsk-102',
    title: 'Harden DLQ replay dry-run guard',
    lane: 'In Progress',
    priority: 88,
    owner: 'Platform',
    reviewer: 'Reliability',
    dueDate: '2026-03-02T10:00:00Z',
    tags: ['backend', 'safety'],
    blockedReason: '',
    dependencies: [],
    updatedAt: '2026-03-02T04:35:00Z',
    version: 1,
  },
  {
    id: 'tsk-103',
    title: 'Align scoreboard copy with submission rubric',
    lane: 'Blocked',
    priority: 82,
    owner: 'Content',
    reviewer: 'PM',
    dueDate: '2026-03-02T09:15:00Z',
    tags: ['ux'],
    blockedReason: 'Awaiting judge rubric clarification',
    dependencies: ['tsk-101'],
    updatedAt: '2026-03-02T04:40:00Z',
    version: 1,
  },
  {
    id: 'tsk-104',
    title: 'Close visual proof manifest QA',
    lane: 'Done',
    priority: 75,
    owner: 'QA',
    reviewer: 'Ops lead',
    dueDate: '2026-03-01T19:00:00Z',
    tags: ['qa'],
    blockedReason: '',
    dependencies: [],
    updatedAt: '2026-03-01T18:20:00Z',
    version: 1,
  },
];

function ensureParent(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function nowIso() {
  return new Date().toISOString();
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  ensureParent(filePath);
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function appendEvent(event) {
  ensureParent(EVENTS_PATH);
  fs.appendFileSync(EVENTS_PATH, `${JSON.stringify(event)}\n`, 'utf8');
}

function trimEventsRetention() {
  if (!fs.existsSync(EVENTS_PATH)) return;
  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const lines = fs
    .readFileSync(EVENTS_PATH, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const kept = lines.filter((line) => {
    try {
      const event = JSON.parse(line);
      const ts = Date.parse(event.at || event.updatedAt || event.createdAt || '');
      return Number.isFinite(ts) ? ts >= cutoff : true;
    } catch {
      return false;
    }
  });

  fs.writeFileSync(EVENTS_PATH, kept.length ? `${kept.join('\n')}\n` : '', 'utf8');
}

function laneFor(value) {
  return LANES.includes(value) ? value : 'Backlog';
}

function int(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}

function sanitizeTask(raw) {
  return {
    id: String(raw.id || '').trim(),
    title: String(raw.title || '').trim(),
    lane: laneFor(raw.lane),
    priority: Math.max(0, Math.min(100, int(raw.priority, 50))),
    owner: String(raw.owner || 'Unassigned').trim() || 'Unassigned',
    reviewer: String(raw.reviewer || '').trim(),
    dueDate: String(raw.dueDate || ''),
    tags: Array.isArray(raw.tags) ? raw.tags.map((x) => String(x).trim()).filter(Boolean) : [],
    blockedReason: String(raw.blockedReason || '').trim(),
    dependencies: Array.isArray(raw.dependencies) ? raw.dependencies.map((x) => String(x).trim()).filter(Boolean) : [],
    updatedAt: String(raw.updatedAt || nowIso()),
    version: Math.max(1, int(raw.version, 1)),
  };
}

function bootstrapIfMissing() {
  if (fs.existsSync(STORE_PATH)) return;
  const seeded = {
    version: 1,
    updatedAt: nowIso(),
    tasks: seedTasks.map((task) => sanitizeTask(task)),
  };
  writeJson(STORE_PATH, seeded);
}

function loadStore() {
  bootstrapIfMissing();
  const store = readJson(STORE_PATH, { version: 1, updatedAt: nowIso(), tasks: [] });
  store.tasks = Array.isArray(store.tasks) ? store.tasks.map(sanitizeTask) : [];
  store.version = Math.max(1, int(store.version, 1));
  return store;
}

function persistStore(store) {
  store.updatedAt = nowIso();
  writeJson(STORE_PATH, store);
}

function riskForTask(task) {
  const dueTs = Date.parse(task.dueDate || '');
  if (!Number.isFinite(dueTs)) return 'green';
  const deltaHours = (dueTs - Date.now()) / (1000 * 60 * 60);
  if (deltaHours < 0) return 'red';
  if (deltaHours <= 24) return 'yellow';
  return 'green';
}

function buildSnapshot() {
  const store = loadStore();
  trimEventsRetention();
  const lanes = LANES.map((lane) => {
    const tasks = store.tasks.filter((task) => task.lane === lane).sort((a, b) => b.priority - a.priority);
    const riskScore = tasks.reduce((acc, task) => {
      const risk = riskForTask(task);
      if (risk === 'red') return acc + 2;
      if (risk === 'yellow') return acc + 1;
      return acc;
    }, 0);
    return {
      lane,
      count: tasks.length,
      riskBadge: riskScore >= 4 ? 'red' : riskScore >= 2 ? 'yellow' : 'green',
      tasks,
    };
  });

  const workloadMap = new Map();
  for (const task of store.tasks) {
    const key = task.owner || 'Unassigned';
    const row = workloadMap.get(key) || { assignee: key, total: 0, inProgress: 0, blocked: 0, wipLimit: 3 };
    row.total += 1;
    if (task.lane === 'In Progress') row.inProgress += 1;
    if (task.lane === 'Blocked') row.blocked += 1;
    row.overLimit = row.inProgress > row.wipLimit;
    workloadMap.set(key, row);
  }

  const todayFocus = [...store.tasks]
    .filter((task) => task.lane !== 'Done')
    .sort((a, b) => b.priority - a.priority || Date.parse(a.dueDate || 0) - Date.parse(b.dueDate || 0))
    .slice(0, 3);

  return {
    ok: true,
    storeVersion: store.version,
    updatedAt: store.updatedAt,
    lanes,
    workload: [...workloadMap.values()].sort((a, b) => b.inProgress - a.inProgress || b.total - a.total),
    todayFocus,
  };
}

function applyMutation(payload = {}) {
  const store = loadStore();
  const id = String(payload.id || '').trim();
  const actor = String(payload.actor || 'taskmaster-ui').trim();
  const expectedVersion = int(payload.expectedVersion, -1);

  const idx = store.tasks.findIndex((task) => task.id === id);
  if (idx < 0) {
    return { ok: false, status: 404, error: 'task_not_found' };
  }

  const current = store.tasks[idx];
  if (expectedVersion > 0 && expectedVersion !== current.version) {
    return {
      ok: false,
      status: 409,
      error: 'version_conflict',
      current,
      message: 'Task changed on server. Refresh and retry your edit.',
    };
  }

  const next = sanitizeTask({ ...current, ...payload.patch, id: current.id, version: current.version + 1, updatedAt: nowIso() });
  if (next.lane !== 'Blocked') next.blockedReason = '';
  if (next.lane === 'Blocked' && !next.blockedReason) next.blockedReason = 'Blocker reason required';

  store.tasks[idx] = next;
  store.version += 1;
  persistStore(store);

  appendEvent({
    type: 'task.mutated',
    at: nowIso(),
    actor,
    id: next.id,
    previousVersion: current.version,
    version: next.version,
    patch: payload.patch || {},
  });

  return { ok: true, status: 200, task: next, storeVersion: store.version };
}

module.exports = {
  LANES,
  STORE_PATH,
  EVENTS_PATH,
  buildSnapshot,
  applyMutation,
};

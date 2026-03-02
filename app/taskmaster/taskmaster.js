const API = globalThis.localStorage?.getItem('community-signal-board-api-base') || 'http://localhost:8791';
const LANES = ['Backlog', 'Ready', 'In Progress', 'Blocked', 'Done'];

const state = { snapshot: null, optimistic: new Map() };

const els = {
  lanes: document.getElementById('lanes'),
  todayFocusList: document.getElementById('today-focus-list'),
  workloadList: document.getElementById('workload-list'),
  laneTpl: document.getElementById('lane-template'),
  taskTpl: document.getElementById('task-template'),
  drawer: document.getElementById('task-drawer'),
  closeDrawer: document.getElementById('close-drawer'),
  drawerTitle: document.getElementById('drawer-title'),
  drawerMeta: document.getElementById('drawer-meta'),
  drawerBlocker: document.getElementById('drawer-blocker'),
  drawerDeps: document.getElementById('drawer-deps'),
  conflictMsg: document.getElementById('conflict-msg'),
};

function riskClass(risk) {
  if (risk === 'red') return 'risk-red';
  if (risk === 'yellow') return 'risk-yellow';
  return 'risk-green';
}

function dueLabel(iso) {
  const ts = Date.parse(iso || '');
  if (!Number.isFinite(ts)) return 'No due date';
  const delta = Math.round((ts - Date.now()) / (1000 * 60 * 60));
  if (delta < 0) return `${Math.abs(delta)}h overdue`;
  return `Due in ${delta}h`;
}

async function loadSnapshot() {
  const res = await fetch(`${API}/v1/taskmaster/snapshot`);
  if (!res.ok) throw new Error(`snapshot_http_${res.status}`);
  state.snapshot = await res.json();
  render();
}

async function mutateTask(task, patch) {
  const optimisticTask = { ...task, ...patch, version: task.version + 1 };
  state.optimistic.set(task.id, optimisticTask);
  render();

  const res = await fetch(`${API}/v1/taskmaster/mutations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: task.id, expectedVersion: task.version, patch }),
  });

  const result = await res.json();
  state.optimistic.delete(task.id);

  if (!res.ok || !result.ok) {
    if (res.status === 409 || result.error === 'version_conflict') {
      els.conflictMsg.hidden = false;
      els.conflictMsg.textContent = result.message || 'Conflict detected. Data was refreshed.';
      await loadSnapshot();
      return;
    }
    throw new Error(result.error || `mutation_http_${res.status}`);
  }

  els.conflictMsg.hidden = true;
  await loadSnapshot();
}

function taskWithOptimistic(task) {
  return state.optimistic.get(task.id) || task;
}

function openDrawer(task) {
  els.drawer.hidden = false;
  els.drawerTitle.textContent = task.title;
  els.drawerMeta.textContent = `${task.lane} • ${task.owner} • ${dueLabel(task.dueDate)}`;
  els.drawerBlocker.textContent = task.blockedReason || 'None';
  els.drawerDeps.textContent = task.dependencies?.length ? task.dependencies.join(', ') : 'None';
}

function renderWorkload(workload) {
  els.workloadList.innerHTML = '';
  workload.forEach((row) => {
    const li = document.createElement('li');
    li.innerHTML = `<strong>${row.assignee}</strong> - In progress ${row.inProgress}/${row.wipLimit}, total ${row.total}, blocked ${row.blocked}`;
    if (row.overLimit) li.classList.add('wip-over');
    els.workloadList.appendChild(li);
  });
}

function renderFocus(tasks) {
  els.todayFocusList.innerHTML = '';
  tasks.forEach((task) => {
    const li = document.createElement('li');
    li.textContent = `${task.title} (${task.owner}) - ${dueLabel(task.dueDate)}`;
    els.todayFocusList.appendChild(li);
  });
}

function render() {
  const snap = state.snapshot;
  if (!snap) return;

  renderFocus(snap.todayFocus || []);
  renderWorkload(snap.workload || []);

  els.lanes.innerHTML = '';
  snap.lanes.forEach((laneData) => {
    const laneNode = els.laneTpl.content.cloneNode(true);
    laneNode.querySelector('.lane-name').textContent = laneData.lane;
    laneNode.querySelector('.lane-count').textContent = String(laneData.count);
    const badge = laneNode.querySelector('.risk-badge');
    badge.textContent = laneData.riskBadge;
    badge.classList.add(riskClass(laneData.riskBadge));

    const list = laneNode.querySelector('.lane-list');

    laneData.tasks.forEach((taskBase) => {
      const task = taskWithOptimistic(taskBase);
      const taskNode = els.taskTpl.content.cloneNode(true);
      taskNode.querySelector('.task-title').textContent = task.title;
      taskNode.querySelector('.task-meta').textContent = `${task.owner} • Priority ${task.priority} • ${dueLabel(task.dueDate)}`;

      const laneSelect = taskNode.querySelector('.lane-select');
      LANES.forEach((lane) => {
        const opt = document.createElement('option');
        opt.value = lane;
        opt.textContent = lane;
        opt.selected = lane === task.lane;
        laneSelect.appendChild(opt);
      });

      const ownerInput = taskNode.querySelector('.owner-input');
      ownerInput.value = task.owner;

      taskNode.querySelector('.save-btn').addEventListener('click', async () => {
        const nextLane = laneSelect.value;
        const nextOwner = ownerInput.value.trim() || 'Unassigned';
        await mutateTask(taskBase, { lane: nextLane, owner: nextOwner });
      });

      taskNode.querySelector('.details-btn').addEventListener('click', () => openDrawer(task));
      list.appendChild(taskNode);
    });

    els.lanes.appendChild(laneNode);
  });
}

els.closeDrawer.addEventListener('click', () => {
  els.drawer.hidden = true;
});

loadSnapshot().catch((err) => {
  console.error(err);
  els.lanes.innerHTML = `<p>Unable to load taskmaster snapshot (${err.message}). Start phase1 server on port 8791.</p>`;
});

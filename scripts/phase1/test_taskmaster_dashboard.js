#!/usr/bin/env node
const assert = require('assert');
const { buildSnapshot, applyMutation } = require('../../lib/phase1/taskmaster_store');

const snapshot = buildSnapshot();
assert(snapshot.ok === true, 'snapshot should be ok');
assert(snapshot.lanes.length === 5, 'expected 5 canonical lanes');
assert(snapshot.todayFocus.length <= 3, 'today focus max 3');

const inProgressTask = snapshot.lanes.flatMap((l) => l.tasks).find((t) => t.lane === 'In Progress');
assert(inProgressTask, 'must have at least one in-progress task');

const updated = applyMutation({
  id: inProgressTask.id,
  expectedVersion: inProgressTask.version,
  patch: { lane: 'Blocked', blockedReason: 'Waiting for review' },
});
assert(updated.ok, 'mutation should pass');
assert(updated.task.version === inProgressTask.version + 1, 'version should increment');

const conflict = applyMutation({
  id: inProgressTask.id,
  expectedVersion: inProgressTask.version,
  patch: { owner: 'Conflict Tester' },
});
assert(conflict.ok === false, 'conflict should fail');
assert(conflict.status === 409, 'conflict should return 409');

console.log('TASKMASTER_TEST_PASS');

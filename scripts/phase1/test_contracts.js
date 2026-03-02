#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { processEvents, replayDlq, PATHS } = require('../../lib/phase1/reliability_pipeline');

function loadFixture(name) {
  const p = path.resolve(__dirname, `../fixtures/${name}`);
  return JSON.parse(fs.readFileSync(p, 'utf8')).events;
}

function resetDataFiles() {
  [PATHS.SIGNALS_PATH, PATHS.BOARD_PATH, PATHS.IDEMPOTENCY_PATH, PATHS.DLQ_PATH, PATHS.VALIDATION_REPORT_PATH]
    .forEach((p) => { if (fs.existsSync(p)) fs.unlinkSync(p); });
}

(async function run() {
  resetDataFiles();

  const valid = loadFixture('phase1-valid-events.json');
  const invalid = loadFixture('phase1-invalid-events.json');

  const ok = await processEvents(valid, { traceId: 'trace_test_valid' });
  assert.equal(ok.accepted, 1, 'valid event should be accepted');
  assert.equal(ok.dlqRouted, 0, 'valid event should not route to dlq');

  const bad = await processEvents(invalid, { traceId: 'trace_test_invalid' });
  assert.equal(bad.accepted, 0, 'invalid event must not be accepted');
  assert.equal(bad.dlqRouted, 1, 'invalid event must route to dlq');
  assert.equal(bad.dlqEntries[0].reason, 'MISSING_ID', 'reason taxonomy should be applied');

  const replay = await replayDlq({ traceId: 'trace_test_invalid' }, { traceId: 'trace_test_replay' });
  assert.equal(replay.selected, 1, 'one DLQ event should be selected');
  assert.equal(replay.replayed, 0, 'unrepaired replay should not be accepted');

  console.log('PHASE1_CONTRACT_TESTS_PASS');
})();

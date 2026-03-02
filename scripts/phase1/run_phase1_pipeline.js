#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { processEvents } = require('../../lib/phase1/reliability_pipeline');

async function main() {
  const inputArg = process.argv[2] || 'data/phase1/sample-phase1-events.json';
  const inputPath = path.resolve(process.cwd(), inputArg);
  const payload = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const events = Array.isArray(payload) ? payload : (Array.isArray(payload.events) ? payload.events : []);
  const result = await processEvents(events, { retries: 3, baseDelayMs: 100, jitterMs: 40 });
  console.log(`PHASE1_PROCESS_DONE traceId=${result.traceId} accepted=${result.accepted} duplicateIgnored=${result.duplicateIgnored} dlqRouted=${result.dlqRouted} totalRanked=${result.totalRanked}`);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(`PHASE1_PROCESS_FAIL reason=${err.message}`);
  process.exit(1);
});

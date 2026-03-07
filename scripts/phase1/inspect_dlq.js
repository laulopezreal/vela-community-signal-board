#!/usr/bin/env node
const { inspectDlq } = require('../../lib/phase1/reliability_pipeline');

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--trace' && argv[i + 1]) args.traceId = argv[++i];
    else if (token === '--from' && argv[i + 1]) args.from = argv[++i];
    else if (token === '--to' && argv[i + 1]) args.to = argv[++i];
  }
  return args;
}

const filters = parseArgs(process.argv);
const entries = inspectDlq(filters);
console.log(`DLQ_INSPECT count=${entries.length} filters=${JSON.stringify(filters)}`);
console.log(JSON.stringify(entries, null, 2));

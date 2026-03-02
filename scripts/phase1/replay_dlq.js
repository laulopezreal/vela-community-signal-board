#!/usr/bin/env node
const { replayDlq } = require('../../lib/phase1/reliability_pipeline');

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--trace' && argv[i + 1]) args.traceId = argv[++i];
    else if (token === '--from' && argv[i + 1]) args.from = argv[++i];
    else if (token === '--to' && argv[i + 1]) args.to = argv[++i];
    else if (token === '--replay-trace' && argv[i + 1]) args.replayTraceId = argv[++i];
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv);
  const filters = { traceId: args.traceId, from: args.from, to: args.to };
  const result = await replayDlq(filters, { traceId: args.replayTraceId, repairForcedFailure: true });
  console.log(`DLQ_REPLAY selected=${result.selected} replayed=${result.replayed}`);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(`DLQ_REPLAY_FAIL reason=${err.message}`);
  process.exit(1);
});

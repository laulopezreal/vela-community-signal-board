#!/usr/bin/env node
const fs = require('fs');
const { PATHS } = require('../../lib/phase1/reliability_pipeline');

if (!fs.existsSync(PATHS.VALIDATION_REPORT_PATH)) {
  console.log('No validation report yet. Run ingestion first.');
  process.exit(0);
}

const report = JSON.parse(fs.readFileSync(PATHS.VALIDATION_REPORT_PATH, 'utf8'));
console.log(JSON.stringify({
  generatedAt: report.generatedAt,
  contractVersion: report.contractVersion,
  totals: report.totals,
  byReason: report.byReason,
  bySource: report.bySource,
}, null, 2));

const fs = require('fs');
const path = require('path');
const { hash } = require('../scoring/rubric');
const { parseExport, normalizeMessage, clusterDedupe } = require('../scoring/normalize');
const { upsertSignals, insertRunHistory, listRunHistory } = require('../db/fileDb');

function runConnectorJob({ connector, inputPath, outputDir }) {
  const startedAt = new Date().toISOString();
  const runId = `run_${hash(`${connector}|${startedAt}`).slice(0, 12)}`;

  try {
    const payload = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    const rows = parseExport(payload, connector);
    const errors = [];
    const normalized = [];
    const seenExternal = new Set();

    for (const row of rows) {
      const result = normalizeMessage(row, connector);
      if (result.skip) {
        errors.push({ rowId: row?.id || null, reason: result.reason });
        continue;
      }

      if (seenExternal.has(result.signal.externalId)) continue;
      seenExternal.add(result.signal.externalId);
      normalized.push(result.signal);
    }

    const dedupeClusters = clusterDedupe(normalized);
    const deduped = dedupeClusters.map((cluster) => normalized.find((s) => s.signalId === cluster.canonicalSignalId)).filter(Boolean);
    const scored = [...deduped].sort((a, b) => b.weighted - a.weighted || b.createdAt.localeCompare(a.createdAt));

    const inserted = upsertSignals(scored);
    const finishedAt = new Date().toISOString();
    const history = {
      runId,
      connector,
      status: 'success',
      rowsProcessed: rows.length,
      rowsInserted: inserted,
      rowsDeduped: normalized.length - deduped.length,
      startedAt,
      finishedAt,
      errorMessage: errors.length ? `${errors.length} malformed rows` : null,
    };
    insertRunHistory(history);

    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, `${connector}-normalized.json`), `${JSON.stringify(scored, null, 2)}\n`);
    fs.writeFileSync(path.join(outputDir, `${connector}-errors.json`), `${JSON.stringify(errors, null, 2)}\n`);
    fs.writeFileSync(path.join(outputDir, `${connector}-run-history.json`), `${JSON.stringify(listRunHistory().filter((x) => x.connector === connector), null, 2)}\n`);

    return history;
  } catch (error) {
    const finishedAt = new Date().toISOString();
    const history = {
      runId,
      connector,
      status: 'fail',
      rowsProcessed: 0,
      rowsInserted: 0,
      rowsDeduped: 0,
      startedAt,
      finishedAt,
      errorMessage: error.message,
    };
    insertRunHistory(history);
    return history;
  }
}

module.exports = { runConnectorJob };

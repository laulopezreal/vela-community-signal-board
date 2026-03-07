import fs from 'node:fs';
import path from 'node:path';

const DB_PATH = path.resolve(process.cwd(), 'server/db/community_signal_board.json');

const EMPTY_DB = {
  connector_signals: [],
  connector_run_history: [],
};

function ensureDb() {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    fs.writeFileSync(DB_PATH, `${JSON.stringify(EMPTY_DB, null, 2)}\n`);
  }
}

function loadDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function saveDb(db) {
  fs.writeFileSync(DB_PATH, `${JSON.stringify(db, null, 2)}\n`);
}

function upsertSignals(signals) {
  const db = loadDb();
  const byIdempotency = new Map(db.connector_signals.map((x) => [x.idempotencyKey, x]));
  let inserted = 0;

  for (const signal of signals) {
    if (byIdempotency.has(signal.idempotencyKey)) continue;
    db.connector_signals.push(signal);
    byIdempotency.set(signal.idempotencyKey, signal);
    inserted += 1;
  }

  saveDb(db);
  return inserted;
}

function insertRunHistory(entry) {
  const db = loadDb();
  db.connector_run_history.push(entry);
  saveDb(db);
}

function listRunHistory() {
  const db = loadDb();
  return [...db.connector_run_history].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export { DB_PATH, upsertSignals, insertRunHistory, listRunHistory };

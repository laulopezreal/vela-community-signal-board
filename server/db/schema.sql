CREATE TABLE IF NOT EXISTS connector_signals (
  signal_id TEXT PRIMARY KEY,
  connector TEXT NOT NULL,
  external_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  dedupe_key TEXT NOT NULL,
  source TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL,
  weighted REAL NOT NULL
);

CREATE TABLE IF NOT EXISTS connector_run_history (
  run_id TEXT PRIMARY KEY,
  connector TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('success','fail')),
  rows_processed INTEGER NOT NULL,
  rows_inserted INTEGER NOT NULL,
  rows_deduped INTEGER NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT NOT NULL,
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS connector_run_history (
  run_id TEXT PRIMARY KEY,
  connector TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT NOT NULL,
  rows_processed INTEGER NOT NULL DEFAULT 0,
  rows_imported INTEGER NOT NULL DEFAULT 0,
  rows_persisted INTEGER NOT NULL DEFAULT 0,
  duplicates_skipped INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  idempotency_key TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_connector_run_history_connector_started
  ON connector_run_history(connector, started_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_connector_run_history_idempotency
  ON connector_run_history(idempotency_key);

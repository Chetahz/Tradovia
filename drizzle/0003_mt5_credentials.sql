CREATE TABLE IF NOT EXISTS mt5_credentials (
  connection_id TEXT PRIMARY KEY NOT NULL REFERENCES broker_connections(id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  login TEXT,
  server TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS mt5_credentials_owner ON mt5_credentials(owner_id);

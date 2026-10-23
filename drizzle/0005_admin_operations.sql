CREATE TABLE IF NOT EXISTS ops_events (
  id TEXT PRIMARY KEY NOT NULL,
  owner_id TEXT,
  category TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  resolved_at INTEGER
);
CREATE INDEX IF NOT EXISTS ops_events_created ON ops_events(created_at DESC);
CREATE INDEX IF NOT EXISTS ops_events_owner ON ops_events(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ops_events_category_status ON ops_events(category, status, created_at DESC);

CREATE TABLE IF NOT EXISTS admin_audit_events (
  id TEXT PRIMARY KEY NOT NULL,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS admin_audit_created ON admin_audit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS admin_audit_actor ON admin_audit_events(actor_id, created_at DESC);

ALTER TABLE ops_events ADD COLUMN resolution_note TEXT;
ALTER TABLE ops_events ADD COLUMN updated_at INTEGER;

CREATE TABLE IF NOT EXISTS customer_support_notes (
  id TEXT PRIMARY KEY NOT NULL,
  owner_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS support_notes_owner_created ON customer_support_notes(owner_id, created_at DESC);

ALTER TABLE webhook_events ADD COLUMN event_type TEXT;
ALTER TABLE webhook_events ADD COLUMN status TEXT;

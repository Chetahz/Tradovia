CREATE TABLE IF NOT EXISTS playbooks (
  id TEXT PRIMARY KEY NOT NULL,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payload TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS playbook_owner ON playbooks(owner_id);

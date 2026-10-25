CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY NOT NULL,
  owner_id TEXT NOT NULL,
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  closed_at INTEGER,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS support_tickets_owner_updated ON support_tickets(owner_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS support_tickets_status_updated ON support_tickets(status, updated_at DESC);

CREATE TABLE IF NOT EXISTS support_messages (
  id TEXT PRIMARY KEY NOT NULL,
  ticket_id TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  author_type TEXT NOT NULL,
  author_id TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS support_messages_ticket_created ON support_messages(ticket_id, created_at);
CREATE INDEX IF NOT EXISTS support_messages_owner_created ON support_messages(owner_id, created_at DESC);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY NOT NULL,
  owner_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT NOT NULL DEFAULT '',
  read_at INTEGER,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS notifications_owner_created ON notifications(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_owner_unread ON notifications(owner_id, read_at, created_at DESC);

CREATE TABLE IF NOT EXISTS daily_checkins (
  id TEXT PRIMARY KEY NOT NULL,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  checkin_date TEXT NOT NULL,
  payload TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS daily_checkin_owner_date ON daily_checkins(owner_id, checkin_date);

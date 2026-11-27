-- 003_events: knowledge sessions, job fairs, training camps
CREATE TABLE IF NOT EXISTS events(
  id TEXT PRIMARY KEY, title_hi TEXT NOT NULL, title_en TEXT NOT NULL,
  kind TEXT DEFAULT 'session',
  event_date TEXT DEFAULT '', place TEXT DEFAULT '', district TEXT DEFAULT '',
  contact TEXT DEFAULT '', demo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_events_district ON events(district);

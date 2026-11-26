-- 002_hunar: talent/skill showcase profiles for skilled women
CREATE TABLE IF NOT EXISTS hunar_profiles(
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  village TEXT DEFAULT '', district TEXT DEFAULT 'Jaipur',
  skills TEXT[] DEFAULT '{}',
  experience TEXT DEFAULT '',
  expected_work TEXT DEFAULT '',
  available_home BOOLEAN DEFAULT true,
  photo_url TEXT DEFAULT '',
  verified BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending',
  views INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_hunar_district ON hunar_profiles(district);
CREATE INDEX IF NOT EXISTS idx_hunar_status ON hunar_profiles(status);

CREATE TABLE IF NOT EXISTS hunar_interests(
  id TEXT PRIMARY KEY,
  hunar_id TEXT REFERENCES hunar_profiles(id),
  by_name TEXT DEFAULT '', by_contact TEXT DEFAULT '', message TEXT DEFAULT '',
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT now()
);

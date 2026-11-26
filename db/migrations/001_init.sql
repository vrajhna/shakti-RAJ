-- SHAKTI production schema — 001_init
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users(
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  pin_hash TEXT NOT NULL,
  village TEXT DEFAULT '',
  district TEXT DEFAULT 'Jaipur',
  lang TEXT DEFAULT 'hi',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_district ON users(district);

CREATE TABLE IF NOT EXISTS admin_users(
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  pin_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'moderator',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employers(
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'SHG',
  district TEXT DEFAULT '',
  contact TEXT DEFAULT '',
  status TEXT DEFAULT 'approved',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS employer_requests(
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT '',
  district TEXT DEFAULT '',
  contact TEXT DEFAULT '',
  job_detail TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS jobs(
  id TEXT PRIMARY KEY,
  title_hi TEXT NOT NULL, title_en TEXT NOT NULL,
  employer TEXT NOT NULL, employer_type TEXT DEFAULT '',
  verified BOOLEAN DEFAULT false, verification TEXT DEFAULT '',
  village TEXT DEFAULT '', district TEXT DEFAULT '', pincode TEXT DEFAULT '',
  distance_km NUMERIC DEFAULT 0,
  pay NUMERIC DEFAULT 0, pay_unit TEXT DEFAULT 'monthly', pay_hi TEXT DEFAULT '',
  hours TEXT DEFAULT '', home_based BOOLEAN DEFAULT false,
  part_time BOOLEAN DEFAULT false, flexible BOOLEAN DEFAULT false,
  daily_wage BOOLEAN DEFAULT false, seasonal BOOLEAN DEFAULT false,
  category TEXT DEFAULT '', skills TEXT[] DEFAULT '{}',
  education TEXT DEFAULT '', childcare BOOLEAN DEFAULT false,
  disability_friendly BOOLEAN DEFAULT false,
  phone TEXT DEFAULT '', desc_hi TEXT DEFAULT '', desc_en TEXT DEFAULT '',
  status TEXT DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_jobs_district ON jobs(district);
CREATE INDEX IF NOT EXISTS idx_jobs_home ON jobs(home_based);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_cat ON jobs(category);

CREATE TABLE IF NOT EXISTS applications(
  id TEXT PRIMARY KEY,
  job_id TEXT REFERENCES jobs(id),
  user_id TEXT REFERENCES users(id),
  name TEXT NOT NULL, phone TEXT NOT NULL,
  village TEXT DEFAULT '', answers TEXT DEFAULT '',
  status TEXT DEFAULT 'submitted',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_apps_phone ON applications(phone);
CREATE INDEX IF NOT EXISTS idx_apps_job ON applications(job_id);

CREATE TABLE IF NOT EXISTS saved_jobs(
  user_id TEXT REFERENCES users(id), job_id TEXT REFERENCES jobs(id),
  created_at TIMESTAMPTZ DEFAULT now(), PRIMARY KEY(user_id, job_id)
);

CREATE TABLE IF NOT EXISTS courses(
  id TEXT PRIMARY KEY, cat TEXT DEFAULT '',
  title_hi TEXT NOT NULL, title_en TEXT NOT NULL,
  level TEXT DEFAULT 'beginner', dur TEXT DEFAULT '',
  lessons INT DEFAULT 0, img TEXT DEFAULT '',
  desc_hi TEXT DEFAULT '', desc_en TEXT DEFAULT '',
  body_hi TEXT DEFAULT '', body_en TEXT DEFAULT '',
  quiz TEXT[] DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS certificates(
  id TEXT PRIMARY KEY, course_id TEXT REFERENCES courses(id),
  user_id TEXT REFERENCES users(id),
  name TEXT NOT NULL, phone TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS anganwadi_centres(
  id TEXT PRIMARY KEY, name TEXT NOT NULL,
  village TEXT DEFAULT '', district TEXT DEFAULT '', pincode TEXT DEFAULT '',
  hours TEXT DEFAULT '', contact TEXT DEFAULT '',
  distance_km NUMERIC DEFAULT 0, facilities TEXT[] DEFAULT '{}',
  demo BOOLEAN DEFAULT true
);
CREATE TABLE IF NOT EXISTS anganwadi_reports(
  id TEXT PRIMARY KEY, centre_id TEXT DEFAULT '',
  detail TEXT DEFAULT '', created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shg_groups(
  id TEXT PRIMARY KEY, name TEXT NOT NULL,
  village TEXT DEFAULT '', district TEXT DEFAULT '',
  members INT DEFAULT 0, work TEXT DEFAULT '', contact TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS marketplace_items(
  id TEXT PRIMARY KEY, item_hi TEXT NOT NULL, item_en TEXT NOT NULL,
  price NUMERIC DEFAULT 0, unit TEXT DEFAULT 'piece',
  district TEXT DEFAULT '', seller TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS business_guides(
  id TEXT PRIMARY KEY, title_hi TEXT NOT NULL, title_en TEXT NOT NULL,
  body_hi TEXT DEFAULT '', body_en TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS reports(
  id TEXT PRIMARY KEY, job_id TEXT DEFAULT '',
  reporter_id TEXT REFERENCES users(id),
  reason TEXT DEFAULT 'other', detail TEXT DEFAULT '', contact TEXT DEFAULT '',
  status TEXT DEFAULT 'new', created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

CREATE TABLE IF NOT EXISTS feedback(
  id TEXT PRIMARY KEY, user_id TEXT REFERENCES users(id),
  page TEXT DEFAULT '/', message TEXT NOT NULL, lang TEXT DEFAULT 'hi',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS analytics_events(
  id BIGSERIAL PRIMARY KEY, ts TIMESTAMPTZ DEFAULT now(),
  event TEXT NOT NULL, page TEXT DEFAULT '/', lang TEXT DEFAULT 'hi',
  district TEXT DEFAULT '', user_id TEXT REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_events_event ON analytics_events(event);
CREATE TABLE IF NOT EXISTS audit_logs(
  id BIGSERIAL PRIMARY KEY, ts TIMESTAMPTZ DEFAULT now(),
  who TEXT DEFAULT '', action TEXT NOT NULL, detail TEXT DEFAULT ''
);

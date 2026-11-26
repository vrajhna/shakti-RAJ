-- SHAKTI PostgreSQL migration path (production). Dev uses data/db.json.
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, name TEXT, phone TEXT, village TEXT, district TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS employers(id TEXT PRIMARY KEY, name TEXT, type TEXT, district TEXT, contact TEXT, status TEXT DEFAULT 'pending', created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS jobs(id TEXT PRIMARY KEY, title_hi TEXT, title_en TEXT, employer TEXT, employer_type TEXT, verified BOOLEAN DEFAULT false, village TEXT, district TEXT, pincode TEXT, distance_km NUMERIC, pay NUMERIC, pay_unit TEXT, pay_hi TEXT, hours TEXT, home_based BOOLEAN, part_time BOOLEAN, flexible BOOLEAN, category TEXT, childcare BOOLEAN, disability_friendly BOOLEAN, phone TEXT, desc_hi TEXT, desc_en TEXT, status TEXT DEFAULT 'published', created_at TIMESTAMPTZ DEFAULT now());
CREATE INDEX IF NOT EXISTS idx_jobs_district ON jobs(district);
CREATE INDEX IF NOT EXISTS idx_jobs_home ON jobs(home_based);
CREATE TABLE IF NOT EXISTS applications(id TEXT PRIMARY KEY, job_id TEXT REFERENCES jobs(id), name TEXT, phone TEXT, village TEXT, answers TEXT, status TEXT DEFAULT 'submitted', created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS courses(id TEXT PRIMARY KEY, cat TEXT, title_hi TEXT, title_en TEXT, body_hi TEXT, body_en TEXT);
CREATE TABLE IF NOT EXISTS certificates(id TEXT PRIMARY KEY, course_id TEXT, name TEXT, phone TEXT, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS anganwadi(id TEXT PRIMARY KEY, name TEXT, village TEXT, district TEXT, pincode TEXT, hours TEXT, contact TEXT, demo BOOLEAN DEFAULT true);
CREATE TABLE IF NOT EXISTS reports(id TEXT PRIMARY KEY, job_id TEXT, reason TEXT, detail TEXT, status TEXT DEFAULT 'new', created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE IF NOT EXISTS analytics_events(id SERIAL PRIMARY KEY, ts TIMESTAMPTZ DEFAULT now(), event TEXT, page TEXT, lang TEXT, demo BOOLEAN DEFAULT true);
CREATE TABLE IF NOT EXISTS audit_logs(id SERIAL PRIMARY KEY, ts TIMESTAMPTZ DEFAULT now(), who TEXT, action TEXT, detail TEXT);

-- 004_employer-job-ownership: link employer-posted jobs to posting user
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS posted_by TEXT REFERENCES users(id);
CREATE INDEX IF NOT EXISTS idx_jobs_posted_by ON jobs(posted_by);

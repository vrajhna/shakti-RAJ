-- 007_sso: link users to Rajasthan SSO subject
ALTER TABLE users ADD COLUMN IF NOT EXISTS sso_id TEXT UNIQUE;

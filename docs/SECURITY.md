# SHAKTI security notes (prototype)

- No dependencies → small attack surface. Input caps on all POST bodies; phone masking in public responses.
- Admin gated by `ADMIN_PASSWORD` (env) + HMAC token (12h). Never expose token; never log passwords.
- Rate limits: apply 20/min, report 15/min, ai 15/min, voice generous.
- Uploads: none in v1 (employer docs = "bring to CSC/office" in pilot; file upload only with AV + type/size checks in production).
- XSS: all user strings escaped in frontend (`esc()`); JSON API only.
- No secrets in frontend. Meta key (if set) stays server-side; AI never invents jobs/verification — local KB fallback.
- PII: applications visible only by phone-match or admin; analytics = counts only, no location precision beyond district.
- Audit log (`DB.audit`) for logins, applies, reports, moderation.
- Production TODO: Postgres (schema ready), HTTPS, SSO/Sewadwaar OAuth, backups, AV-scanned uploads, pentest. NOT claimed certified.

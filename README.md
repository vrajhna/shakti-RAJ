# 🌸 SHAKTI — Safe & Flexible Work Discovery Platform for Rural Women

**Rajasthan Innovation Challenge (Atal Innovation Award) — Panel-3**
**VRAJHNA Technologies, Alwar** • Challenge est. ₹22,00,000 (estimate, not approved budget)

Production system: **Postgres + Express API (Railway) + Vite PWA (Cloudflare Pages) + Meta AI (server-side)**.

## Layout

```
shakti-RAJ/
  backend/          # Express + pg + JWT + helmet + rate-limit + zod + Meta AI → Railway
  frontend/         # Vite static PWA (Hindi-first, voice-first) → Cloudflare Pages
  db/migrations/   # Postgres DDL (001_init.sql)
  docker-compose.yml  # local prod-like run (postgres + api)
  railway.json      # Railway Dockerfile deploy + /api/health check
  wrangler.toml     # Cloudflare Pages notes
  server.js / public/  # offline laptop fallback (zero-dep prototype, panel demo)
```

## Local production run (Postgres + API + Web)

```bash
# 1. Postgres (docker)
docker run -d --name shakti-postgres \
  -e POSTGRES_PASSWORD=shakti_strong_pw_2026 -e POSTGRES_USER=shakti -e POSTGRES_DB=shakti \
  -p 5433:5432 postgres:16

# 2. API
cd backend && cp .env.example .env   # set JWT_SECRET, ADMIN_PASSWORD, DATABASE_URL
npm install && npm test && node src/index.js   # :3101, auto-migrates + seeds

# 3. Web (dev, proxied to API)
cd frontend && npm install && npm run dev        # :5173
# production build (set API URL first):
VITE_API_URL=http://127.0.0.1:3101 npm run build && npm run preview  # :4173
```

Health: `GET /api/health` → `{ok, app, ai, db:{jobs,courses}}`. Ready: `GET /api/ready`.

## Deploy

**Railway (API):** create project → add Postgres plugin (uses `DATABASE_URL`) → deploy `backend/` via Dockerfile → set env:
`JWT_SECRET` (64-hex), `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `FRONTEND_URLS=https://<pages-domain>`,
optional `META_API_KEY` (+`META_MODEL`, default `muse-spark-1.3`). Healthcheck `/api/health`.

**Cloudflare Pages (Web):** connect repo → root `frontend/` → build `npm run build`, output `dist` →
env `VITE_API_URL=https://<railway-api-domain>`. `_redirects` (SPA fallback) + `_headers` (security) included.

## Auth & roles

- Women: phone + 4-digit PIN → JWT (`30d`). Guest apply/report allowed with phone; own data via token.
- Admins: username + password (bcrypt) → JWT (`12h`), roles `super_admin | moderator | verifier`.
  Bootstrap from `ADMIN_USERNAME`/`ADMIN_PASSWORD` on first boot. OTP-SMS login is the documented upgrade when an SMS-gateway key is provided.
- Meta AI: set `META_API_KEY` (server-side only, never in frontend). Without key, verified local KB + intent engine answers — never hallucinates jobs/verification.

## Security (see docs/SECURITY.md)

helmet, CORS allowlist (`FRONTEND_URLS`), rate limits (global/auth/apply/report/ai), zod validation, parameterized SQL only, bcrypt(12), short admin TTL, phone masking, audit logs, `npm audit` in CI. No secrets in frontend. `GET /api/admin/*` requires admin JWT; moderation requires `super_admin|moderator|verifier`.

## Honest limits (say to panel)

- Anganwadi rows are **synthetic DEMO** (`demo=true`) until WCD dataset integration.
- Certificates = learning proof, **not govt-recognised**.
- Dialects = assisted-audio architecture; full STT only after testing.
- "Verified" = ID+contact+address checked — evidence, not a 100% safety guarantee.

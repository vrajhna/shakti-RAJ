# SHAKTI deployment

## Local / panel laptop
```bash
npm start  # PORT=3100
```

## Railway / Render / VPS (Node 18+)
- Build: none (zero-dep). Start: `node server.js`.
- Env: `PORT`, `HOST=0.0.0.0`, `ADMIN_PASSWORD` (strong!), `TOKEN_SECRET`, optional `META_API_KEY`, `META_MODEL`.
- Persist `data/db.json` via volume; or migrate to Postgres with `db/schema.sql`.

## SSO / Sewadwaar (when DoIT&C issues keys)
- Adapter pattern from FARM.RAJ applies: server-side OAuth2/OIDC + `?clientID=` gateway.
- Until keys: manual checklist in admin + labelled demo (never fake).

## PWA
- `manifest.json` + `sw.js` (minimal). Add icons + offline cache for `/skills` in production.

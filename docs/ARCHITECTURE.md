# SHAKTI architecture (prototype)

```
Woman (mobile, Hindi-first, voice) 
  → PWA (hash router, big cards, STT/TTS w/ fallback)
  → Node APIs (server.js, zero-dep)
  → file JSON DB (data/db.json) → Postgres path (db/schema.sql)
  → optional Meta AI (server key) else local intent/KB
  → admin (HMAC token, moderation, analytics)
Gov integrations (future): WCD Anganwadi dataset, SHG registries, SSO/Sewadwaar, skilling/CSC
```

Key files: `server.js` (APIs+static), `public/app.js` (all routes), `public/styles.css`, `public/pitch.html`.
Safety: verification workflow + auto-flags + report→suspend + audit. Privacy: masked phones, counts-only analytics.

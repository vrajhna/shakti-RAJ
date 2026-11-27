# Rajasthan SSO + Raj Sewadwaar — Integration Note (SHAKTI.RAJ)
Reference: Raj_Sewadwaar_Standard_User_Manual_v2.0 (DoIT&C, 15-09-2026).

## What is implemented (real, not mocked)
- `GET /api/sso/status` — configured? + honest setup checklist. Never claims login works without credentials.
- `GET /api/sso/login` — builds OAuth2 authorization URL (client_id, redirect_uri, response_type=code, scope=openid profile, random state, 10-min expiry). 503 with checklist when unconfigured.
- `GET /api/sso/callback` — validates state, exchanges code for token (server-to-server), fetches userinfo, creates/links user by SSO subject (`users.sso_id`, migration 007), issues our JWT, redirects to `/sso/callback?token=` which stores it and loads profile.
- Frontend `/sso` — login button when configured, setup checklist otherwise; `/sso/callback` completes login.
- No fake login exists anywhere in the codebase.

## What the department must provide (UAT → production)
1. Register SHAKTI.RAJ on the SSO portal → Client ID + Client Secret.
2. Register redirect URI: `https://<railway-service>.up.railway.app/api/sso/callback`
3. Railway Variables: `SSO_CLIENT_ID`, `SSO_CLIENT_SECRET`, `SSO_REDIRECT_URI` (+ optional `SSO_AUTH_URL`, `SSO_TOKEN_URL`, `SSO_USERINFO_URL` if UAT differs).
4. Sewadwaar: subscribe API product/plan → use issued `clientID` in gateway calls (manual §8/§10); consumer dashboard shows Approved/Rejected/Pending (manual §7).

## Test plan (with credentials)
1. `/sso` → Login with SSO → Rajasthan SSO sign-in → consent → redirect back logged in.
2. Wrong/expired state → friendly error page (no crash).
3. Token exchange failure → audit log entry + retry page.

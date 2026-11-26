# SHAKTI demo runbook (laptop, offline-tolerant)

## Pre-flight (tonight)
- [ ] `npm test` passes
- [ ] `npm start` → http://localhost:3100 loads, no console errors
- [ ] Test 🔊 Listen (Chrome), 🎤 voice (Chrome; Firefox = type fallback — fine, say so)
- [ ] Pre-open tabs: `/`, `/#/jobs`, `/#/jobs/j2`, `/#/skills/c3`, `/#/anganwadi`, `/#/admin`, `/pitch.html`
- [ ] Admin password ready (default `shakti-admin-2026`); change via `.env` if needed
- [ ] Pitch deck (FARM.RAJ ppt pattern) + this app: keep both on desktop
- [ ] Webex: laptop + stable net + audio; username = startup name; webcam on

## Click path (3-min version)
1. `/` → big cards visible → click 🔍 काम ढूंढें
2. `#/jobs` → check 🏠 → results shrink → open `j2`
3. `j2` → 🔊 सुनें → Apply → name/phone/village → submit → `#/applications` shows `submitted`
4. `#/skills/c3` → 🔊 पाठ सुनें → name → certificate → `#/certificates`
5. `#/anganwadi` → type `Chomu` → demo centres → point at DEMO tag
6. `#/admin` → login → overview counts → reports → suspend demo → analytics

## If something fails live
- Voice fails → "Browser STT सीमित है — टाइप विकल्प हमेशा" → type instead.
- Audio fails → read the Hindi text aloud yourself (panel loves it).
- Net fails → app is local (`localhost`) — still works except Unsplash images (they hide gracefully) and Meta AI (falls back to local KB — say so).
- Forget password → `.env` ADMIN_PASSWORD or restart with default.

## After demo
- Show `/pitch.html` slide 6 (cost) + slide 7 (limits) — honesty wins marks.
- Offer: "Report flow + blocked scam demo + profit calculator भी दिखा सकता हूं।"

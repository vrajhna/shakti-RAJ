# SHAKTI.RAJ — Checklists (interview day)

## A. Woman's journey (demo script, 3 min) — panel me yehi chalao
1. `/` home → slideshow auto-changes + dots → search me "silai" likho → Jobs khulenge
2. Drawer (☰) → Jobs → filter 🏠 Home-based → verified badge wali job kholo → 🔊 Listen → 📝 Apply (naam+phone+gaon) → Applications me `submitted` dikhe
3. Hunar (🌟 bottom nav) → skill chips Hindi me bhi, English me bhi (en select karke dekho) → Add my skill → naam/phone/hunar/photo → submit → "जांच के बाद दिखेगा"
4. Learn (📚) → category chip → course kholo → modules/lessons → lesson kholo → 🔊 Listen → steps → practice → quiz (1-by-1, sahi/galat) → Mark done (login par progress + badge)
5. My Learning → progress bar + continue + bookmarks (♡ course me)
6. Companies → verified employers + open roles + View → job detail
7. Anganwadi → village search → DEMO tag dikhao (honest!) → report-wrong-info
8. Business → profit calculator (200+20+30, 5 hrs) → guides → Marketplace
9. Voice (🎤 FAB) → bolo "ghar baithe kaam" → jobs + spoken reply
10. Help → chat me "hy" likho → short streaming answer + engine badge (NO auto-speak; 🔊 chip se on/off)
11. Safety → rules + helplines + report flow
12. Login/Signup → PIN flow → Profile → Saved jobs → Logout
13. SSO page → checklist visible (dept credentials ke baad live; kabhi fake login nahi)

## B. Admin journey
1. `/admin` → username+password login → role badge
2. Overview counts (jobs/verified/suspended/apps/reports/hunar pending/employers/learn)
3. Hunar pending → ✓ approve / ✕ reject → `/hunar` me dikhe
4. Employer "Post a job" (login as user) → status pending → admin ✓+verify → `/jobs` me live
5. Reports → review/block (job suspend hota hai)
6. Learn CMS → course list + status → publish/unpublish → new course (draft) → new lesson + quiz → publish → `/learn` me live
7. Analytics (public-safe counts) + learn analytics (popular/dropoff/langs)

## C. Pre-interview tech check (15 min before)
- [ ] Railway service Online + `postgres OK` in logs, no crash loop
- [ ] `https://<railway>/api/health` → ok:true, ai:meta, jobs>=26
- [ ] Cloudflare Worker → Settings → Variables → `API_URL` = Railway URL (exact spelling!)
- [ ] `https://shakti-raj.vrajhna.workers.dev/api/health` → same JSON (proves proxy works)
- [ ] Phone: hard refresh → footer build stamp = latest commit → slideshow moves → dots visible
- [ ] Language EN → full English (no Hindi remnants in buttons/labels); HI → full Hindi
- [ ] Mic (Chrome, HTTPS) → toast guides on failure; Enter/Go submits everywhere
- [ ] Chat: short answer + engine badge, NO auto-voice (toggle off default)
- [ ] PWA: Settings → Install app button works / browser offers install
- [ ] SSO page shows honest checklist (no fake login anywhere)

## D. Hunar + Analytics verification (known-sensitive areas)
- Hunar: create → pending (not public) → admin approve → public with masked phone (guest) / full (login) → interest recorded → admin sees interests
- Analytics: public page = counts only; learn analytics = aggregated (popular/dropoff/langs); no names/phones anywhere
- Audit: every login/apply/report/moderation in audit_logs (admin overview shows trail)

## E. Q&A armor (30-sec answers)
- Data? Postgres + migrations; demo Anganwadi labelled; certificates = learning proof.
- Dialects? UI chrome translated; STT hi-IN + assisted audio; full STT after field validation.
- Verified ≠ guarantee? Evidence + reporting + 48h SLA + re-checks + 181/1930.
- SSO? OAuth2 adapter ready; activates on dept Client ID/Secret + UAT; Sewadwaar manual v2.0 mapped; never faked.
- Scale? Stateless Node, Postgres indexes, Cloudflare edge static + Railway API; file-JSON dev fallback exists.
- Cost? ₹22L estimate only (pitch p. S12); Churu office + 10 local jobs inside it.

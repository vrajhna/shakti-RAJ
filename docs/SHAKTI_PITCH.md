# SHAKTI.RAJ — Canva Pitch Deck Pack (copy-paste ready)
Vrajhna Technologies Pvt. Ltd. · Challenge: Safe & Flexible Work Discovery Platform for Rural Women
Applied: 31 Aug 2026 · **Ask: ₹22,00,000** · Status: evaluation

## How to build in Canva (10 min)
Template: pink/brown "women empowerment" · Fonts: large Hindi-capable (Noto Sans/Tiro Devanagari) ·
16:9 · 15 slides · each slide = heading + 3 bullets + 1 visual cue below.

---

**S1 — Title**
🌸 SHAKTI.RAJ — काम, हुनर और सुरक्षित अवसर।
Sub: Every rural woman's path from learning to earning · by Vrajhna Technologies Pvt. Ltd.
Visual: homepage slideshow screenshot on a phone mockup.

**S2 — The problem (challenge statement)**
1. 75%+ rural working women locked in unpaid/low-productivity agri labour
2. Unsafe mobility + childcare burden block nearby formal work
3. No visibility into verified local/home-based opportunities
4. Fraud (advance fees, OTP scams) destroys trust in job platforms
Visual: 4 red ❌ icons.

**S3 — Our answer (one line)**
SHAKTI.RAJ doesn't list jobs — it builds the **whole journey: learn → skill → verified work → business**.
Existing systems (SSO, Sewadwaar, WCD, SHGs) stay systems of record. We integrate, translate, verify and guide.
Visual: Woman → SHAKTI.RAJ → Learn/Jobs/SHG/Anganwadi/Market.

**S4 — Live product, not slides (QR to site)**
https://shakti-raj.vrajhna.workers.dev — working today: 26+ verified jobs, Hunar skill showcase,
Companies hiring directly, Anganwadi finder, SHG + marketplace, safety centre.
**QR code of the URL here.**

**S5 — Learn University (free forever)**
24 categories, 12 complete starter courses (128 Hindi lessons + quizzes + audio),
progress tracking, bookmarks, My Learning, 12 more coming, government scheme discovery.
Tailoring → tailoring jobs; Excel → office jobs. Visual: lesson + quiz screenshots.

**S6 — Hunar: skills get discovered**
Voice-assisted skill profiles (photo, skills, experience) → admin verification →
companies/SHGs discover and contact. Phone numbers masked until login.
Visual: hunar profile cards.

**S7 — Companies hire directly**
Verified employers (SHG/FPO/registered/companies) post real jobs → admin approves →
women apply in 3 questions. No middlemen, no fees, ever.
Visual: companies page + application flow.

**S8 — For women who've never used the internet**
Big photo buttons, voice input + read-aloud, large text, low-bandwidth photo-off mode,
13 languages: हिंदी, English, मारवाड़ी, मेवाड़ी, ढूंढाड़ी, हाड़ौती, शेखावाटी, वागड़ी, बागड़ी, मेवाती, पंजाबी, उर्दू, गुजराती.
Visual: language menu + voice screenshot.

**S9 — AI assistant (Meta, streaming, server-side)**
Streams Hindi answers word-by-word (duck.ai-style fast first token), grounded ONLY on
verified jobs — never invents listings. Local-KB fallback when keys rotate.
Keys never touch the phone. Visual: chat screenshot with engine badge.

**S10 — Safety is the product**
Employer verification workflow, scam-pattern auto-flags, report → 48h review → suspend,
blocked-scam demo list, helplines 181/1090/1930/112. **Verified ≠ guaranteed — evidence + reporting.**
Visual: safety centre + blocked listing.

**S11 — Rajasthan SSO + Sewadwaar — honest integration**
OAuth2 adapter + Sewadwaar consumer flow mapped to Manual v2.0.
Today: real login button + setup checklist; activates fully on dept credentials + UAT.
**We never fake a government login.** Visual: SSO page card.

**S12 — ₹22,00,000 budget (12 months)**
| Head | ₹ |
|---|---|
| Product design & accessibility | 2,50,000 |
| Software development (platform + AI + apps) | 6,00,000 |
| Verification & safety systems | 2,50,000 |
| Learning & content production (24 domains, audio studio) | 2,00,000 |
| Data integrations & APIs (SSO/Sewadwaar/WCD/SHG registries) | 2,00,000 |
| Pilot deployment & field testing (2 districts) | 2,00,000 |
| Churu field office (rent, setup) | 2,00,000 |
| Local employment — 6 youth + 4 women (support, content, training) | 3,00,000 |
| Hosting, security & testing | 1,00,000 |
| Training, documentation & support | 1,00,000 |
| **Total** | **22,00,000** |

**S13 — Churu field office + local employment**
Office in main town; hire locally: 2 graduates (content/validation), 2 support
(Hindi/Marwari/Shekhawati), 4 women (audio lessons, SHG outreach), 1 coordinator.
Women learn directly through us at CSCs, schools, melas. Visual: map pin Churu + team grid.

**S14 — Reach everywhere**
PWA today (install from website) → Play Store + App Store (PWABuilder),
CSC kiosks, WhatsApp/IVR next. Marketing: radio, SHG meetings, mela demos, YouTube Shorts in dialects.

**S15 — The ask**
₹22L pilot → 6-month field pilot in 2 districts → SSO + Sewadwaar + WCD live →
statewide rollout. **Vrajhna Technologies builds, staffs, trains, and maintains — everything from our side.**
Contact + QR + "Live demo now" button.

## Tech stack (1 line for Q&A)
Express + PostgreSQL · Vite PWA · Meta AI streaming (`api.llama.com/v1`) · JWT roles ·
Cloudflare Workers (static + /api proxy) + Railway · Rajasthan SSO OAuth2 + Sewadwaar adapters.

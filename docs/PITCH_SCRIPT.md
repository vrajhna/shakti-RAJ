# SHAKTI 10-minute panel script (Panel-3, 27 Nov 2026)

**Setup:** Webex 10–15 min early, username = startup name, webcam ON, pitch deck on desktop, SHAKTI running on `localhost:3100`, tabs pre-opened. 10 min present + Q&A.

## 0:00–1:00 — Problem (say)
"75% से अधिक ग्रामीण कामकाजी महिलाएं असंगठित कृषि श्रम में हैं। कई बार काम पास में होता है — पर महिलाएं उसे **खोज, पहुंच, भरोसा या बच्चों के साथ संतुलन** नहीं कर पातीं। पढ़ने में कठिनाई, मोबिलिटी, childcare, और धोखे का डर — यही असली बाधा है। हमारी सोच: सिर्फ job-listing नहीं, **accessible opportunity + safety + dignity**।"

## 1:00–6:00 — Live journey (DO, don't describe)
1. **Home:** "कोई रजिस्ट्रेशन नहीं — बड़े बटन, हिंदी पहले।" Click **काम ढूंढें**.
2. **Jobs:** filter **घर से काम** → open **j2 पापड़-पैकेजिंग** (verified badge show). Say: "दूरी, घर-से, पार्ट-टाइम, childcare फिल्टर — 2/5/10/20 km।"
3. **Listen:** press 🔊 — "जो पढ़ नहीं सकती, वो सुन सकती है।"
4. **Apply:** "बिना रिज्यूमे — नाम, फोन, गांव + 1 सवाल।" Submit → show applications page.
5. **Learn:** open **c3 UPI सुरक्षा** → Listen → certificate. "सभी 12 कोर्स मुफ्त, कोई प्रीमियम नहीं।"
6. **Childcare:** Anganwadi search → point at **DEMO label**: "आज डेमो डेटा — उत्पादन में WCD डेटासेट। गलत जानकारी रिपोर्ट होगी।"
7. **SHG/Business:** 2-sec: profit calculator + marketplace demo.

## 6:00–8:00 — Safety + Admin (differentiator)
- Open **j15 (pending)** → warning banner. Open **j16 (blocked scam)** → "फर्जी फीस+OTP पैटर्न — प्रकाशित नहीं, ब्लॉक। सीखने हेतु दिख रहा है।"
- **Admin:** login → show counts, reports queue, employer approve/reject, suspend, analytics. "Verification = ID+contact+address → approve/reject/suspend → re-check. 100% गारंटी का दावा नहीं — evidence + reporting।"
- Helplines: 181 / 1090 / 1930 / 112 + Safety Centre rules.

## 8:00–9:00 — Pilot + cost
"₹22L चुनौती अनुमान है — approved budget नहीं। प्रस्ताव: 2–3 जिलों में SHG साझेदारों संग structured pilot → usage, safety, placement conversion मापें → फिर विस्तार। Design 2.5 • Build 6 • Safety 2.5 • Content 2 • Data/APIs 2 • Pilot 2 • Hosting/security 1.5 • Training 1.5। Dataset access चाहिए: WCD आंगनवाड़ी, SHG/employer registry, SSO/Sewadwaar।"

## 9:00–10:00 — Close + buffer
"समस्या सिर्फ नौकरी की कमी नहीं — **सुरक्षित पहुंच** की कमी है। SHAKTI उसी खाई को भरता है। पायलट से प्रमाणित करके बढ़ेंगे। धन्यवाद — डेमो के लिए तैयार हूं।"

## Likely Q&A (30-sec each)
- **Illiterate users?** Voice+visual, 🔊 every card, 3-Q apply, Hindi-first, assisted audio for dialects.
- **Fake jobs?** Pre-publish verification, auto-flags (fee/OTP/pay), report→48h→suspend, no fee-listings ever.
- **Anganwadi accuracy?** Demo today; prod = WCD feed + report-wrong-info loop.
- **Scale/tech?** Zero-dep Node now, Postgres schema ready, stateless, role admin, SSO/Sewadwaar adapter ready on keys.
- **Why you vs portals?** We solve barriers (literacy, mobility, childcare, trust), not just listings.
- **Revenue/sustainability?** No user fees; govt/CSR pilot + SHG/marketplace enablement; hosting minimal.
- **Data/privacy?** Phone masking, no sensitive analytics, audit logs, secrets server-side.

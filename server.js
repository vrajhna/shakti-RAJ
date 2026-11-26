/*
 * SHAKTI — Safe & Flexible Work Discovery Platform for Rural Women
 * Zero-dependency Node.js prototype for Rajasthan Innovation Challenge (Atal Innovation Award).
 * Serves mobile-first PWA + REST APIs + admin/moderation APIs.
 * Storage: file-backed JSON DB (data/db.json). PostgreSQL migration path in db/schema.sql.
 * Demo data is clearly labelled demo. Anganwadi entries are SYNTHETIC DEMO — not official data.
 * No secrets in frontend. Admin via ADMIN_PASSWORD env.
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

try {
  const envRaw = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  envRaw.split('\n').forEach(line => {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) return;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!(m[1] in process.env) && v) process.env[m[1]] = v;
  });
} catch (e) {}

const PORT = process.env.PORT || 3100;
const HOST = process.env.HOST || '0.0.0.0';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'shakti-admin-2026';
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'shakti-dev-secret-change-me';

const ROOT = __dirname;
const PUB = path.join(ROOT, 'public');
const DATA = path.join(ROOT, 'data');
const DB_FILE = path.join(DATA, 'db.json');
for (const d of [DATA]) if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });

/* ---------------- seed data ---------------- */
const DISTRICTS = ['Jaipur','Alwar','Udaipur','Sikar','Nagaur','Sirohi','Churu','Ajmer','Bharatpur','Bhilwara','Jodhpur','Kota','Tonk','Dausa','Jhunjhunu','Pali'];

function seedDB() {
  const jobs = [
    { id:'j1', title_hi:'सिलाई सहायक — SHG उत्पादन केंद्र', title_en:'Stitching Assistant — SHG Production Centre', employer:'Udaan Mahila SHG Samooh', employer_type:'SHG', verified:true, verification:'SHG-verified', village:'Chomu', district:'Jaipur', pincode:'303702', distance_km:2, pay:6500, pay_unit:'monthly', pay_hi:'₹6,500/माह', hours:'10am–3pm', home_based:false, part_time:true, flexible:true, daily_wage:false, category:'tailoring', skills_hi:['सिलाई बेसिक'], skills_en:['basic stitching'], education:'no-formal', childcare:true, disability_friendly:true, phone:'+91-98290XXXXX', desc_hi:'ब्लाउज व सूट की सिलाई। प्रशिक्षण मिलेगा। घर के समय अनुसार पार्ट-टाइम। कोई फीस नहीं।', desc_en:'Blouse & suit stitching. Training provided. Part-time school-hours. No fees.', posted:'2026-11-10', scam_flags:[], status:'published' },
    { id:'j2', title_hi:'घर बैठे पापड़-पैकेजिंग कार्य', title_en:'Home-based Papad Packaging', employer:'Rajeshwari Foods (Registered)', employer_type:'Registered company', verified:true, verification:'Registered-verified', village:'Kotputli', district:'Jaipur', pincode:'303108', distance_km:0, pay:45, pay_unit:'per-packet', pay_hi:'₹45/पैकेट + साप्ताहिक भुगतान', hours:'flexible', home_based:true, part_time:true, flexible:true, daily_wage:true, category:'packaging', skills_hi:['पैकेजिंग'], skills_en:['packaging'], education:'no-formal', childcare:false, disability_friendly:true, phone:'+91-94140XXXXX', desc_hi:'कच्चा माल घर पहुंचेगा। तैयार पैकेट साप्ताहिक कलेक्शन। अग्रिम राशि नहीं मांगी जाएगी।', desc_en:'Raw material home-delivered. Weekly pickup of packed goods. No advance ever asked.', posted:'2026-11-12', scam_flags:[], status:'published' },
    { id:'j3', title_hi:'आंगनवाड़ी सहायिका (संविदा)', title_en:'Anganwadi Helper (Contractual)', employer:'Women & Child Development Dept (Govt)', employer_type:'Government', verified:true, verification:'Government', village:'Sikar', district:'Sikar', pincode:'332001', distance_km:4, pay:5500, pay_unit:'monthly', pay_hi:'₹5,500/माह (मानदेय)', hours:'9am–2pm', home_based:false, part_time:true, flexible:false, daily_wage:false, category:'govt', skills_hi:['बच्चों की देखभाल'], skills_en:['childcare'], education:'8th-pass', childcare:true, disability_friendly:false, phone:'01472-XXXXXX', desc_hi:'सरकारी मानदेय पद। चयन पारदर्शी प्रक्रिया से। कोई बिचौलिया फीस न दें।', desc_en:'Govt honorarium post. Transparent selection. Never pay middlemen.', posted:'2026-11-08', scam_flags:[], status:'published' },
    { id:'j4', title_hi:'ब्यूटी पार्लर सहायक — प्रशिक्षण सहित', title_en:'Beauty Parlour Assistant with Training', employer:'Glow Beauty Studio (Verified local)', employer_type:'Verified local business', verified:true, verification:'Verified-local', village:'Alwar', district:'Alwar', pincode:'301001', distance_km:5, pay:7000, pay_unit:'monthly', pay_hi:'₹7,000/माह + टिप', hours:'11am–5pm', home_based:false, part_time:true, flexible:true, daily_wage:false, category:'beauty', skills_hi:['ब्यूटी बेसिक'], skills_en:['beauty basics'], education:'no-formal', childcare:false, disability_friendly:true, phone:'+91-97820XXXXX', desc_hi:'महिला स्टाफ, सुरक्षित कार्यस्थल। 2 सप्ताह मुफ्त प्रशिक्षण।', desc_en:'All-women staff, safe workplace. 2-week free training.', posted:'2026-11-14', scam_flags:[], status:'published' },
    { id:'j5', title_hi:'कशीदाकारी — घर से काम', title_en:'Embroidery — Home-based', employer:'Maru Hastkala SHG Federation', employer_type:'SHG', verified:true, verification:'SHG-verified', village:'Barmer Road', district:'Jodhpur', pincode:'342001', distance_km:0, pay:120, pay_unit:'per-piece', pay_hi:'₹120/पीस', hours:'flexible', home_based:true, part_time:true, flexible:true, daily_wage:true, category:'embroidery', skills_hi:['कढ़ाई'], skills_en:['embroidery'], education:'no-formal', childcare:false, disability_friendly:true, phone:'+91-98280XXXXX', desc_hi:'कपड़े व धागा SHG देगा। साप्ताहिक भुगतान UPI/बैंक में।', desc_en:'Fabric & thread by SHG. Weekly UPI/bank payment.', posted:'2026-11-11', scam_flags:[], status:'published' },
    { id:'j6', title_hi:'डेटा एंट्री — सत्यापित NGO (हाइब्रिड)', title_en:'Data Entry — Verified NGO (Hybrid)', employer:'Saksham Seva Sansthan (Registered NGO)', employer_type:'Registered NGO', verified:true, verification:'NGO-verified', village:'Ajmer', district:'Ajmer', pincode:'305001', distance_km:6, pay:8500, pay_unit:'monthly', pay_hi:'₹8,500/माह', hours:'10am–4pm flexible', home_based:true, part_time:true, flexible:true, daily_wage:false, category:'digital', skills_hi:['मोबाइल चलाना'], skills_en:['basic phone use'], education:'10th-pass', childcare:false, disability_friendly:true, phone:'+91-94600XXXXX', desc_hi:'बेसिक हिंदी टाइपिंग। लैपटॉप कार्यालय में उपलब्ध। घर से भी कर सकती हैं।', desc_en:'Basic Hindi typing. Office laptop available. Home option too.', posted:'2026-11-13', scam_flags:[], status:'published' },
    { id:'j7', title_hi:'स्कूल रसोई सहायक (मिड-डे मील)', title_en:'School Kitchen Helper (Mid-day Meal)', employer:'Govt Upper Primary School (Govt)', employer_type:'Government', verified:true, verification:'Government', village:'Dausa', district:'Dausa', pincode:'303303', distance_km:3, pay:4500, pay_unit:'monthly', pay_hi:'₹4,500/माह', hours:'8am–1pm', home_based:false, part_time:true, flexible:false, daily_wage:false, category:'govt', skills_hi:['खाना बनाना'], skills_en:['cooking'], education:'no-formal', childcare:true, disability_friendly:false, phone:'01427-XXXXXX', desc_hi:'स्कूली समय में काम। बच्चों के साथ सुरक्षित परिसर।', desc_en:'School-hours work. Safe campus with children.', posted:'2026-11-09', scam_flags:[], status:'published' },
    { id:'j8', title_hi:'अचार-पापड़ उत्पादन — SHG समूह कार्य', title_en:'Pickle-Papad Production — SHG Group Work', employer:'Shakti Mahila Producer Group', employer_type:'FPO', verified:true, verification:'FPO-verified', village:'Nagaur', district:'Nagaur', pincode:'341001', distance_km:3, pay:350, pay_unit:'daily', pay_hi:'₹350/दिन', hours:'9am–2pm', home_based:false, part_time:true, flexible:true, daily_wage:true, category:'food', skills_hi:['अचार बनाना'], skills_en:['pickle making'], education:'no-formal', childcare:true, disability_friendly:true, phone:'+91-94130XXXXX', desc_hi:'समूह में काम, लाभ में हिस्सेदारी। FSSAI प्रशिक्षण मुफ्त।', desc_en:'Group work, profit share. Free FSSAI training.', posted:'2026-11-15', scam_flags:[], status:'published' },
    { id:'j9', title_hi:'टेलीकॉलर (महिला टीम, हिंदी)', title_en:'Telecaller (Women Team, Hindi)', employer:'Apna Sewa Kendra (Verified)', employer_type:'Verified local business', verified:true, verification:'Verified-local', village:'Jaipur', district:'Jaipur', pincode:'302001', distance_km:8, pay:9000, pay_unit:'monthly', pay_hi:'₹9,000/माह', hours:'10am–5pm', home_based:true, part_time:false, flexible:true, daily_wage:false, category:'digital', skills_hi:['बोलना'], skills_en:['speaking'], education:'10th-pass', childcare:false, disability_friendly:true, phone:'+91-98290XXXXX', desc_hi:'केवल महिला टीम, रिकॉर्डेड लाइन, घर से भी। कोई टारगेट दबाव नहीं।', desc_en:'Women-only team, recorded lines, work-from-home option. No harsh targets.', posted:'2026-11-16', scam_flags:[], status:'published' },
    { id:'j10', title_hi:'डेयरी सहायक — पशु देखभाल', title_en:'Dairy Assistant — Animal Care', employer:'Saras Dairy Cooperative', employer_type:'Cooperative', verified:true, verification:'Cooperative-verified', village:'Bhilwara', district:'Bhilwara', pincode:'311001', distance_km:5, pay:7500, pay_unit:'monthly', pay_hi:'₹7,500/माह', hours:'6–10am', home_based:false, part_time:true, flexible:false, daily_wage:false, category:'livestock', skills_hi:['पशु देखभाल'], skills_en:['animal care'], education:'no-formal', childcare:false, disability_friendly:false, phone:'+91-94140XXXXX', desc_hi:'सुबह की शिफ्ट, प्रशिक्षण मिलेगा। महिला सुपरवाइजर।', desc_en:'Morning shift, training given. Woman supervisor.', posted:'2026-11-07', scam_flags:[], status:'published' },
    { id:'j11', title_hi:'हस्तशिल्प — ब्लू पॉटरी पेंटिंग', title_en:'Handicraft — Blue Pottery Painting', employer:'Sanganer Hastkala Kendra', employer_type:'Registered company', verified:true, verification:'Registered-verified', village:'Sanganer', district:'Jaipur', pincode:'302029', distance_km:9, pay:500, pay_unit:'daily', pay_hi:'₹500/दिन', hours:'10am–4pm', home_based:false, part_time:true, flexible:true, daily_wage:true, category:'craft', skills_hi:['पेंटिंग'], skills_en:['painting'], education:'no-formal', childcare:true, disability_friendly:true, phone:'+91-98290XXXXX', desc_hi:'प्रशिक्षण + सामग्री केंद्र देगा। दिव्यांग महिलाओं हेतु सुलभ केंद्र।', desc_en:'Training + material provided. Accessible centre.', posted:'2026-11-12', scam_flags:[], status:'published' },
    { id:'j12', title_hi:'खेत उपज छंटाई-पैकिंग (मौसमी)', title_en:'Farm Produce Sorting-Packing (Seasonal)', employer:'Kisan Producer Company (FPO)', employer_type:'FPO', verified:true, verification:'FPO-verified', village:'Kota', district:'Kota', pincode:'324001', distance_km:7, pay:400, pay_unit:'daily', pay_hi:'₹400/दिन + भोजन', hours:'8am–1pm', home_based:false, part_time:true, flexible:false, daily_wage:true, seasonal:true, category:'agri', skills_hi:['छंटाई'], skills_en:['sorting'], education:'no-formal', childcare:false, disability_friendly:false, phone:'+91-94610XXXXX', desc_hi:'2 माह मौसमी कार्य। समूह में परिवहन। दैनिक भुगतान।', desc_en:'2-month seasonal. Group transport. Daily pay.', posted:'2026-11-15', scam_flags:[], status:'published' },
    { id:'j13', title_hi:'रिटेल सहायक — महिला स्टोर', title_en:'Retail Assistant — Women Store', employer:'Saheli Mart (Verified)', employer_type:'Verified local business', verified:true, verification:'Verified-local', village:'Tonk', district:'Tonk', pincode:'304001', distance_km:4, pay:8000, pay_unit:'monthly', pay_hi:'₹8,000/माह', hours:'10am–6pm (आधा दिन विकल्प)', home_based:false, part_time:true, flexible:true, daily_wage:false, category:'retail', skills_hi:['बातचीत'], skills_en:['communication'], education:'8th-pass', childcare:false, disability_friendly:true, phone:'+91-98280XXXXX', desc_hi:'आधा-दिन विकल्प उपलब्ध। सुरक्षित स्टोर, महिला मैनेजर।', desc_en:'Half-day option. Safe store, woman manager.', posted:'2026-11-14', scam_flags:[], status:'published' },
    { id:'j14', title_hi:'आशा सहयोगिनी (स्वास्थ्य विभाग)', title_en:'ASHA Support Worker (Health Dept)', employer:'Health Dept Rajasthan (Govt)', employer_type:'Government', verified:true, verification:'Government', village:'Jhunjhunu', district:'Jhunjhunu', pincode:'333001', distance_km:2, pay:6000, pay_unit:'monthly', pay_hi:'₹6,000/माह + प्रोत्साहन', hours:'flexible field', home_based:false, part_time:true, flexible:true, daily_wage:false, category:'govt', skills_hi:['स्वास्थ्य'], skills_en:['health'], education:'8th-pass', childcare:true, disability_friendly:false, phone:'01592-XXXXXX', desc_hi:'गांव में ही कार्य। प्रशिक्षण सरकारी।', desc_en:'Village-level work. Govt training.', posted:'2026-11-06', scam_flags:[], status:'published' },
    { id:'j15', title_hi:'ज्वेलरी असेंबली — घर से', title_en:'Jewellery Assembly — Home-based', employer:'Johari Beads Works', employer_type:'Registered company', verified:false, verification:'Pending review', village:'Jaipur', district:'Jaipur', pincode:'302003', distance_km:10, pay:150, pay_unit:'per-piece', pay_hi:'₹150/पीस (समीक्षाधीन)', hours:'flexible', home_based:true, part_time:true, flexible:true, daily_wage:true, category:'craft', skills_hi:['मोती पिरोना'], skills_en:['beading'], education:'no-formal', childcare:false, disability_friendly:true, phone:'masked — pending verification', desc_hi:'⚠️ सत्यापन लंबित — आवेदन कर सकती हैं पर अग्रिम/किट शुल्क न दें। भुगतान सत्यापन के बाद ही।', desc_en:'⚠️ Pending verification — you may apply but NEVER pay advance/kit fee. Payment only after verification.', posted:'2026-11-17', scam_flags:['unverified-employer'], status:'published' },
    { id:'j16', title_hi:'⚠️ चेतावनी उदाहरण — घर बैठे ₹50,000 (फर्जी पैटर्न)', title_en:'⚠️ Warning example — Earn ₹50,000 from home (scam pattern)', employer:'Unknown WhatsApp contact', employer_type:'Unverified', verified:false, verification:'Blocked — scam pattern', village:'—', district:'Jaipur', pincode:'—', distance_km:0, pay:50000, pay_unit:'monthly', pay_hi:'₹50,000/माह (?)', hours:'—', home_based:true, part_time:false, flexible:false, daily_wage:false, category:'scam-demo', skills_hi:[], skills_en:[], education:'no-formal', childcare:false, disability_friendly:false, phone:'blocked', desc_hi:'यह फर्जी पैटर्न का उदाहरण है: पंजीकरण फीस + OTP मांगा गया। ऐसी सूची SHAKTI पर प्रकाशित नहीं होती — ब्लॉक कर दी गई।', desc_en:'Example of fake pattern: registration fee + OTP asked. Such listings are NEVER published — blocked.', posted:'2026-11-01', scam_flags:['advance-fee','otp-request','too-good-pay'], status:'suspended' },
    { id:'j17', title_hi:'सिलाई — स्कूल यूनिफॉर्म (मौसमी)', title_en:'Stitching — School Uniforms (Seasonal)', employer:'Rajwada Garments (Registered)', employer_type:'Registered company', verified:true, verification:'Registered-verified', village:'Pali', district:'Pali', pincode:'306401', distance_km:12, pay:90, pay_unit:'per-piece', pay_hi:'₹90/पीस', hours:'flexible', home_based:true, part_time:true, flexible:true, daily_wage:true, seasonal:true, category:'tailoring', skills_hi:['सिलाई'], skills_en:['stitching'], education:'no-formal', childcare:false, disability_friendly:true, phone:'+91-98290XXXXX', desc_hi:'कपड़ा घर पहुंचेगा। गुणवत्ता जांच के बाद साप्ताहिक भुगतान।', desc_en:'Fabric home-delivered. Weekly pay after quality check.', posted:'2026-11-13', scam_flags:[], status:'published' },
    { id:'j18', title_hi:'मसाला पैकिंग — महिला समूह', title_en:'Spice Packing — Women Group', employer:'Kesariya Mahila Udyog SHG', employer_type:'SHG', verified:true, verification:'SHG-verified', village:'Churu', district:'Churu', pincode:'331001', distance_km:3, pay:380, pay_unit:'daily', pay_hi:'₹380/दिन', hours:'9am–1pm', home_based:false, part_time:true, flexible:true, daily_wage:true, category:'food', skills_hi:['तौल-पैक'], skills_en:['weigh-pack'], education:'no-formal', childcare:true, disability_friendly:true, phone:'+91-94130XXXXX', desc_hi:'बच्चों के साथ आ सकती हैं — शिशु कोना उपलब्ध।', desc_en:'Children welcome — baby corner available.', posted:'2026-11-15', scam_flags:[], status:'published' },
  ];

  const courses = [
    { id:'c1', cat:'tailoring', title_hi:'सिलाई बेसिक — सूट व ब्लाउज', title_en:'Sewing Basics — Suit & Blouse', level:'beginner', dur:'2 सप्ताह', lessons:6, img:'🧵', desc_hi:'नाप, कटाई, सिलाई — धीरे-धीरे सीखें।', desc_en:'Measure, cut, stitch — step by step.', body_hi:'पाठ 1: नाप लेना। पाठ 2: कपड़ा काटना। पाठ 3: सीधी सिलाई। पाठ 4: ब्लाउज। पाठ 5: सूट। पाठ 6: मरम्मत व प्रेस। हर पाठ में चित्र + ऑडियो।', body_en:'L1 measuring, L2 cutting, L3 straight stitch, L4 blouse, L5 suit, L6 repair & press. Pictures + audio each.', quiz:['नाप किससे लेते हैं? (इंची टेप)','सीधी सिलाई के लिए क्या चाहिए? (प्रैक्टिस कपड़ा)'] },
    { id:'c2', cat:'beauty', title_hi:'ब्यूटी बेसिक — सुरक्षित पार्लर कार्य', title_en:'Beauty Basics — Safe Parlour Work', level:'beginner', dur:'10 दिन', lessons:5, img:'💅', desc_hi:'स्वच्छता, थ्रेडिंग, फेशियल बेसिक।', desc_en:'Hygiene, threading, basic facial.', body_hi:'स्वच्छता सबसे पहले: हाथ धोना, औजार कीटाणुरहित। थ्रेडिंग अभ्यास, फेशियल चरण, ग्राहक से बातचीत।', body_en:'Hygiene first. Threading practice, facial steps, client talk.', quiz:['औजार साफ क्यों? (संक्रमण से बचाव)'] },
    { id:'c3', cat:'digital', title_hi:'मोबाइल चलाना व UPI सुरक्षा', title_en:'Phone Use & UPI Safety', level:'beginner', dur:'1 सप्ताह', lessons:5, img:'📱', desc_hi:'OTP कभी न बताएं, UPI PIN गुप्त रखें।', desc_en:'Never share OTP, keep UPI PIN secret.', body_hi:'पाठ: फोन सेटिंग, व्हाट्सऐप, UPI बनाना, OTP धोखाधड़ी पहचानना, बैंक हेल्पलाइन 1930।', body_en:'Settings, WhatsApp, UPI setup, spotting OTP fraud, helpline 1930.', quiz:['OTP मांगे तो? (कभी न दें, कॉल काटें)'] },
    { id:'c4', cat:'food', title_hi:'अचार-पापड़ व्यवसाय', title_en:'Pickle-Papad Business', level:'beginner', dur:'2 सप्ताह', lessons:6, img:'🫙', desc_hi:'स्वाद, पैकेजिंग, FSSAI बेसिक।', desc_en:'Taste, packing, FSSAI basics.', body_hi:'मसाला अनुपात, धूप-सुखाई, पैकेजिंग, लागत ₹/पैकेट, विक्रय दाम तय करना।', body_en:'Spice ratios, sun-drying, packing, cost per pack, pricing.', quiz:['लागत में क्या जोड़ें? (सामग्री+मेहनत+पैकेट)'] },
    { id:'c5', cat:'finance', title_hi:'बचत, बैंक व धोखाधड़ी से बचाव', title_en:'Savings, Banking & Fraud Safety', level:'beginner', dur:'1 सप्ताह', lessons:4, img:'🏦', desc_hi:'खाता, बचत, स्कैम चेतावनी।', desc_en:'Account, savings, scam alerts.', body_hi:'बैंक खाता, SHG बचत, ब्याज समझ, फर्जी कॉल/लिंक पहचान, साइबर हेल्पलाइन 1930।', body_en:'Bank account, SHG savings, interest basics, spotting fake calls, helpline 1930.', quiz:['अनजान लिंक? (न खोलें)'] },
    { id:'c6', cat:'business', title_hi:'दाम तय करना व लाभ गणना', title_en:'Pricing & Profit Calculation', level:'intermediate', dur:'1 सप्ताह', lessons:4, img:'🧮', desc_hi:'लागत + मेहनत + लाभ = दाम।', desc_en:'Cost + labour + profit = price.', body_hi:'कैलकुलेटर से सीखें: सामग्री लागत, समय, पैकेजिंग, परिवहन जोड़कर दाम।', body_en:'Calculator learning: material, time, packing, transport into price.', quiz:['लाभ क्या? (दाम − लागत)'] },
    { id:'c7', cat:'craft', title_hi:'कढ़ाई व हस्तशिल्प', title_en:'Embroidery & Handicraft', level:'beginner', dur:'2 सप्ताह', lessons:5, img:'🧶', desc_hi:'कांथा, मिरर वर्क बेसिक।', desc_en:'Kantha, mirror-work basics.', body_hi:'टांके: रनिंग, चेन, मिरर। डिजाइन कॉपी, फिनिशिंग, बाजार भाव।', body_en:'Stitches, design copy, finishing, market rates.', quiz:['फिनिशिंग क्यों? (अच्छा दाम)'] },
    { id:'c8', cat:'livestock', title_hi:'बकरी पालन बेसिक', title_en:'Goat Rearing Basics', level:'beginner', dur:'1 सप्ताह', lessons:4, img:'🐐', desc_hi:'10+1 मॉडल, टीके, चारा।', desc_en:'10+1 model, vaccines, feed.', body_hi:'सिरोही नस्ल, PPR टीका, सूखा बाड़ा, बिक्री त्योहार पर।', body_en:'Sirohi breed, PPR vaccine, dry shed, festival sale.', quiz:['PPR टीका क्यों? (बीमारी से बचाव)'] },
    { id:'c9', cat:'agri', title_hi:'जैविक खेती व किचन गार्डन', title_en:'Organic Farming & Kitchen Garden', level:'beginner', dur:'1 सप्ताह', lessons:4, img:'🌱', desc_hi:'घर की सब्जी, कम खर्च।', desc_en:'Home veggies, low cost.', body_hi:'क्यारी, गोबर खाद, जीवामृत, बीज बचत।', body_en:'Beds, compost, jeevamrut, seed saving.', quiz:['गोबर खाद लाभ? (मिट्टी नरम)'] },
    { id:'c10', cat:'employment', title_hi:'इंटरव्यू व कार्यस्थल अधिकार', title_en:'Interview & Workplace Rights', level:'beginner', dur:'5 दिन', lessons:4, img:'💼', desc_hi:'आत्मविश्वास से बोलें, अधिकार जानें।', desc_en:'Speak confidently, know rights.', body_hi:'परिचय, वेतन पूछना, POSH अधिकार, शिकायत 1090/181।', body_en:'Intro, asking pay, POSH rights, helplines 1090/181.', quiz:['असुरक्षित लगे तो? (मना करें + रिपोर्ट)'] },
    { id:'c11', cat:'literacy', title_hi:'हिंदी पढ़ना-लिखना बेसिक', title_en:'Basic Hindi Literacy', level:'beginner', dur:'3 सप्ताह', lessons:8, img:'📖', desc_hi:'अक्षर से फॉर्म भरना तक।', desc_en:'Letters to filling forms.', body_hi:'स्वर-व्यंजन, मात्रा, नाम लिखना, मोबाइल नंबर, फॉर्म भरना।', body_en:'Vowels, matras, writing name, numbers, forms.', quiz:['फॉर्म में नाम कहाँ? (पहली लाइन)'] },
    { id:'c12', cat:'entrepreneurship', title_hi:'छोटा व्यवसाय शुरू करें', title_en:'Start a Small Business', level:'intermediate', dur:'2 सप्ताह', lessons:6, img:'🚀', desc_hi:'SHG ऋण, बाजार, ग्राहक।', desc_en:'SHG loan, market, customers.', body_hi:'विचार चुनना, लागत, SHG ऋण, ग्राहक, व्हाट्सऐप बेचना।', body_en:'Idea, costing, SHG loan, customers, WhatsApp selling.', quiz:['पहला कदम? (छोटा शुरू, हिसाब रखें)'] },
  ];

  const anganwadi = [
    { id:'a1', name:'आंगनवाड़ी केंद्र चोमू-1 (डेमो)', village:'Chomu', district:'Jaipur', pincode:'303702', hours:'9am–2pm', contact:'01423-XXXXXX', distance_km:1.2, facilities:['पोषण','टीकाकरण सहायता','3–6 वर्ष खेल'], demo:true },
    { id:'a2', name:'आंगनवाड़ी केंद्र कोटपूतली-3 (डेमो)', village:'Kotputli', district:'Jaipur', pincode:'303108', hours:'9am–2pm', contact:'01421-XXXXXX', distance_km:0.8, facilities:['पोषण','पूर्व-विद्यालय'], demo:true },
    { id:'a3', name:'आंगनवाड़ी केंद्र सीकर-शहर (डेमो)', village:'Sikar', district:'Sikar', pincode:'332001', hours:'9am–1pm', contact:'01572-XXXXXX', distance_km:2.1, facilities:['पोषण','स्वास्थ्य जांच'], demo:true },
    { id:'a4', name:'आंगनवाड़ी केंद्र अलवर-2 (डेमो)', village:'Alwar', district:'Alwar', pincode:'301001', hours:'9am–2pm', contact:'0144-XXXXXX', distance_km:3.0, facilities:['पोषण','खेल'], demo:true },
    { id:'a5', name:'आंगनवाड़ी केंद्र नागौर-1 (डेमो)', village:'Nagaur', district:'Nagaur', pincode:'341001', hours:'9am–2pm', contact:'01582-XXXXXX', distance_km:1.5, facilities:['पोषण'], demo:true },
    { id:'a6', name:'आंगनवाड़ी केंद्र दौसा-मुख्य (डेमो)', village:'Dausa', district:'Dausa', pincode:'303303', hours:'9am–2pm', contact:'01427-XXXXXX', distance_km:2.4, facilities:['पोषण','टीकाकरण'], demo:true },
    { id:'a7', name:'आंगनवाड़ी केंद्र टोंक-4 (डेमो)', village:'Tonk', district:'Tonk', pincode:'304001', hours:'9am–1pm', contact:'01432-XXXXXX', distance_km:1.9, facilities:['पोषण'], demo:true },
    { id:'a8', name:'आंगनवाड़ी केंद्र चूरू-2 (डेमो)', village:'Churu', district:'Churu', pincode:'331001', hours:'9am–2pm', contact:'01562-XXXXXX', distance_km:2.8, facilities:['पोषण','खेल'], demo:true },
    { id:'a9', name:'आंगनवाड़ी केंद्र पाली-5 (डेमो)', village:'Pali', district:'Pali', pincode:'306401', hours:'9am–2pm', contact:'02932-XXXXXX', distance_km:3.5, facilities:['पोषण'], demo:true },
    { id:'a10', name:'आंगनवाड़ी केंद्र झुंझुनूं-1 (डेमो)', village:'Jhunjhunu', district:'Jhunjhunu', pincode:'333001', hours:'9am–2pm', contact:'01592-XXXXXX', distance_km:1.1, facilities:['पोषण','स्वास्थ्य'], demo:true },
  ];

  const shg = [
    { id:'s1', name:'उड़ान महिला SHG (चोमू)', village:'Chomu', district:'Jaipur', members:14, work:'सिलाई व यूनिफॉर्म', contact:'SHG लीडर — मीना देवी', demo:true },
    { id:'s2', name:'शक्ति महिला उत्पादक समूह (नागौर)', village:'Nagaur', district:'Nagaur', members:18, work:'अचार-पापड़', contact:'SHG लीडर — कमला', demo:true },
    { id:'s3', name:'मरु हस्तकला SHG महासंघ (जोधपुर)', village:'Jodhpur', district:'Jodhpur', members:42, work:'कढ़ाई व हस्तशिल्प', contact:'SHG लीडर — पप्पी बानो', demo:true },
    { id:'s4', name:'केसरिया महिला उद्योग (चूरू)', village:'Churu', district:'Churu', members:12, work:'मसाला पैकिंग', contact:'SHG लीडर — संतोष', demo:true },
    { id:'s5', name:'सखी सिलाई केंद्र (अलवर)', village:'Alwar', district:'Alwar', members:16, work:'सिलाई प्रशिक्षण + उत्पादन', contact:'SHG लीडर — रुकसाना', demo:true },
    { id:'s6', name:'मेवात डेयरी महिला समूह (भरतपुर)', village:'Bharatpur', district:'Bharatpur', members:20, work:'डेयरी व पशु', contact:'SHG लीडर — गायत्री', demo:true },
    { id:'s7', name:'नीलकंठ ब्यूटी SHG (सीकर)', village:'Sikar', district:'Sikar', members:10, work:'ब्यूटी सेवाएं', contact:'SHG लीडर — पूजा', demo:true },
    { id:'s8', name:'सांगानेर क्राफ्ट SHG (जयपुर)', village:'Sanganer', district:'Jaipur', members:22, work:'ब्लू पॉटरी', contact:'SHG लीडर — शारदा', demo:true },
  ];

  const market = [
    { id:'m1', item_hi:'हाथ की कढ़ाई वाला कुशन कवर (2 पीस)', item_en:'Hand-embroidered cushion covers (2 pc)', price:349, unit:'set', district:'Jodhpur', seller:'मरु हस्तकला SHG', demo:true },
    { id:'a2m', item_hi:'आम का अचार 1kg', item_en:'Mango pickle 1kg', price:280, unit:'kg', district:'Nagaur', seller:'शक्ति समूह', demo:true },
    { id:'m3', item_hi:'सिलाई ब्लाउज (ऑर्डर पर)', item_en:'Stitched blouse (on order)', price:250, unit:'piece', district:'Jaipur', seller:'उड़ान SHG', demo:true },
    { id:'m4', item_hi:'मसाला कॉम्बो (हल्दी+मिर्च 500g)', item_en:'Spice combo 500g', price:180, unit:'pack', district:'Churu', seller:'केसरिया उद्योग', demo:true },
    { id:'m5', item_hi:'ब्लू पॉटरी प्लेट सेट', item_en:'Blue pottery plate set', price:599, unit:'set', district:'Jaipur', seller:'सांगानेर SHG', demo:true },
    { id:'m6', item_hi:'पापड़ 1kg (मूंग)', item_en:'Papad 1kg moong', price:160, unit:'kg', district:'Nagaur', seller:'शक्ति समूह', demo:true },
  ];

  const guides = [
    { id:'g1', title_hi:'दाम कैसे तय करें?', title_en:'How to price?', body_hi:'लागत = सामग्री + पैकेट + किराया + आपकी मेहनत (घंटे × ₹50)। दाम = लागत + 20% लाभ। उदाहरण: अचार 1kg लागत ₹200 → दाम ₹240।', body_en:'Cost = material + pack + transport + labour (hrs × ₹50). Price = cost + 20%. Eg cost ₹200 → price ₹240.' },
    { id:'g2', title_hi:'SHG से ऋण कैसे लें?', title_en:'How to take SHG loan?', body_hi:'6 माह नियमित बचत → समूह प्रस्ताव → बैंक लिंकेज। कागज: आधार, बचत पासबुक, समूह रजिस्टर।', body_en:'6 months saving → group resolution → bank linkage. Docs: Aadhaar, passbook, register.' },
    { id:'g3', title_hi:'व्हाट्सऐप पर बेचना', title_en:'Sell on WhatsApp?', body_hi:'साफ फोटो (दिन की रोशनी), दाम स्पष्ट, गांव/शहर लिखें। अग्रिम 50% लें। OTP/लिंक कभी न भेजें।', body_en:'Clear daylight photo, clear price, location. Take 50% advance. Never send OTP/links.' },
    { id:'g4', title_hi:'सरकारी योजनाएं (सूचना)', title_en:'Govt schemes (info)', body_hi:'पहचान हेतु: NRLM/SHG सहायता, PMEGP, Stand-Up India, महिला समृद्धि — लाभ पात्रता अनुसार, नजदीकी CSC/बैंक से सत्यापित करें।', body_en:'Indicative: NRLM/SHG support, PMEGP, Stand-Up India, Mahila Samriddhi — verify at CSC/bank.' },
  ];

  return {
    version: 1,
    jobs, courses, anganwadi, shg, market, guides,
    employers: [
      { id:'e1', name:'Udaan Mahila SHG Samooh', type:'SHG', district:'Jaipur', status:'approved', ts:'2026-11-10' },
      { id:'e2', name:'Rajeshwari Foods', type:'Registered company', district:'Jaipur', status:'approved', ts:'2026-11-12' },
      { id:'e3', name:'Saksham Seva Sansthan', type:'Registered NGO', district:'Ajmer', status:'approved', ts:'2026-11-13' },
      { id:'e4', name:'Johari Beads Works', type:'Registered company', district:'Jaipur', status:'pending', ts:'2026-11-17' },
      { id:'e5', name:'Unknown WhatsApp contact', type:'Unverified', district:'—', status:'suspended', ts:'2026-11-01' },
    ],
    applications: [],
    saved: [],
    reports: [
      { id:'r-demo-1', jobId:'j16', reason:'advance-fee', detail:'₹500 पंजीकरण मांगा (डेमो रिपोर्ट)', status:'actioned — listing blocked', ts:'2026-11-02', demo:true },
    ],
    certificates: [],
    feedback: [],
    events: [
      { ts:new Date().toISOString(), event:'seed', page:'/', lang:'hi', demo:true },
    ],
    audit: [],
    employerRequests: [],
    anganwadiReports: [],
  };
}

let DB;
try {
  DB = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  if (!DB.jobs) DB = seedDB();
} catch (e) { DB = seedDB(); }
function saveDB() { try { fs.writeFileSync(DB_FILE, JSON.stringify(DB, null, 2)); } catch (e) {} }
if (!fs.existsSync(DB_FILE)) saveDB();

/* ---------------- helpers ---------------- */
function send(res, code, obj) {
  const b = Buffer.from(JSON.stringify(obj));
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': b.length, 'Access-Control-Allow-Origin': '*' });
  res.end(b);
}
function body(req) {
  return new Promise(resolve => {
    let s = '';
    req.on('data', c => { s += c; if (s.length > 2e6) { try { req.destroy(); } catch (e) {} resolve({}); } });
    req.on('end', () => { try { resolve(s ? JSON.parse(s) : {}); } catch (e) { resolve({}); } });
  });
}
function signToken(payload) {
  const b = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(b).digest('base64url');
  return b + '.' + sig;
}
function verifyToken(t) {
  try {
    const [b, s] = String(t || '').split('.');
    if (!b || !s) return null;
    const exp = crypto.createHmac('sha256', TOKEN_SECRET).update(b).digest('base64url');
    if (exp !== s) return null;
    return JSON.parse(Buffer.from(b, 'base64url').toString());
  } catch (e) { return null; }
}
const RL = new Map();
function rateOk(ip, key, n, ms) {
  const k = ip + ':' + key;
  const now = Date.now();
  const arr = (RL.get(k) || []).filter(t => now - t < ms);
  if (arr.length >= n) { RL.set(k, arr); return false; }
  arr.push(now); RL.set(k, arr); return true;
}
function audit(who, action, detail) {
  DB.audit.push({ ts: new Date().toISOString(), who, action, detail: String(detail || '').slice(0, 160) });
  if (DB.audit.length > 500) DB.audit = DB.audit.slice(-500);
}
function track(event, page, lang) {
  DB.events.push({ ts: new Date().toISOString(), event, page: String(page || '/').slice(0, 80), lang: lang || 'hi', demo: true });
  if (DB.events.length > 5000) DB.events = DB.events.slice(-5000);
}

/* AI gateway (optional Meta key, server-side only) */
function aiConfig() {
  const key = process.env.META_API_KEY || '';
  return { enabled: !!key, key, url: process.env.META_API_URL || 'https://api.meta.ai/v1/chat/completions', model: process.env.META_MODEL || 'muse-spark-1.3' };
}
async function metaChat(messages, maxTokens) {
  const cfg = aiConfig(); if (!cfg.enabled) return null;
  const ctrl = new AbortController(); const to = setTimeout(() => ctrl.abort(), 30000);
  try {
    const r = await fetch(cfg.url, { method: 'POST', signal: ctrl.signal, headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cfg.key }, body: JSON.stringify({ model: cfg.model, messages, max_completion_tokens: maxTokens || 800 }) });
    clearTimeout(to);
    if (!r.ok) return null;
    const j = await r.json();
    const t = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
    return t || null;
  } catch (e) { clearTimeout(to); return null; }
}
/* Local voice-assistant intent (works without AI key) */
function localAssist(text) {
  const t = String(text || '').toLowerCase();
  const has = (...ws) => ws.some(w => t.includes(w));
  let jobs = DB.jobs.filter(j => j.status === 'published');
  if (has('घर', 'home', 'ghar')) jobs = jobs.filter(j => j.home_based);
  if (has('सिलाई', 'silaa', 'stitch', 'tailor')) jobs = jobs.filter(j => /tailor|stitch|सिलाई/i.test(j.title_hi + j.title_en + j.category));
  if (has('पैक', 'pack')) jobs = jobs.filter(j => /pack/i.test(j.category + j.title_en));
  if (has('ब्यूटी', 'beauty', 'parlour')) jobs = jobs.filter(j => j.category === 'beauty');
  if (has('बच्च', 'child', 'anganwadi', 'आंगन')) return { intent: 'childcare', reply_hi: 'आंगनवाड़ी खोज पेज पर गांव/पिनकोड लिखें। बच्चे के साथ किया जा सकने वाला काम चाहिए तो “बच्चों के साथ” फिल्टर लगाएं।', reply_en: 'Open Childcare page, enter village/pincode. Use “childcare available” filter for jobs.', jobs: jobs.slice(0, 3) };
  if (has('सीख', 'sikha', 'learn', 'course', 'कोर्स')) return { intent: 'learn', reply_hi: '“कुछ सीखें” पेज पर 12 मुफ्त कोर्स हैं — सिलाई, ब्यूटी, UPI सुरक्षा, अचार व्यवसाय। कोई फीस नहीं।', reply_en: 'Open Learn page — 12 free courses, no fees.', jobs: jobs.slice(0, 3) };
  if (has('सुरक्षा', 'safe', 'fraud', 'धोखा', 'report')) return { intent: 'safety', reply_hi: 'कभी अग्रिम फीस, OTP, आधार-बैंक डिटेल न दें। संदिग्ध लगे तो Report बटन दबाएं। हेल्पलाइन: 1930 (साइबर), 181 (महिला)।', reply_en: 'Never pay advance, never share OTP/bank. Use Report. Helplines: 1930 cyber, 181 women.', jobs: jobs.slice(0, 3) };
  if (!jobs.length) jobs = DB.jobs.filter(j => j.status === 'published').slice(0, 3);
  const top = jobs.slice(0, 3);
  return {
    intent: 'jobs',
    reply_hi: top.length ? `आपके लिए ${top.length} सुरक्षित काम मिले: ${top.map(j => j.title_hi).join(' | ')}। “सुनें” दबाकर विवरण सुन सकती हैं।` : 'अभी इस खोज में कोई सत्यापित काम नहीं — फिल्टर हटाकर देखें।',
    reply_en: top.length ? `Found ${top.length} verified jobs: ${top.map(j => j.title_en).join(' | ')}` : 'No verified jobs for this search — try clearing filters.',
    jobs: top
  };
}

/* ---------------- static ---------------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
function serveStatic(req, res, p) {
  try {
    let f = decodeURIComponent(p.split('?')[0]);
    if (f === '/') f = '/index.html';
    if (f === '/pitch') f = '/pitch.html';
    const fp = path.join(PUB, f.replace(/^\/+/, ''));
    if (!fp.startsWith(PUB)) return false;
    if (fs.existsSync(fp) && fs.statSync(fp).isFile()) {
      const ext = path.extname(fp).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'public, max-age=300' });
      fs.createReadStream(fp).pipe(res);
      return true;
    }
    if (!path.extname(f)) { // SPA fallback
      const idx = path.join(PUB, 'index.html');
      if (fs.existsSync(idx)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        fs.createReadStream(idx).pipe(res);
        return true;
      }
    }
    return false;
  } catch (e) { return false; }
}

/* ---------------- server ---------------- */
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  const p = u.pathname;
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').toString();

  // CORS preflight
  if (req.method === 'OPTIONS') { res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' }); return res.end(); }

  /* health */
  if (p === '/api/health' && req.method === 'GET') return send(res, 200, { ok: true, app: 'SHAKTI', version: '1.0.0 (prototype)', time: new Date().toISOString(), demo: true, districts: DISTRICTS.length, jobs: DB.jobs.length, courses: DB.courses.length });

  /* i18n dictionary */
  if (p === '/api/i18n' && req.method === 'GET') return send(res, 200, {
    hi: { find_work: 'काम ढूंढें', home_work: 'घर से काम', learn: 'कुछ सीखें', ask_voice: 'बोलकर पूछें', childcare: 'आंगनवाड़ी खोजें', skills: 'अपना हुनर बढ़ाएं', verified_only: 'सुरक्षित काम ही दिखाएं', apply: 'आवेदन करें', listen: 'सुनें', call: 'कॉल करें' },
    en: { find_work: 'Find work', home_work: 'Home-based', learn: 'Learn free', ask_voice: 'Ask by voice', childcare: 'Find childcare', skills: 'Build skills', verified_only: 'Show verified only', apply: 'Apply', listen: 'Listen', call: 'Call' },
    dialects: ['Marwari', 'Mewari', 'Dhundhari', 'Harauti', 'Shekhawati', 'Wagdi'],
    note: 'Hindi + English in UI now. Dialect packs are audio-assisted architecture — validated progressively, not claimed as full STT.'
  });

  /* jobs list */
  if (p === '/api/jobs' && req.method === 'GET') {
    let list = DB.jobs.filter(j => j.status === 'published');
    const q = (u.searchParams.get('q') || '').toLowerCase();
    const district = u.searchParams.get('district') || '';
    const home = u.searchParams.get('home') || '';
    const part = u.searchParams.get('part') || '';
    const flex = u.searchParams.get('flexible') || '';
    const vonly = u.searchParams.get('verifiedOnly') || 'true';
    const maxD = Number(u.searchParams.get('maxDistance') || 0);
    const child = u.searchParams.get('childcare') || '';
    const dis = u.searchParams.get('disability') || '';
    const cat = u.searchParams.get('category') || '';
    if (vonly === 'true') list = list.filter(j => j.verified);
    if (district) list = list.filter(j => j.district === district);
    if (home === 'true') list = list.filter(j => j.home_based);
    if (part === 'true') list = list.filter(j => j.part_time);
    if (flex === 'true') list = list.filter(j => j.flexible);
    if (child === 'true') list = list.filter(j => j.childcare);
    if (dis === 'true') list = list.filter(j => j.disability_friendly);
    if (cat) list = list.filter(j => j.category === cat);
    if (maxD > 0) list = list.filter(j => (j.distance_km || 0) <= maxD);
    if (q) list = list.filter(j => (j.title_hi + j.title_en + j.employer + j.village + j.district + j.category).toLowerCase().includes(q));
    track('job_search', '/jobs', u.searchParams.get('lang') || 'hi'); saveDB();
    return send(res, 200, { count: list.length, jobs: list, districts: DISTRICTS, safety_note: 'केवल सत्यापित सूची प्रकाशित। अग्रिम फीस/OTP मांगे तो तुरंत Report करें।' });
  }
  if (p.startsWith('/api/jobs/') && req.method === 'GET') {
    const id = p.split('/')[3];
    const j = DB.jobs.find(x => x.id === id);
    if (!j) return send(res, 404, { error: 'job not found' });
    const related = DB.jobs.filter(x => x.id !== id && x.status === 'published' && (x.category === j.category || x.district === j.district)).slice(0, 3);
    return send(res, 200, { job: j, related, safety: 'साक्षात्कार के लिए अकेले सुनसान जगह न जाएं। पहले दिन परिवार को बताएं। कोई फीस न दें।' });
  }

  /* apply */
  if (p === '/api/apply' && req.method === 'POST') {
    if (!rateOk(ip, 'apply', 20, 60000)) return send(res, 429, { error: 'Too many requests — 1 min baad try karein' });
    const b = await body(req);
    const job = DB.jobs.find(x => x.id === String(b.jobId || ''));
    if (!job) return send(res, 404, { error: 'job not found' });
    const name = String(b.name || '').trim().slice(0, 60);
    const phone = String(b.phone || '').replace(/[^0-9+]/g, '').slice(0, 15);
    if (name.length < 2) return send(res, 400, { error: 'कृपया अपना नाम लिखें / Please enter name' });
    if (phone.length < 10) return send(res, 400, { error: 'सही मोबाइल नंबर लिखें (10 अंक) / Enter valid phone' });
    if (job.scam_flags && job.scam_flags.length && !job.verified) {
      // allow apply but warn strongly
    }
    const app = { id: 'a' + Date.now(), jobId: job.id, jobTitle: job.title_hi, name, phone, village: String(b.village || '').slice(0, 80), answers: String(b.answers || '').slice(0, 500), voiceNote: !!b.voiceNote, status: 'submitted', ts: new Date().toISOString() };
    DB.applications.unshift(app); track('application', '/apply/' + job.id, 'hi'); saveDB(); audit('woman', 'apply', job.id);
    return send(res, 200, { ok: true, application: app, message_hi: `धन्यवाद ${name}! आवेदन मिल गया (ID ${app.id})। नियोक्ता संपर्क करेगा। कोई फीस न दें।`, message_en: `Thank you ${name}! Application received (ID ${app.id}). Employer will contact. Never pay fees.` });
  }
  if (p === '/api/applications' && req.method === 'GET') {
    const phone = (u.searchParams.get('phone') || '').replace(/[^0-9+]/g, '');
    const list = phone ? DB.applications.filter(a => a.phone.includes(phone.slice(-10))) : DB.applications.slice(0, 50);
    return send(res, 200, { count: list.length, applications: list });
  }
  if (p.startsWith('/api/applications/') && p.endsWith('/withdraw') && req.method === 'POST') {
    const id = p.split('/')[3];
    const a = DB.applications.find(x => x.id === id);
    if (!a) return send(res, 404, { error: 'not found' });
    a.status = 'withdrawn'; saveDB();
    return send(res, 200, { ok: true, application: a });
  }
  if (p === '/api/saved' && req.method === 'POST') {
    const b = await body(req);
    DB.saved.unshift({ jobId: String(b.jobId || ''), phone: String(b.phone || ''), ts: new Date().toISOString() });
    saveDB(); return send(res, 200, { ok: true });
  }

  /* courses */
  if (p === '/api/courses' && req.method === 'GET') {
    const cat = u.searchParams.get('cat') || '';
    let list = DB.courses;
    if (cat) list = list.filter(c => c.cat === cat);
    return send(res, 200, { count: list.length, courses: list, note: 'सभी कोर्स मुफ्त। कोई प्रीमियम नहीं। / All courses free.' });
  }
  if (p.startsWith('/api/courses/') && p.endsWith('/complete') && req.method === 'POST') {
    const id = p.split('/')[3];
    const c = DB.courses.find(x => x.id === id);
    if (!c) return send(res, 404, { error: 'course not found' });
    const b = await body(req);
    const cert = { id: 'cert-' + Date.now(), courseId: id, courseTitle: c.title_hi, name: String(b.name || 'SHAKTI Learner').slice(0, 60), phone: String(b.phone || ''), ts: new Date().toISOString(), demo: true, note: 'SHAKTI learning certificate (prototype — not a government-recognised certificate)' };
    DB.certificates.unshift(cert); saveDB();
    return send(res, 200, { ok: true, certificate: cert, message_hi: 'बधाई! प्रमाणपत्र बन गया। यह सीखने का प्रमाण है (सरकारी मान्यता का दावा नहीं)।' });
  }
  if (p.startsWith('/api/courses/') && req.method === 'GET') {
    const id = p.split('/')[3];
    const c = DB.courses.find(x => x.id === id);
    if (!c) return send(res, 404, { error: 'not found' });
    return send(res, 200, { course: c });
  }
  if (p === '/api/certificates' && req.method === 'GET') {
    const phone = (u.searchParams.get('phone') || '').replace(/[^0-9+]/g, '');
    const list = phone ? DB.certificates.filter(x => (x.phone || '').includes(phone.slice(-10))) : DB.certificates.slice(0, 50);
    return send(res, 200, { count: list.length, certificates: list });
  }

  /* anganwadi */
  if (p === '/api/anganwadi' && req.method === 'GET') {
    const v = (u.searchParams.get('village') || '').toLowerCase();
    const d = u.searchParams.get('district') || '';
    const pin = u.searchParams.get('pincode') || '';
    let list = DB.anganwadi;
    if (v) list = list.filter(x => x.village.toLowerCase().includes(v) || x.name.toLowerCase().includes(v));
    if (d) list = list.filter(x => x.district === d);
    if (pin) list = list.filter(x => x.pincode.includes(pin));
    return send(res, 200, { count: list.length, centres: list, warning: 'DEMO DATASET — आधिकारिक सूची नहीं। उत्पादन में WCD/सरकारी डेटासेट से जुड़ेगा। / Demo data, not official.' });
  }
  if (p === '/api/anganwadi/report' && req.method === 'POST') {
    const b = await body(req);
    DB.anganwadiReports.unshift({ id: 'aw' + Date.now(), centreId: String(b.centreId || ''), detail: String(b.detail || '').slice(0, 500), ts: new Date().toISOString() });
    saveDB(); return send(res, 200, { ok: true, message_hi: 'जानकारी के लिए धन्यवाद। टीम जांच करेगी।' });
  }

  /* shg + marketplace + business */
  if (p === '/api/shg' && req.method === 'GET') return send(res, 200, { count: DB.shg.length, groups: DB.shg });
  if (p === '/api/marketplace' && req.method === 'GET') return send(res, 200, { count: DB.market.length, items: DB.market, note: 'Demo listings — SHG collective sales prototype' });
  if (p === '/api/marketplace' && req.method === 'POST') {
    const b = await body(req);
    const item = { id: 'm' + Date.now(), item_hi: String(b.title || '').slice(0, 120), item_en: String(b.title || '').slice(0, 120), price: Number(b.price || 0), unit: String(b.unit || 'piece'), district: String(b.district || 'Jaipur'), seller: String(b.seller || 'SHG'), demo: true };
    if (!item.item_hi || !item.price) return send(res, 400, { error: 'title + price required' });
    DB.market.unshift(item); saveDB(); return send(res, 200, { ok: true, item });
  }
  if (p === '/api/business/guides' && req.method === 'GET') return send(res, 200, { guides: DB.guides });
  if (p === '/api/business/calc' && req.method === 'POST') {
    const b = await body(req);
    const mat = Number(b.material || 0), pack = Number(b.packing || 0), trans = Number(b.transport || 0), hrs = Number(b.hours || 0), wage = Number(b.wagePerHour || 50), margin = Number(b.marginPct || 20);
    const labour = hrs * wage;
    const cost = mat + pack + trans + labour;
    const price = Math.round(cost * (1 + margin / 100));
    const profit = price - cost;
    return send(res, 200, { cost, labour, price, profit, formula_hi: `लागत ₹${cost} (सामग्री ₹${mat}+पैकिंग ₹${pack}+किराया ₹${trans}+मेहनत ₹${labour}) → सुझाव दाम ₹${price} (लाभ ₹${profit})`, formula_en: `Cost ₹${cost} → suggested price ₹${price} (profit ₹${profit})` });
  }

  /* employers */
  if (p === '/api/employers' && req.method === 'GET') return send(res, 200, { employers: DB.employers.filter(e => e.status === 'approved'), note: 'केवल सत्यापित नियोक्ता सार्वजनिक। / Only verified employers public.' });
  if (p === '/api/employers/apply' && req.method === 'POST') {
    const b = await body(req);
    const r = { id: 'er' + Date.now(), name: String(b.name || '').slice(0, 120), type: String(b.type || ''), district: String(b.district || ''), contact: String(b.contact || ''), job: String(b.job || '').slice(0, 300), status: 'pending', ts: new Date().toISOString() };
    if (!r.name || !r.contact) return send(res, 400, { error: 'name + contact required' });
    DB.employerRequests.unshift(r); saveDB(); audit('employer', 'register', r.name);
    return send(res, 200, { ok: true, request: r, message_hi: 'पंजीकरण मिला। दस्तावेज़ जांच के बाद ही सूची प्रकाशित होगी। कोई फीस नहीं।' });
  }

  /* reports + safety */
  if (p === '/api/report' && req.method === 'POST') {
    if (!rateOk(ip, 'report', 15, 60000)) return send(res, 429, { error: 'rate limited' });
    const b = await body(req);
    const r = { id: 'r' + Date.now(), jobId: String(b.jobId || ''), reason: String(b.reason || 'other').slice(0, 40), detail: String(b.detail || '').slice(0, 1000), contact: String(b.contact || ''), status: 'new', ts: new Date().toISOString() };
    DB.reports.unshift(r); saveDB(); audit('woman', 'report', r.reason + ':' + r.jobId);
    return send(res, 200, { ok: true, report: r, message_hi: `रिपोर्ट दर्ज (ID ${r.id})। टीम 48 घंटे में जांच करेगी। खतरा हो तो 181/1090 पर कॉल करें।`, message_en: `Report filed (ID ${r.id}). Team reviews in 48h. If in danger call 181/1090.` });
  }
  if (p === '/api/safety/info' && req.method === 'GET') return send(res, 200, {
    rules_hi: ['कभी अग्रिम फीस/रजिस्ट्रेशन शुल्क न दें', 'OTP, आधार-बैंक डिटेल कभी न बताएं', 'अनजान लिंक न खोलें', 'पहली मुलाकात दिन में, परिवार को बताकर जाएं', 'वेतन हमेशा बैंक/UPI में लें, नकद रसीद लें'],
    rules_en: ['Never pay advance/registration fee', 'Never share OTP/Aadhaar/bank', 'Do not open unknown links', 'First meeting daytime, inform family', 'Take pay in bank/UPI with receipt'],
    helplines: [{ n: 'महिला हेल्पलाइन', p: '181' }, { n: 'चाइल्ड/वुमन (all-in-one)', p: '1090' }, { n: 'Cyber fraud', p: '1930' }, { n: 'Emergency', p: '112' }],
    verify_note: 'SHAKTI “सत्यापित” का अर्थ: संगठन-पहचान + संपर्क + पता जांचा गया। इसका अर्थ 100% गारंटी नहीं — सतर्क रहें, रिपोर्ट करें।'
  });

  /* voice + AI help */
  if (p === '/api/voice-assist' && req.method === 'POST') {
    const b = await body(req);
    const out = localAssist(b.text || b.q || '');
    track('voice_usage', '/voice', b.lang || 'hi'); saveDB();
    return send(res, 200, { ...out, engine: 'local-intent (no key needed)' });
  }
  if (p === '/api/ai-help' && req.method === 'POST') {
    if (!rateOk(ip, 'ai', 15, 60000)) return send(res, 429, { error: 'rate limited' });
    const b = await body(req);
    const msg = String(b.message || '').slice(0, 800);
    if (!msg) return send(res, 400, { error: 'message required' });
    const lang = b.lang === 'en' ? 'en' : 'hi';
    const cfg = aiConfig();
    const local = localAssist(msg);
    if (cfg.enabled) {
      const ai = await metaChat([
        { role: 'system', content: 'You are SHAKTI Sahayak, a kind Rajasthan women-livelihood helper. Reply in ' + (lang === 'en' ? 'simple English' : 'simple Hindi') + ' under 150 words. RULES: Never invent jobs, verification, pay, schemes or deadlines. Never say an unverified listing is safe. Always warn: no advance fee, no OTP/bank sharing. Suggest verified filters, SHG, free courses, Anganwadi search, helplines 181/1930.' },
        { role: 'user', content: msg + '\n\nVerified context: ' + local.jobs.map(j => j.title_hi + ' (' + j.district + ', ' + j.pay_hi + ')').join('; ') }
      ], 700);
      if (ai) { track('ai_help', '/help', lang); saveDB(); return send(res, 200, { answer: ai, engine: 'meta:' + cfg.model, jobs: local.jobs, disclaimer: lang === 'en' ? 'AI guidance — verified listings only from /api/jobs.' : 'AI मार्गदर्शन — सत्यापित सूची केवल /api/jobs से।' }); }
    }
    track('ai_help_local', '/help', lang); saveDB();
    return send(res, 200, { answer: lang === 'en' ? local.reply_en : local.reply_hi, engine: 'local-kb (no AI key)', jobs: local.jobs });
  }

  /* feedback + analytics */
  if (p === '/api/feedback' && req.method === 'POST') {
    const b = await body(req);
    if (!String(b.message || '').trim() || String(b.message).length < 3) return send(res, 400, { error: 'feedback too short' });
    const f = { id: 'f' + Date.now(), page: String(b.page || '/'), message: String(b.message).slice(0, 2000), lang: b.lang === 'en' ? 'en' : 'hi', ts: new Date().toISOString() };
    DB.feedback.unshift(f); saveDB(); return send(res, 200, { ok: true, id: f.id, message_hi: 'धन्यवाद! प्रतिक्रिया दर्ज।' });
  }
  if (p === '/api/analytics/track' && req.method === 'POST') {
    const b = await body(req);
    track(String(b.event || 'page_view').slice(0, 40), String(b.page || '/'), b.lang || 'hi'); saveDB();
    return send(res, 200, { ok: true });
  }

  /* admin */
  if (p === '/api/admin/login' && req.method === 'POST') {
    const b = await body(req);
    if (String(b.password || '') !== ADMIN_PASSWORD) { audit('admin', 'login_fail', ip); return send(res, 401, { error: 'wrong password' }); }
    const tok = signToken({ admin: true, exp: Date.now() + 12 * 36e5 });
    audit('admin', 'login_ok', ''); saveDB();
    return send(res, 200, { ok: true, token: tok });
  }
  const needAdmin = () => {
    const t = verifyToken((req.headers['authorization'] || '').replace('Bearer ', ''));
    return t && t.admin && t.exp > Date.now();
  };
  if (p === '/api/admin/overview' && req.method === 'GET') {
    if (!needAdmin()) return send(res, 401, { error: 'admin login required' });
    const ev = DB.events;
    const by = (k) => { const m = {}; ev.forEach(e => { const key = e[k] || '?'; m[key] = (m[key] || 0) + 1; }); return m; };
    return send(res, 200, {
      counts: { jobs: DB.jobs.length, published: DB.jobs.filter(j => j.status === 'published').length, suspended: DB.jobs.filter(j => j.status === 'suspended').length, verified: DB.jobs.filter(j => j.verified).length, applications: DB.applications.length, reports: DB.reports.length, openReports: DB.reports.filter(r => r.status === 'new').length, certificates: DB.certificates.length, employersPending: DB.employerRequests.filter(e => e.status === 'pending').length, feedback: DB.feedback.length, events: ev.length },
      byEvent: by('event'), byPage: by('page'), recent: ev.slice(-10).reverse(), audit: DB.audit.slice(-20).reverse()
    });
  }
  if (p === '/api/admin/reports' && req.method === 'GET') {
    if (!needAdmin()) return send(res, 401, { error: 'admin login required' });
    return send(res, 200, { reports: DB.reports, employerRequests: DB.employerRequests, anganwadiReports: DB.anganwadiReports });
  }
  if (p === '/api/admin/jobs' && req.method === 'GET') {
    if (!needAdmin()) return send(res, 401, { error: 'admin login required' });
    return send(res, 200, { jobs: DB.jobs });
  }
  if (p === '/api/admin/moderate' && req.method === 'POST') {
    if (!needAdmin()) return send(res, 401, { error: 'admin login required' });
    const b = await body(req);
    if (b.kind === 'job') {
      const j = DB.jobs.find(x => x.id === String(b.id));
      if (!j) return send(res, 404, { error: 'job not found' });
      j.status = String(b.status || 'published'); if (b.status === 'suspended') j.verified = false;
      audit('admin', 'moderate_job', j.id + '=' + j.status); saveDB();
      return send(res, 200, { ok: true, job: j });
    }
    if (b.kind === 'report') {
      const r = DB.reports.find(x => x.id === String(b.id));
      if (!r) return send(res, 404, { error: 'report not found' });
      r.status = String(b.status || 'reviewing');
      if (b.suspendJob && r.jobId) { const j = DB.jobs.find(x => x.id === r.jobId); if (j) { j.status = 'suspended'; j.verified = false; } }
      audit('admin', 'moderate_report', r.id + '=' + r.status); saveDB();
      return send(res, 200, { ok: true, report: r });
    }
    if (b.kind === 'employer') {
      const r = DB.employerRequests.find(x => x.id === String(b.id));
      if (!r) return send(res, 404, { error: 'not found' });
      r.status = String(b.status || 'approved');
      if (r.status === 'approved') DB.employers.push({ id: 'e' + Date.now(), name: r.name, type: r.type, district: r.district, status: 'approved', ts: new Date().toISOString().slice(0, 10) });
      audit('admin', 'moderate_employer', r.id + '=' + r.status); saveDB();
      return send(res, 200, { ok: true, request: r });
    }
    return send(res, 400, { error: 'kind must be job|report|employer' });
  }

  if (serveStatic(req, res, p)) return;
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not found', hint: 'See /api/health' }));
});

if (require.main === module) {
  server.listen(PORT, HOST, () => console.log(`SHAKTI running on http://${HOST}:${PORT}`));
}
module.exports = { server };

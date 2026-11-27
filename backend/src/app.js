'use strict';
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const { query } = require('./db');
const { hashPin, checkPin, signUser, signAdmin, requireUser, requireAdmin } = require('./auth');
const { registerSchema, loginSchema, adminLoginSchema, applySchema, reportSchema, certSchema, calcSchema, employerSchema, empJobSchema, quizSubmitSchema, reviewSchema, learnCourseSchema, learnLessonSchema, moderateSchema, feedbackSchema, validate } = require('./validate');
const { aiEnabled, metaChat, metaChatStream, SYSTEM, localAssist, META_MODEL } = require('./ai');
const { hunarSchema, interestSchema } = require('./validateHunar');

function makeApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // API only; frontend sets its own via Cloudflare
  }));

  const origins = (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || 'http://localhost:4173,http://localhost:3100,http://localhost:5173')
    .split(',').map(s => s.trim()).filter(Boolean);
  app.use(cors({ origin: (o, cb) => { if (!o || origins.includes(o)) return cb(null, true); return cb(null, false); }, credentials: true }));
  app.use(express.json({ limit: '1mb' }));

  // request id + basic log
  app.use((req, res, next) => {
    req.rid = crypto.randomBytes(6).toString('hex');
    const t = Date.now();
    res.on('finish', () => console.log(`[${req.rid}] ${req.method} ${req.path} ${res.statusCode} ${Date.now() - t}ms`));
    next();
  });

  const limiter = rateLimit({ windowMs: 15 * 60e3, max: 600, standardHeaders: true, legacyHeaders: false });
  app.use('/api/', limiter);
  app.use('/api/auth/', rateLimit({ windowMs: 15 * 60e3, max: 30 }));
  app.use('/api/apply', rateLimit({ windowMs: 60e3, max: 20 }));
  app.use('/api/report', rateLimit({ windowMs: 60e3, max: 15 }));
  app.use('/api/ai-help', rateLimit({ windowMs: 60e3, max: 15 }));

  async function audit(who, action, detail) {
    try { await query(`INSERT INTO audit_logs(who, action, detail) VALUES($1,$2,$3)`, [String(who || '').slice(0, 80), action, String(detail || '').slice(0, 300)]); } catch {}
  }
  async function track(event, page, lang, district, user_id) {
    try { await query(`INSERT INTO analytics_events(event, page, lang, district, user_id) VALUES($1,$2,$3,$4,$5)`, [event, String(page || '/').slice(0, 80), lang || 'hi', district || '', user_id || null]); } catch {}
  }
  const me = (req) => {
    const h = req.headers.authorization || '';
    const m = h.match(/^Bearer (.+)$/);
    if (!m) return null;
    try { return require('jsonwebtoken').verify(m[1], process.env.JWT_SECRET || 'dev-only-change-me-in-production-shakti-2026'); } catch { return null; }
  };

  /* ---------- health ---------- */
  app.get('/api/health', async (req, res) => {
    const c = await query('SELECT (SELECT COUNT(*) FROM jobs) jobs, (SELECT COUNT(*) FROM courses) courses').catch(() => null);
    res.json({ ok: true, app: 'SHAKTI', version: '1.0.0', time: new Date().toISOString(), ai: aiEnabled() ? 'meta:' + META_MODEL : 'local-kb', db: c ? { jobs: Number(c.rows[0].jobs), courses: Number(c.rows[0].courses) } : 'unreachable' });
  });
  app.get('/api/ready', async (req, res) => {
    try { await query('SELECT 1'); res.json({ ok: true }); }
    catch { res.status(503).json({ ok: false }); }
  });
  app.get('/api/i18n', (req, res) => res.json({
    hi: { find_work: 'काम ढूंढें', home_work: 'घर से काम', learn: 'कुछ सीखें', ask_voice: 'बोलकर पूछें', childcare: 'आंगनवाड़ी खोजें', skills: 'अपना हुनर बढ़ाएं', verified_only: 'सुरक्षित काम ही दिखाएं', apply: 'आवेदन करें', listen: 'सुनें', call: 'कॉल करें' },
    en: { find_work: 'Find work', home_work: 'Home-based', learn: 'Learn free', ask_voice: 'Ask by voice', childcare: 'Find childcare', skills: 'Build skills', verified_only: 'Show verified only', apply: 'Apply', listen: 'Listen', call: 'Call' },
    dialects: ['Marwari', 'Mewari', 'Dhundhari', 'Harauti', 'Shekhawati', 'Wagdi'],
    note: 'Hindi + English in UI now. Dialects via assisted audio, validated progressively.',
  }));

  /* ---------- auth (phone + PIN; OTP-SMS upgrade path documented) ---------- */
  app.post('/api/auth/register', validate(registerSchema), async (req, res) => {
    const { name, phone, pin, village, district } = req.valid;
    const id = 'u' + Date.now().toString(36);
    try {
      const h = await hashPin(pin);
      await query(`INSERT INTO users(id,name,phone,pin_hash,village,district) VALUES($1,$2,$3,$4,$5,$6)`, [id, name, phone, h, village || '', district || 'Jaipur']);
    } catch (e) {
      if (String(e.code) === '23505') {
        const ex = await query(`SELECT * FROM users WHERE phone=$1`, [phone]);
        const u = ex.rows[0];
        if (!u || !(await checkPin(pin, u.pin_hash))) return res.status(401).json({ error: 'यह नंबर पहले से है — सही PIN से login करें / Number exists — login with PIN' });
        return res.json({ ok: true, token: signUser(u), user: { id: u.id, name: u.name, phone: u.phone, village: u.village, district: u.district } });
      }
      throw e;
    }
    const u = (await query(`SELECT * FROM users WHERE id=$1`, [id])).rows[0];
    audit(u.id, 'register', phone); track('register', '/', 'hi', district, u.id);
    res.json({ ok: true, token: signUser(u), user: { id: u.id, name: u.name, phone: u.phone, village: u.village, district: u.district } });
  });
  app.post('/api/auth/login', validate(loginSchema), async (req, res) => {
    const { phone, pin } = req.valid;
    const r = await query(`SELECT * FROM users WHERE phone=$1`, [phone]);
    const u = r.rows[0];
    if (!u || !(await checkPin(pin, u.pin_hash))) { audit(phone, 'login_fail', ''); return res.status(401).json({ error: 'नंबर या PIN गलत / Wrong number or PIN' }); }
    audit(u.id, 'login', ''); res.json({ ok: true, token: signUser(u), user: { id: u.id, name: u.name, phone: u.phone, village: u.village, district: u.district } });
  });
  app.get('/api/auth/me', async (req, res) => {
    const t = me(req); if (!t || t.role !== 'user') return res.status(401).json({ error: 'login required' });
    const r = await query(`SELECT id,name,phone,village,district,lang FROM users WHERE id=$1`, [t.sub]);
    if (!r.rows[0]) return res.status(401).json({ error: 'login required' });
    res.json({ user: r.rows[0] });
  });

  /* ---------- jobs ---------- */
  app.get('/api/districts', async (req, res) => {
    const r = await query(`SELECT DISTINCT district FROM jobs WHERE status='published' ORDER BY 1`);
    res.json({ districts: r.rows.map(x => x.district).filter(Boolean) });
  });
  app.get('/api/jobs', async (req, res) => {
    const q = (req.query.q || '').toLowerCase();
    const district = req.query.district || '';
    const cat = req.query.category || '';
    const maxD = Number(req.query.maxDistance || 0);
    const vonly = (req.query.verifiedOnly ?? 'true') === 'true';
    const conds = [`status='published'`]; const p = [];
    if (vonly) conds.push(`verified=true`);
    if (district) { p.push(district); conds.push(`district=$${p.length}`); }
    if (req.query.home === 'true') conds.push(`home_based=true`);
    if (req.query.part === 'true') conds.push(`part_time=true`);
    if (req.query.flexible === 'true') conds.push(`flexible=true`);
    if (req.query.childcare === 'true') conds.push(`childcare=true`);
    if (req.query.disability === 'true') conds.push(`disability_friendly=true`);
    if (cat) { p.push(cat); conds.push(`category=$${p.length}`); }
    if (maxD > 0) { p.push(maxD); conds.push(`distance_km <= $${p.length}`); }
    if (q) { p.push(`%${q}%`); conds.push(`(LOWER(title_hi||' '||title_en||' '||employer||' '||village||' '||district||' '||category) LIKE $${p.length})`); }
    const r = await query(`SELECT *, (employer ILIKE 'Vrajhna%') AS featured FROM jobs WHERE ${conds.join(' AND ')} ORDER BY featured DESC, verified DESC, distance_km ASC LIMIT 100`, p);
    const d = await query(`SELECT DISTINCT district FROM jobs WHERE status='published' ORDER BY 1`);
    const t = me(req);
    track('job_search', '/jobs', req.query.lang || 'hi', district, t && t.role === 'user' ? t.sub : null);
    res.json({ count: r.rowCount, jobs: r.rows, districts: d.rows.map(x => x.district), safety_note: 'केवल सत्यापित सूची प्रकाशित। अग्रिम फीस/OTP मांगे तो तुरंत Report करें।' });
  });
  app.get('/api/jobs/:id', async (req, res) => {
    const r = await query(`SELECT * FROM jobs WHERE id=$1`, [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'job not found' });
    const j = r.rows[0];
    const rel = await query(`SELECT * FROM jobs WHERE id<>$1 AND status='published' AND (category=$2 OR district=$3) LIMIT 3`, [j.id, j.category, j.district]);
    res.json({ job: j, related: rel.rows, safety: 'साक्षात्कार हेतु अकेले सुनसान जगह न जाएं। पहले दिन परिवार को बताएं। कोई फीस न दें।' });
  });

  /* ---------- applications ---------- */
  app.post('/api/apply', validate(applySchema), async (req, res) => {
    const { jobId, name, phone, village, answers } = req.valid;
    const j = await query(`SELECT * FROM jobs WHERE id=$1`, [jobId]);
    if (!j.rows[0]) return res.status(404).json({ error: 'job not found' });
    if (j.rows[0].status !== 'published') return res.status(400).json({ error: 'यह सूची बंद है / Listing closed' });
    const t = me(req);
    const id = 'a' + Date.now().toString(36);
    await query(`INSERT INTO applications(id,job_id,user_id,name,phone,village,answers) VALUES($1,$2,$3,$4,$5,$6,$7)`,
      [id, jobId, t && t.role === 'user' ? t.sub : null, name, phone, village || '', answers || '']);
    audit(t ? t.sub : phone, 'apply', jobId);
    track('application', '/apply/' + jobId, 'hi', '', t ? t.sub : null);
    res.json({ ok: true, application: { id, jobId, status: 'submitted' }, message_hi: `धन्यवाद ${name}! आवेदन मिल गया (ID ${id})। नियोक्ता संपर्क करेगा। कोई फीस न दें।`, message_en: `Thank you ${name}! Application received (ID ${id}). Never pay fees.` });
  });
  app.get('/api/applications', async (req, res) => {
    const t = me(req);
    const phone = (req.query.phone || '').replace(/[^0-9+]/g, '');
    let r;
    if (t && t.role === 'user') r = await query(`SELECT a.*, j.title_hi AS "jobTitle" FROM applications a LEFT JOIN jobs j ON j.id=a.job_id WHERE a.user_id=$1 OR a.phone=(SELECT phone FROM users WHERE id=$1) ORDER BY a.created_at DESC LIMIT 50`, [t.sub]);
    else if (phone) r = await query(`SELECT a.*, j.title_hi AS "jobTitle" FROM applications a LEFT JOIN jobs j ON j.id=a.job_id WHERE a.phone LIKE $1 ORDER BY a.created_at DESC LIMIT 50`, ['%' + phone.slice(-10)]);
    else return res.status(401).json({ error: 'login required (or ?phone=)' });
    res.json({ count: r.rowCount, applications: r.rows });
  });
  app.post('/api/applications/:id/withdraw', async (req, res) => {
    const t = me(req);
    const r = await query(`SELECT * FROM applications WHERE id=$1`, [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'not found' });
    const a = r.rows[0];
    if (t && t.role === 'user' && a.user_id && a.user_id !== t.sub) return res.status(403).json({ error: 'forbidden' });
    await query(`UPDATE applications SET status='withdrawn' WHERE id=$1`, [req.params.id]);
    res.json({ ok: true });
  });
  app.post('/api/saved', requireUser, async (req, res) => {
    const jobId = String(req.body.jobId || '');
    if (!jobId) return res.status(400).json({ error: 'jobId required' });
    await query(`INSERT INTO saved_jobs(user_id,job_id) VALUES($1,$2) ON CONFLICT DO NOTHING`, [req.auth.sub, jobId]);
    res.json({ ok: true });
  });
  app.get('/api/saved', requireUser, async (req, res) => {
    const r = await query(`SELECT j.* FROM saved_jobs s JOIN jobs j ON j.id=s.job_id WHERE s.user_id=$1 ORDER BY s.created_at DESC LIMIT 50`, [req.auth.sub]);
    res.json({ count: r.rowCount, jobs: r.rows });
  });

  /* ---------- courses + certificates ---------- */
  app.get('/api/courses', async (req, res) => {
    const cat = req.query.cat || '';
    const r = cat ? await query(`SELECT * FROM courses WHERE cat=$1 ORDER BY id`, [cat]) : await query(`SELECT * FROM courses ORDER BY id`);
    res.json({ count: r.rowCount, courses: r.rows, note: 'सभी कोर्स मुफ्त। कोई प्रीमियम नहीं।' });
  });
  app.get('/api/courses/:id', async (req, res) => {
    const r = await query(`SELECT * FROM courses WHERE id=$1`, [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'not found' });
    res.json({ course: r.rows[0] });
  });
  app.post('/api/courses/:id/complete', validate(certSchema), async (req, res) => {
    const c = await query(`SELECT * FROM courses WHERE id=$1`, [req.params.id]);
    if (!c.rows[0]) return res.status(404).json({ error: 'course not found' });
    const t = me(req);
    const id = 'cert-' + Date.now().toString(36);
    await query(`INSERT INTO certificates(id,course_id,user_id,name,phone) VALUES($1,$2,$3,$4,$5)`, [id, req.params.id, t && t.role === 'user' ? t.sub : null, req.valid.name, req.valid.phone || '']);
    res.json({ ok: true, certificate: { id, courseId: req.params.id, courseTitle: c.rows[0].title_hi, name: req.valid.name, ts: new Date().toISOString(), demo: false, note: 'SHAKTI learning certificate (prototype — not a government-recognised certificate)' }, message_hi: 'बधाई! प्रमाणपत्र बन गया। यह सीखने का प्रमाण है (सरकारी मान्यता का दावा नहीं)।' });
  });
  app.get('/api/certificates', async (req, res) => {
    const t = me(req);
    const phone = (req.query.phone || '').replace(/[^0-9+]/g, '');
    let r;
    if (t && t.role === 'user') r = await query(`SELECT c.*, co.title_hi AS "courseTitle" FROM certificates c LEFT JOIN courses co ON co.id=c.course_id WHERE c.user_id=$1 ORDER BY c.created_at DESC`, [t.sub]);
    else if (phone) r = await query(`SELECT c.*, co.title_hi AS "courseTitle" FROM certificates c LEFT JOIN courses co ON co.id=c.course_id WHERE c.phone LIKE $1 ORDER BY c.created_at DESC`, ['%' + phone.slice(-10)]);
    else return res.status(401).json({ error: 'login required (or ?phone=)' });
    res.json({ count: r.rowCount, certificates: r.rows });
  });

  /* ---------- childcare / community / business ---------- */
  app.get('/api/anganwadi', async (req, res) => {
    const v = (req.query.village || '').toLowerCase(), d = req.query.district || '', pin = req.query.pincode || '';
    const conds = []; const p = [];
    if (v) { p.push(`%${v}%`); conds.push(`(LOWER(village) LIKE $${p.length} OR LOWER(name) LIKE $${p.length})`); }
    if (d) { p.push(d); conds.push(`district=$${p.length}`); }
    if (pin) { p.push(`%${pin}%`); conds.push(`pincode LIKE $${p.length}`); }
    const r = await query(`SELECT * FROM anganwadi_centres ${conds.length ? 'WHERE ' + conds.join(' AND ') : ''} ORDER BY distance_km LIMIT 50`, p);
    res.json({ count: r.rowCount, centres: r.rows, warning: 'DEMO DATASET — आधिकारिक सूची नहीं। उत्पादन में WCD/सरकारी डेटासेट से जुड़ेगा।' });
  });
  app.post('/api/anganwadi/report', async (req, res) => {
    const id = 'aw' + Date.now().toString(36);
    await query(`INSERT INTO anganwadi_reports(id,centre_id,detail) VALUES($1,$2,$3)`, [id, String(req.body.centreId || ''), String(req.body.detail || '').slice(0, 500)]);
    res.json({ ok: true, message_hi: 'जानकारी के लिए धन्यवाद। टीम जांच करेगी।' });
  });
  app.get('/api/shg', async (req, res) => {
    const r = await query(`SELECT * FROM shg_groups ORDER BY id`);
    res.json({ count: r.rowCount, groups: r.rows });
  });
  app.get('/api/marketplace', async (req, res) => {
    const r = await query(`SELECT * FROM marketplace_items ORDER BY created_at DESC LIMIT 50`);
    res.json({ count: r.rowCount, items: r.rows, note: 'Demo listings — SHG collective sales prototype' });
  });
  app.post('/api/marketplace', requireUser, async (req, res) => {
    const title = String(req.body.title || '').slice(0, 120), price = Number(req.body.price || 0);
    if (!title || !price) return res.status(400).json({ error: 'title + price required' });
    const id = 'm' + Date.now().toString(36);
    await query(`INSERT INTO marketplace_items(id,item_hi,item_en,price,unit,district,seller) VALUES($1,$2,$2,$3,$4,$5,$6)`,
      [id, title, price, String(req.body.unit || 'piece'), String(req.body.district || 'Jaipur'), String(req.body.seller || 'SHG')]);
    res.json({ ok: true, item: { id } });
  });
  app.get('/api/business/guides', async (req, res) => {
    const r = await query(`SELECT * FROM business_guides ORDER BY id`);
    res.json({ guides: r.rows });
  });
  app.post('/api/business/calc', validate(calcSchema), async (req, res) => {
    const { material, packing, transport, hours, wagePerHour, marginPct } = req.valid;
    const labour = hours * wagePerHour, cost = material + packing + transport + labour;
    const price = Math.round(cost * (1 + marginPct / 100)), profit = price - cost;
    res.json({ cost, labour, price, profit, formula_hi: `लागत ₹${cost} → सुझाव दाम ₹${price} (लाभ ₹${profit})`, formula_en: `Cost ₹${cost} → suggested price ₹${price} (profit ₹${profit})` });
  });

  /* ---------- hunar: skilled-women talent showcase ---------- */
  function maskPhone(p, authed) {
    if (authed) return p;
    const d = String(p || '').replace(/[^0-9]/g, '');
    if (d.length < 4) return '***';
    return d.slice(0, 2) + 'XXXX' + d.slice(-2) + ' (लॉगिन पर पूरा नंबर)';
  }
  app.get('/api/hunar', async (req, res) => {
    const t = me(req);
    const district = req.query.district || '', skill = (req.query.skill || '').toLowerCase();
    const conds = [`status='approved'`]; const p = [];
    if (district) { p.push(district); conds.push(`district=$${p.length}`); }
    if (req.query.home === 'true') conds.push(`available_home=true`);
    if (skill) { p.push(`%${skill}%`); conds.push(`(LOWER(array_to_string(skills,' ')) LIKE $${p.length} OR LOWER(expected_work) LIKE $${p.length})`); }
    const r = await query(`SELECT * FROM hunar_profiles WHERE ${conds.join(' AND ')} ORDER BY verified DESC, views DESC LIMIT 60`, p);
    const out = r.rows.map(x => ({ ...x, phone: maskPhone(x.phone, !!(t && t.role === 'user')) }));
    res.json({ count: r.rowCount, profiles: out, note: 'सत्यापित हुनर प्रोफाइल। संपर्क हेतु लॉगिन करें।' });
  });
  app.get('/api/hunar/skills', async (req, res) => {
    const r = await query(`SELECT DISTINCT unnest(skills) AS s FROM hunar_profiles WHERE status='approved' ORDER BY 1 LIMIT 60`);
    res.json({ skills: r.rows.map(x => x.s) });
  });
  app.get('/api/hunar/:id', async (req, res) => {
    const t = me(req);
    const r = await query(`SELECT * FROM hunar_profiles WHERE id=$1`, [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'not found' });
    await query(`UPDATE hunar_profiles SET views=views+1 WHERE id=$1`, [req.params.id]).catch(() => {});
    const x = r.rows[0];
    if (x.status !== 'approved' && !(t && String(t.role).startsWith('admin'))) return res.status(404).json({ error: 'not found' });
    res.json({ profile: { ...x, phone: maskPhone(x.phone, !!(t && (t.role === 'user' || String(t.role).startsWith('admin')))) } });
  });
  app.post('/api/hunar', async (req, res) => {
    const v = hunarSchema.safeParse(req.body);
    if (!v.success) return res.status(400).json({ error: 'invalid input', issues: v.error.issues.slice(0, 5) });
    const t = me(req);
    const id = 'h' + Date.now().toString(36);
    await query(`INSERT INTO hunar_profiles(id,user_id,name,phone,village,district,skills,experience,expected_work,available_home,photo_url) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [id, t && t.role === 'user' ? t.sub : null, v.data.name, v.data.phone, v.data.village, v.data.district, v.data.skills, v.data.experience, v.data.expected_work, v.data.available_home, v.data.photo || '👩‍🎨']);
    audit(t ? t.sub : v.data.phone, 'hunar_create', id);
    res.json({ ok: true, profile: { id }, message_hi: 'आपका हुनर प्रोफाइल मिल गया! जांच के बाद कंपनियां/SHG देख पाएंगे।', message_en: 'Skill profile received! Visible after verification.' });
  });
  app.post('/api/hunar/:id/interest', async (req, res) => {
    const v = interestSchema.safeParse(req.body);
    if (!v.success) return res.status(400).json({ error: 'invalid input' });
    const h = await query(`SELECT id FROM hunar_profiles WHERE id=$1 AND status='approved'`, [req.params.id]);
    if (!h.rows[0]) return res.status(404).json({ error: 'not found' });
    const id = 'hi' + Date.now().toString(36);
    await query(`INSERT INTO hunar_interests(id,hunar_id,by_name,by_contact,message) VALUES($1,$2,$3,$4,$5)`, [id, req.params.id, v.data.by_name, v.data.by_contact, v.data.message]);
    res.json({ ok: true, message_hi: 'रुचि दर्ज! महिला से संपर्क कराया जाएगा।', message_en: 'Interest recorded!' });
  });

  /* ---------- events: knowledge sessions, job fairs, camps ---------- */
  app.get('/api/events', async (req, res) => {
    const district = req.query.district || '';
    const r = district
      ? await query(`SELECT * FROM events WHERE district=$1 ORDER BY event_date LIMIT 30`, [district])
      : await query(`SELECT * FROM events ORDER BY event_date LIMIT 30`);
    res.json({ count: r.rowCount, events: r.rows });
  });

  /* ---------- LEARN UNIVERSITY ---------- */
  app.get('/api/learn/categories', async (req, res) => {
    const r = await query(`SELECT * FROM learn_categories ORDER BY sort`);
    res.json({ count: r.rowCount, categories: r.rows });
  });
  app.get('/api/learn/courses', async (req, res) => {
    const cat = req.query.cat || '', q = (req.query.q || '').toLowerCase(), st = req.query.status || 'published';
    const conds = []; const p = [];
    if (st !== 'all') { p.push(st); conds.push(`c.status=$${p.length}`); }
    if (cat) { p.push(cat); conds.push(`c.cat_id=$${p.length}`); }
    if (q) { p.push(`%${q}%`); conds.push(`(LOWER(c.title_hi||' '||c.title_en||' '||c.desc_hi) LIKE $${p.length})`); }
    const r = await query(`SELECT c.*, k.title_hi AS cat_hi, k.title_en AS cat_en, (SELECT COUNT(*) FROM learn_lessons l WHERE l.course_id=c.id) AS lessons FROM learn_courses c LEFT JOIN learn_categories k ON k.id=c.cat_id ${conds.length ? 'WHERE ' + conds.join(' AND ') : ''} ORDER BY c.created_at`, p);
    res.json({ count: r.rowCount, courses: r.rows, note: 'All courses free forever. Planned = content pending review.' });
  });
  app.get('/api/learn/courses/:id', async (req, res) => {
    const t = me(req);
    const c = await query(`SELECT c.*, k.title_hi AS cat_hi FROM learn_courses c LEFT JOIN learn_categories k ON k.id=c.cat_id WHERE c.id=$1`, [req.params.id]);
    if (!c.rows[0]) return res.status(404).json({ error: 'not found' });
    if (c.rows[0].status !== 'published' && !(t && String(t.role).startsWith('admin'))) return res.status(404).json({ error: 'not found' });
    const mods = await query(`SELECT * FROM learn_modules WHERE course_id=$1 ORDER BY pos`, [req.params.id]);
    const lessons = await query(`SELECT l.id,l.module_id,l.pos,l.title_hi,l.title_en,l.mins,(SELECT COUNT(*) FROM learn_quizzes q WHERE q.lesson_id=l.id) AS quiz_n FROM learn_lessons l WHERE l.course_id=$1 ORDER BY l.pos`, [req.params.id]);
    let done = [];
    if (t && t.role === 'user') { const pr = await query(`SELECT lesson_id FROM learn_progress WHERE user_id=$1 AND course_id=$2 AND done=true`, [t.sub, req.params.id]); done = pr.rows.map(x => x.lesson_id); }
    const rel = c.rows[0].related_jobs ? await query(`SELECT id,title_hi,pay_hi,district FROM jobs WHERE status='published' AND verified=true AND (LOWER(title_hi||' '||title_en||' '||category) LIKE $1) LIMIT 4`, ['%' + c.rows[0].related_jobs.split(' ')[0] + '%']).catch(() => ({ rows: [] })) : { rows: [] };
    res.json({ course: c.rows[0], modules: mods.rows, lessons: lessons.rows, done, relatedJobs: rel.rows });
  });
  app.get('/api/learn/lessons/:id', async (req, res) => {
    const t = me(req);
    const l = await query(`SELECT l.*, c.title_hi AS course_hi, c.status FROM learn_lessons l JOIN learn_courses c ON c.id=l.course_id WHERE l.id=$1`, [req.params.id]);
    if (!l.rows[0]) return res.status(404).json({ error: 'not found' });
    if (l.rows[0].status !== 'published' && !(t && String(t.role).startsWith('admin'))) return res.status(404).json({ error: 'not found' });
    const qz = await query(`SELECT id,question_hi,question_en,options_hi,options_en,explain_hi,explain_en FROM learn_quizzes WHERE lesson_id=$1`, [req.params.id]);
    const all = await query(`SELECT id,title_hi FROM learn_lessons WHERE course_id=$1 ORDER BY pos`, [l.rows[0].course_id]);
    const ids = all.rows.map(x => x.id); const ix = ids.indexOf(req.params.id);
    res.json({ lesson: l.rows[0], quiz: qz.rows, prev: ids[ix - 1] || null, next: ids[ix + 1] || null });
  });
  app.post('/api/learn/lessons/:id/complete', requireUser, async (req, res) => {
    const l = await query(`SELECT course_id FROM learn_lessons WHERE id=$1`, [req.params.id]);
    if (!l.rows[0]) return res.status(404).json({ error: 'not found' });
    await query(`INSERT INTO learn_progress(user_id,lesson_id,course_id,done) VALUES($1,$2,$3,true) ON CONFLICT(user_id,lesson_id) DO UPDATE SET done=true, updated_at=now()`, [req.auth.sub, req.params.id, l.rows[0].course_id]);
    const c = await query(`SELECT (SELECT COUNT(*) FROM learn_lessons WHERE course_id=$2) total, (SELECT COUNT(*) FROM learn_progress WHERE user_id=$1 AND course_id=$2 AND done=true) done`, [req.auth.sub, l.rows[0].course_id]);
    const badge = Number(c.rows[0].done) >= Number(c.rows[0].total) && Number(c.rows[0].total) > 0;
    audit(req.auth.sub, 'learn_complete', req.params.id);
    track('lesson_complete', '/learn', 'hi', '', req.auth.sub);
    res.json({ ok: true, done: Number(c.rows[0].done), total: Number(c.rows[0].total), badge, message_hi: badge ? 'बधाई! कोर्स पूरा — यह सीखने का प्रमाण है।' : 'शाबाश! आगे बढ़ें।' });
  });
  app.post('/api/learn/quiz', requireUser, async (req, res) => {
    const v = quizSubmitSchema.safeParse(req.body);
    if (!v.success) return res.status(400).json({ error: 'invalid input' });
    const qz = await query(`SELECT answer,lesson_id,course_id FROM learn_quizzes WHERE id=$1`, [String(req.body.quizId || '')]);
    // support per-question check via quiz id OR lesson-level answers
    let score = null, total = null;
    if (qz.rows[0]) {
      const qa = await query(`SELECT id,answer FROM learn_quizzes WHERE lesson_id=$1 ORDER BY id`, [qz.rows[0].lesson_id]);
      total = qa.rows.length;
      score = qa.rows.filter((q, i) => Number((v.data.answers || [])[i]) === Number(q.answer)).length;
      await query(`UPDATE learn_progress SET quiz_score=$3 WHERE user_id=$1 AND lesson_id=$2`, [req.auth.sub, qz.rows[0].lesson_id, score]).catch(() => {});
    }
    res.json({ ok: true, score, total });
  });
  app.get('/api/learn/my-learning', requireUser, async (req, res) => {
    const r = await query(`SELECT c.id,c.title_hi,c.img,(SELECT COUNT(*) FROM learn_lessons l WHERE l.course_id=c.id) total, COUNT(p.lesson_id) FILTER (WHERE p.done) done, MAX(p.updated_at) last FROM learn_courses c JOIN learn_progress p ON p.course_id=c.id WHERE p.user_id=$1 GROUP BY c.id ORDER BY last DESC`, [req.auth.sub]);
    const bm = await query(`SELECT c.id,c.title_hi,c.img FROM learn_bookmarks b JOIN learn_courses c ON c.id=b.course_id WHERE b.user_id=$1 ORDER BY b.created_at DESC LIMIT 20`, [req.auth.sub]);
    const done = r.rows.filter(x => Number(x.total) > 0 && Number(x.done) >= Number(x.total));
    res.json({ started: r.rows, completed: done, bookmarks: bm.rows });
  });
  app.post('/api/learn/bookmarks', requireUser, async (req, res) => {
    const cid = String(req.body.courseId || '');
    if (!cid) return res.status(400).json({ error: 'courseId required' });
    await query(`INSERT INTO learn_bookmarks(user_id,course_id) VALUES($1,$2) ON CONFLICT DO NOTHING`, [req.auth.sub, cid]);
    res.json({ ok: true });
  });
  app.post('/api/learn/reviews', requireUser, async (req, res) => {
    const v = reviewSchema.safeParse(req.body);
    if (!v.success) return res.status(400).json({ error: 'invalid input' });
    const id = 'rv' + Date.now().toString(36);
    await query(`INSERT INTO learn_reviews(id,course_id,user_id,rating,message) VALUES($1,$2,$3,$4,$5)`, [id, v.data.courseId, req.auth.sub, v.data.rating, v.data.message]);
    res.json({ ok: true });
  });
  app.get('/api/learn/reviews', async (req, res) => {
    const cid = String(req.query.courseId || '');
    const r = await query(`SELECT rating,message,created_at FROM learn_reviews WHERE course_id=$1 ORDER BY created_at DESC LIMIT 20`, [cid]);
    res.json({ count: r.rowCount, reviews: r.rows });
  });
  // --- admin CMS ---
  app.post('/api/admin/learn/course', requireAdmin(['super_admin', 'moderator', 'verifier', 'content_editor']), validate(learnCourseSchema), async (req, res) => {
    const id = 'lc-' + Date.now().toString(36);
    try {
      await query(`INSERT INTO learn_courses(id,cat_id,title_hi,title_en,desc_hi,level,dur,img,skills,related_jobs,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'draft')`,
        [id, req.valid.cat_id, req.valid.title_hi, req.valid.title_en, req.valid.desc_hi, req.valid.level, req.valid.dur, req.valid.img, req.valid.skills, req.valid.related_jobs]);
    } catch { return res.status(400).json({ error: 'invalid category — pick from /api/learn/categories' }); }
    audit(req.auth.sub, 'learn_course_create', id);
    res.json({ ok: true, course: { id } });
  });
  app.post('/api/admin/learn/lesson', requireAdmin(['super_admin', 'moderator', 'verifier', 'content_editor']), validate(learnLessonSchema), async (req, res) => {
    const v = req.valid;
    let mid = v.moduleId, cid = v.courseId;
    if (!mid && cid) {
      mid = cid + '-m9';
      await query(`INSERT INTO learn_modules(id,course_id,pos,title_hi,title_en) VALUES($1,$2,99,$3,$4) ON CONFLICT(id) DO NOTHING`, [mid, cid, v.module_th || 'अतिरिक्त', v.module_te || 'Extra']);
    }
    if (!mid) return res.status(400).json({ error: 'courseId or moduleId required' });
    const mc = await query(`SELECT course_id FROM learn_modules WHERE id=$1`, [mid]);
    cid = v.courseId || (mc.rows[0] && mc.rows[0].course_id);
    const id = mid + '-l' + Date.now().toString(36);
    const n = await query(`SELECT COUNT(*) n FROM learn_lessons WHERE module_id=$1`, [mid]);
    await query(`INSERT INTO learn_lessons(id,module_id,course_id,pos,title_hi,title_en,body_hi,body_en,steps_hi,practice_hi) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [id, mid, cid, Number(n.rows[0].n) + 1, v.title_hi, v.title_en, v.body_hi, v.body_en, v.steps_hi, v.practice_hi]);
    if (v.qh) await query(`INSERT INTO learn_quizzes(id,lesson_id,course_id,question_hi,question_en,options_hi,answer) VALUES($1,$2,$3,$4,$4,$5,$6)`, [id + '-q', id, cid, v.qh, v.qh, v.options, v.answer]);
    audit(req.auth.sub, 'learn_lesson_create', id);
    res.json({ ok: true, lesson: { id } });
  });
  app.post('/api/admin/learn/publish', requireAdmin(['super_admin', 'moderator', 'verifier']), async (req, res) => {
    const { id, status } = req.body || {};
    if (!['draft', 'review', 'approved', 'published'].includes(status)) return res.status(400).json({ error: 'bad status' });
    const r = await query(`UPDATE learn_courses SET status=$2, updated_at=now() WHERE id=$1 RETURNING *`, [id, status]);
    if (!r.rows[0]) return res.status(404).json({ error: 'not found' });
    audit(req.auth.sub, 'learn_publish', id + '=' + status);
    res.json({ ok: true, course: r.rows[0] });
  });
  app.get('/api/learn/analytics', requireAdmin(), async (req, res) => {
    const c = await query(`SELECT (SELECT COUNT(*) FROM learn_courses WHERE status='published') published, (SELECT COUNT(*) FROM learn_courses WHERE status<>'published') drafts, (SELECT COUNT(*) FROM learn_lessons) lessons, (SELECT COUNT(*) FROM learn_progress WHERE done=true) completions, (SELECT COUNT(DISTINCT user_id) FROM learn_progress) learners, (SELECT COUNT(*) FROM learn_bookmarks) bookmarks`);
    const pop = await query(`SELECT c.id,c.title_hi,COUNT(p.lesson_id) n FROM learn_courses c LEFT JOIN learn_progress p ON p.course_id=c.id GROUP BY c.id ORDER BY n DESC LIMIT 12`);
    const drop = await query(`SELECT l.id,l.title_hi,COUNT(p.lesson_id) n FROM learn_lessons l LEFT JOIN learn_progress p ON p.lesson_id=l.id AND p.done GROUP BY l.id ORDER BY n ASC LIMIT 12`);
    const lang = await query(`SELECT lang,COUNT(*) n FROM analytics_events WHERE event IN ('lesson_complete','learn_search') GROUP BY 1 ORDER BY 2 DESC`);
    res.json({ counts: c.rows[0], popular: pop.rows, dropoff: drop.rows, byLang: lang.rows });
  });

  /* ---------- schemes ---------- */
  app.get('/api/schemes', async (req, res) => {
    const q = (req.query.q || '').toLowerCase();
    const r = await query(`SELECT * FROM govt_schemes ORDER BY id`);
    const list = q ? r.rows.filter(s => (s.title_hi + ' ' + s.title_en + ' ' + s.dept).toLowerCase().includes(q)) : r.rows;
    res.json({ count: list.length, schemes: list, note: 'सूचना हेतु — पात्रता CSC/बैंक से सत्यापित करें। / Info only — verify eligibility at CSC/bank.' });
  });

  /* ---------- employers ---------- */
  app.get('/api/employers', async (req, res) => {
    const r = await query(`SELECT * FROM employers WHERE status='approved' ORDER BY created_at DESC`);
    res.json({ employers: r.rows, note: 'केवल सत्यापित नियोक्ता सार्वजनिक।' });
  });
  app.post('/api/employers/apply', validate(employerSchema), async (req, res) => {
    const id = 'er' + Date.now().toString(36);
    await query(`INSERT INTO employer_requests(id,name,type,district,contact,job_detail) VALUES($1,$2,$3,$4,$5,$6)`,
      [id, req.valid.name, req.valid.type, req.valid.district, req.valid.contact, req.valid.job]);
    audit('employer', 'register', req.valid.name);
    res.json({ ok: true, request: { id }, message_hi: 'पंजीकरण मिला। दस्तावेज़ जांच के बाद ही सूची प्रकाशित होगी। कोई फीस नहीं।' });
  });

  /* ----- employer posts a real job (goes live only after admin approval) ----- */
  app.post('/api/employer/jobs', requireUser, async (req, res) => {
    const v = empJobSchema.safeParse(req.body);
    if (!v.success) return res.status(400).json({ error: 'invalid input', issues: v.error.issues.slice(0, 5) });
    const id = 'j' + Date.now().toString(36);
    await query(`INSERT INTO jobs(id,title_hi,title_en,employer,employer_type,verified,verification,village,district,pincode,pay,pay_unit,pay_hi,hours,home_based,part_time,flexible,daily_wage,seasonal,category,skills,education,childcare,disability_friendly,phone,desc_hi,desc_en,status,posted_by)
      VALUES($1,$2,$3,$4,'Employer-posted',false,'Pending review',$5,$6,'',0,'monthly',$7,'flexible',$8,$9,false,false,false,$10,'{}','no-formal',false,false,$11,$12,'','pending',$13)`,
      [id, v.data.title_hi, v.data.title_en || v.data.title_hi, v.data.org, v.data.village, v.data.district, v.data.pay_hi, v.data.home_based, v.data.part_time, v.data.category, v.data.contact, v.data.desc_hi, req.auth.sub]);
    audit(req.auth.sub, 'employer_job_post', id);
    res.json({ ok: true, job: { id }, message_hi: 'भर्ती भेजी गई! जांच के बाद प्रकाशित होगी — तब महिलाएं आवेदन कर पाएंगी।', message_en: 'Job submitted! It goes live after verification.' });
  });
  app.get('/api/employer/jobs', requireUser, async (req, res) => {
    const r = await query(`SELECT id,title_hi,district,pay_hi,status,verified,created_at FROM jobs WHERE posted_by=$1 ORDER BY created_at DESC LIMIT 50`, [req.auth.sub]);
    res.json({ count: r.rowCount, jobs: r.rows });
  });

  /* ---------- safety / reports ---------- */
  const SAFETY = {
    rules_hi: ['कभी अग्रिम फीस/रजिस्ट्रेशन शुल्क न दें', 'OTP, आधार-बैंक डिटेल कभी न बताएं', 'अनजान लिंक न खोलें', 'पहली मुलाकात दिन में, परिवार को बताकर जाएं', 'वेतन हमेशा बैंक/UPI में लें, रसीद लें'],
    rules_en: ['Never pay advance/registration fee', 'Never share OTP/Aadhaar/bank', 'Do not open unknown links', 'First meeting daytime, inform family', 'Take pay in bank/UPI with receipt'],
    helplines: [{ n: 'महिला हेल्पलाइन', p: '181' }, { n: 'Child/Women', p: '1090' }, { n: 'Cyber fraud', p: '1930' }, { n: 'Emergency', p: '112' }],
    verify_note: 'SHAKTI “सत्यापित” का अर्थ: संगठन-पहचान + संपर्क + पता जांचा गया। इसका अर्थ 100% गारंटी नहीं — सतर्क रहें, रिपोर्ट करें।',
  };
  app.get('/api/safety/info', (req, res) => res.json(SAFETY));
  app.post('/api/report', validate(reportSchema), async (req, res) => {
    const t = me(req);
    const id = 'r' + Date.now().toString(36);
    await query(`INSERT INTO reports(id,job_id,reporter_id,reason,detail,contact) VALUES($1,$2,$3,$4,$5,$6)`,
      [id, req.valid.jobId, t && t.role === 'user' ? t.sub : null, req.valid.reason, req.valid.detail, req.valid.contact]);
    audit(t ? t.sub : 'guest', 'report', req.valid.reason + ':' + req.valid.jobId);
    res.json({ ok: true, report: { id }, message_hi: `रिपोर्ट दर्ज (ID ${id})। टीम 48 घंटे में जांच करेगी। खतरा हो तो 181/1090 पर कॉल करें।`, message_en: `Report filed (ID ${id}). Reviewed in 48h. If in danger call 181/1090.` });
  });

  /* ---------- voice + AI ---------- */
  async function allPublishedJobs() { return (await query(`SELECT * FROM jobs WHERE status='published' LIMIT 100`)).rows; }
  app.post('/api/voice-assist', async (req, res) => {
    const jobs = await allPublishedJobs();
    const out = localAssist(req.body.text || req.body.q || '', jobs);
    const t = me(req);
    track('voice_usage', '/voice', req.body.lang || 'hi', '', t ? t.sub : null);
    res.json({ ...out, engine: 'local-intent (no key needed)' });
  });
  app.post('/api/ai-help', async (req, res) => {
    const msg = String(req.body.message || '').slice(0, 800);
    if (!msg) return res.status(400).json({ error: 'message required' });
    const lang = req.body.lang === 'en' ? 'en' : 'hi';
    const jobs = await allPublishedJobs();
    const local = localAssist(msg, jobs);
    if (aiEnabled()) {
      const ctx = local.jobs.map(j => `${j.title_hi} (${j.district}, ${j.pay_hi}, verified:${j.verified})`).join('; ');
      const { text: ai, metaStatus } = await metaChat([
        { role: 'system', content: SYSTEM },
        { role: 'user', content: `Question: ${msg}\nVerified context (use only this, never invent): ${ctx}` },
      ], 400);
      if (ai) {
        const t = me(req);
        track('ai_help', '/help', lang, '', t ? t.sub : null);
        return res.json({ answer: ai, engine: 'meta:' + META_MODEL, jobs: local.jobs, disclaimer: lang === 'en' ? 'AI guidance — verified listings only from /api/jobs.' : 'AI मार्गदर्शन — सत्यापित सूची केवल /api/jobs से।' });
      }
      return res.json({ answer: lang === 'en' ? local.reply_en : local.reply_hi, engine: 'local-kb', metaStatus, jobs: local.jobs });
    }
    res.json({ answer: lang === 'en' ? local.reply_en : local.reply_hi, engine: 'local-kb (no AI key)', jobs: local.jobs });
  });

  /* ---------- streaming AI (SSE, duck.ai-style fast first token) ---------- */
  app.post('/api/ai-help/stream', async (req, res) => {
    const msg = String(req.body.message || '').slice(0, 800);
    if (!msg) return res.status(400).json({ error: 'message required' });
    const lang = req.body.lang === 'en' ? 'en' : 'hi';
    res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'Access-Control-Allow-Origin': '*', 'X-Accel-Buffering': 'no' });
    const say = (o) => { try { res.write('data: ' + JSON.stringify(o) + '\n\n'); } catch {} };
    const t0 = Date.now();
    const jobs = (await query(`SELECT * FROM jobs WHERE status='published' LIMIT 100`).catch(() => ({ rows: [] }))).rows;
    const local = localAssist(msg, jobs);
    const t = me(req);
    if (aiEnabled()) {
      const ctx = local.jobs.map(j => `${j.title_hi} (${j.district}, ${j.pay_hi}, verified:${j.verified})`).join('; ');
      let first = true;
      const full = await metaChatStream([
        { role: 'system', content: SYSTEM },
        { role: 'user', content: `Question: ${msg}\nVerified context (use only this, never invent): ${ctx || 'none'}` },
      ], 400, (tok) => { say({ token: tok, firstTokenMs: first ? Date.now() - t0 : undefined }); first = false; });
      if (full) {
        track('ai_help', '/help', lang, '', t ? t.sub : null);
        say({ done: true, ms: Date.now() - t0, engine: 'meta:' + META_MODEL, jobs: local.jobs.slice(0, 3) });
        try { res.end(); } catch {}
        return;
      }
    }
    say({ token: lang === 'en' ? local.reply_en : local.reply_hi, firstTokenMs: Date.now() - t0 });
    say({ done: true, ms: Date.now() - t0, engine: 'local-kb (no AI key)', jobs: local.jobs.slice(0, 3) });
    try { res.end(); } catch {}
  });

  /* ---------- feedback / analytics ---------- */
  app.post('/api/feedback', validate(feedbackSchema), async (req, res) => {
    const t = me(req);
    const id = 'f' + Date.now().toString(36);
    await query(`INSERT INTO feedback(id,user_id,page,message,lang) VALUES($1,$2,$3,$4,$5)`, [id, t && t.role === 'user' ? t.sub : null, req.valid.page, req.valid.message, 'hi']);
    res.json({ ok: true, id, message_hi: 'धन्यवाद! प्रतिक्रिया दर्ज।' });
  });
  app.post('/api/analytics/track', async (req, res) => {
    const t = me(req);
    track(String(req.body.event || 'page_view').slice(0, 40), String(req.body.page || '/'), req.body.lang || 'hi', req.body.district || '', t ? t.sub : null);
    res.json({ ok: true });
  });

  /* ---------- Rajasthan SSO (OAuth2 authorization-code; activates on dept credentials) ---------- */
  const SSO = {
    clientId: process.env.SSO_CLIENT_ID || '',
    secret: process.env.SSO_CLIENT_SECRET || '',
    authUrl: process.env.SSO_AUTH_URL || 'https://sso.rajasthan.gov.in/signin',
    tokenUrl: process.env.SSO_TOKEN_URL || 'https://sso.rajasthan.gov.in/token',
    userUrl: process.env.SSO_USERINFO_URL || 'https://sso.rajasthan.gov.in/userinfo',
    redirect: process.env.SSO_REDIRECT_URI || '',
  };
  const ssoStates = new Map();
  app.get('/api/sso/status', (req, res) => res.json({
    configured: !!SSO.clientId,
    manual: 'Raj_Sewadwaar_Standard_User_Manual_v2.0 (DoIT&C, 15-09-2026)',
    steps: SSO.clientId ? ['SSO configured — login active'] : [
      '1. SSO portal par app register karke Client ID/Secret lein (manual §9)',
      '2. Redirect URI register karein: <Railway-URL>/api/sso/callback',
      '3. Railway Variables me SSO_CLIENT_ID / SSO_CLIENT_SECRET / SSO_REDIRECT_URI set karein',
      '4. Sewadwaar par API product subscribe karke clientID gateway calls me jodein (manual §8/§10)',
    ],
  }));
  app.get('/api/sso/login', (req, res) => {
    if (!SSO.clientId) return res.status(503).json({ error: 'SSO not configured — see /api/sso/status', hint: 'Dept credentials required. We never fake a government login.' });
    const st = require('crypto').randomBytes(16).toString('hex');
    ssoStates.set(st, Date.now()); setTimeout(() => ssoStates.delete(st), 10 * 60e3);
    const u = new URL(SSO.authUrl);
    u.searchParams.set('client_id', SSO.clientId);
    u.searchParams.set('redirect_uri', SSO.redirect);
    u.searchParams.set('response_type', 'code');
    u.searchParams.set('scope', 'openid profile');
    u.searchParams.set('state', st);
    res.redirect(u.toString());
  });
  app.get('/api/sso/callback', async (req, res) => {
    const { code, state } = req.query;
    const front = (process.env.FRONTEND_URLS || '').split(',')[0] || '/';
    const fail = (m) => res.redirect(front.replace(/\/+$/, '') + '/sso?error=' + encodeURIComponent(m));
    if (!code || !state || !ssoStates.has(String(state))) return fail('invalid session — retry login');
    ssoStates.delete(String(state));
    try {
      const tr = await fetch(SSO.tokenUrl, {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'authorization_code', code: String(code), redirect_uri: SSO.redirect, client_id: SSO.clientId, client_secret: SSO.secret }),
      });
      const tj = await tr.json().catch(() => ({}));
      if (!tr.ok || !tj.access_token) throw new Error('token exchange failed');
      const ur = await fetch(SSO.userUrl, { headers: { Authorization: 'Bearer ' + tj.access_token } });
      const u = await ur.json().catch(() => ({}));
      const ssoId = String(u.sub || u.id || u.ssoid || '');
      if (!ssoId) throw new Error('no subject');
      let row = (await query(`SELECT * FROM users WHERE sso_id=$1`, [ssoId])).rows[0];
      if (!row) {
        const id = 'u' + Date.now().toString(36);
        await query(`INSERT INTO users(id,name,phone,pin_hash,village,sso_id) VALUES($1,$2,$3,$4,'','')`, [id, String(u.name || 'SSO User').slice(0, 80), 'sso:' + ssoId.slice(0, 20), await hashPin(require('crypto').randomBytes(8).toString('hex'))]);
        row = (await query(`SELECT * FROM users WHERE id=$1`, [id])).rows[0];
      }
      audit(row.id, 'sso_login', '');
      const tok = signUser(row);
      res.redirect(front.replace(/\/+$/, '') + '/sso/callback?token=' + tok);
    } catch (e) { audit('sso', 'login_fail', String(e.message || e).slice(0, 80)); fail('login failed — try again'); }
  });

  /* ---------- admin ---------- */
  app.post('/api/admin/login', validate(adminLoginSchema), async (req, res) => {
    const r = await query(`SELECT * FROM admin_users WHERE username=$1`, [req.valid.username]);
    const a = r.rows[0];
    if (!a || !(await checkPin(req.valid.password, a.pin_hash))) { audit(req.valid.username, 'admin_login_fail', ''); return res.status(401).json({ error: 'wrong credentials' }); }
    audit(a.id, 'admin_login_ok', a.role);
    res.json({ ok: true, token: signAdmin(a), role: a.role });
  });
  app.get('/api/admin/overview', requireAdmin(), async (req, res) => {
    const c = await query(`SELECT (SELECT COUNT(*) FROM jobs) jobs, (SELECT COUNT(*) FROM jobs WHERE status='published') published, (SELECT COUNT(*) FROM jobs WHERE status='suspended') suspended, (SELECT COUNT(*) FROM jobs WHERE verified) verified, (SELECT COUNT(*) FROM applications) applications, (SELECT COUNT(*) FROM reports) reports, (SELECT COUNT(*) FROM reports WHERE status='new') open_reports, (SELECT COUNT(*) FROM certificates) certificates, (SELECT COUNT(*) FROM employer_requests WHERE status='pending') pending_employers, (SELECT COUNT(*) FROM feedback) feedback, (SELECT COUNT(*) FROM analytics_events) events, (SELECT COUNT(*) FROM hunar_profiles WHERE status='approved') hunar, (SELECT COUNT(*) FROM hunar_profiles WHERE status='pending') pending_hunar`);
    const byE = await query(`SELECT event, COUNT(*) n FROM analytics_events GROUP BY 1 ORDER BY 2 DESC LIMIT 15`);
    const byP = await query(`SELECT page, COUNT(*) n FROM analytics_events GROUP BY 1 ORDER BY 2 DESC LIMIT 15`);
    const recent = await query(`SELECT * FROM analytics_events ORDER BY id DESC LIMIT 10`);
    const auditL = await query(`SELECT * FROM audit_logs ORDER BY id DESC LIMIT 20`);
    res.json({ counts: c.rows[0], byEvent: byE.rows, byPage: byP.rows, recent: recent.rows, audit: auditL.rows });
  });
  app.get('/api/admin/reports', requireAdmin(), async (req, res) => {
    const reps = await query(`SELECT * FROM reports ORDER BY created_at DESC LIMIT 100`);
    const ers = await query(`SELECT * FROM employer_requests ORDER BY created_at DESC LIMIT 100`);
    const aw = await query(`SELECT * FROM anganwadi_reports ORDER BY created_at DESC LIMIT 100`);
    res.json({ reports: reps.rows, employerRequests: ers.rows, anganwadiReports: aw.rows });
  });
  app.get('/api/admin/jobs', requireAdmin(), async (req, res) => {
    const r = await query(`SELECT * FROM jobs ORDER BY created_at DESC`);
    res.json({ jobs: r.rows });
  });
  app.get('/api/admin/hunar', requireAdmin(), async (req, res) => {
    const r = await query(`SELECT * FROM hunar_profiles ORDER BY created_at DESC LIMIT 100`);
    const i = await query(`SELECT * FROM hunar_interests ORDER BY created_at DESC LIMIT 100`);
    res.json({ profiles: r.rows, interests: i.rows });
  });
  app.post('/api/admin/moderate', requireAdmin(['super_admin', 'moderator', 'verifier']), validate(moderateSchema), async (req, res) => {
    const { kind, id, status, suspendJob } = req.valid;
    if (kind === 'job') {
      const sets = [`status=$2`]; const pv = [id, status];
      if (typeof req.valid.verified === 'boolean') { pv.push(req.valid.verified); sets.push(`verified=$${pv.length}`); }
      if (status === 'published' && typeof req.valid.verified !== 'boolean') sets.push(`verified=true`);
      if (status === 'suspended') sets.push(`verified=false`);
      const r = await query(`UPDATE jobs SET ${sets.join(', ')} WHERE id=$1 RETURNING *`, pv);
      if (!r.rows[0]) return res.status(404).json({ error: 'job not found' });
      audit(req.auth.sub, 'moderate_job', id + '=' + status);
      return res.json({ ok: true, job: r.rows[0] });
    }
    if (kind === 'report') {
      const r = await query(`UPDATE reports SET status=$2 WHERE id=$1 RETURNING *`, [id, status]);
      if (!r.rows[0]) return res.status(404).json({ error: 'report not found' });
      if (suspendJob && r.rows[0].job_id) await query(`UPDATE jobs SET status='suspended', verified=false WHERE id=$1`, [r.rows[0].job_id]);
      audit(req.auth.sub, 'moderate_report', id + '=' + status);
      return res.json({ ok: true, report: r.rows[0] });
    }
    if (kind === 'hunar') {
      const r = await query(`UPDATE hunar_profiles SET status=$2, verified = CASE WHEN $2='approved' THEN true ELSE false END WHERE id=$1 RETURNING *`, [id, status]);
      if (!r.rows[0]) return res.status(404).json({ error: 'hunar not found' });
      audit(req.auth.sub, 'moderate_hunar', id + '=' + status);
      return res.json({ ok: true, profile: r.rows[0] });
    }
    const r = await query(`UPDATE employer_requests SET status=$2 WHERE id=$1 RETURNING *`, [id, status]);
    if (!r.rows[0]) return res.status(404).json({ error: 'not found' });
    if (status === 'approved') {
      await query(`INSERT INTO employers(id,name,type,district,contact,status) VALUES($1,$2,$3,$4,$5,'approved') ON CONFLICT(id) DO NOTHING`,
        ['e' + Date.now().toString(36), r.rows[0].name, r.rows[0].type, r.rows[0].district, r.rows[0].contact]);
    }
    audit(req.auth.sub, 'moderate_employer', id + '=' + status);
    res.json({ ok: true, request: r.rows[0] });
  });

  app.use('/api/', (req, res) => res.status(404).json({ error: 'not found', hint: 'See /api/health' }));
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error(`[${req.rid}]`, err.message);
    res.status(500).json({ error: 'internal error', rid: req.rid });
  });
  return app;
}

module.exports = { makeApp };

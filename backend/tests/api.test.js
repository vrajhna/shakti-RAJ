'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

const PORT = 3199;
process.env.PORT = String(PORT);
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgres://shakti:shakti_strong_pw_2026@127.0.0.1:5433/shakti';
process.env.JWT_SECRET = 'test-secret-min-32-chars-0123456789abcdef';
process.env.ADMIN_USERNAME = 'test-admin';
process.env.ADMIN_PASSWORD = 'test-admin-pw-1234';

const { migrate, query } = require('../src/db');
const { makeApp } = require('../src/app');
const { hashPin } = require('../src/auth');
const SEED = require('../src/seed-data');

let server;
const base = `http://127.0.0.1:${PORT}`;
async function get(p, token) {
  const h = token ? { Authorization: 'Bearer ' + token } : {};
  const r = await fetch(base + p, { headers: h });
  return { s: r.status, j: await r.json() };
}
async function post(p, b, token) {
  const h = { 'Content-Type': 'application/json' };
  if (token) h.Authorization = 'Bearer ' + token;
  const r = await fetch(base + p, { method: 'POST', headers: h, body: JSON.stringify(b) });
  return { s: r.status, j: await r.json() };
}

test.before(async () => {
  await migrate();
  await query(`INSERT INTO admin_users(id,username,pin_hash,role) VALUES('t-admin','test-admin',$1,'super_admin') ON CONFLICT(username) DO NOTHING`, [await hashPin('test-admin-pw-1234')]);
  const c = await query(`SELECT COUNT(*) n FROM jobs`);
  if (Number(c.rows[0].n) === 0) {
    for (const j of SEED.jobs.slice(0, 5)) {
      await query(`INSERT INTO jobs(id,title_hi,title_en,employer,employer_type,verified,verification,village,district,pincode,distance_km,pay,pay_unit,pay_hi,hours,home_based,part_time,flexible,daily_wage,seasonal,category,skills,education,childcare,disability_friendly,phone,desc_hi,desc_en,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29) ON CONFLICT(id) DO NOTHING`,
        [j.id, j.title_hi, j.title_en, j.employer, j.employer_type, j.verified, j.verification, j.village, j.district, j.pincode, j.distance_km, j.pay, j.pay_unit, j.pay_hi, j.hours, j.home_based, j.part_time, j.flexible, j.daily_wage, j.seasonal, j.category, j.skills, j.education, j.childcare, j.disability_friendly, j.phone, j.desc_hi, j.desc_en, j.status]);
    }
    for (const x of SEED.courses.slice(0, 3)) {
      await query(`INSERT INTO courses(id,cat,title_hi,title_en,level,dur,lessons,img,desc_hi,desc_en,body_hi,body_en,quiz) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) ON CONFLICT(id) DO NOTHING`,
        [x.id, x.cat, x.title_hi, x.title_en, x.level, x.dur, x.lessons, x.img, x.desc_hi, x.desc_en, x.body_hi, x.body_en, x.quiz]);
    }
  }
  server = makeApp().listen(PORT, '127.0.0.1');
  await new Promise(r => setTimeout(r, 300));
});
test.after(async () => { await new Promise(r => server.close(r)); });

test('health + i18n', async () => {
  const h = await get('/api/health');
  assert.equal(h.s, 200); assert.equal(h.j.ok, true);
  const i = await get('/api/i18n');
  assert.ok(i.j.hi.find_work);
});
test('register validation rejects bad phone', async () => {
  const r = await post('/api/auth/register', { name: 'x', phone: '123', pin: '1234' });
  assert.equal(r.s, 400);
});
test('register + login + me', async () => {
  const ph = '98' + String(Date.now()).slice(-8);
  const r = await post('/api/auth/register', { name: 'Meena Test', phone: ph, pin: '4321', village: 'Chomu' });
  assert.equal(r.s, 200); assert.ok(r.j.token);
  const l = await post('/api/auth/login', { phone: ph, pin: '4321' });
  assert.equal(l.s, 200);
  const m = await get('/api/auth/me', l.j.token);
  assert.equal(m.j.user.phone, ph);
});
test('jobs list filters + scam suspended excluded from verified', async () => {
  const all = await get('/api/jobs?verifiedOnly=false');
  const ver = await get('/api/jobs?verifiedOnly=true');
  assert.ok(all.j.count >= ver.j.count);
  assert.ok(ver.j.jobs.every(j => j.verified));
  const home = await get('/api/jobs?home=true&verifiedOnly=false');
  assert.ok(home.j.jobs.every(j => j.home_based));
});
test('apply validation + success', async () => {
  const bad = await post('/api/apply', { jobId: 'j1', name: 'x', phone: '123' });
  assert.equal(bad.s, 400);
  const ok = await post('/api/apply', { jobId: 'j1', name: 'Meena', phone: '9829012345', village: 'Chomu' });
  assert.equal(ok.s, 200);
});
test('courses + cert + safety + voice + calc', async () => {
  const c = await get('/api/courses');
  assert.ok(c.j.count >= 3);
  const cert = await post('/api/courses/c1/complete', { name: 'Test Learner', phone: '9999999999' });
  assert.equal(cert.s, 200);
  const s = await get('/api/safety/info');
  assert.ok(s.j.helplines.length >= 3);
  const v = await post('/api/voice-assist', { text: 'mujhe ghar baithe kaam chahiye' });
  assert.ok(v.j.jobs.length >= 1);
  const calc = await post('/api/business/calc', { material: 200, packing: 20, transport: 30, hours: 5 });
  assert.ok(calc.j.price > calc.j.cost);
});
test('hunar showcase: list, create, moderation guard', async () => {
  const l = await get('/api/hunar');
  assert.ok(l.s === 200 && l.j.count >= 0);
  const bad = await post('/api/hunar', { name: 'x', phone: '123', skills: [] });
  assert.equal(bad.s, 400);
  const ok = await post('/api/hunar', { name: 'Hunar Test', phone: '9829067890', village: 'Test', skills: ['सिलाई'] });
  assert.equal(ok.s, 200);
});
test('saved jobs need login, work with token', async () => {
  const no = await get('/api/saved');
  assert.equal(no.s, 401);
  const ph = '98' + String(Date.now()).slice(-8);
  const r = await post('/api/auth/register', { name: 'Save Test', phone: ph, pin: '4321' });
  const s = await post('/api/saved', { jobId: 'j1' }, r.j.token);
  assert.equal(s.s, 200);
  const l = await get('/api/saved', r.j.token);
  assert.ok(l.j.count >= 1);
});
test('admin login + overview + moderation guard', async () => {
  const no = await get('/api/admin/overview');
  assert.equal(no.s, 401);
  const bad = await post('/api/admin/login', { username: 'test-admin', password: 'wrong' });
  assert.equal(bad.s, 401);
  const ok = await post('/api/admin/login', { username: 'test-admin', password: 'test-admin-pw-1234' });
  assert.equal(ok.s, 200);
  const ov = await get('/api/admin/overview', ok.j.token);
  assert.equal(ov.s, 200);
  assert.ok('jobs' in ov.j.counts);
});

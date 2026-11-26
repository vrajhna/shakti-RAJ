'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');

const PORT = 3199;
process.env.PORT = String(PORT);
const { server } = require('../server.js');
const base = `http://127.0.0.1:${PORT}`;

test.before(async () => {
  await new Promise(res => server.listen(PORT, '127.0.0.1', res));
});
test.after(async () => { await new Promise(res => server.close(res)); });

async function get(p) { const r = await fetch(base + p); return { s: r.status, j: await r.json() }; }
async function post(p, b, token) {
  const h = { 'Content-Type': 'application/json' };
  if (token) h['Authorization'] = 'Bearer ' + token;
  const r = await fetch(base + p, { method: 'POST', headers: h, body: JSON.stringify(b) });
  return { s: r.status, j: await r.json() };
}

test('health', async () => {
  const { s, j } = await get('/api/health');
  assert.equal(s, 200); assert.equal(j.app, 'SHAKTI'); assert.ok(j.jobs >= 10);
});
test('jobs: verified filter + home filter', async () => {
  const all = await get('/api/jobs?verifiedOnly=false');
  const ver = await get('/api/jobs?verifiedOnly=true');
  assert.ok(all.j.count > ver.j.count);
  const home = await get('/api/jobs?home=true&verifiedOnly=false');
  assert.ok(home.j.jobs.every(x => x.home_based));
});
test('scam demo blocked, not published', async () => {
  const { j } = await get('/api/jobs?verifiedOnly=false');
  const scam = j.jobs.find(x => x.id === 'j16');
  assert.ok(!scam, 'suspended j16 must not appear in published list');
  const one = await get('/api/jobs/j16');
  assert.equal(one.j.job.status, 'suspended');
});
test('courses free + certificate is learning-proof', async () => {
  const { j } = await get('/api/courses');
  assert.ok(j.count >= 10);
  const c = await post('/api/courses/c3/complete', { name: 'Test', phone: '9999999999' });
  assert.equal(c.s, 200); assert.ok(c.j.certificate.note.includes('not a government'));
});
test('anganwadi labelled demo', async () => {
  const { j } = await get('/api/anganwadi?village=Chomu');
  assert.ok(j.centres.length >= 1); assert.ok(j.warning.includes('DEMO'));
});
test('apply validation', async () => {
  const bad = await post('/api/apply', { jobId: 'j1', name: 'x', phone: '123' });
  assert.equal(bad.s, 400);
  const ok = await post('/api/apply', { jobId: 'j1', name: 'Meena', phone: '9829012345', village: 'Chomu' });
  assert.equal(ok.s, 200);
});
test('report + safety + voice', async () => {
  const r = await post('/api/report', { jobId: 'j15', reason: 'advance-fee', detail: 'test' });
  assert.equal(r.s, 200);
  const s = await get('/api/safety/info');
  assert.ok(s.j.helplines.length >= 3);
  const v = await post('/api/voice-assist', { text: 'mujhe ghar baithe kaam chahiye' });
  assert.ok(v.j.jobs.length >= 1);
});
test('admin auth + moderation', async () => {
  const no = await get('/api/admin/overview');
  assert.equal(no.s, 401);
  const login = await post('/api/admin/login', { password: 'wrong' });
  assert.equal(login.s, 401);
  const ok = await post('/api/admin/login', { password: process.env.ADMIN_PASSWORD || 'shakti-admin-2026' });
  assert.equal(ok.s, 200);
  const ov = await get('/api/admin/overview').catch(() => null);
  const r = await fetch(base + '/api/admin/overview', { headers: { Authorization: 'Bearer ' + ok.j.token } });
  assert.equal(r.status, 200);
});

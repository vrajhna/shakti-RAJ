'use strict';
require('dotenv').config();
const { migrate, ping, query } = require('./db');
const { hashPin } = require('./auth');
const { makeApp } = require('./app');
const SEED = require('./seed-data');

const PORT = Number(process.env.PORT || 3101);

async function ensureAdmin() {
  const username = process.env.ADMIN_USERNAME || 'shakti-admin';
  const password = process.env.ADMIN_PASSWORD || 'shakti-admin-2026';
  const role = 'super_admin';
  const ex = await query(`SELECT 1 FROM admin_users WHERE username=$1`, [username]);
  if (!ex.rowCount) {
    await query(`INSERT INTO admin_users(id,username,pin_hash,role) VALUES($1,$2,$3,$4)`, ['admin-' + Date.now().toString(36), username, await hashPin(password), role]);
    console.log(`[boot] admin user created: ${username}`);
  }
}

async function ensureSeed() {
  const c = await query(`SELECT COUNT(*) n FROM jobs`);
  if (Number(c.rows[0].n) > 0) return;
  console.log('[boot] seeding database…');
  for (const j of SEED.jobs) {
    await query(`INSERT INTO jobs(id,title_hi,title_en,employer,employer_type,verified,verification,village,district,pincode,distance_km,pay,pay_unit,pay_hi,hours,home_based,part_time,flexible,daily_wage,seasonal,category,skills,education,childcare,disability_friendly,phone,desc_hi,desc_en,status)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29)`,
      [j.id, j.title_hi, j.title_en, j.employer, j.employer_type, j.verified, j.verification, j.village, j.district, j.pincode, j.distance_km, j.pay, j.pay_unit, j.pay_hi, j.hours, j.home_based, j.part_time, j.flexible, j.daily_wage, j.seasonal, j.category, j.skills, j.education, j.childcare, j.disability_friendly, j.phone, j.desc_hi, j.desc_en, j.status]);
  }
  for (const x of SEED.courses) {
    await query(`INSERT INTO courses(id,cat,title_hi,title_en,level,dur,lessons,img,desc_hi,desc_en,body_hi,body_en,quiz) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [x.id, x.cat, x.title_hi, x.title_en, x.level, x.dur, x.lessons, x.img, x.desc_hi, x.desc_en, x.body_hi, x.body_en, x.quiz]);
  }
  for (const a of SEED.anganwadi) {
    await query(`INSERT INTO anganwadi_centres(id,name,village,district,pincode,hours,contact,distance_km,facilities,demo) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,true)`,
      [a.id, a.name, a.village, a.district, a.pincode, a.hours, a.contact, a.distance_km, a.facilities]);
  }
  for (const s of SEED.shg) {
    await query(`INSERT INTO shg_groups(id,name,village,district,members,work,contact) VALUES($1,$2,$3,$4,$5,$6,$7)`, [s.id, s.name, s.village, s.district, s.members, s.work, s.contact]);
  }
  for (const m of SEED.market) {
    await query(`INSERT INTO marketplace_items(id,item_hi,item_en,price,unit,district,seller) VALUES($1,$2,$3,$4,$5,$6,$7)`, [m.id, m.item_hi, m.item_en, m.price, m.unit, m.district, m.seller]);
  }
  for (const g of SEED.guides) {
    await query(`INSERT INTO business_guides(id,title_hi,title_en,body_hi,body_en) VALUES($1,$2,$3,$4,$5)`, [g.id, g.title_hi, g.title_en, g.body_hi, g.body_en]);
  }
  await query(`INSERT INTO employers(id,name,type,district,status) VALUES('e-seed-1','Udaan Mahila SHG Samooh','SHG','Jaipur','approved'),('e-seed-2','Rajeshwari Foods','Registered company','Jaipur','approved'),('e-seed-3','Saksham Seva Sansthan','Registered NGO','Ajmer','approved') ON CONFLICT(id) DO NOTHING`);
  console.log('[boot] seed complete');
}

async function main() {
  await migrate();
  await ensureAdmin();
  await ensureSeed();
  const app = makeApp();
  app.listen(PORT, '0.0.0.0', async () => {
    console.log(`SHAKTI API running on :${PORT} — ai=${process.env.META_API_KEY ? 'meta' : 'local-kb'}`);
    try { await ping(); console.log('[boot] postgres OK'); } catch (e) { console.error('[boot] postgres FAIL', e.message); }
  });
}

if (require.main === module) { main().catch(e => { console.error(e); process.exit(1); }); }
module.exports = { main };

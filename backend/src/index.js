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
  // idempotent: all inserts use ON CONFLICT DO NOTHING
  console.log('[boot] seeding database…');
  for (const j of SEED.jobs) {
    await query(`INSERT INTO jobs(id,title_hi,title_en,employer,employer_type,verified,verification,village,district,pincode,distance_km,pay,pay_unit,pay_hi,hours,home_based,part_time,flexible,daily_wage,seasonal,category,skills,education,childcare,disability_friendly,phone,desc_hi,desc_en,status)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29) ON CONFLICT(id) DO NOTHING`,
      [j.id, j.title_hi, j.title_en, j.employer, j.employer_type, j.verified, j.verification, j.village, j.district, j.pincode, j.distance_km, j.pay, j.pay_unit, j.pay_hi, j.hours, j.home_based, j.part_time, j.flexible, j.daily_wage, j.seasonal, j.category, j.skills, j.education, j.childcare, j.disability_friendly, j.phone, j.desc_hi, j.desc_en, j.status]);
  }
  for (const x of SEED.courses) {
    await query(`INSERT INTO courses(id,cat,title_hi,title_en,level,dur,lessons,img,desc_hi,desc_en,body_hi,body_en,quiz) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) ON CONFLICT(id) DO NOTHING`,
      [x.id, x.cat, x.title_hi, x.title_en, x.level, x.dur, x.lessons, x.img, x.desc_hi, x.desc_en, x.body_hi, x.body_en, x.quiz]);
  }
  for (const a of SEED.anganwadi) {
    await query(`INSERT INTO anganwadi_centres(id,name,village,district,pincode,hours,contact,distance_km,facilities,demo) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,true) ON CONFLICT(id) DO NOTHING`,
      [a.id, a.name, a.village, a.district, a.pincode, a.hours, a.contact, a.distance_km, a.facilities]);
  }
  for (const s of SEED.shg) {
    await query(`INSERT INTO shg_groups(id,name,village,district,members,work,contact) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(id) DO NOTHING`, [s.id, s.name, s.village, s.district, s.members, s.work, s.contact]);
  }
  for (const m of SEED.market) {
    await query(`INSERT INTO marketplace_items(id,item_hi,item_en,price,unit,district,seller) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(id) DO NOTHING`, [m.id, m.item_hi, m.item_en, m.price, m.unit, m.district, m.seller]);
  }
  for (const g of SEED.guides) {
    await query(`INSERT INTO business_guides(id,title_hi,title_en,body_hi,body_en) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO NOTHING`, [g.id, g.title_hi, g.title_en, g.body_hi, g.body_en]);
  }
  await query(`INSERT INTO employers(id,name,type,district,status) VALUES('e-seed-1','Udaan Mahila SHG Samooh','SHG','Jaipur','approved'),('e-seed-2','Rajeshwari Foods','Registered company','Jaipur','approved'),('e-seed-3','Saksham Seva Sansthan','Registered NGO','Ajmer','approved') ON CONFLICT(id) DO NOTHING`);
  const hunarSeed = [
    { id:'h-seed-1', name:'मीना देवी', phone:'+91-98290XXXXX', village:'Chomu', district:'Jaipur', skills:['सिलाई','ब्लाउज'], experience:'12 साल — 500+ ब्लाउज/सूट', expected_work:'बुटिक/SHG सिलाई कार्य', home:true },
    { id:'h-seed-2', name:'पप्पी बानो', phone:'+91-98280XXXXX', village:'Jodhpur', district:'Jodhpur', skills:['कढ़ाई','मिरर वर्क'], experience:'10 साल — हस्तशिल्प निर्यात हेतु', expected_work:'हस्तशिल्प इकाई/निर्यातक', home:true },
    { id:'h-seed-3', name:'कमला कुम्हार', phone:'+91-94130XXXXX', village:'Nagaur', district:'Nagaur', skills:['अचार','पापड़','मसाले'], experience:'8 साल — SHG उत्पादन समूह', expected_work:'फूड प्रोसेसिंग इकाई', home:false },
    { id:'h-seed-4', name:'रुकसाना', phone:'+91-97820XXXXX', village:'Alwar', district:'Alwar', skills:['ब्यूटी','मेहंदी'], experience:'6 साल — घर पार्लर', expected_work:'पार्लर/सैलून', home:false },
    { id:'h-seed-5', name:'शारदा प्रजापत', phone:'+91-98290XXXXX', village:'Sanganer', district:'Jaipur', skills:['ब्लू पॉटरी','पेंटिंग'], experience:'15 साल — पुरस्कृत शिल्पकार', expected_work:'क्राफ्ट सेंटर/प्रशिक्षक', home:false },
    { id:'h-seed-6', name:'संतोष जाट', phone:'+91-94130XXXXX', village:'Churu', district:'Churu', skills:['डेयरी','पशु देखभाल'], experience:'9 साल — 8 भैंस डेयरी', expected_work:'डेयरी फार्म', home:false },
  ];
  for (const h of hunarSeed) {
    await query(`INSERT INTO hunar_profiles(id,name,phone,village,district,skills,experience,expected_work,available_home,verified,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,true,'approved') ON CONFLICT(id) DO NOTHING`,
      [h.id, h.name, h.phone, h.village, h.district, h.skills, h.experience, h.expected_work, h.home]);
  }
  for (const ev of SEED.events) {
    await query(`INSERT INTO events(id,title_hi,title_en,kind,event_date,place,district,contact,demo) VALUES($1,$2,$3,$4,$5,$6,$7,$8,true) ON CONFLICT(id) DO NOTHING`,
      [ev.id, ev.title_hi, ev.title_en, ev.kind, ev.event_date, ev.place, ev.district, ev.contact]);
  }
  await require('./seed-learn').seedLearn(query);
  console.log('[boot] seed complete');
}

async function main() {
  process.on('unhandledRejection', (e) => console.error('[boot] unhandled rejection (server stays up):', String((e && e.message) || e).slice(0, 200)));
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

import { t, getLang } from './i18n.js';

export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
export const A = (p) => API_BASE + p;
export const S = {
  get lang() { return getLang(); },
  profile: JSON.parse(localStorage.getItem('shakti_profile') || '{"name":"","phone":"","village":"","district":"Jaipur"}'),
  token: localStorage.getItem('shakti_token') || '',
  adminToken: sessionStorage.getItem('shakti_admin') || '',
  adminRole: sessionStorage.getItem('shakti_admin_role') || '',
  jobsCache: [],
};
export function saveProfile() { localStorage.setItem('shakti_profile', JSON.stringify(S.profile)); }
export function toast(m) { const e = document.getElementById('toast'); e.textContent = m; e.style.display = 'block'; setTimeout(() => e.style.display = 'none', 2600); }
export function esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
export async function api(p, opt = {}) {
  const h = { 'Content-Type': 'application/json' };
  if (S.token) h['Authorization'] = 'Bearer ' + S.token;
  else if (S.adminToken) h['Authorization'] = 'Bearer ' + S.adminToken;
  const r = await fetch(A(p), { ...opt, headers: { ...h, ...(opt.headers || {}) } });
  return r.json();
}
export function track(event, page) {
  fetch(A('/api/analytics/track'), {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(S.token ? { Authorization: 'Bearer ' + S.token } : {}) },
    body: JSON.stringify({ event, page: page || location.pathname, lang: S.lang }),
  }).catch(() => {});
}
export function speak(text) {
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = S.lang === 'en' ? 'en-IN' : 'hi-IN'; u.rate = 0.95;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  } catch { toast('🔇 Audio not supported'); }
}
export function listenInto(inputEl, ontext) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { toast(S.lang === 'en' ? 'Voice typing not supported — please type' : 'बोलकर लिखना नहीं है — टाइप करें'); return; }
  const r = new SR(); r.lang = S.lang === 'en' ? 'en-IN' : 'hi-IN'; r.interimResults = false;
  toast('🎤 ' + (S.lang === 'en' ? 'Speak…' : 'बोलें…'));
  r.onresult = e => { const txt = e.results[0][0].transcript; if (inputEl) inputEl.value = txt; if (ontext) ontext(txt); };
  r.onerror = () => toast('🎤 ' + (S.lang === 'en' ? 'Try again' : 'दोबारा कोशिश करें'));
  r.start();
}
const U = (id) => `https://images.unsplash.com/${id}?w=800&q=60&auto=format&fit=crop`;
export const IMG = {
  hero1: U('photo-1573497019940-1c28c88b4f3e'),
  hero2: U('photo-1558769132-cb1aea4585e5'),
  hero3: U('photo-1596040033229-a9821ebd058d'),
  hero4: U('photo-1599661046289-e31897846e41'),
  tailoring: U('photo-1558769132-cb1aea4585e5'),
  food: U('photo-1601050690597-df0568f70950'),
  beauty: U('photo-1560066984-138dadb4c035'),
  dairy: U('photo-1516467508483-a7212febe31a'),
  craft: U('photo-1452860606245-08befc0ff44b'),
  pottery: U('photo-1493106641515-6b5631de4bb9'),
  shg: U('photo-1573164713988-8665fc963095'),
  kids: U('photo-1503676260728-1c00da094a0b'),
  market: U('photo-1488459716781-31db52582fe9'),
};
export function jobImg(j) {
  const m = { tailoring: IMG.tailoring, food: IMG.food, beauty: IMG.beauty, craft: IMG.craft, embroidery: IMG.craft, livestock: IMG.dairy, agri: IMG.market, digital: IMG.shg, retail: IMG.market, govt: IMG.kids };
  return m[j.category] || IMG.hero2;
}
export function vBadge(j) {
  if (j.status === 'suspended') return '<span class="badge b-red">⛔ Blocked</span>';
  if (j.verified) return `<span class="badge b-green">✅ ${S.lang === 'en' ? 'Verified' : 'सत्यापित'} • ${esc(j.verification || '')}</span>`;
  return `<span class="badge b-orange">⏳ ${S.lang === 'en' ? 'Pending review' : 'सत्यापन लंबित'}</span>`;
}
export function jobCard(j) {
  const hi = S.lang !== 'en';
  const blocked = j.status === 'suspended';
  return `<div class="card">
    ${blocked ? `<div class="warnbox">⛔ ${hi ? 'स्कैम पैटर्न पर ब्लॉक — सीखने हेतु दिख रही है। आवेदन बंद।' : 'Blocked scam-pattern demo. Applications closed.'}</div>` : ''}
    <img class="imgcover ph" loading="lazy" src="${jobImg(j)}" onerror="this.style.display='none'" alt="">
    <div style="margin-top:8px"><b style="font-size:19px">${esc(hi ? j.title_hi : j.title_en)}</b></div>
    <div class="kv"><span>${esc(j.employer)} • ${esc(j.village)}, ${esc(j.district)}${j.distance_km ? ' • ' + j.distance_km + ' km' : ''}</span></div>
    <div>${vBadge(j)}${j.home_based ? `<span class="badge b-blue">🏠 ${hi ? 'घर से' : 'Home'}</span>` : ''}${j.childcare ? `<span class="badge b-green">👶 ${hi ? 'बच्चों के साथ' : 'Childcare'}</span>` : ''}</div>
    <div style="font-size:21px;font-weight:900;color:var(--green)">${esc(j.pay_hi)}</div>
    <div class="kv"><span>⏰ ${esc(j.hours)}${j.part_time ? (hi ? ' • पार्ट-टाइम' : ' • Part-time') : ''}</span></div>
    <div class="btnrow">
      <a class="btn" href="/jobs/${j.id}" data-link>${t('view')} ➜</a>
      <button class="btn yel" data-speak="${esc(hi ? j.title_hi + '. ' + j.desc_hi : j.title_en + '. ' + j.desc_en).slice(0, 300)}">🔊 ${t('listen')}</button>
    </div>
  </div>`;
}
export function hunarCard(h) {
  const hi = S.lang !== 'en';
  return `<div class="card"><div class="hunar">
    <div class="face">👩‍🎨</div>
    <div><b style="font-size:19px">${esc(h.name)}</b>
    <div class="kv"><span>${esc(h.village)}, ${esc(h.district)}${h.verified ? ' ✅' : ''}</span></div>
    <div>${(h.skills || []).map(s => `<span class="skilltag">🧵 ${esc(s)}</span>`).join('')}</div>
    <div class="kv"><span>${esc(h.experience || '')}</span></div>
    <div class="btnrow"><a class="btn sec" href="/hunar/${h.id}" data-link>${t('view')} ➜</a></div></div>
  </div></div>`;
}
// photo slideshow
export function slideshow(slides) {
  const id = 'ss' + Math.floor(Math.random() * 1e6);
  const dots = slides.map((_, i) => `<i class="${i === 0 ? 'on' : ''}"></i>`).join('');
  const imgs = slides.map(s => `<img class="ph" src="${s.img}" onerror="this.style.display='none'" alt="">`).join('');
  const cap = slides[0];
  setTimeout(() => {
    const el = document.getElementById(id); if (!el) return;
    const box = el.querySelector('.slides'), d = el.querySelectorAll('.ss-dots i');
    const capT = el.querySelector('.ss-cap h1'), capP = el.querySelector('.ss-cap p');
    let i = 0;
    setInterval(() => {
      if (!document.getElementById(id)) return;
      i = (i + 1) % slides.length;
      box.style.transform = `translateX(-${i * 100}%)`;
      d.forEach((x, k) => x.classList.toggle('on', k === i));
      if (capT) capT.textContent = slides[i].t;
      if (capP) capP.textContent = slides[i].s;
    }, 4500);
  }, 50);
  return `<div class="slideshow" id="${id}"><div class="slides">${imgs}</div>
    <div class="ss-cap"><h1>${esc(cap.t)}</h1><p>${esc(cap.s)}</p></div>
    <div class="ss-dots">${dots}</div></div>`;
}
// delegate data-link + data-speak clicks (SPA)
export function wireGlobal() {
  document.addEventListener('click', e => {
    const a = e.target.closest('a[data-link]');
    if (a) { e.preventDefault(); nav(a.getAttribute('href')); return; }
    const sp = e.target.closest('[data-speak]');
    if (sp) { speak(sp.getAttribute('data-speak')); return; }
    const mi = e.target.closest('#micFab');
    if (mi) { nav('/voice'); return; }
  });
}
export let nav = (p) => { location.href = p; };
export function setNav(fn) { nav = fn; }

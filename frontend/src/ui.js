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
  let r;
  try {
    r = await fetch(A(p), { ...opt, headers: { ...h, ...(opt.headers || {}) } });
  } catch {
    throw new Error(S.lang === 'en' ? 'No connection — check internet and retry.' : 'संपर्क नहीं हो पाया — नेट जांचकर दोबारा कोशिश करें।');
  }
  const ct = (r.headers.get('content-type') || '').toLowerCase();
  if (!ct.includes('json')) {
    throw new Error(S.lang === 'en' ? 'Server is starting — please retry in a minute.' : 'सर्वर शुरू हो रहा है — एक मिनट बाद दोबारा कोशिश करें।');
  }
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
  const needChrome = S.lang === 'en'
    ? 'Voice needs Chrome + internet. Please type instead — I focused the box for you.'
    : 'आवाज़ के लिए Chrome + इंटरनेट चाहिए। कृपया टाइप करें — बॉक्स तैयार है।';
  if (!SR) { toast('🎤 ' + needChrome); try { inputEl && inputEl.focus(); } catch { } return; }
  if (!window.isSecureContext) { toast('🎤 ' + needChrome); try { inputEl && inputEl.focus(); } catch { } return; }
  try {
    const r = new SR(); r.lang = S.lang === 'en' ? 'en-IN' : 'hi-IN'; r.interimResults = false; r.maxAlternatives = 1;
    toast('🎤 ' + (S.lang === 'en' ? 'Speak now…' : 'अब बोलें…'));
    let done = false;
    r.onresult = e => { done = true; const txt = e.results[0][0].transcript; if (inputEl) inputEl.value = txt; if (ontext) ontext(txt); };
    r.onerror = ev => {
      const k = (ev && ev.error) || '';
      if (k === 'not-allowed' || k === 'service-not-allowed') toast('🎤 ' + (S.lang === 'en' ? 'Mic blocked — allow microphone, or type.' : 'माइक बंद है — अनुमति दें या टाइप करें।'));
      else if (!done) toast('🎤 ' + (S.lang === 'en' ? 'Did not catch — type instead.' : 'सुनाई नहीं दिया — टाइप करें।'));
      try { inputEl && inputEl.focus(); } catch { }
    };
    r.onend = () => { if (!done) { try { inputEl && inputEl.focus(); } catch { } } };
    r.start();
  } catch { toast('🎤 ' + needChrome); try { inputEl && inputEl.focus(); } catch { } }
}
const U = (id) => `https://images.unsplash.com/${id}?w=800&q=60&auto=format&fit=crop`;
export const IMG = {
  hero1: U('photo-1573497019940-1c28c88b4f3e'),
  hero2: U('photo-1558769132-cb1aea4585e5'),
  hero3: U('photo-1596040033229-a9821ebd058d'),
  hero4: U('photo-1599661046289-e31897846e41'),
  woman: U('photo-1610030469983-98e550d6193c'),
  field: U('photo-1500382017468-9049fed747ef'),
  farm: U('photo-1625246333195-78d9c38ad449'),
  jewel: U('photo-1611591437281-460bfbe1220a'),
  pottery2: U('photo-1565193566173-7a0ee3dbe261'),
  land2: U('photo-1477587458883-47145ed94245'),
  fair: U('photo-1574227492706-f65b24c3688a'),
  fair2: U('photo-1603262110263-fb0112e7cc33'),
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
  const m = { tailoring: IMG.hero2, food: IMG.hero3, beauty: IMG.beauty, craft: IMG.jewel, embroidery: IMG.hero2, livestock: IMG.dairy, agri: IMG.field, digital: IMG.shg, retail: IMG.market, govt: IMG.kids };
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
    <img class="imgcover ph" loading="lazy" decoding="async" src="${jobImg(j)}" onerror="this.style.display='none'" alt="">
    <div style="margin-top:8px"><b style="font-size:19px">${esc(hi ? j.title_hi : j.title_en)}</b></div>
    <div class="kv"><span>${esc(j.employer)} • ${esc(j.village)}, ${esc(j.district)}${j.distance_km ? ' • ' + j.distance_km + ' km' : ''}</span></div>
    <div>${vBadge(j)}${j.home_based ? `<span class="badge b-blue">🏠 ${hi ? 'घर से' : 'Home'}</span>` : ''}${j.childcare ? `<span class="badge b-green">👶 ${hi ? 'बच्चों के साथ' : 'Childcare'}</span>` : ''}</div>
    <div style="font-size:21px;font-weight:900;color:var(--green)">${esc(j.pay_hi)}</div>
    <div class="kv"><span>⏰ ${esc(j.hours)}${j.part_time ? (hi ? ' • पार्ट-टाइम' : ' • Part-time') : ''}</span></div>
    <div class="btnrow">
      <a class="btn" href="/jobs/${j.id}" data-link>${t('view')} ➜</a>
      <button class="btn sec" onclick="window._saveJob('${j.id}')">♡ ${S.lang === 'en' ? 'Save' : 'सहेजें'}</button>
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
  const imgs = slides.map((s, k) => `<img class="ph" src="${s.img}" ${k === 0 ? 'fetchpriority="high"' : 'loading="lazy" decoding="async"'} onerror="this.style.display='none'" alt="">`).join('');
  const cap = slides[0];
  setTimeout(() => {
    const el = document.getElementById(id); if (!el) return;
    const box = el.querySelector('.slides'), d = el.querySelectorAll('.ss-dots i');
    const capT = el.querySelector('.ss-cap h1'), capP = el.querySelector('.ss-cap p');
    let i = 0;
    const timer = setInterval(() => {
      if (!document.getElementById(id)) { clearInterval(timer); return; }
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

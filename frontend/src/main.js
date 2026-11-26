import { LANGS, t, getLang, setLang } from './i18n.js';
import './styles.css';
import { S, saveProfile, toast, esc, api, track, speak, listenInto, IMG, jobImg, vBadge, jobCard, hunarCard, slideshow, wireGlobal, setNav } from './ui.js';
import { registerPages } from './pages2.js';

const Pages = {};
window.listenInto = listenInto; window.speak = speak;

/* ---------- shell: drawer, bottomnav, strip ---------- */
function shell() {
  const hi = S.lang !== 'en';
  document.getElementById('tagline').textContent = t('tagline');
  document.getElementById('strip').innerHTML =
    `🛡️ ${t('strip')} • हेल्पलाइन <b>181</b> • साइबर <b>1930</b> • <a href="/safety" data-link>${t('safety')} केंद्र</a>`;
  const L = (p, ic, k) => `<a href="${p}" data-link>${ic} <span>${t(k)}</span></a>`;
  document.getElementById('side').innerHTML = `
    ${L('/', '🏠', 'home')}${L('/jobs', '🔍', 'jobs')}${L('/hunar', '🌟', 'hunar')}
    ${L('/companies', '🏢', 'companies')}${L('/home-work', '🏠', 'home_work')}${L('/skills', '📚', 'learn')}${L('/anganwadi', '👶', 'child')}
    ${L('/shg', '🧵', 'shg')}${L('/business', '🚀', 'biz')}${L('/marketplace', '🛍️', 'market')}
    ${L('/voice', '🎤', 'ask_voice')}${L('/help', '🤖', 'help')}${L('/safety', '🛡️', 'safety')}
    <hr><div class="menu-ctl"><label>🌐 Language / भाषा / बोली</label>
      <select id="langSel" aria-label="Language">${LANGS.map(l => `<option value="${l.v}" ${l.v === getLang() ? 'selected' : ''}>${l.n}</option>`).join('')}</select>
      <div class="small" style="margin-top:4px">बोली: ऑडियो-सहायता सहित (पूर्ण STT परीक्षण बाद)</div>
      <div class="menu-btns">
        <button id="micTop">🎤 <small>${hi ? 'बोलें' : 'Speak'}</small></button>
        <button id="speakTop">🔊 <small>${hi ? 'सुनें' : 'Listen'}</small></button>
        <button id="fontBtn">अ+ <small>${hi ? 'बड़ा' : 'Big'}</small></button>
        <button id="imgBtn">🖼️ <small>${hi ? 'फोटो बंद' : 'No pics'}</small></button>
      </div></div><hr>
    ${L('/employer', '🏢', 'employer')}${L('/profile', '👩', 'signup')}${L('/admin', '🔐', 'admin')}
    ${L('/analytics', '📊', 'analytics')}${L('/pitch', '📑', 'pitch')}${L('/about', 'ℹ️', 'about')}
    <div class="demo-note">🌸 SHAKTI • Rajasthan Innovation Challenge • Anganwadi = demo data</div>`;
  document.getElementById('bottomnav').innerHTML = `
    <a href="/" data-link data-r="">🏠<small>${t('home')}</small></a>
    <a href="/jobs" data-link data-r="jobs">🔍<small>${t('jobs')}</small></a>
    <a href="/hunar" data-link data-r="hunar">🌟<small>${t('hunar')}</small></a>
    <a href="/skills" data-link data-r="skills">📚<small>${t('learn')}</small></a>
    <a href="/help" data-link data-r="help">🤖<small>${t('help')}</small></a>`;
  document.getElementById('menuBtn').onclick = () => { document.getElementById('side').classList.add('open'); document.getElementById('scrim').classList.add('on'); };
  document.getElementById('scrim').onclick = closeMenu;
  document.getElementById('langSel').onchange = e => { setLang(e.target.value); shell(); render(); };
  document.getElementById('micTop').onclick = () => { closeMenu(); nav('/voice'); };
  document.getElementById('speakTop').onclick = () => speak(document.getElementById('app').innerText.slice(0, 300));
  const lt = document.getElementById('langTop');
  if (lt && !lt.options.length) lt.innerHTML = LANGS.map(l => `<option value="${l.v}">${l.n}</option>`).join('');
  if (lt) { lt.value = getLang(); lt.onchange = e => { setLang(e.target.value); shell(); render(); }; }
  const tb = (id, fn) => { const b = document.getElementById(id); if (b) b.onclick = fn; };
  tb('tMic', () => nav('/voice'));
  tb('tSpeak', () => speak(document.getElementById('app').innerText.slice(0, 300)));
  tb('tFont', () => document.body.classList.toggle('big'));
  tb('tImg', () => document.body.classList.toggle('noimg'));
  document.getElementById('speakTop').onclick = () => speak(document.getElementById('app').innerText.slice(0, 300));
  document.getElementById('fontBtn').onclick = () => document.body.classList.toggle('big');
  document.getElementById('imgBtn').onclick = (e) => { document.body.classList.toggle('noimg'); e.target.querySelector('small').textContent = document.body.classList.contains('noimg') ? (hi ? 'फोटो चालू' : 'Pics on') : (hi ? 'फोटो बंद' : 'No pics'); };
}
function closeMenu() { document.getElementById('side').classList.remove('open'); document.getElementById('scrim').classList.remove('on'); }

/* ---------- router (history mode, like FARM.RAJ) ---------- */
function nav(p) { history.pushState({}, '', p); render(); window.scrollTo(0, 0); }
setNav(nav);
window.addEventListener('popstate', () => render());

/* ---------- HOME ---------- */
Pages.home = async () => {
  track('home', '/');
  const hi = S.lang !== 'en';
  const slides = [
    { img: IMG.hero2, t: hi ? 'सिलाई जानती हैं? हुनर को काम बनाएं' : 'Know stitching? Turn skill into work', s: hi ? 'SHG • बुटिक • घर से काम' : 'SHG • boutique • home-based' },
    { img: IMG.hero3, t: hi ? 'अचार-पापड़ बनाती हैं? समूह से जुड़ें' : 'Make pickles? Join a group', s: hi ? 'मसाला • पैकेजिंग • बाज़ार' : 'Spices • packing • market' },
    { img: IMG.hero1, t: hi ? 'पढ़ना कठिन? सुनकर सीखें — सब मुफ्त' : 'Reading hard? Learn by listening — all free', s: hi ? '12 कोर्स • ऑडियो • प्रमाणपत्र' : '12 courses • audio • certificate' },
    { img: IMG.hero4, t: hi ? 'राजस्थान की बेटियां, राजस्थान का गौरव' : 'Daughters of Rajasthan, its pride', s: hi ? 'सुरक्षित काम • सम्मान • स्वतंत्रता' : 'Safe work • dignity • independence' },
  ];
  const jobs = await api('/api/jobs?verifiedOnly=true&maxDistance=10');
  const near = (jobs.jobs || []).slice(0, 4);
  let hunar = [];
  try { hunar = (await api('/api/hunar')).profiles || []; } catch { }
  let employers = [];
  try { employers = (await api('/api/employers')).employers || []; } catch { }
  const stat = `<div class="statgrid">
    <div class="stat"><b>${jobs.count ?? '—'}</b><small>${hi ? 'सत्यापित काम' : 'Verified jobs'}</small></div>
    <div class="stat"><b>12</b><small>${hi ? 'मुफ्त कोर्स' : 'Free courses'}</small></div>
    <div class="stat"><b>${hunar.length}</b><small>${hi ? 'हुनर प्रोफाइल' : 'Skill profiles'}</small></div>
    <div class="stat"><b>181</b><small>${hi ? 'महिला हेल्पलाइन' : 'Women helpline'}</small></div></div>`;
  return `
  ${slideshow([
    { img: IMG.woman, t: hi ? 'नमस्ते बहन 🙏' : 'Hello sister 🙏', s: hi ? 'आज क्या करेंगी? पास का सत्यापित काम' : 'What shall we do today? Verified nearby work' },
    { img: IMG.hero2, t: hi ? 'सिलाई-कढ़ाई जानती हैं?' : 'Know stitching & embroidery?', s: hi ? 'हुनर दिखाएं — प्रतिष्ठित कंपनियां खोज रही हैं' : 'Showcase skill — reputed companies are hiring' },
    { img: IMG.jewel, t: hi ? 'ज्वेलरी • पॉटरी • हस्तशिल्प' : 'Jewellery • pottery • handicraft', s: hi ? 'ब्रांड सीधे कारीगरों से जुड़ें' : 'Brands connect directly with artisans' },
    { img: IMG.field, t: hi ? 'राजस्थान की धरती' : 'Land of Rajasthan', s: hi ? 'मौसमी काम • समूह परिवहन • दैनिक भुगतान' : 'Seasonal work • group transport • daily pay' },
    { img: IMG.hero3, t: hi ? 'अचार-मसाले-पापड़' : 'Pickles, spices & papad', s: hi ? 'SHG समूह से जुड़ें, बाज़ार पाएं' : 'Join SHG groups, reach markets' },
    { img: IMG.hero4, t: hi ? 'राजस्थान की बेटियां' : 'Daughters of Rajasthan', s: hi ? 'सुरक्षित काम • सम्मान • स्वतंत्रता' : 'Safe work • dignity • independence' },
  ])}
  <div class="searchwrap"><div class="searchbar"><input id="hq" placeholder="${t('search_ph')}"><button onclick="window._goSearch()">🔍</button>
    <button onclick="listenInto(document.getElementById('hq'))" title="voice">🎤</button></div></div>
  <div class="ticker">🌸 ${hi ? '75% से अधिक ग्रामीण महिलाएं असंगठित श्रम में — SHAKTI उन्हें सुरक्षित, सत्यापित, घर-पास के काम से जोड़ता है • कभी फीस/OTP न दें' : '75%+ rural women in informal labour — SHAKTI connects them to safe, verified, nearby work • never pay fees/OTP'}</div>
  <div class="grid6">
    <a class="svc" href="/jobs" data-link><span>🔍</span>${t('find_work')}<small>${hi ? 'पास का काम' : 'Nearby jobs'}</small></a>
    <a class="svc" href="/hunar" data-link><span>🌟</span>${t('show_hunar')}<small>${hi ? 'कंपनियां देखें' : 'Seen by companies'}</small></a>
    <a class="svc" href="/home-work" data-link><span>🏠</span>${t('home_work')}<small>${hi ? 'घर बैठे' : 'From home'}</small></a>
    <a class="svc" href="/skills" data-link><span>📚</span>${t('learn_free')}<small>12 ${hi ? 'मुफ्त' : 'free'}</small></a>
    <a class="svc" href="/voice" data-link><span>🎤</span>${t('ask_voice')}<small>${hi ? 'बिना लिखे' : 'No typing'}</small></a>
    <a class="svc" href="/anganwadi" data-link><span>👶</span>${t('childcare')}<small>${hi ? 'पास का केंद्र' : 'Nearby centre'}</small></a>
  </div>
  ${stat}
  <div class="card"><h2>✨ ${t('near_you')}</h2>${near.map(jobCard).join('') || `<p>${hi ? 'जल्द आ रहा है' : 'Coming soon'}</p>`}
    <a class="btn sec" href="/jobs" data-link>${t('jobs')} ➜</a></div>
  <div class="card"><h2>🏢 ${hi ? 'प्रतिष्ठित कंपनियां — सीधी भर्ती' : 'Reputed companies hiring directly'}</h2>
    <p>${hi ? 'सत्यापित नियोक्ता। कोई बिचौलिया नहीं, कोई फीस नहीं। अपना हुनर दिखाएं — यही कंपनियां आपको खोजेंगी।' : 'Verified employers. No middlemen, no fees. Showcase your skill — these companies will discover you.'}</p>
    ${employers.slice(0, 5).map(e => `<div class="kv"><span>✅ <b>${esc(e.name)}</b> • ${esc(e.type)} • ${esc(e.district)}</span></div>`).join('') || `<p>${hi ? 'जल्द आ रहा है' : 'Coming soon'}</p>`}
    <div class="btnrow"><a class="btn" href="/companies" data-link>🏢 ${t('companies')} ➜</a><a class="btn sec" href="/hunar/new" data-link>🌟 ${t('show_hunar')}</a></div></div>
  <h2 style="margin:18px 0 4px">🌟 ${t('spotlight')}</h2>
  <div class="photogrid">
    <a class="photocard" href="/hunar" data-link><img class="ph" loading="lazy" src="${IMG.tailoring}" onerror="this.style.display='none'"><span class="lbl">🧵 ${hi ? 'सिलाई-कढ़ाई' : 'Stitching'}<small>${hi ? 'हुनर दिखाएं' : 'Showcase'}</small></span></a>
    <a class="photocard" href="/hunar" data-link><img class="ph" loading="lazy" src="${IMG.food}" onerror="this.style.display='none'"><span class="lbl">🫙 ${hi ? 'अचार-पापड़' : 'Pickles'}<small>${hi ? 'समूह कार्य' : 'Group work'}</small></span></a>
    <a class="photocard" href="/hunar" data-link><img class="ph" loading="lazy" src="${IMG.beauty}" onerror="this.style.display='none'"><span class="lbl">💅 ${hi ? 'ब्यूटी-मेहंदी' : 'Beauty'}<small>${hi ? 'पार्लर कार्य' : 'Parlour work'}</small></span></a>
    <a class="photocard" href="/hunar" data-link><img class="ph" loading="lazy" src="${IMG.pottery}" onerror="this.style.display='none'"><span class="lbl">🏺 ${hi ? 'हस्तशिल्प' : 'Handicraft'}<small>${hi ? 'नीली पॉटरी' : 'Blue pottery'}</small></span></a>
  </div>
  ${(hunar.slice(0, 2).map(hunarCard).join(''))}
  <div class="card"><h2>🧭 ${t('journey')}</h2>
    <div class="step">1️⃣ ${hi ? 'वह SHAKTI खोलती है — कोई रजिस्ट्रेशन नहीं' : 'She opens SHAKTI — no registration'}</div>
    <div class="step">2️⃣ 🔍 ${hi ? 'पास का सत्यापित काम चुनती है' : 'Picks verified nearby work'}</div>
    <div class="step">3️⃣ 🔊 ${hi ? 'सुनकर समझती है, 3 सवाल में आवेदन' : 'Listens, applies in 3 questions'}</div>
    <div class="step">4️⃣ 🌟 ${hi ? 'अपना हुनर दिखाती है — कंपनियां देखती हैं' : 'Showcases skill — companies discover'}</div>
    <div class="step">5️⃣ 📚👶 ${hi ? 'मुफ्त सीखती है, बच्चों की चिंता नहीं' : 'Learns free, childcare covered'}</div>
    <div class="btnrow"><a class="btn" href="/jobs" data-link>${t('find_work')} ➜</a><a class="btn sec" href="/pitch" data-link>📊 Pitch</a></div></div>
  <div class="safebox">🛡️ <b>${t('safety')}</b> — ${hi ? 'कोई फीस नहीं। कोई OTP नहीं। संदिग्ध लगे तो' : 'No fees. No OTP. If suspicious,'} <a href="/report" data-link>${t('report_btn')}</a> • 181 / 1930</div>
  <div class="footer">🌸 SHAKTI • Rajasthan Innovation Challenge • VRAJHNA Technologies, Alwar<br>Anganwadi = demo data • Certificates = learning proof</div>`;
};
window._goSearch = () => { const q = document.getElementById('hq').value; nav('/jobs?q=' + encodeURIComponent(q)); };

/* ---------- JOBS ---------- */
Pages.jobs = async () => {
  const qs = new URLSearchParams(location.search);
  track('job_search', '/jobs');
  const d = await api('/api/jobs?verifiedOnly=true&' + new URLSearchParams({ district: qs.get('d') || '', q: qs.get('q') || '' }).toString());
  S.jobsCache = d.jobs || [];
  const hi = S.lang !== 'en';
  return `<h2>🔍 ${t('find_work')}</h2>
  <div class="card" style="border:2px dashed var(--terra)">
    <div style="display:flex;gap:8px"><input id="fq" value="${esc(qs.get('q') || '')}" placeholder="${t('search_ph')}"><button class="btn yel" style="min-width:60px" onclick="listenInto(document.getElementById('fq'))">🎤</button></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
      <select id="fdist"><option value="">${hi ? 'सब जिले' : 'All districts'}</option>${(d.districts || []).map(x => `<option ${x === qs.get('d') ? 'selected' : ''}>${x}</option>`).join('')}</select>
      <select id="fmax"><option value="0">${hi ? 'कोई भी दूरी' : 'Any distance'}</option><option value="2">2 km</option><option value="5">5 km</option><option value="10">10 km</option><option value="20">20 km</option></select>
    </div>
    <label style="display:flex;gap:10px;align-items:center"><input type="checkbox" id="fhome" style="width:28px;height:28px;min-height:28px"> 🏠 ${t('home_work')}</label>
    <label style="display:flex;gap:10px;align-items:center"><input type="checkbox" id="fchild" style="width:28px;height:28px;min-height:28px"> 👶 ${hi ? 'बच्चों के साथ हो सके' : 'Childcare compatible'}</label>
    <label style="display:flex;gap:10px;align-items:center"><input type="checkbox" id="fdis" style="width:28px;height:28px;min-height:28px"> ♿ ${hi ? 'दिव्यांग-सुलभ' : 'Disability friendly'}</label>
    <button class="btn" style="width:100%" onclick="window._doFilter()">🔍 ${t('search')}</button>
  </div>
  <div id="jobsList">${S.jobsCache.map(jobCard).join('') || `<p>${hi ? 'कोई काम नहीं' : 'No jobs'}</p>`}</div>`;
};
window._doFilter = async () => {
  const d = await api('/api/jobs?verifiedOnly=true&' + new URLSearchParams({
    q: document.getElementById('fq').value, district: document.getElementById('fdist').value,
    maxDistance: document.getElementById('fmax').value, home: document.getElementById('fhome').checked,
    childcare: document.getElementById('fchild').checked, disability: document.getElementById('fdis').checked,
  }).toString());
  S.jobsCache = d.jobs || [];
  document.getElementById('jobsList').innerHTML = S.jobsCache.map(jobCard).join('');
  track('job_filter', '/jobs');
};
Pages.jobDetail = async (id) => {
  const d = await api('/api/jobs/' + id);
  if (!d.job) return '<p>Not found</p>';
  const j = d.job, hi = S.lang !== 'en';
  return `<a href="/jobs" data-link>← ${t('back')}</a><div class="card">
  <img class="imgcover ph" src="${jobImg(j)}" onerror="this.style.display='none'">
  <h2>${esc(hi ? j.title_hi : j.title_en)}</h2>
  <div class="kv"><span>${esc(j.employer)} • ${esc(j.village)}, ${esc(j.district)}${j.distance_km ? ' • ' + j.distance_km + ' km' : ''}</span></div>
  <div>${vBadge(j)}</div>
  <div style="font-size:22px;font-weight:900;color:var(--green)">${esc(j.pay_hi)}</div>
  <div class="kv"><span>⏰ ${hi ? 'समय' : 'Hours'}</span><b>${esc(j.hours)}</b></div>
  <div class="kv"><span>🏠</span><b>${j.home_based ? (hi ? 'हां' : 'Yes') : (hi ? 'नहीं' : 'No')}</b></div>
  <div class="kv"><span>👶</span><b>${j.childcare ? (hi ? 'हां' : 'Yes') : (hi ? 'नहीं' : 'No')}</b></div>
  <div class="kv"><span>📞</span><b>${esc(j.phone || '—')}</b></div>
  <p>${esc(hi ? j.desc_hi : j.desc_en)}</p>
  ${!j.verified ? `<div class="warnbox">⚠️ ${hi ? 'सत्यापन लंबित — अग्रिम/किट फीस बिल्कुल न दें। OTP/बैंक डिटेल न बताएं।' : 'Pending verification — NEVER pay advance/kit fee.'}</div>` : ''}
  <div class="btnrow"><button class="btn yel" data-speak="${esc(hi ? j.title_hi + '. ' + j.desc_hi : j.title_en + '. ' + j.desc_en).slice(0, 300)}">🔊 ${t('listen')}</button>
  ${j.phone && !/blocked|pending/i.test(j.phone) ? `<a class="btn warn" href="tel:${esc(j.phone.replace(/X/g, ''))}">📞 ${t('call')}</a>` : ''}</div>
  ${j.status !== 'suspended' ? `<a class="btn" style="width:100%" href="/apply/${j.id}" data-link>📝 ${t('apply')}</a>` : `<p>⛔ ${hi ? 'आवेदन बंद' : 'Closed'}</p>`}
  <div style="margin-top:8px"><a href="/report?job=${j.id}" data-link>🚩 ${hi ? 'यह काम रिपोर्ट करें' : 'Report this job'}</a></div></div>
  <h3>${hi ? 'मिलते-जुलते काम' : 'Similar work'}</h3>${(d.related || []).map(jobCard).join('')}`;
};
Pages.apply = (id) => {
  const j = S.jobsCache.find(x => x.id === id) || { id, title_hi: '', title_en: '' };
  const hi = S.lang !== 'en';
  return `<h2>📝 ${t('apply')} — ${esc(hi ? (j.title_hi || id) : (j.title_en || id))}</h2>
  <div class="safebox">✅ ${hi ? 'बिना रिज्यूमे — सिर्फ 3 सवाल। कोई फीस नहीं।' : 'No resume — just 3 questions. No fees.'}</div>
  <div class="card"><label>${hi ? 'आपका नाम *' : 'Your name *'}</label><input id="aname" value="${esc(S.profile.name)}">
  <label>${hi ? 'मोबाइल *' : 'Mobile *'}</label><input id="aphone" inputmode="numeric" value="${esc(S.profile.phone)}">
  <label>${hi ? 'गांव' : 'Village'}</label><input id="avill" value="${esc(S.profile.village)}">
  <label>${hi ? 'आप क्या जानती हैं?' : 'Your skills?'}</label>
  <div style="display:flex;gap:8px"><input id="aans"><button class="btn yel" style="min-width:60px" onclick="listenInto(document.getElementById('aans'))">🎤</button></div>
  <button class="btn" style="width:100%" onclick="window._doApply('${id}')">✅ ${t('submit')}</button></div>`;
};
window._doApply = async (id) => {
  const name = document.getElementById('aname').value, phone = document.getElementById('aphone').value;
  const village = document.getElementById('avill').value, ans = document.getElementById('aans').value;
  S.profile = { name, phone, village, district: S.profile.district }; saveProfile();
  const r = await api('/api/apply', { method: 'POST', body: JSON.stringify({ jobId: id, name, phone, village, answers: ans }) });
  if (r.ok) { speak(S.lang !== 'en' ? r.message_hi : r.message_en); nav('/applications'); }
  else toast('⚠️ ' + (r.error || 'error'));
};
Pages.applications = async () => {
  const hi = S.lang !== 'en';
  const ph = S.profile.phone || '';
  const d = await api('/api/applications' + (S.token ? '' : '?phone=' + encodeURIComponent(ph)));
  return `<h2>📋 ${hi ? 'मेरे आवेदन' : 'My applications'}</h2>
  ${!S.token ? `<div class="card"><label>${hi ? 'मोबाइल से देखें' : 'View by mobile'}</label><input id="tphone" value="${esc(ph)}"><button class="btn sec" onclick="S.profile.phone=document.getElementById('tphone').value;saveProfile();render()">🔍 ${hi ? 'देखें' : 'View'}</button></div>` : ''}
  ${(d.applications || []).map(a => `<div class="card"><b>${esc(a.jobTitle || a.jobId)}</b> <span class="badge ${a.status === 'withdrawn' ? 'b-red' : 'b-green'}">${esc(a.status)}</span><div class="kv"><span>ID ${esc(a.id)} • ${esc((a.created_at || a.ts || '').slice(0, 10))}</span></div>${a.status !== 'withdrawn' ? `<button class="btn sec" onclick="window._withdraw('${a.id}')">↩ ${hi ? 'वापस लें' : 'Withdraw'}</button>` : ''}</div>`).join('') || `<p>${hi ? 'अभी कोई आवेदन नहीं' : 'No applications yet'}</p>`}`;
};
window._withdraw = async (id) => { await api('/api/applications/' + id + '/withdraw', { method: 'POST' }); render(); };
window._saveJob = async (id) => {
  if (!S.token) { toast(S.lang === 'en' ? 'Login to save jobs' : 'सहेजने हेतु लॉगिन करें'); nav('/login'); return; }
  const r = await api('/api/saved', { method: 'POST', body: JSON.stringify({ jobId: id }) });
  if (r.ok) toast('♡ ' + (S.lang === 'en' ? 'Saved' : 'सहेजा गया'));
};

registerPages(Pages);

/* ---------- render ---------- */
async function render() {
  closeMenu(); shell();
  const app = document.getElementById('app');
  const path = location.pathname, seg = path.split('/').filter(Boolean);
  document.querySelectorAll('#bottomnav a').forEach(a => a.classList.toggle('on', a.dataset.r === (seg[0] || '')));
  try {
    let html = '';
    if (path === '/') html = await Pages.home();
    else if (path === '/jobs') html = await Pages.jobs();
    else if (seg[0] === 'jobs' && seg[1]) html = await Pages.jobDetail(seg[1]);
    else if (seg[0] === 'apply' && seg[1]) html = Pages.apply(seg[1]);
    else if (path === '/applications') html = await Pages.applications();
    else if (Pages['route:' + (seg[0] || '')]) html = await Pages['route:' + seg[0]](seg[1], new URLSearchParams(location.search));
    else html = '<div class="card"><h2>404</h2><a class="btn" href="/" data-link>🏠 Home</a></div>';
    app.innerHTML = html + `<div class="footer">🌸 SHAKTI • ${S.token ? `<a href="/profile" data-link>👩 ${esc(S.profile.name || 'Profile')}</a>` : `<a href="/login" data-link>🔑 ${t('login')}</a> • <a href="/register" data-link>📝 ${t('signup')}</a>`} • <a href="/settings" data-link>⚙️</a> • <a href="/admin" data-link>🔐</a></div>`;
    window.scrollTo(0, 0); track('page_view', path);
    if (path === '/jobs' && !document.getElementById('fq')) { /* filtered render */ }
  } catch (e) {
    app.innerHTML = `<div class="card" style="text-align:center"><div style="font-size:52px">🌸</div>
      <h2>${S.lang === 'en' ? 'Please retry' : 'कृपया दोबारा कोशिश करें'}</h2>
      <p>${esc(e.message || 'Error')}</p>
      <button class="btn" onclick="location.reload()">🔄 ${S.lang === 'en' ? 'Retry' : 'पुनः कोशिश'}</button>
      <div class="btnrow"><a class="btn sec" href="/safety" data-link>🛡️ ${t('safety')}</a><a class="btn sec" href="/help" data-link>🤖 ${t('help')}</a></div></div>`;
    }
}
window.render = render;
wireGlobal();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
render();

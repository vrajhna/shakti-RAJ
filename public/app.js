/* SHAKTI frontend — mobile-first, Hindi-first, voice-first PWA */
const S = {
  lang: localStorage.getItem('shakti_lang') || 'hi',
  profile: JSON.parse(localStorage.getItem('shakti_profile') || '{"name":"","phone":"","village":"","district":"Jaipur"}'),
  adminToken: sessionStorage.getItem('shakti_admin') || '',
  jobsCache: [],
};
const HI = v => (S.lang === 'hi' ? v.hi ?? v.en ?? v : v.en ?? v.hi ?? v);
function saveProfile(){ localStorage.setItem('shakti_profile', JSON.stringify(S.profile)); }
function toast(m){ const t=document.getElementById('toast'); t.textContent=m; t.style.display='block'; setTimeout(()=>t.style.display='none',2600); }
function esc(s){ return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
async function api(p, opt={}){
  const h = {'Content-Type':'application/json'}; if(S.adminToken) h['Authorization']='Bearer '+S.adminToken;
  const r = await fetch(p,{...opt,headers:{...h,...(opt.headers||{})}});
  return r.json();
}
function track(event, page){ fetch('/api/analytics/track',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({event,page:page||location.hash||'/',lang:S.lang})}).catch(()=>{}); }
/* voice */
function speak(text){
  try{
    const u = new SpeechSynthesisUtterance(text); u.lang = S.lang==='hi'?'hi-IN':'en-IN'; u.rate=0.95;
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  }catch(e){ toast('🔇 Audio not supported'); }
}
function listenInto(inputEl, ontext){
  const SR = window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){ toast(S.lang==='hi'?'इस फोन में बोलकर लिखना नहीं है — टाइप करें':'Voice typing not supported — please type'); return; }
  const r = new SR(); r.lang = S.lang==='hi'?'hi-IN':'en-IN'; r.interimResults=false;
  toast('🎤 बोलें... / Speak...');
  r.onresult = e=>{ const t=e.results[0][0].transcript; if(inputEl) inputEl.value=t; if(ontext) ontext(t); };
  r.onerror = ()=>toast('🎤 दोबारा कोशिश करें');
  r.start();
}
const IMG = {
  tailoring:'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&q=60&auto=format&fit=crop',
  food:'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&q=60&auto=format&fit=crop',
  beauty:'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=60&auto=format&fit=crop',
  craft:'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=600&q=60&auto=format&fit=crop',
  dairy:'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=600&q=60&auto=format&fit=crop',
  default:'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&q=60&auto=format&fit=crop',
};
function jobImg(j){
  const m={tailoring:IMG.tailoring,food:IMG.food,beauty:IMG.beauty,craft:IMG.craft,embroidery:IMG.craft,livestock:IMG.dairy,agri:IMG.default,digital:IMG.default,retail:IMG.default,govt:IMG.default};
  return m[j.category]||IMG.default;
}
function vBadge(j){
  if(j.status==='suspended') return '<span class="badge blocked">⛔ '+(S.lang==='hi'?'ब्लॉक — असुरक्षित':'Blocked — unsafe')+'</span>';
  if(j.verified) return '<span class="badge verified">✅ '+(S.lang==='hi'?'सत्यापित':'Verified')+' • '+esc(j.verification||'')+'</span>';
  return '<span class="badge pending">⏳ '+(S.lang==='hi'?'सत्यापन लंबित':'Pending review')+'</span>';
}
function jobCard(j){
  return `<div class="card">
    ${j.status==='suspended'?'<div class="warnbox">⛔ '+(S.lang==='hi'?'यह सूची स्कैम पैटर्न के कारण ब्लॉक है — सीखने हेतु दिख रही है। आवेदन बंद।':'Blocked scam-pattern demo — applications closed.')+'</div>':''}
    <img class="imgcover" loading="lazy" src="${jobImg(j)}" onerror="this.style.display='none'" alt="">
    <div style="margin-top:8px"><b style="font-size:19px">${esc(S.lang==='hi'?j.title_hi:j.title_en)}</b></div>
    <div class="meta">${esc(j.employer)} • ${esc(j.village)}, ${esc(j.district)} ${j.distance_km?'• '+j.distance_km+' km':''}</div>
    <div>${vBadge(j)} ${j.home_based?'<span class="badge govt">🏠 '+(S.lang==='hi'?'घर से':'Home')+'</span>':''} ${j.childcare?'<span class="badge verified">👶 '+(S.lang==='hi'?'बच्चों के साथ':'Childcare')+'</span>':''}</div>
    <div class="pay">${esc(j.pay_hi)}</div>
    <div class="meta">⏰ ${esc(j.hours)} ${j.part_time?'• ⏳ '+(S.lang==='hi'?'पार्ट-टाइम':'Part-time'):''}</div>
    <div class="btn-row">
      <a class="btn btn-primary" href="#/jobs/${j.id}">${S.lang==='hi'?'देखें ➜':'View ➜'}</a>
      <button class="btn btn-yellow" onclick='speak(${JSON.stringify((S.lang==='hi'?j.title_hi+'. '+j.desc_hi:j.title_en+'. '+j.desc_en)).slice(0,2000)})'>🔊 ${S.lang==='hi'?'सुनें':'Listen'}</button>
    </div>
  </div>`;
}

/* ---------- pages ---------- */
async function pgHome(){
  track('home','/');
  return `<div class="hero">
    <div style="font-size:52px">🌸</div>
    <h1>${S.lang==='hi'?'आज आप क्या करना चाहती हैं?':'What would you like to do today?'}</h1>
    <p><b>SHAKTI</b> — ${S.lang==='hi'?'काम, हुनर और सुरक्षित अवसर':'Safe work. Skills. Opportunity'}</p>
    <div class="listen-row">
      <button class="btn btn-yellow" onclick="goVoice()">🎤 ${S.lang==='hi'?'बोलकर पूछें':'Ask by voice'}</button>
      <button class="btn btn-ghost" style="width:auto" onclick="speak(${S.lang==='hi'?"'नमस्ते! मैं शक्ति हूं। काम के लिए ऊपर बटन दबाएं।'":"'Hello! I am SHAKTI. Press a button above.' "})">🔊 ${S.lang==='hi'?'सुनें':'Listen'}</button>
    </div>
  </div>
  <div class="grid2">
    <a class="bigcard" href="#/jobs"><span class="ic">🔍</span><b>${S.lang==='hi'?'काम ढूंढें':'Find work'}</b><span>${S.lang==='hi'?'पास का काम':'Nearby jobs'}</span></a>
    <a class="bigcard" href="#/home-work"><span class="ic">🏠</span><b>${S.lang==='hi'?'घर से काम':'Home work'}</b><span>${S.lang==='hi'?'घर बैठे कमाएं':'Earn from home'}</span></a>
    <a class="bigcard" href="#/skills"><span class="ic">📚</span><b>${S.lang==='hi'?'कुछ सीखें':'Learn free'}</b><span>${S.lang==='hi'?'12 मुफ्त कोर्स':'12 free courses'}</span></a>
    <a class="bigcard" href="#/voice"><span class="ic">🎤</span><b>${S.lang==='hi'?'बोलकर पूछें':'Ask by voice'}</b><span>${S.lang==='hi'?'बिना लिखे':'No typing'}</span></a>
    <a class="bigcard" href="#/anganwadi"><span class="ic">👶</span><b>${S.lang==='hi'?'आंगनवाड़ी खोजें':'Childcare'}</b><span>${S.lang==='hi'?'पास का केंद्र':'Nearby centre'}</span></a>
    <a class="bigcard" href="#/shg"><span class="ic">🧵</span><b>${S.lang==='hi'?'SHG व हुनर':'SHG & skills'}</b><span>${S.lang==='hi'?'समूह से जुड़ें':'Join groups'}</span></a>
  </div>
  <div class="section"><h2>✨ ${S.lang==='hi'?'पास के सत्यापित काम':'Verified work near you'}</h2><div id="nearJobs">…</div></div>
  <div class="safebox">🛡️ <b>${S.lang==='hi'?'सुरक्षा वादा':'Safety promise'}</b><br>${S.lang==='hi'?'कोई फीस नहीं। कोई OTP नहीं। संदिग्ध लगे तो तुरंत ':'No fees. No OTP. If suspicious, '}<a href="#/report">${S.lang==='hi'?'रिपोर्ट करें':'Report'}</a> • 181 / 1930</div>
  <div class="card"><b>🧭 ${S.lang==='hi'?'3 मिनट डेमो पथ':'3-min demo path'}</b><div class="small">${S.lang==='hi'?'काम → घर से काम → सुनें → आवेदन → सीखें → आंगनवाड़ी → एडमिन':'Jobs → Home-work → Listen → Apply → Learn → Anganwadi → Admin'}</div>
  <div class="btn-row"><a class="btn btn-warm" href="#/jobs">${S.lang==='hi'?'शुरू करें ➜':'Start ➜'}</a><a class="btn btn-ghost" href="/pitch.html">📊 Pitch</a></div></div>`;
}
async function pgJobs(q){
  const district=q.get('d')||'';
  const d=await api('/api/jobs?verifiedOnly=true&'+new URLSearchParams({district}).toString());
  S.jobsCache=d.jobs||[];
  const cats=[...new Set(S.jobsCache.map(j=>j.category))];
  return `<h2>🔍 ${S.lang==='hi'?'काम ढूंढें':'Find work'}</h2>
  <div class="filters">
    <label>${S.lang==='hi'?'खोजें (गांव/काम)':'Search (village/work)'}</label>
    <div style="display:flex;gap:8px"><input id="fq" placeholder="${S.lang==='hi'?'जैसे: सिलाई, चोमू':'e.g. stitching, Chomu'}"><button class="btn btn-yellow" style="width:64px" onclick="listenInto(document.getElementById('fq'))">🎤</button></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
      <select id="fdist"><option value="">${S.lang==='hi'?'सब जिले':'All districts'}</option>${(d.districts||[]).map(x=>`<option ${x===district?'selected':''}>${x}</option>`).join('')}</select>
      <select id="fmax"><option value="0">${S.lang==='hi'?'कोई भी दूरी':'Any distance'}</option><option value="2">2 km</option><option value="5">5 km</option><option value="10">10 km</option><option value="20">20 km</option></select>
    </div>
    <label style="display:flex;gap:10px;align-items:center;margin-top:8px;font-size:17px"><input type="checkbox" id="fhome" style="width:28px;height:28px"> 🏠 ${S.lang==='hi'?'घर से काम':'Home-based'}</label>
    <label style="display:flex;gap:10px;align-items:center;font-size:17px"><input type="checkbox" id="fchild" style="width:28px;height:28px"> 👶 ${S.lang==='hi'?'बच्चों के साथ हो सके':'Childcare available'}</label>
    <label style="display:flex;gap:10px;align-items:center;font-size:17px"><input type="checkbox" id="fdis" style="width:28px;height:28px"> ♿ ${S.lang==='hi'?'दिव्यांग-सुलभ':'Disability friendly'}</label>
    <button class="btn btn-primary" onclick="doFilter()">🔍 ${S.lang==='hi'?'खोजें':'Search'}</button>
  </div>
  <div id="jobsList">${(S.jobsCache.map(jobCard).join('')||'<p>कोई काम नहीं मिला</p>')}</div>`;
}
async function pgJobDetail(id){
  const d=await api('/api/jobs/'+id); if(!d.job) return '<p>Not found</p><a href="#/jobs">← back</a>';
  const j=d.job;
  return `<a href="#/jobs">← ${S.lang==='hi'?'वापस':'Back'}</a>
  <div class="card"><img class="imgcover" src="${jobImg(j)}" onerror="this.style.display='none'">
  <h2>${esc(S.lang==='hi'?j.title_hi:j.title_en)}</h2>
  <div class="meta">${esc(j.employer)} • ${esc(j.village)}, ${esc(j.district)} ${j.distance_km?'• '+j.distance_km+' km':''}</div>
  <div>${vBadge(j)}</div><div class="pay">${esc(j.pay_hi)}</div>
  <div class="kv"><span>⏰ ${S.lang==='hi'?'समय':'Hours'}</span><b>${esc(j.hours)}</b></div>
  <div class="kv"><span>🏠 ${S.lang==='hi'?'घर से':'Home-based'}</span><b>${j.home_based?(S.lang==='hi'?'हां':'Yes'):(S.lang==='hi'?'नहीं':'No')}</b></div>
  <div class="kv"><span>👶 ${S.lang==='hi'?'बच्चों की सुविधा':'Childcare'}</span><b>${j.childcare?(S.lang==='hi'?'हां':'Yes'):(S.lang==='hi'?'नहीं':'No')}</b></div>
  <div class="kv"><span>📞 ${S.lang==='hi'?'संपर्क':'Contact'}</span><b>${esc(j.phone||'—')}</b></div>
  <p>${esc(S.lang==='hi'?j.desc_hi:j.desc_en)}</p>
  ${!j.verified?'<div class="warnbox">⚠️ '+(S.lang==='hi'?'सत्यापन लंबित — अग्रिम/किट फीस बिल्कुल न दें। OTP/बैंक डिटेल न बताएं।':'Pending verification — NEVER pay advance/kit fee. Never share OTP/bank.')+'</div>':''}
  <div class="btn-row"><button class="btn btn-yellow" onclick='speak(${JSON.stringify((S.lang==='hi'?j.title_hi+'. '+j.desc_hi:j.title_en+'. '+j.desc_en)).slice(0,2000)})'>🔊 ${S.lang==='hi'?'सुनें':'Listen'}</button>
  ${j.phone&&!j.phone.includes('blocked')&&!j.phone.includes('pending')?`<a class="btn btn-warm" href="tel:${esc(j.phone.replace(/X/g,''))}">📞 ${S.lang==='hi'?'कॉल':'Call'}</a>`:''}</div>
  ${j.status!=='suspended'?`<a class="btn btn-primary" style="margin-top:10px" href="#/apply/${j.id}">📝 ${S.lang==='hi'?'आवेदन करें':'Apply'}</a>`:'<p>⛔ आवेदन बंद (ब्लॉक सूची)</p>'}
  <div style="margin-top:10px"><a href="#/report?job=${j.id}">🚩 ${S.lang==='hi'?'यह काम रिपोर्ट करें':'Report this job'}</a></div></div>
  <h3>${S.lang==='hi'?'मिलते-जुलते काम':'Similar work'}</h3>${(d.related||[]).map(jobCard).join('')}`;
}
function pgApply(id){
  const j=S.jobsCache.find(x=>x.id===id)||{id,title_hi:'',title_en:''};
  return `<h2>📝 ${S.lang==='hi'?'आवेदन':'Apply'} — ${esc(S.lang==='hi'?(j.title_hi||id):(j.title_en||id))}</h2>
  <div class="safebox">✅ ${S.lang==='hi'?'बिना रिज्यूमे — सिर्फ 3 सवाल। कोई फीस नहीं।':'No resume — just 3 questions. No fees.'}</div>
  <div class="card"><label>${S.lang==='hi'?'आपका नाम *':'Your name *'}</label><input id="aname" value="${esc(S.profile.name)}" placeholder="${S.lang==='hi'?'जैसे: मीना देवी':'e.g. Meena Devi'}">
  <label>${S.lang==='hi'?'मोबाइल नंबर *':'Mobile *'}</label><input id="aphone" inputmode="numeric" value="${esc(S.profile.phone)}" placeholder="98XXXXXXXX">
  <label>${S.lang==='hi'?'गांव':'Village'}</label><input id="avill" value="${esc(S.profile.village)}">
  <label>${S.lang==='hi'?'आप क्या जानती हैं? (बोलकर भी)':'What can you do?'}</label>
  <div style="display:flex;gap:8px"><input id="aans" placeholder="${S.lang==='hi'?'जैसे: सिलाई आती है':'e.g. I can stitch'}"><button class="btn btn-yellow" style="width:64px" onclick="listenInto(document.getElementById('aans'))">🎤</button></div>
  <button class="btn btn-primary" onclick="doApply('${id}')">✅ ${S.lang==='hi'?'आवेदन भेजें':'Submit application'}</button></div>`;
}
async function pgApplications(){
  const ph=S.profile.phone||'';
  const d=await api('/api/applications?phone='+encodeURIComponent(ph));
  return `<h2>📋 ${S.lang==='hi'?'मेरे आवेदन':'My applications'}</h2>
  <div class="card"><label>${S.lang==='hi'?'मोबाइल से देखें':'View by mobile'}</label><input id="tphone" value="${esc(ph)}" placeholder="98XXXXXXXX"><button class="btn btn-ghost" onclick="S.profile.phone=document.getElementById('tphone').value;saveProfile();location.reload()">🔍 ${S.lang==='hi'?'देखें':'View'}</button></div>
  ${(d.applications||[]).map(a=>`<div class="card"><b>${esc(a.jobTitle)}</b> <span class="badge ${a.status==='withdrawn'?'blocked':'verified'}">${esc(a.status)}</span><div class="meta">ID ${esc(a.id)} • ${esc(a.ts.slice(0,10))}</div><button class="btn btn-ghost" onclick="withdrawApp('${a.id}')">↩ ${S.lang==='hi'?'वापस लें':'Withdraw'}</button></div>`).join('')||'<p>'+(S.lang==='hi'?'अभी कोई आवेदन नहीं':'No applications yet')+'</p>'}`;
}
async function pgHomeWork(){
  const d=await api('/api/jobs?home=true&verifiedOnly=false');
  const list=(d.jobs||[]).filter(j=>j.home_based&&j.status==='published');
  return `<h2>🏠 ${S.lang==='hi'?'घर से काम':'Home-based work'}</h2>
  <div class="warnbox">⚠️ ${S.lang==='hi'?'घर-बैठे काम में धोखा ज्यादा होता है। SHAKTI कभी अग्रिम/किट फीस वाली सूची प्रकाशित नहीं करता। मांगे तो रिपोर्ट करें।':'Home-work scams are common. SHAKTI never publishes advance/kit-fee listings. Report if asked.'}</div>
  ${list.map(jobCard).join('')}`;
}
async function pgSkills(){
  const d=await api('/api/courses');
  return `<h2>📚 ${S.lang==='hi'?'मुफ्त सीखें':'Learn free'}</h2><p class="small">${S.lang==='hi'?'सभी कोर्स मुफ्त • कोई प्रीमियम नहीं • सर्टिफिकेट मुफ्त':'All free • No premium • Free certificate'}</p>
  ${(d.courses||[]).map(c=>`<a class="card" style="display:block;text-decoration:none;color:inherit" href="#/skills/${c.id}"><div style="font-size:40px">${c.img}</div><b>${esc(S.lang==='hi'?c.title_hi:c.title_en)}</b><div class="meta">${esc(S.lang==='hi'?c.desc_hi:c.desc_en)} • ${esc(c.dur)} • ${c.lessons} पाठ</div><span class="badge verified">FREE • ${S.lang==='hi'?'मुफ्त':'Free'}</span></a>`).join('')}`;
}
async function pgSkillDetail(id){
  const d=await api('/api/courses/'+id); if(!d.course) return 'Not found';
  const c=d.course;
  return `<a href="#/skills">← ${S.lang==='hi'?'वापस':'Back'}</a><div class="card"><div style="font-size:56px;text-align:center">${c.img}</div>
  <h2>${esc(S.lang==='hi'?c.title_hi:c.title_en)}</h2><div class="meta">${esc(c.dur)} • ${esc(c.level)} • ${c.lessons} पाठ • <span class="badge verified">FREE</span></div>
  <p>${esc(S.lang==='hi'?c.body_hi:c.body_en)}</p>
  <div class="btn-row"><button class="btn btn-yellow" onclick='speak(${JSON.stringify((S.lang==='hi'?c.title_hi+'. '+c.body_hi:c.title_en+'. '+c.body_en)).slice(0,2000)})'>🔊 ${S.lang==='hi'?'पाठ सुनें':'Listen lesson'}</button></div>
  <h3>❓ ${S.lang==='hi'?'छोटा सवाल':'Quick quiz'}</h3>${(c.quiz||[]).map(q=>`<p>• ${esc(q)}</p>`).join('')}
  <div class="card"><label>${S.lang==='hi'?'नाम (प्रमाणपत्र हेतु)':'Name (for certificate)'}</label><input id="cname" value="${esc(S.profile.name)}"><button class="btn btn-primary" onclick="doCert('${c.id}')">🎓 ${S.lang==='hi'?'प्रमाणपत्र पाएं (मुफ्त)':'Get certificate (free)'}</button><div class="small">${S.lang==='hi'?'यह सीखने का प्रमाण है, सरकारी मान्यता का दावा नहीं।':'Learning proof only, not govt-recognised.'}</div></div></div>`;
}
async function pgCerts(){
  const d=await api('/api/certificates?phone='+encodeURIComponent(S.profile.phone||''));
  return `<h2>🎓 ${S.lang==='hi'?'मेरे प्रमाणपत्र':'My certificates'}</h2>${(d.certificates||[]).map(c=>`<div class="card">🌸 <b>SHAKTI</b> — ${esc(c.courseTitle)}<br>👩 ${esc(c.name)} • ${esc(c.ts.slice(0,10))}<br><span class="demoTag">learning proof • not govt-recognised</span></div>`).join('')||'<p>'+(S.lang==='hi'?'अभी कोई प्रमाणपत्र नहीं — कोई कोर्स पूरा करें':'No certificates — complete a course')+'</p>'}`;
}
async function pgAnganwadi(q){
  const d=await api('/api/anganwadi?'+new URLSearchParams({village:q.get('v')||'',district:q.get('d')||''}).toString());
  return `<h2>👶 ${S.lang==='hi'?'आंगनवाड़ी खोजें':'Find childcare'}</h2>
  <div class="warnbox">📢 <span class="demoTag">DEMO</span> ${S.lang==='hi'?'यह सूची डेमो है — आधिकारिक WCD डेटा नहीं। उत्पादन में सरकारी डेटासेट जुड़ेगा।':'Demo list — not official WCD data. Govt dataset in production.'}</div>
  <div class="filters"><input id="awv" placeholder="${S.lang==='hi'?'गांव लिखें':'Enter village'}"><button class="btn btn-primary" onclick="location.hash='#/anganwadi?v='+encodeURIComponent(document.getElementById('awv').value)">🔍 ${S.lang==='hi'?'खोजें':'Search'}</button></div>
  ${(d.centres||[]).map(a=>`<div class="card"><b>${esc(a.name)}</b> <span class="demoTag">DEMO</span><div class="meta">${esc(a.village)}, ${esc(a.district)} ${a.pincode} • ${a.distance_km} km • ⏰ ${esc(a.hours)}</div><div class="meta">📞 ${esc(a.contact)} • ${(a.facilities||[]).join(' • ')}</div><button class="btn btn-ghost" onclick="reportAW('${a.id}')">📝 ${S.lang==='hi'?'गलत जानकारी बताएं':'Report wrong info'}</button></div>`).join('')}`;
}
async function pgSHG(){
  const d=await api('/api/shg');
  return `<h2>🧵 ${S.lang==='hi'?'SHG व समुदाय':'SHG & community'}</h2>${(d.groups||[]).map(g=>`<div class="card"><b>👭 ${esc(g.name)}</b><div class="meta">${esc(g.village)}, ${esc(g.district)} • ${g.members} सदस्य • ${esc(g.work)}</div><div class="meta">📞 ${esc(g.contact)}</div><span class="demoTag">DEMO profile</span></div>`).join('')}<div class="card"><b>➕ ${S.lang==='hi'?'SHG से जुड़ना है?':'Want to join?'}</b><p class="small">${S.lang==='hi'?'नजदीकी CSC/ब्लॉक कार्यालय में SHG रजिस्टर देखें या आशा दीदी से पूछें। SHAKTI पर समूह प्रोफाइल सत्यापन के बाद ही दिखता है।':'Visit CSC/block office or ask ASHA. Group profiles appear only after verification.'}</p></div>`;
}
async function pgBusiness(){
  const [g,m]=await Promise.all([api('/api/business/guides'),api('/api/marketplace')]);
  return `<h2>🚀 ${S.lang==='hi'?'अपना व्यवसाय':'My business'}</h2>
  <div class="card"><h3>🧮 ${S.lang==='hi'?'लाभ कैलकुलेटर':'Profit calculator'}</h3>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><input id="bmat" type="number" placeholder="${S.lang==='hi'?'सामग्री ₹':'Material ₹'}"><input id="bpack" type="number" placeholder="${S.lang==='hi'?'पैकिंग ₹':'Packing ₹'}"><input id="btrans" type="number" placeholder="${S.lang==='hi'?'किराया ₹':'Transport ₹'}"><input id="bhrs" type="number" placeholder="${S.lang==='hi'?'घंटे':'Hours'}"></div>
  <button class="btn btn-primary" onclick="doCalc()">🧮 ${S.lang==='hi'?'दाम निकालें':'Calculate price'}</button><div id="calcOut"></div></div>
  ${(g.guides||[]).map(x=>`<div class="card"><b>📘 ${esc(S.lang==='hi'?x.title_hi:x.title_en)}</b><p>${esc(S.lang==='hi'?x.body_hi:x.body_en)}</p></div>`).join('')}
  <h3>🛍 ${S.lang==='hi'?'SHG बाज़ार (डेमो)':'SHG market (demo)'}</h3>${(m.items||[]).map(i=>`<div class="card"><b>${esc(S.lang==='hi'?i.item_hi:i.item_en)}</b><div class="meta">${esc(i.seller)} • ${esc(i.district)}</div><div class="pay">₹${i.price}/${esc(i.unit)}</div></div>`).join('')}`;
}
function pgVoice(){
  return `<h2>🎤 ${S.lang==='hi'?'बोलकर पूछें':'Ask by voice'}</h2>
  <div class="card" style="text-align:center"><div style="font-size:64px">🎤</div>
  <p>${S.lang==='hi'?'बोलें — जैसे: “मुझे घर बैठे काम चाहिए”':'Say — e.g. “I want home-based work”'}</p>
  <input id="vq" placeholder="${S.lang==='hi'?'या यहां लिखें...':'or type here...'}">
  <div class="btn-row"><button class="btn btn-yellow" onclick="listenInto(document.getElementById('vq'))">🎤 ${S.lang==='hi'?'बोलें':'Speak'}</button><button class="btn btn-primary" onclick="doVoice()">🔍 ${S.lang==='hi'?'पूछें':'Ask'}</button></div>
  <div id="voiceOut"></div></div>
  <div class="small">${S.lang==='hi'?'नोट: ब्राउज़र वाली आवाज़ पहचान सीमित हो सकती है — टाइप विकल्प हमेशा उपलब्ध। Rajasthani बोलियां ऑडियो-सहायता से क्रमशः जुड़ेंगी।':'Note: browser speech may be limited — typing always works. Dialects via assisted audio progressively.'}</div>`;
}
function pgHelp(){
  return `<h2>❓ ${S.lang==='hi'?'मदद व सहायक':'Help & assistant'}</h2>
  <div class="card"><input id="hq" placeholder="${S.lang==='hi'?'पूछें: काम, सीखना, सुरक्षा...':'Ask: jobs, learning, safety...'}">
  <div class="btn-row"><button class="btn btn-yellow" onclick="listenInto(document.getElementById('hq'))">🎤</button><button class="btn btn-primary" onclick="doHelp()">💬 ${S.lang==='hi'?'पूछें':'Ask'}</button></div><div id="helpOut"></div></div>
  <div class="card"><b>📞 ${S.lang==='hi'?'हेल्पलाइन':'Helplines'}</b><div class="meta">👩 181 (${S.lang==='hi'?'महिला':'women'}) • 🆘 1090 • 💻 1930 (${S.lang==='hi'?'साइबर':'cyber'}) • 🚨 112</div>
  <div class="btn-row"><a class="btn btn-warm" href="tel:181">📞 181</a><a class="btn btn-warm" href="tel:1930">📞 1930</a></div></div>
  <div class="card"><b>💡 ${S.lang==='hi'?'प्रतिक्रिया':'Feedback'}</b><input id="fb" placeholder="${S.lang==='hi'?'सुझाव लिखें...':'Write suggestion...'}"><button class="btn btn-ghost" onclick="doFeedback()">📩 ${S.lang==='hi'?'भेजें':'Send'}</button></div>`;
}
async function pgSafety(){
  const d=await api('/api/safety/info');
  return `<h2>🛡️ ${S.lang==='hi'?'सुरक्षा केंद्र':'Safety centre'}</h2>
  <div class="warnbox">⛔ <b>${S.lang==='hi'?'कभी न करें':'Never do'}</b><ul>${(S.lang==='hi'?d.rules_hi:d.rules_en).map(r=>`<li>${esc(r)}</li>`).join('')}</ul></div>
  <div class="safebox">✅ ${esc(S.lang==='hi'?d.verify_note:d.verify_note)}</div>
  <div class="card"><b>📞 ${S.lang==='hi'?'आपातकालीन':'Emergency'}</b><div class="btn-row"><a class="btn btn-warm" href="tel:181">👩 181</a><a class="btn btn-warm" href="tel:1930">💻 1930</a><a class="btn btn-warm" href="tel:112">🚨 112</a></div></div>
  <div class="card"><b>🚩 ${S.lang==='hi'?'शिकायत':'Complaint'}</b><p class="small">${S.lang==='hi'?'फर्जी फीस, OTP मांग, गलत वेतन, असुरक्षित जगह — तुरंत रिपोर्ट करें।':'Fake fees, OTP ask, wrong pay, unsafe place — report now.'}</p><a class="btn btn-primary" href="#/report">🚩 ${S.lang==='hi'?'रिपोर्ट करें':'Report'}</a></div>
  <div class="card"><b>📜 ${S.lang==='hi'?'स्कैम उदाहरण (सीखने हेतु)':'Scam example (for learning)'}</b><p class="small">${S.lang==='hi'?'“₹50,000 घर बैठे + ₹500 फीस + OTP” — यह 100% धोखा पैटर्न है। SHAKTI ऐसी सूची ब्लॉक करता है।':'“₹50,000 from home + ₹500 fee + OTP” — 100% fraud pattern. SHAKTI blocks it.'}</p><a href="#/jobs/j16">${S.lang==='hi'?'ब्लॉक सूची देखें':'See blocked listing'}</a></div>`;
}
function pgReport(q){
  const job=q.get('job')||'';
  return `<h2>🚩 ${S.lang==='hi'?'असुरक्षित काम रिपोर्ट करें':'Report unsafe job'}</h2>
  <div class="card"><label>${S.lang==='hi'?'काम की ID (यदि पता हो)':'Job ID (if known)'}</label><input id="rjob" value="${esc(job)}" placeholder="j1">
  <label>${S.lang==='hi'?'कारण':'Reason'}</label><select id="rreason"><option value="advance-fee">${S.lang==='hi'?'अग्रिम फीस मांगी':'Asked advance fee'}</option><option value="otp">OTP / ${S.lang==='hi'?'बैंक डिटेल मांगी':'bank asked'}</option><option value="fake-job">${S.lang==='hi'?'नकली काम':'Fake job'}</option><option value="harassment">${S.lang==='hi'?'परेशान किया':'Harassment'}</option><option value="unsafe-place">${S.lang==='hi'?'असुरक्षित जगह':'Unsafe place'}</option><option value="wrong-pay">${S.lang==='hi'?'गलत वेतन':'Wrong pay'}</option><option value="other">${S.lang==='hi'?'अन्य':'Other'}</option></select>
  <label>${S.lang==='hi'?'विवरण':'Detail'}</label><textarea id="rdetail" rows="3" placeholder="${S.lang==='hi'?'क्या हुआ? (नाम/नंबर न लिखें)':'What happened?'}"></textarea>
  <button class="btn btn-primary" onclick="doReport()">🚩 ${S.lang==='hi'?'रिपोर्ट भेजें':'Send report'}</button>
  <div class="small">${S.lang==='hi'?'खतरे में हों तो पहले 181/112 पर कॉल करें। रिपोर्ट ID 48 घंटे में जांच।':'If in danger call 181/112 first. Report reviewed in 48h.'}</div></div>`;
}
function pgProfile(){
  const p=S.profile;
  return `<h2>👩 ${S.lang==='hi'?'मेरी प्रोफाइल':'My profile'}</h2><div class="card">
  <label>${S.lang==='hi'?'नाम':'Name'}</label><input id="pname" value="${esc(p.name)}">
  <label>${S.lang==='hi'?'मोबाइल':'Mobile'}</label><input id="pphone" value="${esc(p.phone)}">
  <label>${S.lang==='hi'?'गांव':'Village'}</label><input id="pvill" value="${esc(p.village)}">
  <label>${S.lang==='hi'?'जिला':'District'}</label><input id="pdist" value="${esc(p.district||'Jaipur')}">
  <button class="btn btn-primary" onclick="S.profile={name:document.getElementById('pname').value,phone:document.getElementById('pphone').value,village:document.getElementById('pvill').value,district:document.getElementById('pdist').value};saveProfile();toast('✅ Saved');location.hash='#/'">💾 ${S.lang==='hi'?'सहेजें':'Save'}</button>
  <div class="btn-row"><a class="btn btn-ghost" href="#/applications">📋 ${S.lang==='hi'?'मेरे आवेदन':'Applications'}</a><a class="btn btn-ghost" href="#/certificates">🎓 ${S.lang==='hi'?'प्रमाणपत्र':'Certificates'}</a></div></div>`;
}
function pgSettings(){
  return `<h2>⚙️ ${S.lang==='hi'?'सेटिंग':'Settings'}</h2><div class="card">
  <label>${S.lang==='hi'?'भाषा':'Language'}</label><select id="langSel"><option value="hi" ${S.lang==='hi'?'selected':''}>हिंदी</option><option value="en" ${S.lang==='en'?'selected':''}>English</option></select>
  <p class="small">Marwari • Mewari • Dhundhari • Harauti • Shekhawati • Wagdi — ${S.lang==='hi'?'ऑडियो सहायता से क्रमशः (पूर्ण STT का दावा नहीं)':'via assisted audio progressively (no full-STT claim)'}</p>
  <button class="btn btn-primary" onclick="S.lang=document.getElementById('langSel').value;localStorage.setItem('shakti_lang',S.lang);location.reload()">💾 Save</button></div>
  <div class="card"><b>🏢 ${S.lang==='hi'?'नियोक्ता हैं?':'Are you an employer?'}</b><p class="small">${S.lang==='hi'?'सत्यापन के बाद ही सूची। कोई फीस नहीं।':'Listing only after verification. No fees.'}</p><a class="btn btn-warm" href="#/employer">📝 ${S.lang==='hi'?'नियोक्ता पंजीकरण':'Employer registration'}</a></div>
  <div class="card"><a href="#/admin">🔐 Admin</a> • <a href="/pitch.html">📊 Pitch</a></div>`;
}
function pgEmployer(){
  return `<h2>🏢 ${S.lang==='hi'?'नियोक्ता पंजीकरण':'Employer registration'}</h2><div class="card">
  <label>${S.lang==='hi'?'संगठन का नाम *':'Organisation *'}</label><input id="ename">
  <label>${S.lang==='hi'?'प्रकार':'Type'}</label><select id="etype"><option>SHG</option><option>Registered company</option><option>Registered NGO</option><option>Cooperative</option><option>FPO</option><option>Government</option><option>Verified local business</option></select>
  <label>${S.lang==='hi'?'जिला':'District'}</label><input id="edist" placeholder="Jaipur">
  <label>${S.lang==='hi'?'संपर्क (फोन) *':'Contact *'}</label><input id="econtact">
  <label>${S.lang==='hi'?'काम का विवरण':'Job detail'}</label><textarea id="ejob" rows="3"></textarea>
  <button class="btn btn-primary" onclick="doEmployer()">📩 ${S.lang==='hi'?'जांच हेतु भेजें':'Submit for verification'}</button>
  <div class="small">${S.lang==='hi'?'प्रक्रिया: पहचान + संपर्क + पता जांच → अनुमोदन/अस्वीकृति → समय-समय पर पुनः जांच। अग्रिम फीस वाली सूची कभी अनुमोदित नहीं।':'Process: ID + contact + address check → approve/reject → re-verification. Advance-fee listings never approved.'}</div></div>`;
}
async function pgAdmin(q){
  if(!S.adminToken) return `<h2>🔐 Admin</h2><div class="card"><label>Password (ADMIN_PASSWORD)</label><input id="apw" type="password" placeholder="••••••"><button class="btn btn-primary" onclick="doAdminLogin()">Login</button><div class="small">Demo default: shakti-admin-2026 (set ADMIN_PASSWORD in production — never hardcode).</div></div>`;
  const o=await api('/api/admin/overview');
  const reps=await api('/api/admin/reports');
  const jobs=await api('/api/admin/jobs');
  return `<h2>🔐 Admin ${S.lang==='hi'?'डैशबोर्ड':'dashboard'}</h2>
  <div class="admin"><b>Counts</b><br>Jobs ${o.counts?.jobs} (verified ${o.counts?.verified}, suspended ${o.counts?.suspended}) • Applications ${o.counts?.applications} • Reports ${o.counts?.reports} (open ${o.counts?.openReports}) • Pending employers ${o.counts?.employersPending} • Events ${o.counts?.events}</div>
  <div class="card"><h3>🚩 Reports (${(reps.reports||[]).length})</h3>${(reps.reports||[]).slice(0,8).map(r=>`<div class="kv"><span>${esc(r.id)} • ${esc(r.reason)} • ${esc(r.jobId)} • <b>${esc(r.status)}</b></span><button onclick="modReport('${r.id}','actioned',true)">block job</button></div>`).join('')}</div>
  <div class="card"><h3>🏢 Employer requests (${(reps.employerRequests||[]).length})</h3>${(reps.employerRequests||[]).map(e=>`<div class="kv"><span>${esc(e.name)} • ${esc(e.type)} • ${esc(e.status)}</span><span><button onclick="modEmployer('${e.id}','approved')">approve</button> <button onclick="modEmployer('${e.id}','rejected')">reject</button></span></div>`).join('')||'none'}</div>
  <div class="card"><h3>📋 Jobs moderation</h3>${(jobs.jobs||[]).map(j=>`<div class="kv"><span>${j.id} ${j.verified?'✅':'⏳'} ${esc(j.title_hi).slice(0,30)} • ${j.status}</span><span><button onclick="modJob('${j.id}','suspended')">suspend</button> <button onclick="modJob('${j.id}','published')">publish</button></span></div>`).join('')}</div>
  <button class="btn btn-ghost" onclick="sessionStorage.removeItem('shakti_admin');S.adminToken='';location.reload()">Logout</button>`;
}

/* ---------- actions ---------- */
window.goVoice=()=>location.hash='#/voice';
window.listenInto=listenInto; window.speak=speak;
window.doFilter=async()=>{
  const q=document.getElementById('fq').value, dist=document.getElementById('fdist').value, max=document.getElementById('fmax').value;
  const home=document.getElementById('fhome').checked, child=document.getElementById('fchild').checked, dis=document.getElementById('fdis').checked;
  const d=await api('/api/jobs?verifiedOnly=true&'+new URLSearchParams({q,district:dist,maxDistance:max,home,part:'',flexible:'',childcare:child,disability:dis}).toString());
  S.jobsCache=d.jobs||[];
  document.getElementById('jobsList').innerHTML=S.jobsCache.map(jobCard).join('')||'<p>कोई सत्यापित काम नहीं — फिल्टर हटाएं</p>';
  track('job_filter','/jobs');
};
window.doApply=async(id)=>{
  const name=document.getElementById('aname').value, phone=document.getElementById('aphone').value, village=document.getElementById('avill').value, ans=document.getElementById('aans').value;
  S.profile={name,phone,village,district:S.profile.district}; saveProfile();
  const r=await api('/api/apply',{method:'POST',body:JSON.stringify({jobId:id,name,phone,village,answers:ans})});
  if(r.ok){ speak(S.lang==='hi'?r.message_hi:r.message_en); location.hash='#/applications'; } else toast('⚠️ '+(r.error||'error'));
};
window.withdrawApp=async(id)=>{ const r=await api('/api/applications/'+id+'/withdraw',{method:'POST'}); if(r.ok){toast('↩ withdrawn');location.reload();} };
window.doCert=async(cid)=>{
  const name=document.getElementById('cname').value||S.profile.name||'SHAKTI Learner';
  const r=await api('/api/courses/'+cid+'/complete',{method:'POST',body:JSON.stringify({name,phone:S.profile.phone})});
  if(r.ok){ speak(S.lang==='hi'?r.message_hi:'Congratulations!'); toast('🎓 '+(S.lang==='hi'?'प्रमाणपत्र बन गया':'Certificate ready')); location.hash='#/certificates'; }
};
window.reportAW=async(id)=>{ const d=prompt(S.lang==='hi'?'क्या गलत है? (पता/समय/फोन)':'What is wrong?'); if(!d) return; await api('/api/anganwadi/report',{method:'POST',body:JSON.stringify({centreId:id,detail:d})}); toast('✅ धन्यवाद / Thank you'); };
window.doCalc=async()=>{
  const r=await api('/api/business/calc',{method:'POST',body:JSON.stringify({material:+document.getElementById('bmat').value||0,packing:+document.getElementById('bpack').value||0,transport:+document.getElementById('btrans').value||0,hours:+document.getElementById('bhrs').value||0})});
  document.getElementById('calcOut').innerHTML=`<div class="safebox">💰 ${esc(S.lang==='hi'?r.formula_hi:r.formula_en)}<br><b>${S.lang==='hi'?'सुझाव दाम':'Suggested price'}: ₹${r.price}</b></div>`; speak(S.lang==='hi'?r.formula_hi:r.formula_en);
};
window.doVoice=async()=>{
  const q=document.getElementById('vq').value; const out=document.getElementById('voiceOut'); out.innerHTML='🔍 ...';
  const r=await api('/api/voice-assist',{method:'POST',body:JSON.stringify({text:q,lang:S.lang})});
  out.innerHTML=`<div class="safebox">🎤 ${esc(S.lang==='hi'?r.reply_hi:r.reply_en)}</div>`+(r.jobs||[]).map(jobCard).join('');
  speak(S.lang==='hi'?r.reply_hi:r.reply_en);
};
window.doHelp=async()=>{
  const q=document.getElementById('hq').value; const out=document.getElementById('helpOut'); out.innerHTML='💭 ...';
  const r=await api('/api/ai-help',{method:'POST',body:JSON.stringify({message:q,lang:S.lang})});
  out.innerHTML=`<div class="card">💬 ${esc(r.answer)}<div class="small">engine: ${esc(r.engine||'')} • ${esc(r.disclaimer||'')}</div></div>`+(r.jobs||[]).map(jobCard).join('');
  speak(String(r.answer).slice(0,300));
};
window.doFeedback=async()=>{ const m=document.getElementById('fb').value; const r=await api('/api/feedback',{method:'POST',body:JSON.stringify({message:m,page:location.hash})}); if(r.ok) toast('✅ '+(S.lang==='hi'?'धन्यवाद!':'Thank you!')); };
window.doReport=async()=>{
  const r=await api('/api/report',{method:'POST',body:JSON.stringify({jobId:document.getElementById('rjob').value,reason:document.getElementById('rreason').value,detail:document.getElementById('rdetail').value})});
  if(r.ok){ speak(S.lang==='hi'?r.message_hi:r.message_en); toast('🚩 '+(S.lang==='hi'?'रिपोर्ट दर्ज':'Reported')); location.hash='#/safety'; } else toast(r.error||'error');
};
window.doEmployer=async()=>{
  const r=await api('/api/employers/apply',{method:'POST',body:JSON.stringify({name:document.getElementById('ename').value,type:document.getElementById('etype').value,district:document.getElementById('edist').value,contact:document.getElementById('econtact').value,job:document.getElementById('ejob').value})});
  if(r.ok){ toast('✅ '+(S.lang==='hi'?'जांच हेतु भेजा':'Submitted')); location.hash='#/'; } else toast(r.error||'error');
};
window.doAdminLogin=async()=>{
  const r=await api('/api/admin/login',{method:'POST',body:JSON.stringify({password:document.getElementById('apw').value})});
  if(r.ok){ S.adminToken=r.token; sessionStorage.setItem('shakti_admin',r.token); location.reload(); } else toast('Wrong password');
};
window.modJob=async(id,st)=>{ await api('/api/admin/moderate',{method:'POST',body:JSON.stringify({kind:'job',id,status:st})}); location.reload(); };
window.modReport=async(id,st,sj)=>{ await api('/api/admin/moderate',{method:'POST',body:JSON.stringify({kind:'report',id,status:st,suspendJob:sj})}); location.reload(); };
window.modEmployer=async(id,st)=>{ await api('/api/admin/moderate',{method:'POST',body:JSON.stringify({kind:'employer',id,status:st})}); location.reload(); };

/* ---------- router ---------- */
async function render(){
  const app=document.getElementById('app');
  const h=(location.hash||'#/').replace(/^#/,''), [_,page,arg]=h.split('?')[0].split('/');
  const q=new URLSearchParams((h.split('?')[1]||''));
  document.querySelectorAll('#bottomnav a').forEach(a=>a.classList.remove('active'));
  try{
    let html='';
    if(page==='' ) html=await pgHome();
    else if(page==='jobs'&&arg) html=await pgJobDetail(arg);
    else if(page==='jobs') html=await pgJobs(q);
    else if(page==='apply') html=pgApply(arg);
    else if(page==='applications') html=await pgApplications();
    else if(page==='home-work') html=await pgHomeWork();
    else if(page==='skills'&&arg) html=await pgSkillDetail(arg);
    else if(page==='skills') html=await pgSkills();
    else if(page==='certificates') html=await pgCerts();
    else if(page==='anganwadi') html=await pgAnganwadi(q);
    else if(page==='shg') html=await pgSHG();
    else if(page==='business') html=await pgBusiness();
    else if(page==='marketplace') html=await pgBusiness();
    else if(page==='voice') html=pgVoice();
    else if(page==='help') html=pgHelp();
    else if(page==='safety') html=await pgSafety();
    else if(page==='report') html=pgReport(q);
    else if(page==='profile') html=pgProfile();
    else if(page==='settings') html=pgSettings();
    else if(page==='employer') html=pgEmployer();
    else if(page==='admin') html=await pgAdmin(q);
    else html='<p>Not found</p><a href="#/">← home</a>';
    // profile shortcut bar
    html+=`<div class="card" style="text-align:center"><a href="#/profile">👩 ${esc(S.profile.name||(S.lang==='hi'?'प्रोफाइल बनाएं':'Create profile'))}</a> • <a href="#/settings">⚙️ ${S.lang==='hi'?'सेटिंग':'Settings'}</a> • <a href="#/admin">🔐 Admin</a></div>`;
    app.innerHTML=html;
    const map={'':'home',jobs:'jobs',skills:'skills',anganwadi:'child',help:'help'};
    const nav=document.querySelector(`#bottomnav a[href="#/${page==='home-work'?'jobs':page}"]`);
    window.scrollTo(0,0); track('page_view','/'+(page||''));
    if(page==='' ){ const nj=document.getElementById('nearJobs'); if(nj){ const d=await api('/api/jobs?verifiedOnly=true&maxDistance=5'); nj.innerHTML=(d.jobs||[]).slice(0,3).map(jobCard).join('')||''; } }
  }catch(e){ app.innerHTML='<p>⚠️ Error — <a href="#/">home</a></p><pre class="small">'+esc(e.message)+'</pre>'; }
}
window.addEventListener('hashchange',render);
document.getElementById('langBtn').onclick=()=>{ S.lang=S.lang==='hi'?'en':'hi'; localStorage.setItem('shakti_lang',S.lang); location.reload(); };
document.getElementById('voiceBtnTop').onclick=()=>location.hash='#/voice';
document.getElementById('micFab').onclick=()=>location.hash='#/voice';
if('serviceWorker' in navigator){ navigator.serviceWorker.register('/sw.js').catch(()=>{}); }
render();

import { t } from './i18n.js';
import { S, saveProfile, toast, esc, api, track, speak, listenInto, IMG, jobImg, vBadge, jobCard, hunarCard, slideshow } from './ui.js';

export function registerPages(Pages) {
  const hi = () => S.lang !== 'en';

  /* ----- companies: reputed employers hiring directly ----- */
  Pages['route:companies'] = async () => {
    const H = hi();
    const [e, j] = await Promise.all([api('/api/employers'), api('/api/jobs?verifiedOnly=true')]);
    const byEmp = {};
    (j.jobs || []).forEach(x => { (byEmp[x.employer] = byEmp[x.employer] || []).push(x); });
    return `<h2>🏢 ${t('companies')}</h2>
    <p>${H ? 'ये सत्यापित कंपनियां/संस्थाएं सीधी भर्ती करती हैं — कोई बिचौलिया नहीं, कोई फीस नहीं।' : 'These verified companies hire directly — no middlemen, no fees.'}</p>
    ${((e.employers || []).map(emp => {
      const jobs = byEmp[emp.name] || [];
      return `<div class="card"><b>✅ ${esc(emp.name)}</b> <span class="badge b-blue">${esc(emp.type)}</span>
      <div class="kv"><span>${esc(emp.district)} • ${jobs.length} ${H ? 'खुली भर्तियां' : 'open roles'}</span></div>
      ${jobs.slice(0, 4).map(x => `<div class="kv"><span>• ${esc(H ? x.title_hi : x.title_en)} — ${esc(x.pay_hi)}</span><a href="/jobs/${x.id}" data-link>${t('view')} ➜</a></div>`).join('')}
      <div class="btnrow"><a class="btn sec" href="/hunar/new" data-link>🌟 ${H ? 'हुनर दिखाएं — ये आपको खोजें' : 'Showcase skill — get discovered'}</a></div></div>`;
    }).join('')) || `<p>${H ? 'जल्द आ रहा है' : 'Coming soon'}</p>`}
    <div class="card"><b>🏢 ${H ? 'कंपनी हैं? सीधे जुड़ें' : 'A company? Join directly'}</b><p>${H ? 'सत्यापन के बाद आपकी भर्तियां यहां दिखेंगी।' : 'Your openings appear here after verification.'}</p><a class="btn warn" href="/employer" data-link>📝 ${t('employer')}</a></div>`;
  };

  /* ----- home-work ----- */
  Pages['route:home-work'] = async () => {
    const d = await api('/api/jobs?home=true&verifiedOnly=false');
    const list = (d.jobs || []).filter(j => j.home_based && j.status === 'published');
    return `<h2>🏠 ${t('home_work')}</h2>
    <div class="warnbox">⚠️ ${hi() ? 'घर-बैठे काम में धोखा ज्यादा होता है। SHAKTI कभी अग्रिम/किट फीस वाली सूची नहीं छापता। मांगे तो रिपोर्ट करें।' : 'Home-work scams are common. SHAKTI never lists advance/kit-fee jobs. Report if asked.'}</div>
    ${list.map(jobCard).join('')}`;
  };

  /* ----- hunar showcase ----- */
  Pages['route:hunar'] = async (arg) => {
    if (arg === 'new') return Pages.hunarNew();
    if (arg) return Pages.hunarDetail(arg);
    const [h, sk] = await Promise.all([api('/api/hunar'), api('/api/hunar/skills').catch(() => ({ skills: [] }))]);
    return `<h2>🌟 ${hi() ? 'हुनर दिखाएं — कंपनियां खोजें' : 'Showcase skill — get discovered'}</h2>
    ${slideshow([{ img: IMG.tailoring, t: hi() ? 'पढ़ाई नहीं, हुनर बोलता है' : 'Not degrees — skill speaks', s: hi() ? 'सिलाई • कढ़ाई • अचार • ब्यूटी • पॉटरी' : 'Stitching • embroidery • pickles • beauty • pottery' }])}
    <div class="card"><p>${hi() ? 'बिना पढ़ी-लिखी महिलाएं भी बहुत कुछ जानती हैं। अपना हुनर-प्रोफाइल बनाएं — सत्यापन के बाद SHG, कंपनियां और खरीदार आपको खोज पाएंगे।' : 'Even without formal education, women hold deep skills. Create a skill profile — after verification, SHGs and companies can discover you.'}</p>
    <div class="btnrow"><a class="btn" href="/hunar/new" data-link>🌟 ${hi() ? 'मेरा हुनर जोड़ें (मुफ्त)' : 'Add my skill (free)'}</a></div>
    <div class="chips">${(sk.skills || []).slice(0, 12).map(s => `<button class="chip" onclick="window._hunarSkill('${esc(s)}')">🧵 ${esc(s)}</button>`).join('')}</div></div>
    <div id="hunarList">${(h.profiles || []).map(hunarCard).join('') || `<p>${hi() ? 'जल्द आ रहा है' : 'Coming soon'}</p>`}</div>`;
  };
  window._hunarSkill = async (s) => {
    const h = await api('/api/hunar?skill=' + encodeURIComponent(s));
    document.getElementById('hunarList').innerHTML = (h.profiles || []).map(hunarCard).join('');
  };
  Pages.hunarDetail = async (id) => {
    const H = hi();
    const d = await api('/api/hunar/' + id);
    if (!d.profile) return '<p>Not found</p>';
    const h = d.profile;
    return `<a href="/hunar" data-link>← ${t('back')}</a><div class="card"><div class="hunar">
    <div class="face">👩‍🎨</div><div><b style="font-size:22px">${esc(h.name)}</b> ${h.verified ? '<span class="badge b-green">✅ ' + (H ? 'सत्यापित' : 'Verified') + '</span>' : '<span class="badge b-orange">⏳</span>'}
    <div class="kv"><span>${esc(h.village)}, ${esc(h.district)} • 👀 ${h.views}</span></div></div></div>
    <div style="margin:8px 0">${(h.skills || []).map(s => `<span class="skilltag">🧵 ${esc(s)}</span>`).join('')}</div>
    <div class="kv"><span>${H ? 'अनुभव' : 'Experience'}</span><b>${esc(h.experience || '—')}</b></div>
    <div class="kv"><span>${H ? 'चाहती हैं' : 'Seeks'}</span><b>${esc(h.expected_work || '—')}</b></div>
    <div class="kv"><span>🏠 ${H ? 'घर से उपलब्ध' : 'Home available'}</span><b>${h.available_home ? (H ? 'हां' : 'Yes') : (H ? 'नहीं' : 'No')}</b></div>
    <div class="kv"><span>📞</span><b>${esc(h.phone || '')}</b></div>
    ${S.token ? '' : `<p class="footer">${H ? 'पूरा नंबर हेतु लॉगिन करें' : 'Login to see full number'}</p>`}</div>
    <div class="card"><h3>${H ? 'संपर्क / रुचि बताएं' : 'Contact / express interest'}</h3>
    <label>${H ? 'आपका नाम *' : 'Your name *'}</label><input id="iname" value="${esc(S.profile.name)}">
    <label>${H ? 'संपर्क *' : 'Contact *'}</label><input id="icontact" value="${esc(S.profile.phone)}">
    <label>${H ? 'संदेश' : 'Message'}</label><input id="imsg" placeholder="${H ? 'जैसे: बुटिक हेतु सिलाई कार्य' : 'e.g. stitching for boutique'}">
    <button class="btn" style="width:100%" onclick="window._doInterest('${h.id}')">💬 ${H ? 'रुचि भेजें' : 'Send interest'}</button></div>`;
  };
  window._doInterest = async (id) => {
    const r = await api('/api/hunar/' + id + '/interest', { method: 'POST', body: JSON.stringify({ by_name: document.getElementById('iname').value, by_contact: document.getElementById('icontact').value, message: document.getElementById('imsg').value }) });
    if (r.ok) toast('✅ ' + (hi() ? r.message_hi : r.message_en)); else toast('⚠️ ' + (r.error || 'error'));
  };
  Pages.hunarNew = () => {
    const H = hi();
    return `<h2>🌟 ${H ? 'मेरा हुनर जोड़ें' : 'Add my skill'}</h2>
    <div class="safebox">✅ ${H ? 'मुफ्त। जांच के बाद प्रकाशित। फोन नंबर सबको नहीं दिखता।' : 'Free. Published after verification. Phone stays masked.'}</div>
    <div class="card"><label>${H ? 'आपका नाम *' : 'Your name *'}</label><input id="hname" value="${esc(S.profile.name)}">
    <label>${H ? 'मोबाइल *' : 'Mobile *'}</label><input id="hphone" inputmode="numeric" value="${esc(S.profile.phone)}">
    <label>${H ? 'गांव' : 'Village'}</label><input id="hvill" value="${esc(S.profile.village)}">
    <label>${H ? 'आप क्या-क्या जानती हैं? (अलग-अलग लिखें) *' : 'Your skills (comma separated) *'}</label>
    <div style="display:flex;gap:8px"><input id="hskills" placeholder="${H ? 'जैसे: सिलाई, कढ़ाई' : 'e.g. stitching, embroidery'}"><button class="btn yel" style="min-width:60px" onclick="listenInto(document.getElementById('hskills'))">🎤</button></div>
    <div class="chips" id="hchips">${['सिलाई', 'कढ़ाई', 'अचार-पापड़', 'ब्यूटी-मेहंदी', 'पॉटरी', 'डेयरी', 'मसाले', 'बुनाई'].map(s => `<button type="button" class="chip" onclick="window._hchip(this)">${s}</button>`).join('')}</div>
    <label>${H ? 'अनुभव' : 'Experience'}</label><input id="hexp" placeholder="${H ? 'जैसे: 10 साल, 500 सूट' : 'e.g. 10 years'}">
    <label>${H ? 'कैसा काम चाहिए?' : 'Work sought?'}</label><input id="hexpw" placeholder="${H ? 'जैसे: बुटिक सिलाई' : 'e.g. boutique stitching'}">
    <button class="btn" style="width:100%" onclick="window._doHunar()">🌟 ${H ? 'हुनर भेजें' : 'Submit skill'}</button></div>`;
  };
  window._hchip = (b) => {
    b.classList.toggle('on');
    const inp = document.getElementById('hskills');
    const cur = inp.value.split(',').map(s => s.trim()).filter(Boolean);
    const v = b.textContent.trim();
    inp.value = cur.includes(v) ? cur.filter(x => x !== v).join(', ') : [...cur, v].join(', ');
  };
  window._doHunar = async () => {
    const skills = document.getElementById('hskills').value.split(',').map(s => s.trim()).filter(Boolean);
    const r = await api('/api/hunar', { method: 'POST', body: JSON.stringify({ name: document.getElementById('hname').value, phone: document.getElementById('hphone').value, village: document.getElementById('hvill').value, skills, experience: document.getElementById('hexp').value, expected_work: document.getElementById('hexpw').value }) });
    if (r.ok) { toast('✅ ' + (hi() ? 'हुनर भेजा!' : 'Submitted!')); history.back(); } else toast('⚠️ ' + (r.error || 'error'));
  };
  // /hunar/new + /hunar/:id routing hook (called from main render via route: param)
  Pages['route:hunar-new-page'] = async () => Pages.hunarNew();

  /* ----- skills ----- */
  Pages['route:skills'] = async (arg) => {
    if (arg) return Pages.skillDetail(arg);
    const d = await api('/api/courses');
    const H = hi();
    return `<h2>📚 ${t('learn_free')} <span class="badge b-green">FREE • ${H ? 'मुफ्त' : 'Free'}</span></h2>
    <div class="photogrid">${(d.courses || []).map(c => `<a class="photocard" href="/skills/${c.id}" data-link><img class="ph" loading="lazy" src="${IMG.hero1}" onerror="this.style.display='none'"><span class="lbl">${c.img} ${esc(H ? c.title_hi : c.title_en)}<small>${esc(c.dur)} • ${c.lessons} ${H ? 'पाठ' : 'lessons'}</small></span></a>`).join('')}</div>`;
  };
  Pages.skillDetail = async (id) => {
    const d = await api('/api/courses/' + id);
    if (!d.course) return '<p>Not found</p>';
    const c = d.course, H = hi();
    return `<a href="/skills" data-link>← ${t('back')}</a><div class="card"><div style="font-size:56px;text-align:center">${c.img}</div>
    <h2>${esc(H ? c.title_hi : c.title_en)}</h2><div class="kv"><span>${esc(c.dur)} • ${esc(c.level)} • ${c.lessons} ${H ? 'पाठ' : 'lessons'} • <span class="badge b-green">FREE</span></span></div>
    <p>${esc(H ? c.body_hi : c.body_en)}</p>
    <div class="btnrow"><button class="btn yel" data-speak="${esc(H ? c.title_hi + '. ' + c.body_hi : c.title_en + '. ' + c.body_en).slice(0, 300)}">🔊 ${t('listen')}</button></div>
    <h3>❓ ${H ? 'छोटा सवाल' : 'Quick quiz'}</h3>${(c.quiz || []).map(q => `<p>• ${esc(q)}</p>`).join('')}
    <label>${H ? 'नाम (प्रमाणपत्र हेतु)' : 'Name (for certificate)'}</label><input id="cname" value="${esc(S.profile.name)}">
    <button class="btn" style="width:100%" onclick="window._doCert('${c.id}')">🎓 ${H ? 'प्रमाणपत्र पाएं (मुफ्त)' : 'Get certificate (free)'}</button>
    <p class="footer">${H ? 'यह सीखने का प्रमाण है, सरकारी मान्यता का दावा नहीं।' : 'Learning proof only, not govt-recognised.'}</p></div>`;
  };
  window._doCert = async (cid) => {
    const r = await api('/api/courses/' + cid + '/complete', { method: 'POST', body: JSON.stringify({ name: document.getElementById('cname').value || S.profile.name || 'SHAKTI Learner', phone: S.profile.phone }) });
    if (r.ok) { speak(hi() ? r.message_hi : 'Congratulations!'); toast('🎓'); location.href = '/certificates'; }
  };

  /* ----- certificates ----- */
  Pages['route:certificates'] = async () => {
    const d = await api('/api/certificates' + (S.token ? '' : '?phone=' + encodeURIComponent(S.profile.phone || '')));
    return `<h2>🎓 ${hi() ? 'मेरे प्रमाणपत्र' : 'My certificates'}</h2>${(d.certificates || []).map(c => `<div class="card">🌸 <b>SHAKTI</b> — ${esc(c.courseTitle || c.course_id)}<br>👩 ${esc(c.name)} • ${esc((c.created_at || '').slice(0, 10))}<br><span class="badge b-grey">learning proof • not govt-recognised</span></div>`).join('') || `<p>${hi() ? 'अभी कोई प्रमाणपत्र नहीं' : 'None yet'}</p>`}`;
  };

  /* ----- anganwadi ----- */
  Pages['route:anganwadi'] = async () => {
    const qs = new URLSearchParams(location.search);
    const d = await api('/api/anganwadi?' + new URLSearchParams({ village: qs.get('v') || '', district: qs.get('d') || '' }).toString());
    const H = hi();
    return `<h2>👶 ${t('childcare')}</h2>
    <div class="warnbox">📢 <span class="badge b-orange">DEMO</span> ${H ? 'यह सूची डेमो है — आधिकारिक WCD डेटा नहीं। उत्पादन में सरकारी डेटासेट जुड़ेगा।' : 'Demo list — not official WCD data.'}</div>
    <div class="card"><img class="imgcover ph" src="${IMG.kids}" onerror="this.style.display='none'"><div style="display:flex;gap:8px;margin-top:8px"><input id="awv" placeholder="${H ? 'गांव लिखें' : 'Enter village'}"><button class="btn" onclick="location.href='/anganwadi?v='+encodeURIComponent(document.getElementById('awv').value)">🔍</button></div></div>
    ${(d.centres || []).map(a => `<div class="card"><b>${esc(a.name)}</b> <span class="badge b-grey">DEMO</span><div class="kv"><span>${esc(a.village)}, ${esc(a.district)} ${a.pincode} • ${a.distance_km} km • ⏰ ${esc(a.hours)}</span></div><div class="kv"><span>📞 ${esc(a.contact)} • ${(a.facilities || []).join(' • ')}</span></div><button class="btn sec" onclick="window._reportAW('${a.id}')">📝 ${H ? 'गलत जानकारी बताएं' : 'Report wrong info'}</button></div>`).join('')}`;
  };
  window._reportAW = async (id) => { const d = prompt(hi() ? 'क्या गलत है?' : 'What is wrong?'); if (!d) return; await api('/api/anganwadi/report', { method: 'POST', body: JSON.stringify({ centreId: id, detail: d }) }); toast('✅ ' + (hi() ? 'धन्यवाद' : 'Thanks')); };

  /* ----- shg ----- */
  Pages['route:shg'] = async () => {
    const d = await api('/api/shg');
    return `<h2>🧵 SHG ${hi() ? 'व समुदाय' : '& community'}</h2>
    <img class="imgcover ph" src="${IMG.shg}" onerror="this.style.display='none'">
    ${(d.groups || []).map(g => `<div class="card"><b>👭 ${esc(g.name)}</b><div class="kv"><span>${esc(g.village)}, ${esc(g.district)} • ${g.members} ${hi() ? 'सदस्य' : 'members'} • ${esc(g.work)}</span></div><div class="kv"><span>📞 ${esc(g.contact)}</span></div></div>`).join('')}
    <div class="card"><b>➕ ${hi() ? 'SHG से जुड़ना है?' : 'Want to join?'}</b><p>${hi() ? 'नजदीकी CSC/ब्लॉक कार्यालय में SHG रजिस्टर देखें या आशा दीदी से पूछें।' : 'Visit CSC/block office or ask ASHA didi.'}</p></div>`;
  };

  /* ----- business + marketplace ----- */
  Pages['route:business'] = async () => {
    const H = hi();
    const g = await api('/api/business/guides');
    return `<h2>🚀 ${H ? 'अपना व्यवसाय' : 'My business'}</h2>
    <div class="card"><h3>🧮 ${H ? 'लाभ कैलकुलेटर' : 'Profit calculator'}</h3>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><input id="bmat" type="number" placeholder="${H ? 'सामग्री ₹' : 'Material ₹'}"><input id="bpack" type="number" placeholder="${H ? 'पैकिंग ₹' : 'Packing ₹'}"><input id="btrans" type="number" placeholder="${H ? 'किराया ₹' : 'Transport ₹'}"><input id="bhrs" type="number" placeholder="${H ? 'घंटे' : 'Hours'}"></div>
    <button class="btn" style="width:100%" onclick="window._doCalc()">🧮 ${H ? 'दाम निकालें' : 'Calculate'}</button><div id="calcOut"></div></div>
    ${(g.guides || []).map(x => `<div class="card"><b>📘 ${esc(H ? x.title_hi : x.title_en)}</b><p>${esc(H ? x.body_hi : x.body_en)}</p></div>`).join('')}
    <a class="btn sec" href="/marketplace" data-link>🛍️ SHG ${t('market')} ➜</a></div>`;
  };
  window._doCalc = async () => {
    const r = await api('/api/business/calc', { method: 'POST', body: JSON.stringify({ material: +document.getElementById('bmat').value || 0, packing: +document.getElementById('bpack').value || 0, transport: +document.getElementById('btrans').value || 0, hours: +document.getElementById('bhrs').value || 0 }) });
    document.getElementById('calcOut').innerHTML = `<div class="safebox">💰 ${esc(hi() ? r.formula_hi : r.formula_en)}<br><b>${hi() ? 'सुझाव दाम' : 'Price'}: ₹${r.price}</b></div>`;
    speak(hi() ? r.formula_hi : r.formula_en);
  };
  Pages['route:marketplace'] = async () => {
    const m = await api('/api/marketplace');
    return `<h2>🛍️ SHG ${t('market')} <span class="badge b-grey">demo</span></h2>
    <img class="imgcover ph" src="${IMG.market}" onerror="this.style.display='none'">
    ${(m.items || []).map(i => `<div class="card"><b>${esc(hi() ? i.item_hi : i.item_en)}</b><div class="kv"><span>${esc(i.seller)} • ${esc(i.district)}</span></div><div style="font-size:20px;font-weight:800">₹${i.price}/${esc(i.unit)}</div></div>`).join('')}`;
  };

  /* ----- voice ----- */
  Pages['route:voice'] = async () => {
    const H = hi();
    return `<h2>🎤 ${t('ask_voice')}</h2><div class="card" style="text-align:center"><div style="font-size:64px">🎤</div>
    <p>${H ? 'बोलें — जैसे: “मुझे घर बैठे काम चाहिए”' : 'Say — e.g. “I want home-based work”'}</p>
    <input id="vq" placeholder="${H ? 'या यहां लिखें…' : 'or type here…'}">
    <div class="btnrow"><button class="btn yel" onclick="listenInto(document.getElementById('vq'))">🎤 ${H ? 'बोलें' : 'Speak'}</button><button class="btn" onclick="window._doVoice()">🔍 ${H ? 'पूछें' : 'Ask'}</button></div>
    <div id="voiceOut" style="text-align:left"></div></div>
    <p class="footer">${H ? 'ब्राउज़र आवाज़ सीमित हो सकती है — टाइप हमेशा उपलब्ध। बोलियां ऑडियो-सहायता से।' : 'Browser speech may be limited — typing always works.'}</p>`;
  };
  window._doVoice = async () => {
    const q = document.getElementById('vq').value, out = document.getElementById('voiceOut');
    out.innerHTML = '🔍 …';
    const r = await api('/api/voice-assist', { method: 'POST', body: JSON.stringify({ text: q, lang: S.lang }) });
    out.innerHTML = `<div class="safebox">🎤 ${esc(hi() ? r.reply_hi : r.reply_en)}</div>` + (r.jobs || []).map(jobCard).join('');
    speak(hi() ? r.reply_hi : r.reply_en);
  };

  /* ----- help chat ----- */
  Pages['route:help'] = async () => {
    const H = hi();
    return `<h2>🤖 ${H ? 'SHAKTI सहायक' : 'SHAKTI assistant'}</h2>
    <div class="chatbox" id="chatbox"><div class="msg b">🌸 ${H ? 'नमस्ते! काम, हुनर, सुरक्षा — कुछ भी पूछें।' : 'Hello! Ask about work, skills, safety.'}</div></div>
    <div class="chatrow"><input id="hq" placeholder="${H ? 'पूछें…' : 'Ask…'}"><button class="btn yel" onclick="listenInto(document.getElementById('hq'))">🎤</button><button class="btn" onclick="window._doHelp()">💬</button></div>
    <div class="card"><b>📞 ${H ? 'हेल्पलाइन' : 'Helplines'}</b><div class="btnrow"><a class="btn warn" href="tel:181">📞 181</a><a class="btn warn" href="tel:1930">📞 1930</a><a class="btn warn" href="tel:112">📞 112</a></div></div>
    <div class="card"><b>💡 ${t('feedback')}</b><input id="fb" placeholder="${H ? 'सुझाव लिखें…' : 'Write suggestion…'}"><button class="btn sec" onclick="window._doFeedback()">📩 ${t('submit')}</button></div>`;
  };
  window._doHelp = async () => {
    const q = document.getElementById('hq').value; if (!q.trim()) return;
    const box = document.getElementById('chatbox');
    box.innerHTML += `<div class="msg u">${esc(q)}</div>`; document.getElementById('hq').value = '';
    box.innerHTML += `<div class="msg b" id="thinking">💭 …</div>`; box.scrollTop = box.scrollHeight;
    const r = await api('/api/ai-help', { method: 'POST', body: JSON.stringify({ message: q, lang: S.lang }) });
    document.getElementById('thinking')?.remove();
    box.innerHTML += `<div class="msg b">💬 ${esc(r.answer)}<small>engine: ${esc(r.engine || '')}</small></div>`;
    if (r.jobs?.length) box.innerHTML += r.jobs.map(jobCard).join('');
    box.scrollTop = box.scrollHeight; speak(String(r.answer).slice(0, 280));
  };
  window._doFeedback = async () => {
    const r = await api('/api/feedback', { method: 'POST', body: JSON.stringify({ message: document.getElementById('fb').value }) });
    if (r.ok) toast('✅ ' + (hi() ? 'धन्यवाद!' : 'Thanks!'));
  };

  /* ----- safety + report ----- */
  Pages['route:safety'] = async () => {
    const d = await api('/api/safety/info');
    const H = hi();
    return `<h2>🛡️ ${t('safety')} ${H ? 'केंद्र' : 'centre'}</h2>
    <div class="warnbox">⛔ <b>${H ? 'कभी न करें' : 'Never do'}</b><ul>${(H ? d.rules_hi : d.rules_en).map(r => `<li>${esc(r)}</li>`).join('')}</ul></div>
    <div class="safebox">✅ ${esc(d.verify_note)}</div>
    <div class="card"><b>📞 ${H ? 'आपातकालीन' : 'Emergency'}</b><div class="btnrow"><a class="btn warn" href="tel:181">👩 181</a><a class="btn warn" href="tel:1930">💻 1930</a><a class="btn warn" href="tel:112">🚨 112</a></div></div>
    <div class="card"><b>🚩 ${H ? 'शिकायत' : 'Complaint'}</b><p>${H ? 'फर्जी फीस, OTP मांग, गलत वेतन, असुरक्षित जगह — तुरंत रिपोर्ट करें।' : 'Fake fees, OTP ask, wrong pay, unsafe place — report now.'}</p><a class="btn" href="/report" data-link>🚩 ${t('report_btn')}</a></div>
    <div class="card"><b>📜 ${H ? 'स्कैम उदाहरण (सीखने हेतु)' : 'Scam example'}</b><p>${H ? '“₹50,000 घर बैठे + ₹500 फीस + OTP” — 100% धोखा। SHAKTI ऐसी सूची ब्लॉक करता है।' : '“₹50,000 from home + fee + OTP” — 100% fraud. SHAKTI blocks it.'}</p><a href="/jobs/j16" data-link>${H ? 'ब्लॉक सूची देखें' : 'See blocked listing'}</a></div>`;
  };
  Pages['route:report'] = async () => {
    const qs = new URLSearchParams(location.search);
    const H = hi();
    return `<h2>🚩 ${H ? 'असुरक्षित काम रिपोर्ट करें' : 'Report unsafe job'}</h2><div class="card">
    <label>${H ? 'काम की ID' : 'Job ID'}</label><input id="rjob" value="${esc(qs.get('job') || '')}">
    <label>${H ? 'कारण' : 'Reason'}</label><select id="rreason"><option value="advance-fee">${H ? 'अग्रिम फीस मांगी' : 'Asked advance fee'}</option><option value="otp">OTP / ${H ? 'बैंक डिटेल' : 'bank'}</option><option value="fake-job">${H ? 'नकली काम' : 'Fake job'}</option><option value="harassment">${H ? 'परेशान किया' : 'Harassment'}</option><option value="unsafe-place">${H ? 'असुरक्षित जगह' : 'Unsafe place'}</option><option value="wrong-pay">${H ? 'गलत वेतन' : 'Wrong pay'}</option><option value="other">${H ? 'अन्य' : 'Other'}</option></select>
    <label>${H ? 'विवरण' : 'Detail'}</label><textarea id="rdetail" rows="3"></textarea>
    <button class="btn" style="width:100%" onclick="window._doReport()">🚩 ${t('report_btn')}</button>
    <p class="footer">${H ? 'खतरे में हों तो पहले 181/112 पर कॉल करें।' : 'If in danger call 181/112 first.'}</p></div>`;
  };
  window._doReport = async () => {
    const r = await api('/api/report', { method: 'POST', body: JSON.stringify({ jobId: document.getElementById('rjob').value, reason: document.getElementById('rreason').value, detail: document.getElementById('rdetail').value }) });
    if (r.ok) { speak(hi() ? r.message_hi : r.message_en); location.href = '/safety'; } else toast(r.error || 'error');
  };

  /* ----- profile / settings / auth ----- */
  Pages['route:profile'] = async () => {
    const H = hi(), p = S.profile;
    let saved = [];
    if (S.token) { try { saved = (await api('/api/saved')).jobs || []; } catch { } }
    return `<h2>👩 ${H ? 'मेरी प्रोफाइल' : 'My profile'}</h2><div class="card">
    ${S.token ? `<div class="safebox">✅ ${H ? 'लॉगिन हैं' : 'Logged in'} — ${esc(p.phone)}</div>` : `<div class="warnbox">${H ? 'लॉगिन नहीं हैं — आवेदन फोन से दिखेंगे' : 'Not logged in'}</div>`}
    <label>${H ? 'नाम' : 'Name'}</label><input id="pname" value="${esc(p.name)}">
    <label>${H ? 'मोबाइल' : 'Mobile'}</label><input id="pphone" value="${esc(p.phone)}">
    <label>${H ? 'गांव' : 'Village'}</label><input id="pvill" value="${esc(p.village)}">
    <label>${H ? 'जिला' : 'District'}</label><input id="pdist" value="${esc(p.district || 'Jaipur')}">
    <button class="btn" style="width:100%" onclick="window._saveP()">💾 ${t('save')}</button>
    <div class="btnrow"><a class="btn sec" href="/applications" data-link>📋 ${H ? 'आवेदन' : 'Applications'}</a><a class="btn sec" href="/certificates" data-link>🎓 ${H ? 'प्रमाणपत्र' : 'Certificates'}</a></div>
    ${S.token ? `<h3>♡ ${t('saved')} (${saved.length})</h3>${saved.map(j => `<div class="kv"><span>• ${esc(H ? j.title_hi : j.title_en)} — ${esc(j.pay_hi)}</span><a href="/jobs/${j.id}" data-link>${t('view')} ➜</a></div>`).join('')}` : ''}
    ${S.token ? `<button class="btn sec" onclick="window._doLogout()">↩ ${t('logout')}</button>` : ''}</div>`;
  };
  window._saveP = () => { S.profile = { name: document.getElementById('pname').value, phone: document.getElementById('pphone').value, village: document.getElementById('pvill').value, district: document.getElementById('pdist').value }; saveProfile(); toast('✅ Saved'); location.href = '/'; };
  Pages['route:settings'] = async () => {
    const H = hi();
    return `<h2>⚙️ ${H ? 'सेटिंग' : 'Settings'}</h2><div class="card">
    <label>🌐 ${H ? 'भाषा / बोली' : 'Language'}</label><select id="langSel2">${(await import('./i18n.js')).LANGS.map(l => `<option value="${l.v}" ${l.v === S.lang ? 'selected' : ''}>${l.n}</option>`).join('')}</select>
    <p class="footer">Marwari • Mewari • Dhundhari • Harauti • Shekhawati • Wagdi — ${H ? 'ऑडियो-सहायता सहित' : 'with assisted audio'}</p>
    <button class="btn" onclick="window._saveLang()">${t('save')}</button></div>
    <div class="card"><b>🏢 ${H ? 'नियोक्ता हैं?' : 'Employer?'}</b><p>${H ? 'सत्यापन के बाद ही सूची। कोई फीस नहीं।' : 'Listing only after verification.'}</p><a class="btn warn" href="/employer" data-link>📝 ${t('employer')}</a></div>`;
  };
  window._saveLang = async () => { const { setLang } = await import('./i18n.js'); setLang(document.getElementById('langSel2').value); location.href = '/settings'; };
  Pages['route:login'] = async () => {
    const H = hi();
    return `<h2>🔑 ${t('login')}</h2><div class="card"><label>${H ? 'मोबाइल' : 'Mobile'}</label><input id="lphone" inputmode="numeric" value="${esc(S.profile.phone)}">
    <label>${H ? '4-अंक PIN' : '4-digit PIN'}</label><input id="lpin" type="password" inputmode="numeric" maxlength="12">
    <button class="btn" style="width:100%" onclick="window._doLogin()">🔑 ${t('login')}</button>
    <p style="text-align:center"><a href="/register" data-link>${t('signup')}</a></p></div>`;
  };
  Pages['route:register'] = async () => {
    const H = hi();
    return `<h2>📝 ${t('signup')} (${H ? 'मुफ्त' : 'free'})</h2><div class="card">
    <label>${H ? 'आपका नाम *' : 'Your name *'}</label><input id="rname" value="${esc(S.profile.name)}">
    <label>${H ? 'मोबाइल *' : 'Mobile *'}</label><input id="rphone" inputmode="numeric" value="${esc(S.profile.phone)}">
    <label>${H ? '4-अंक PIN *' : '4-digit PIN *'}</label><input id="rpin" type="password" inputmode="numeric" maxlength="12">
    <label>${H ? 'गांव' : 'Village'}</label><input id="rvill" value="${esc(S.profile.village)}">
    <button class="btn" style="width:100%" onclick="window._doRegister()">✅ ${t('signup')}</button>
    <p class="footer">${H ? 'PIN ही पासवर्ड है — किसी को न बताएं।' : 'PIN is your password — never share.'}</p></div>`;
  };
  window._doRegister = async () => {
    const r = await api('/api/auth/register', { method: 'POST', body: JSON.stringify({ name: document.getElementById('rname').value, phone: document.getElementById('rphone').value, pin: document.getElementById('rpin').value, village: document.getElementById('rvill').value || '', district: S.profile.district || 'Jaipur' }) });
    if (r.ok) { S.token = r.token; localStorage.setItem('shakti_token', r.token); S.profile = { name: r.user.name, phone: r.user.phone, village: r.user.village, district: r.user.district }; saveProfile(); toast('✅'); location.href = '/'; }
    else toast('⚠️ ' + (r.error || 'error'));
  };
  window._doLogin = async () => {
    const r = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ phone: document.getElementById('lphone').value, pin: document.getElementById('lpin').value }) });
    if (r.ok) { S.token = r.token; localStorage.setItem('shakti_token', r.token); S.profile = { name: r.user.name, phone: r.user.phone, village: r.user.village, district: r.user.district }; saveProfile(); toast('✅'); location.href = '/'; }
    else toast('⚠️ ' + (r.error || 'error'));
  };
  window._doLogout = () => { S.token = ''; localStorage.removeItem('shakti_token'); location.href = '/'; };
  Pages['route:employer'] = async () => {
    const H = hi();
    return `<h2>🏢 ${t('employer')}</h2><div class="card">
    <label>${H ? 'संगठन *' : 'Organisation *'}</label><input id="ename">
    <label>${H ? 'प्रकार' : 'Type'}</label><select id="etype"><option>SHG</option><option>Registered company</option><option>Registered NGO</option><option>Cooperative</option><option>FPO</option><option>Government</option><option>Verified local business</option></select>
    <label>${H ? 'जिला' : 'District'}</label><input id="edist">
    <label>${H ? 'संपर्क *' : 'Contact *'}</label><input id="econtact">
    <label>${H ? 'काम का विवरण' : 'Job detail'}</label><textarea id="ejob" rows="3"></textarea>
    <button class="btn" style="width:100%" onclick="window._doEmployer()">📩 ${t('submit')}</button>
    <p class="footer">${H ? 'पहचान + संपर्क + पता जांच → अनुमोदन। फीस वाली सूची कभी नहीं।' : 'ID + contact + address check → approval.'}</p></div>`;
  };
  window._doEmployer = async () => {
    const r = await api('/api/employers/apply', { method: 'POST', body: JSON.stringify({ name: document.getElementById('ename').value, type: document.getElementById('etype').value, district: document.getElementById('edist').value, contact: document.getElementById('econtact').value, job: document.getElementById('ejob').value }) });
    if (r.ok) { toast('✅'); location.href = '/'; } else toast(r.error || 'error');
  };

  /* ----- admin ----- */
  Pages['route:admin'] = async () => {
    const H = hi();
    if (!S.adminToken) return `<h2>🔐 ${t('admin')}</h2><div class="card"><label>Username</label><input id="auser" autocomplete="username">
    <label>Password</label><input id="apw" type="password" autocomplete="current-password">
    <button class="btn" style="width:100%" onclick="window._doAdminLogin()">Login</button>
    <p class="footer">super_admin / moderator / verifier</p></div>`;
    const [o, reps, jobs, hunarA] = await Promise.all([api('/api/admin/overview'), api('/api/admin/reports'), api('/api/admin/jobs'), api('/api/admin/hunar').catch(() => ({ profiles: [], interests: [] }))]);
    const pendH = (hunarA.profiles || []).filter(p => p.status === 'pending');
    return `<h2>🔐 ${t('admin')} <span class="badge b-blue">${esc(S.adminRole)}</span></h2>
    <div class="card"><b>Counts</b><br>Jobs ${o.counts?.jobs} (✅${o.counts?.verified} ⛔${o.counts?.suspended}) • Apps ${o.counts?.applications} • Reports ${o.counts?.reports} (new ${o.counts?.open_reports}) • Hunar ${o.counts?.hunar} (pending ${o.counts?.pending_hunar}) • Employers⏳ ${o.counts?.pending_employers} • Events ${o.counts?.events}</div>
    <div class="card"><h3>🌟 Hunar pending (${pendH.length})</h3>${pendH.slice(0, 10).map(p => `<div class="kv"><span>${esc(p.name)} • ${(p.skills || []).join(',')} • ${esc(p.district)} • ${esc(p.status)}</span><span><button onclick="window._mod('hunar','${p.id}','approved')">✓</button> <button onclick="window._mod('hunar','${p.id}','rejected')">✕</button></span></div>`).join('') || 'none'}</div>
    <div class="card"><h3>🚩 Reports (${(reps.reports || []).length})</h3>${(reps.reports || []).slice(0, 10).map(r => `<div class="kv"><span>${esc(r.id)} • ${esc(r.reason)} • ${esc(r.job_id || '')} • <b>${esc(r.status)}</b></span><span><button onclick="window._mod('report','${r.id}','actioned',true)">block</button> <button onclick="window._mod('report','${r.id}','reviewing')">review</button></span></div>`).join('')}</div>
    <div class="card"><h3>🏢 Employers (${(reps.employerRequests || []).length})</h3>${(reps.employerRequests || []).map(e => `<div class="kv"><span>${esc(e.name)} • ${esc(e.type)} • ${esc(e.status)}</span><span><button onclick="window._mod('employer','${e.id}','approved')">✓</button> <button onclick="window._mod('employer','${e.id}','rejected')">✕</button></span></div>`).join('') || 'none'}</div>
    <div class="card"><h3>📋 Jobs</h3>${(jobs.jobs || []).map(j => `<div class="kv"><span>${j.id} ${j.verified ? '✅' : '⏳'} ${esc(j.title_hi).slice(0, 28)} • ${j.status}</span><span><button onclick="window._mod('job','${j.id}','suspended')">⛔</button> <button onclick="window._mod('job','${j.id}','published')">✓</button></span></div>`).join('')}</div>
    <button class="btn sec" onclick="sessionStorage.removeItem('shakti_admin');S.adminToken='';location.href='/'">Logout</button>`;
  };
  window._doAdminLogin = async () => {
    const r = await api('/api/admin/login', { method: 'POST', body: JSON.stringify({ username: document.getElementById('auser').value, password: document.getElementById('apw').value }) });
    if (r.ok) { S.adminToken = r.token; S.adminRole = r.role || ''; sessionStorage.setItem('shakti_admin', r.token); sessionStorage.setItem('shakti_admin_role', S.adminRole); render(); }
    else toast('⚠️ ' + (r.error || 'error'));
  };
  window._mod = async (kind, id, status, sj) => { await api('/api/admin/moderate', { method: 'POST', body: JSON.stringify({ kind, id, status, suspendJob: !!sj }) }); render(); };

  /* ----- analytics (public-safe) ----- */
  Pages['route:analytics'] = async () => {
    const d = await api('/api/jobs?verifiedOnly=false');
    const byD = {}, byC = {};
    (d.jobs || []).forEach(j => { byD[j.district] = (byD[j.district] || 0) + 1; byC[j.category] = (byC[j.category] || 0) + 1; });
    const row = (o) => Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) => `<div class="kv"><span>${esc(k)}</span><b>${v}</b></div>`).join('');
    return `<h2>📊 ${t('analytics')}</h2><div class="card"><h3>${hi() ? 'जिलेवार सूची' : 'By district'}</h3>${row(byD)}</div>
    <div class="card"><h3>${hi() ? 'श्रेणीवार' : 'By category'}</h3>${row(byC)}</div>
    <p class="footer">${hi() ? 'केवल सार्वजनिक सूची-गणना — कोई व्यक्तिगत डेटा नहीं।' : 'Public listing counts only — no personal data.'}</p>`;
  };

  /* ----- pitch + about ----- */
  Pages['route:pitch'] = async () => {
    const H = hi();
    return `<a href="/" data-link>← SHAKTI</a><h2>📊 SHAKTI — Panel Pitch</h2>
    <div class="card"><h3>1. ${H ? 'समस्या' : 'Problem'}</h3><p>${H ? '75% से अधिक ग्रामीण कामकाजी महिलाएं असंगठित कृषि श्रम में हैं। काम पास में होते हुए भी महिलाएं उसे खोज, पहुंच, भरोसा या बच्चों के साथ संतुलन नहीं कर पातीं।' : '75%+ rural working women are in informal agri labour. Even when work exists nearby, women cannot find, reach, trust, or balance it.'}</p></div>
    <div class="card"><h3>2. ${H ? 'समाधान — एक महिला की कहानी' : 'Solution — one woman’s journey'}</h3><p>🔍 ${H ? 'पास का काम' : 'nearby work'} → 🏠 ${H ? 'घर से' : 'home'} → 🔊 ${H ? 'सुनें' : 'listen'} → 📝 3 ${H ? 'सवाल आवेदन' : 'question apply'} → 🌟 ${H ? 'हुनर दिखाएं' : 'showcase skill'} → 📚 ${H ? 'मुफ्त सीखें' : 'learn free'} → 👶 ${H ? 'आंगनवाड़ी' : 'childcare'} → 🔐 ${H ? 'एडमिन' : 'admin'}</p></div>
    <div class="card"><h3>3. Safety</h3><p>${H ? 'सत्यापन (सरकारी/पंजीकृत/SHG/FPO/सहकारी) → अनुमोदन/निलंबन → पुनः जांच। अग्रिम फीस/OTP वाली सूची कभी नहीं। हेल्पलाइन 181/1930।' : 'Verification → approve/suspend → re-check. Never advance-fee/OTP listings. Helplines 181/1930.'}</p></div>
    <div class="card"><h3>4. ₹22L ${H ? 'संकेत विभाजन (अनुमानित)' : 'indicative split'}</h3><p>Design 2.5 • Build 6 • Safety 2.5 • Content 2 • Data/APIs 2 • Pilot 2 • Hosting 1.5 • Training 1.5</p><p class="footer">${H ? 'चुनौती अनुमान — स्वीकृत बजट नहीं' : 'Challenge estimate — not approved budget'}</p></div>
    <div class="card"><h3>5. Ask</h3><p>${H ? 'पायलट अनुमति + WCD आंगनवाड़ी डेटा + SHG रजिस्ट्री + SSO/Sewadwaar + SHG साझेदार। सफलता = आवेदन → साक्षात्कार → नियुक्ति + सुरक्षा।' : 'Pilot approval + WCD data + SHG registries + SSO/Sewadwaar + field partners.'}</p></div>`;
  };
  Pages['route:about'] = async () => {
    const H = hi();
    return `<h2>ℹ️ ${t('about')}</h2><div class="card"><p>${H ? 'राजस्थान की महिला श्रमशक्ति असंगतिपूर्वक असंगठित कृषि श्रम में केंद्रित है — 75% से अधिक ग्रामीण कामकाजी महिलाएं कृषक या कृषि मजदूर हैं — जबकि असुरक्षित आवागमन, बच्चों का बोझ और पास के औपचारिक अवसरों की अदृश्यता उन्हें बेहतर, स्थिर काम से दूर रखती है, भले ही ऐसा काम पास में हो।' : 'Rajasthan’s female workforce remains overwhelmingly concentrated in unpaid or low-productivity agricultural labour — over 75% of working rural women are cultivators or agricultural labourers — while unsafe mobility, childcare burden, and invisibility of nearby formal opportunities lock them out of better-paying, stable work, even when such work exists nearby.'}</p>
    <p>🌸 <b>SHAKTI</b> — ${H ? 'पहुंच-योग्य अवसर + सुरक्षा + सम्मान + आर्थिक भागीदारी।' : 'accessible opportunity + safety + dignity + economic participation.'}</p></div>
    <div class="card"><b>${H ? 'ईमानदार सीमाएं' : 'Honest limits'}</b><ul><li>Anganwadi = demo</li><li>Certificates = learning proof</li><li>Dialects = assisted audio</li><li>Verified ≠ 100% guarantee</li></ul></div>`;
  };
  Pages['route:feedback'] = async () => { location.href = '/help'; return ''; };
}

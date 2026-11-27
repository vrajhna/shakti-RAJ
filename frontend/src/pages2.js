import { t } from './i18n.js';
import { S, saveProfile, toast, esc, api, A, track, speak, listenInto, IMG, jobImg, vBadge, jobCard, hunarCard, slideshow, learnImg } from './ui.js';

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

  /* ----- LEARN UNIVERSITY ----- */
  Pages['route:learn'] = async () => {
    const path = location.pathname, seg = path.split('/').filter(Boolean);
    if (seg[1] === 'course' && seg[3] === 'lesson') return Pages.learnLesson(seg[2], seg[4]);
    if (seg[1] === 'course' && seg[2]) return Pages.learnCourse(seg[2]);
    if (seg[1] === 'my-learning') return Pages.learnMine();
    if (seg[1] === 'bookmarks') return Pages.learnMine(true);
    return Pages.learnHome(new URLSearchParams(location.search));
  };
  Pages.learnHome = async (qs) => {
    const H = hi();
    const [cats, courses] = await Promise.all([
      api('/api/learn/categories').catch(() => ({ categories: [] })),
      api('/api/learn/courses?' + new URLSearchParams({ cat: qs.get('cat') || '', q: qs.get('q') || '' }).toString()).catch(() => ({ courses: [], count: 0 })),
    ]);
    const cat = qs.get('cat') || '';
    return `<h2>🎓 ${t('learn_title')}</h2><p>${t('learn_sub')}</p>
    <div class="searchbar"><input id="lq" value="${esc(qs.get('q') || '')}" placeholder="${t('search_course')}"><button onclick="window._learnSearch()">🔍</button>
    <button onclick="listenInto(document.getElementById('lq'))" title="voice">🎤</button></div>
    <div class="chips"><button class="chip ${!cat ? 'on' : ''}" onclick="location.href='/learn'">${t('all_categories')}</button>${(cats.categories || []).map(c => `<button class="chip ${cat === c.id ? 'on' : ''}" onclick="location.href='/learn?cat=${c.id}'">${c.icon} ${esc(H ? c.title_hi : c.title_en)}</button>`).join('')}</div>
    <div class="btnrow"><a class="btn sec" href="/learn/my-learning" data-link>📊 ${t('my_learning')}</a><a class="btn sec" href="/skills" data-link>📚 ${H ? 'पुराना स्किल सेक्शन' : 'Old skills'} ➜</a></div>
    <h3>${H ? 'शुरुआत हेतु 12 पूर्ण कोर्स' : '12 complete starter courses'} <span class="badge b-green">FREE</span></h3>
    <div class="photogrid">${(courses.courses || []).filter(c => c.status === 'published').map(c => `
      <a class="photocard" href="/learn/course/${c.id}" data-link><img class="ph" loading="lazy" decoding="async" src="${learnImg(c)}" onerror="this.style.display='none'">
      <span class="lbl">📖 ${esc(H ? c.title_hi : c.title_en)}<small>${c.lessons || ''} ${t('lessons_n')} • ${esc(c.dur || '')}</small></span></a>`).join('') || `<p>${t('learn_empty')}</p>`}</div>
    ${(courses.courses || []).some(c => c.status === 'planned') ? `<h3>${H ? 'जल्द आने वाले' : 'Coming soon'}</h3><p>${(courses.courses || []).filter(c => c.status === 'planned').map(c => `<span class="skilltag">${esc(H ? c.title_hi : c.title_en)}</span>`).join('')}</p>` : ''}
    <div class="card"><b>🛡️ ${H ? 'हमेशा मुफ्त' : 'Always free'}</b><p class="small">${H ? 'कोई फीस, कोई प्रीमियम, कोई लॉक नहीं। प्रमाणपत्र सीखने का प्रमाण है।' : 'No fees, no premium, no locks. Certificates are learning proof.'}</p></div>`;
  };
  window._learnSearch = () => { const q = document.getElementById('lq').value; location.href = '/learn' + (q ? '?q=' + encodeURIComponent(q) : ''); };
  Pages.learnCourse = async (id) => {
    const H = hi();
    const d = await api('/api/learn/courses/' + id);
    if (!d.course) return '<p>Not found</p>';
    const c = d.course, done = d.done || [];
    const pct = d.lessons.length ? Math.round(done.length / d.lessons.length * 100) : 0;
    const byMod = {};
    (d.modules || []).forEach(m => byMod[m.id] = { ...m, ls: [] });
    (d.lessons || []).forEach(l => { (byMod[l.module_id] || (byMod[l.module_id] = { title_hi: '', title_en: '', ls: [] })).ls.push(l); });
    return `<a href="/learn" data-link>← ${t('back')}</a><div class="card"><div class="topimg">${c.img ? '' : '📖'}</div>
    <img class="imgcover ph" src="${learnImg(c)}" onerror="this.style.display='none'">
    <h2>${esc(H ? c.title_hi : c.title_en)}</h2>
    <div><span class="badge b-green">FREE</span> <span class="badge b-blue">${esc(c.level || '')}</span> <span class="badge b-grey">${esc(c.translation_status || '')}</span> <span class="badge b-grey">📝 ${esc(c.review_status || c.status || '')}</span></div>
    <p>${esc(H ? c.desc_hi : c.desc_en)}</p>
    <div class="kv"><span>${t('progress_tag')}</span><b>${pct}% (${done.length}/${d.lessons.length})</b></div>
    <div style="background:#eee;border-radius:8px;height:10px"><div style="background:var(--green);height:10px;border-radius:8px;width:${pct}%"></div></div>
    <div style="margin:8px 0">${(c.skills || []).map(s => `<span class="skilltag">✅ ${esc(s)}</span>`).join('')}</div>
    <div class="btnrow"><button class="btn yel" data-speak="${esc(H ? c.title_hi + '. ' + c.desc_hi : c.title_en + '. ' + c.desc_en).slice(0, 300)}">🔊 ${t('listen_l')}</button>
    ${S.token ? `<button class="btn sec" onclick="window._bmCourse('${c.id}')">♡ ${t('bookmarks_l')}</button>` : `<a class="btn sec" href="/login" data-link>🔑 ${t('login')}</a>`}</div></div>
    ${Object.values(byMod).map(m => `<div class="card"><h3>📦 ${esc(H ? (m.title_hi || c.title_hi) : (m.title_en || c.title_en))}</h3>${(m.ls || []).map((l, i) => `<div class="kv"><span>${done.includes(l.id) ? '✅' : '⭕'} <a href="/learn/course/${c.id}/lesson/${l.id}" data-link>${esc(H ? l.title_hi : l.title_en)}</a> <small>• ${l.mins || 5} ${t('min_n')}</small></span><span>${l.quiz_n > 0 ? '❓' : ''}</span></div>`).join('')}</div>`).join('')}
    ${(d.relatedJobs || []).length ? `<div class="card"><h3>💼 ${t('related_jobs')}</h3>${d.relatedJobs.map(j => `<div class="kv"><span>• ${esc(j.title_hi)} — ${esc(j.pay_hi)} (${esc(j.district)})</span><a href="/jobs/${j.id}" data-link>${t('view')} ➜</a></div>`).join('')}</div>` : ''}
    <div class="card"><b>💬 ${H ? 'समीक्षा' : 'Reviews'}</b><div id="revList">…</div><div class="chatrow"><input id="rvMsg" placeholder="${H ? 'क्या सीखा?' : 'What did you learn?'}"><button class="btn sec" onclick="window._doReview('${c.id}')">📩</button></div></div>`;
  };
  window._bmCourse = async (id) => { if (!S.token) { location.href = '/login'; return; } await api('/api/learn/bookmarks', { method: 'POST', body: JSON.stringify({ courseId: id }) }); toast('♡'); };
  window._doReview = async (id) => {
    if (!S.token) { location.href = '/login'; return; }
    await api('/api/learn/reviews', { method: 'POST', body: JSON.stringify({ courseId: id, rating: 5, message: document.getElementById('rvMsg').value }) });
    toast('✅'); document.getElementById('rvMsg').value = '';
  };
  Pages.learnLesson = async (cid, lid) => {
    const H = hi();
    const d = await api('/api/learn/lessons/' + lid);
    if (!d.lesson) return '<p>Not found</p>';
    const l = d.lesson, qz = d.quiz || [];
    window._QZ = qz; window._QH = hi();
    return `<a href="/learn/course/${cid}" data-link>← ${t('back')}</a><div class="card">
    <h2>${esc(H ? l.title_hi : l.title_en)}</h2>
    <div class="btnrow"><button class="btn yel" data-speak="${esc(H ? l.title_hi + '. ' + l.body_hi : l.title_en + '. ' + (l.body_en || '')).slice(0, 400)}">🔊 ${t('listen_l')}</button></div>
    <p style="font-size:19px">${esc(H ? l.body_hi : (l.body_en || l.body_hi))}</p>
    ${(l.steps_hi || []).length ? `<h3>👣 ${H ? 'चरण' : 'Steps'}</h3><div>${(H ? l.steps_hi : (l.steps_en && l.steps_en.length ? l.steps_en : l.steps_hi)).map((s, i) => `<div class="step"><b>${i + 1}.</b> ${esc(s)}</div>`).join('')}</div>` : ''}
    ${l.practice_hi ? `<div class="safebox">✋ <b>${t('practice_l')}:</b> ${esc(H ? l.practice_hi : (l.practice_en || l.practice_hi))}</div>` : ''}
    <div id="quizBox">${qz.length ? `<h3>❓ Quiz (${qz.length})</h3><div id="qBody"></div>` : ''}</div>
    <div class="btnrow">
      ${d.prev ? `<a class="btn sec" href="/learn/course/${cid}/lesson/${d.prev}" data-link>← ${t('prev_lesson')}</a>` : ''}
      ${S.token ? `<button class="btn" onclick="window._completeLesson('${l.id}')">✅ ${t('mark_done')}</button>` : `<a class="btn sec" href="/login" data-link>🔑 ${t('login')}</a>`}
      ${d.next ? `<a class="btn sec" href="/learn/course/${cid}/lesson/${d.next}" data-link>${t('next_lesson')} →</a>` : ''}
    </div><div id="doneOut"></div></div>`;
  };
  window._quizState = { i: 0, answers: [] };
  window._startQuiz = () => {
    const qz = window._QZ || [], H = window._QH;
    const box = document.getElementById('qBody'); if (!box || !qz.length) return;
    window._quizState = { i: 0, answers: [] };
    const show = () => {
      const st = window._quizState, q = qz[st.i];
      const opts = (H ? q.options_hi : (q.options_en && q.options_en.length ? q.options_en : q.options_hi)) || [];
      box.innerHTML = `<p><b>${t('quiz_of')} ${st.i + 1}/${qz.length}:</b> ${esc(H ? q.question_hi : (q.question_en || q.question_hi))}</p>
      ${opts.map((o, k) => `<button class="btn sec" style="width:100%;text-align:left" onclick="window._answerQuiz(${k})">${esc(o)}</button>`).join('')}<div id="qFb"></div>`;
    };
    show();
    window._answerQuiz = async (k) => {
      const st = window._quizState, q = qz[st.i];
      st.answers[st.i] = k;
      const ok = Number(k) === Number(q.answer);
      document.getElementById('qFb').innerHTML = `<div class="${ok ? 'safebox' : 'warnbox'}">${ok ? t('correct_msg') : t('wrong_msg')}${q.explain_hi ? '<br><small>' + esc(H ? q.explain_hi : (q.explain_en || q.explain_hi)) + '</small>' : ''}</div>
      ${st.i + 1 < qz.length ? `<button class="btn" onclick="window._nextQuiz()">${t('next_lesson')} →</button>` : `<button class="btn" onclick="window._finishQuiz()">${t('quiz_check')} ✓</button>`}`;
    };
    window._nextQuiz = () => { window._quizState.i++; show(); const b = document.getElementById('qBody'); };
    window._finishQuiz = async () => {
      const st = window._quizState;
      if (S.token) {
        const r = await api('/api/learn/quiz', { method: 'POST', body: JSON.stringify({ quizId: qz[0].id, answers: st.answers }) }).catch(() => null);
        if (r && r.ok) document.getElementById('qFb').innerHTML += `<div class="safebox">📊 ${r.score}/${r.total}</div>`;
      } else {
        const score = qz.filter((q, i) => Number(st.answers[i]) === Number(q.answer)).length;
        document.getElementById('qFb').innerHTML += `<div class="safebox">📊 ${score}/${qz.length} — <a href="/login" data-link>${t('login')}</a></div>`;
      }
    };
  };
  window._completeLesson = async (lid) => {
    const r = await api('/api/learn/lessons/' + lid + '/complete', { method: 'POST', body: JSON.stringify({}) });
    if (r.ok) { document.getElementById('doneOut').innerHTML = `<div class="safebox">🎉 ${esc(hi() ? r.message_hi : 'Done!')} (${r.done}/${r.total})</div>`; speak(hi() ? r.message_hi : 'Done'); }
  };
  Pages.learnMine = async (onlyBm) => {
    const H = hi();
    if (!S.token) return `<div class="card"><h2>📊 ${t('my_learning')}</h2><p>${t('login_to_learn')}</p><a class="btn" href="/login" data-link>🔑 ${t('login')}</a></div>`;
    const d = await api('/api/learn/my-learning');
    const bar = (a, b) => { const p = b ? Math.round(a / b * 100) : 0; return `<div style="background:#eee;border-radius:8px;height:10px"><div style="background:var(--green);height:10px;border-radius:8px;width:${p}%"></div></div>`; };
    return `<h2>📊 ${t('my_learning')}</h2>
    ${(d.started || []).map(c => `<div class="card"><b>${esc(c.title_hi)}</b><div class="kv"><span>${H ? 'प्रगति' : 'Progress'}</span><b>${c.done}/${c.total}</b></div>${bar(Number(c.done), Number(c.total))}<a class="btn sec" href="/learn/course/${c.id}" data-link>${t('continue_l')} ➜</a></div>`).join('') || `<p>${t('learn_empty')}</p>`}
    <h3>🎓 ${H ? 'पूर्ण' : 'Completed'} (${(d.completed || []).length})</h3>
    <h3>♡ ${t('bookmarks_l')} (${(d.bookmarks || []).length})</h3>
    ${(d.bookmarks || []).map(c => `<div class="kv"><span>♡ <a href="/learn/course/${c.id}" data-link>${esc(c.title_hi)}</a></span></div>`).join('') || `<p>${t('bookmarks_empty')}</p>`}`;
  };
  Pages['route:schemes'] = async () => {
    const H = hi();
    const d = await api('/api/schemes');
    return `<h2>🏛️ ${t('schemes_title')}</h2><p class="small">📢 ${t('schemes_note')}</p>
    ${(d.schemes || []).map(s => `<div class="card"><b>${esc(H ? s.title_hi : s.title_en)}</b> <span class="badge b-blue">${esc(s.dept)}</span>
    <p>💰 ${esc(H ? s.benefit_hi : s.benefit_en)}</p><div class="kv"><span>👩 ${esc(H ? s.who_hi : s.who_en)}</span></div>
    <a class="btn sec" href="${esc(s.portal)}" target="_blank" rel="noopener">🌐 ${H ? 'आधिकारिक पोर्टल' : 'Official portal'} ↗</a></div>`).join('')}`;
  };
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

  /* ----- help: FULL-SCREEN chat ----- */
  Pages['route:help'] = async () => {
    const H = hi();
    const qs = H ? ['घर से काम चाहिए', 'सिलाई आती है', 'धोखे से कैसे बचें?', 'SHG से कैसे जुड़ें?'] : ['Home-based work', 'I know stitching', 'Avoid fraud?', 'Join SHG?'];
    return `<h2>🤖 ${H ? 'SHAKTI सहायक' : 'SHAKTI assistant'}</h2>
    <div class="chatfull">
      <div class="chatbox" id="chatbox"><div class="msg b">🌸 ${H ? 'नमस्ते! मैं पूरी स्क्रीन पर आपकी मदद के लिए हूं। काम, हुनर, सुरक्षा — कुछ भी पूछें।' : 'Hello! I am here full-screen to help. Ask about work, skills, safety.'}</div></div>
      <div class="chatqs">${qs.map(q => `<button class="chip" onclick="window._qAsk(this)" data-q="${esc(q)}">💬 ${esc(q)}</button>`).join('')}</div>
      <div class="chatinput"><div class="chatrow"><input id="hq" enterkeyhint="send" placeholder="${H ? 'पूछें… (Enter दबाएं)' : 'Ask… (press Enter)'}" autocomplete="off"><button class="btn yel" onclick="listenInto(document.getElementById('hq'))" aria-label="voice">🎤</button><button class="btn" onclick="window._doHelp()" aria-label="send">➤</button></div></div>
    </div>
    <div class="card"><b>📞 ${H ? 'हेल्पलाइन' : 'Helplines'}</b><div class="btnrow"><a class="btn warn" href="tel:181">📞 181</a><a class="btn warn" href="tel:1930">📞 1930</a><a class="btn warn" href="tel:112">📞 112</a></div></div>
    <div class="card"><b>💡 ${t('feedback')}</b><div class="chatrow"><input id="fb" placeholder="${H ? 'सुझाव लिखें…' : 'Write suggestion…'}"><button class="btn sec" onclick="window._doFeedback()">📩</button></div></div>`;
  };
  window._qAsk = (b) => { document.getElementById('hq').value = b.getAttribute('data-q'); window._doHelp(); };
  window._doHelp = async () => {
    const q = document.getElementById('hq').value; if (!q.trim()) return;
    const box = document.getElementById('chatbox');
    box.innerHTML += `<div class="msg u">${esc(q)}</div>`; document.getElementById('hq').value = '';
    const bid = 'b' + Date.now();
    box.innerHTML += `<div class="msg b" id="${bid}">💭 …</div>`; box.scrollTop = box.scrollHeight;
    const t0 = Date.now();
    try {
      const r = await fetch(A('/api/ai-help/stream'), { method: 'POST', headers: { 'Content-Type': 'application/json', ...(S.token ? { Authorization: 'Bearer ' + S.token } : {}) }, body: JSON.stringify({ message: q, lang: S.lang }) });
      if (!r.ok || !r.body) throw new Error('stream');
      const reader = r.body.getReader(); const dec = new TextDecoder(); let buf = '', txt = '', eng = '', jobs = [];
      const el = () => document.getElementById(bid);
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split('\n\n'); buf = parts.pop();
        for (const part of parts) {
          const line = part.split('\n').map(l => l.trim()).find(l => l.startsWith('data:'));
          if (!line) continue;
          try {
            const d = JSON.parse(line.slice(5).trim());
            if (d.token) { txt += d.token; if (el()) el().innerHTML = '💬 ' + esc(txt); box.scrollTop = box.scrollHeight; }
            if (d.done) { eng = d.engine || ''; jobs = d.jobs || []; }
          } catch { }
        }
      }
      if (el()) el().innerHTML = '💬 ' + esc(txt) + `<small>engine: ${esc(eng)} • ${((Date.now() - t0) / 1000).toFixed(1)}s</small>`;
      if (jobs.length) box.innerHTML += jobs.map(jobCard).join('');
      box.scrollTop = box.scrollHeight; speak(txt.slice(0, 280));
    } catch {
      if (document.getElementById(bid)) document.getElementById(bid).innerHTML = '⚠️ ' + (S.lang === 'en' ? 'Connection issue — retry.' : 'संपर्क टूटा — दोबारा पूछें।');
    }
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
    <div class="card"><b>📲 ${t('install_app')}</b><p class="small">${t('install_note')}</p>
    <button class="btn" style="width:100%" onclick="window._doInstall()">📲 ${t('install_app')}</button></div>
    <div class="card"><b>🏢 ${H ? 'नियोक्ता हैं?' : 'Employer?'}</b><p>${H ? 'सत्यापन के बाद ही सूची। कोई फीस नहीं।' : 'Listing only after verification.'}</p><a class="btn warn" href="/employer" data-link>📝 ${t('employer')}</a></div>`;
  };
  window._saveLang = async () => { const { setLang } = await import('./i18n.js'); setLang(document.getElementById('langSel2').value); location.href = '/settings'; };
  window._doInstall = async () => {
    if (window._deferredPrompt) { window._deferredPrompt.prompt(); await window._deferredPrompt.userChoice.catch(() => {}); window._deferredPrompt = null; }
    else toast(S.lang === 'en' ? 'Browser menu → “Add to Home Screen / Install app”.' : 'ब्राउज़र मेन्यू → “होम स्क्रीन पर जोड़ें / Install app” दबाएं।');
  };
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); window._deferredPrompt = e; });
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
  Pages['route:employer'] = async (arg) => {
    if (arg === 'mine') return Pages['route:employer-mine']();
    const H = hi();
    return `<h2>🏢 ${t('employer')}</h2><div class="card">
    <label>${H ? 'संगठन *' : 'Organisation *'}</label><input id="ename">
    <label>${H ? 'प्रकार' : 'Type'}</label><select id="etype"><option>SHG</option><option>Registered company</option><option>Registered NGO</option><option>Cooperative</option><option>FPO</option><option>Government</option><option>Verified local business</option></select>
    <label>${H ? 'जिला' : 'District'}</label><input id="edist">
    <label>${H ? 'संपर्क *' : 'Contact *'}</label><input id="econtact">
    <label>${H ? 'काम का विवरण' : 'Job detail'}</label><textarea id="ejob" rows="3"></textarea>
    <button class="btn" style="width:100%" onclick="window._doEmployer()">📩 ${t('submit')}</button>
    <p class="footer">${H ? 'पहचान + संपर्क + पता जांच → अनुमोदन। फीस वाली सूची कभी नहीं।' : 'ID + contact + address check → approval.'}</p></div>
  <div class="card"><h3>📢 ${H ? 'सीधी भर्ती डालें (लॉगिन जरूरी)' : 'Post a real job (login required)'}</h3>
    <p class="small">${H ? 'भर्ती जांच के बाद ही live होगी। महिलाएं सीधे आवेदन करेंगी।' : 'Goes live only after verification. Women apply directly.'}</p>
    <label>${H ? 'संगठन *' : 'Organisation *'}</label><input id="jorg">
    <label>${H ? 'काम का नाम *' : 'Job title *'}</label><input id="jtitle">
    <label>${H ? 'वेतन' : 'Pay'}</label><input id="jpay" placeholder="₹8,000/माह">
    <label>${H ? 'गांव/शहर' : 'Village/City'}</label><input id="jvill">
    <label>${H ? 'संपर्क *' : 'Contact *'}</label><input id="jcontact">
    <label>${H ? 'विवरण' : 'Details'}</label><textarea id="jdesc" rows="2"></textarea>
    <label style="display:flex;gap:10px;align-items:center"><input type="checkbox" id="jhome" style="width:28px;height:28px;min-height:28px"> 🏠 ${H ? 'घर से हो सकता है' : 'Home-based possible'}</label>
    <button class="btn warn" style="width:100%" onclick="window._doEmpJob()">📢 ${H ? 'भर्ती भेजें' : 'Post job'}</button>
    <div class="btnrow"><a class="btn sec" href="/employer/mine" data-link>${H ? 'मेरी भर्तियां' : 'My postings'}</a></div></div>`;
  window._doEmpJob = async () => {
    if (!S.token) { toast(S.lang === 'en' ? 'Login to post a job' : 'भर्ती हेतु लॉगिन करें'); location.href = '/login'; return; }
    const r = await api('/api/employer/jobs', { method: 'POST', body: JSON.stringify({ org: document.getElementById('jorg').value, title_hi: document.getElementById('jtitle').value, pay_hi: document.getElementById('jpay').value, village: document.getElementById('jvill').value, contact: document.getElementById('jcontact').value, desc_hi: document.getElementById('jdesc').value, home_based: document.getElementById('jhome').checked }) });
    if (r.ok) toast('✅ ' + (hi() ? r.message_hi : r.message_en)); else toast('⚠️ ' + (r.error || 'error'));
  };
  };
  Pages['route:employer-mine'] = async () => {
    const H = hi();
    if (!S.token) { location.href = '/login'; return `<p>…</p>`; }
    const d = await api('/api/employer/jobs');
    return `<h2>📢 ${H ? 'मेरी भर्तियां' : 'My postings'}</h2>
    ${(d.jobs || []).map(j => `<div class="card"><b>${esc(j.title_hi)}</b> — ${esc(j.pay_hi)}<br><span class="badge ${j.status === 'published' ? 'b-green' : 'b-orange'}">${esc(j.status)}${j.verified ? ' ✅' : ''}</span><div class="kv"><span>${esc(j.id)} • ${esc((j.created_at || '').slice(0, 10))}</span></div></div>`).join('') || `<p>${H ? 'अभी कोई भर्ती नहीं' : 'No postings yet'}</p>`}
    <a class="btn sec" href="/employer" data-link>← ${t('back')}</a>`;
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
  /* ----- legal: terms / privacy / data-safety ----- */
  const legalShell = (title, bodyHi, bodyEn) => {
    const H = hi();
    return `<div class="card legal"><h2>${title}</h2>${H ? bodyHi : bodyEn}
    <div class="btnrow"><a class="btn sec" href="/help" data-link>💬 ${t('help')}</a><a class="btn sec" href="/safety" data-link>🛡️ ${t('safety')}</a></div></div>`;
  };
  Pages['route:terms'] = async () => legalShell(t('terms'),
    `<ul><li>SHAKTI मुफ्त है — कोई फीस, कोई प्रीमियम नहीं।</li><li>केवल सत्यापित सूचनाएं प्रकाशित होती हैं; अग्रिम फीस/OTP मांगने वाली सूची कभी नहीं।</li><li>गलत जानकारी पर रिपोर्ट करें — 48 घंटे में जांच।</li><li>खतरे में हों तो पहले 181/112 पर कॉल करें।</li></ul><p class="footer">यह प्रोटोटाइप नियमावली है — पायलट में विधिक समीक्षा होगी।</p>`,
    `<ul><li>SHAKTI is free — no fees, no premium.</li><li>Only verified listings are published; advance-fee/OTP listings never.</li><li>Report wrong info — reviewed in 48 hours.</li><li>In danger, call 181/112 first.</li></ul><p class="footer">Prototype terms — legal review in pilot.</p>`);
  Pages['route:privacy'] = async () => legalShell(t('privacy'),
    `<ul><li>मोबाइल नंबर आंशिक दिखता है (जैसे 98XXXX45) — पूरा नंबर सिर्फ लॉगिन पर।</li><li>आवेदन केवल संबंधित नियोक्ता व टीम को दिखता है।</li><li>एनालिटिक्स में सिर्फ गिनती — कोई व्यक्तिगत लोकेशन/शिकायत सार्वजनिक नहीं।</li><li>खाता मिटाने हेतु Help से लिखें।</li></ul>`,
    `<ul><li>Phone numbers are masked (e.g. 98XXXX45) — full number only after login.</li><li>Applications visible only to the employer and team.</li><li>Analytics counts only — no personal location/complaints public.</li><li>To delete your account, write via Help.</li></ul>`);
  Pages['route:data-safety'] = async () => legalShell(t('datasec'),
    `<ul><li>पासवर्ड (PIN) हैश होकर सुरक्षित रहता है — टीम भी नहीं देख सकती।</li><li>सभी ट्रैफ़िक एन्क्रिप्टेड (HTTPS)। गुप्त चाबियां सिर्फ सर्वर पर।</li><li>OTP/आधार/बैंक डिटेल SHAKTI कभी नहीं मांगता — मांगे तो 1930 पर रिपोर्ट करें।</li><li>नियमित सुरक्षा जांच व ऑडिट लॉग।</li></ul>`,
    `<ul><li>PINs stored hashed — even the team cannot see them.</li><li>All traffic encrypted (HTTPS). Secrets stay server-side.</li><li>SHAKTI never asks OTP/Aadhaar/bank — if asked, report to 1930.</li><li>Regular security checks and audit logs.</li></ul>`);

  Pages['route:feedback'] = async () => { location.href = '/help'; return ''; };
}

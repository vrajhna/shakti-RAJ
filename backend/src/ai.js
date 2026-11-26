'use strict';
// Meta AI gateway — server-side key only. Graceful fallback to local KB when no key.
const META_URL = process.env.META_API_URL || 'https://api.meta.ai/v1/chat/completions';
const META_MODEL = process.env.META_MODEL || 'muse-spark-1.3';
const META_KEY = () => process.env.META_API_KEY || '';

function aiEnabled() { return !!META_KEY(); }

async function metaChat(messages, maxTokens = 800) {
  if (!aiEnabled()) return null;
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), 30000);
  try {
    const r = await fetch(META_URL, {
      method: 'POST', signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + META_KEY() },
      body: JSON.stringify({ model: META_MODEL, messages, max_completion_tokens: maxTokens, reasoning_effort: 'low' }),
    });
    clearTimeout(to);
    if (!r.ok) { console.error('[ai] meta http', r.status); return null; }
    const j = await r.json();
    return (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || null;
  } catch (e) { clearTimeout(to); console.error('[ai] meta error', String(e.message || e).slice(0, 120)); return null; }
}

const SYSTEM = `You are SHAKTI Sahayak, a kind Rajasthan women-livelihood helper. Reply in the user's language (simple Hindi default, simple English when asked), under 150 words. RULES: (1) Never invent jobs, employers, verification, pay, schemes, or deadlines — use only the verified context given. (2) Never say an unverified listing is safe. (3) Always warn: never pay advance/registration fee, never share OTP/Aadhaar/bank details. (4) Suggest verified filters, SHG groups, free courses, Anganwadi search, helplines 181/1930.`;

// Local intent engine (works with zero keys — deterministic, no hallucination)
function localAssist(text, jobs) {
  const t = String(text || '').toLowerCase();
  const has = (...ws) => ws.some(w => t.includes(w));
  let list = jobs.filter(j => j.status === 'published');
  if (has('घर', 'home', 'ghar')) list = list.filter(j => j.home_based);
  if (has('सिलाई', 'silaa', 'stitch', 'tailor')) list = list.filter(j => /tailor|stitch|सिलाई/i.test(j.title_hi + ' ' + j.title_en + ' ' + j.category));
  if (has('पैक', 'pack')) list = list.filter(j => /pack/i.test(j.category + ' ' + j.title_en));
  if (has('ब्यूटी', 'beauty', 'parlour')) list = list.filter(j => j.category === 'beauty');
  if (has('बच्च', 'child', 'anganwadi', 'आंगन')) {
    return { intent: 'childcare', reply_hi: 'आंगनवाड़ी खोज पेज पर गांव/पिनकोड लिखें। बच्चों के साथ हो सकने वाले काम हेतु “childcare” फिल्टर लगाएं।', reply_en: 'Open Childcare, enter village/pincode. Use the childcare filter for compatible jobs.', jobs: list.slice(0, 3) };
  }
  if (has('सीख', 'sikha', 'learn', 'course', 'कोर्स')) {
    return { intent: 'learn', reply_hi: '“कुछ सीखें” पेज पर 12 मुफ्त कोर्स हैं — सिलाई, ब्यूटी, UPI सुरक्षा, अचार व्यवसाय। कोई फीस नहीं।', reply_en: 'Open Learn — 12 free courses, no fees.', jobs: list.slice(0, 3) };
  }
  if (has('सुरक्षा', 'safe', 'fraud', 'धोखा', 'report')) {
    return { intent: 'safety', reply_hi: 'कभी अग्रिम फीस, OTP, आधार-बैंक डिटेल न दें। संदिग्ध लगे तो Report दबाएं। हेल्पलाइन: 1930 (साइबर), 181 (महिला)।', reply_en: 'Never pay advance, never share OTP/bank. Use Report. Helplines: 1930 cyber, 181 women.', jobs: list.slice(0, 3) };
  }
  if (!list.length) list = jobs.filter(j => j.status === 'published').slice(0, 3);
  const top = list.slice(0, 3);
  return {
    intent: 'jobs',
    reply_hi: top.length ? `आपके लिए ${top.length} सुरक्षित काम: ${top.map(j => j.title_hi).join(' | ')}। “सुनें” दबाकर विवरण सुन सकती हैं।` : 'इस खोज में कोई सत्यापित काम नहीं — फिल्टर हटाकर देखें।',
    reply_en: top.length ? `Found ${top.length} verified jobs: ${top.map(j => j.title_en).join(' | ')}` : 'No verified jobs for this search — clear filters.',
    jobs: top,
  };
}

module.exports = { aiEnabled, metaChat, SYSTEM, localAssist, META_MODEL };

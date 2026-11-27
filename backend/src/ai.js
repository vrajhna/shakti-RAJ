'use strict';
// Meta AI gateway — server-side key only. Graceful fallback to local KB when no key.
// Llama API (llama.com) is OpenAI-compatible. If one base URL 404s, try the other.
const META_URLS = [process.env.META_API_URL, 'https://api.llama.com/v1/chat/completions', 'https://api.meta.ai/v1/chat/completions'].filter(Boolean);
const META_URL = META_URLS[0];
const META_MODEL = process.env.META_MODEL || 'muse-spark-1.3';
const META_KEY = () => (process.env.META_API_KEY || '').trim().replace(/^["']+|["']+$/g, '');

function aiEnabled() { return !!META_KEY(); }

function cleanBase(b) {
  const s = String(b || '').trim().replace(/\/+$/, '');
  return /^https?:\/\/[^/]+\/v1\/chat\/completions$/.test(s) ? s : null;
}
async function metaChat(messages, maxTokens = 800) {
  if (!aiEnabled()) return { text: null, metaStatus: 'no-key' };
  let last = 'unknown';
  for (const base0 of [...new Set(META_URLS)]) {
    const base = cleanBase(base0);
    if (!base) { last = 'bad-url'; continue; }
    for (const extra of [{ reasoning_effort: 'low' }, {}]) {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 25000);
      try {
        const r = await fetch(base, {
          method: 'POST', signal: ctrl.signal,
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + META_KEY() },
          body: JSON.stringify({ model: META_MODEL, messages, max_completion_tokens: maxTokens, ...extra }),
        });
        clearTimeout(to);
        if (!r.ok) { last = 'http-' + r.status; console.error('[ai] meta http', r.status, base); continue; }
        const j = await r.json();
        const txt = (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || null;
        if (txt) { if (base !== META_URL) console.log('[ai] working base:', base); return { text: txt, metaStatus: 'ok' }; }
        last = 'empty-content'; console.error('[ai] meta empty content', base);
      } catch (e) { clearTimeout(to); last = 'error'; console.error('[ai] meta error', String(e.message || e).slice(0, 120), base); }
    }
  }
  return { text: null, metaStatus: last };
}

const SYSTEM = `You are SHAKTI Sahayak, a kind Rajasthan women-livelihood helper. Reply in the user's language (simple Hindi default, simple English when asked). Keep EVERY reply under 90 words — short, chat-style, one idea at a time. RULES: (1) Never invent jobs, employers, verification, pay, schemes, or deadlines — use only the verified context given. (2) Never say an unverified listing is safe. (3) Always warn: never pay advance/registration fee, never share OTP/Aadhaar/bank details. (4) Suggest verified filters, SHG groups, free courses, Anganwadi search, helplines 181/1930.`;

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

async function metaChatStream(messages, maxTokens = 800, onToken) {
  for (const base0 of [...new Set(META_URLS)]) {
    const base = cleanBase(base0);
    if (!base) continue;
    for (const extra of [{ reasoning_effort: 'low' }, {}]) {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), 45000);
      try {
        const r = await fetch(base, {
          method: 'POST', signal: ctrl.signal,
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + META_KEY() },
          body: JSON.stringify({ model: META_MODEL, messages, max_completion_tokens: maxTokens || 800, stream: true, ...extra }),
        });
        if (!r.ok || !r.body) { clearTimeout(to); console.error('[ai] meta stream http', r.status, base); continue; }
        let buf = '', full = '';
        for await (const chunk of r.body) {
          buf += Buffer.from(chunk).toString('utf8');
          const parts = buf.split('\n\n'); buf = parts.pop();
          for (const part of parts) {
            const line = part.split('\n').map(l => l.trim()).find(l => l.startsWith('data:'));
            if (!line) continue;
            const data = line.slice(5).trim();
            if (!data || data === '[DONE]') continue;
            try {
              const tok = JSON.parse(data).choices?.[0]?.delta?.content;
              if (tok) { full += tok; onToken(tok); }
            } catch {}
          }
        }
        clearTimeout(to);
        if (full) { if (base !== META_URL) console.log('[ai] working base:', base); return full; }
      } catch (e) { clearTimeout(to); console.error('[ai] meta stream error', String(e.message || e).slice(0, 80), base); }
    }
  }
  return null;
}

module.exports = { aiEnabled, metaChat, metaChatStream, SYSTEM, localAssist, META_MODEL };

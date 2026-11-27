// SHAKTI Cloudflare Worker — serves the Vite PWA + proxies /api/* to Railway.
// Why a proxy? The frontend uses relative /api URLs, so there are no CORS
// problems and no API URL needs baking at build time.
// Runtime config: dashboard variable API_URL = https://<railway-service>.up.railway.app
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      const origin = url.origin;
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: {
            'access-control-allow-origin': origin,
            'access-control-allow-credentials': 'true',
            'access-control-allow-methods': 'GET,POST,OPTIONS',
            'access-control-allow-headers': 'Content-Type, Authorization',
          },
        });
      }
      // Public backend address fallback. Secrets/keys NEVER live here —
      // they stay in dashboards only. Dashboard API_URL (when set) always wins.
      const FALLBACK_API = 'https://shakti-raj-production.up.railway.app';
      const apiBase = (env.API_URL || FALLBACK_API).replace(/\/+$/, '');
      const target = apiBase + url.pathname + url.search;
      const headers = new Headers();
      for (const h of ['content-type', 'authorization', 'accept', 'accept-language']) {
        const v = request.headers.get(h);
        if (v) headers.set(h, v);
      }
      let upstream;
      try {
        upstream = await fetch(target, {
          method: request.method,
          headers,
          body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
          redirect: 'manual',
        });
      } catch {
        return new Response(JSON.stringify({ error: 'backend unreachable — Railway service starting? Check deploy logs.' }), {
          status: 502, headers: { 'content-type': 'application/json', 'access-control-allow-origin': origin },
        });
      }
      const out = new Headers(upstream.headers);
      const ct = (upstream.headers.get('content-type') || '').toLowerCase();
      if (!ct.includes('json') && !ct.includes('text/')) {
        // Upstream crashed (Railway HTML error page) — never leak HTML to the app
        const txt = await upstream.text().catch(() => '');
        console.log('upstream non-JSON', upstream.status, txt.slice(0, 120));
        return new Response(JSON.stringify({ error: 'backend error — check Railway deploy logs', status: upstream.status }), {
          status: 502, headers: { 'content-type': 'application/json', 'access-control-allow-origin': origin },
        });
      }
      out.set('access-control-allow-origin', origin);
      out.set('access-control-allow-credentials', 'true');
      out.set('vary', 'Origin');
      return new Response(upstream.body, { status: upstream.status, headers: out });
    }
    return env.ASSETS.fetch(request);
  },
};

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
      if (!env.API_URL) {
        return new Response(JSON.stringify({ error: 'API not configured — set API_URL variable' }), {
          status: 503, headers: { 'content-type': 'application/json' },
        });
      }
      const target = env.API_URL.replace(/\/+$/, '') + url.pathname + url.search;
      const headers = new Headers();
      for (const h of ['content-type', 'authorization', 'accept', 'accept-language']) {
        const v = request.headers.get(h);
        if (v) headers.set(h, v);
      }
      const upstream = await fetch(target, {
        method: request.method,
        headers,
        body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
        redirect: 'manual',
      });
      const out = new Headers(upstream.headers);
      out.set('access-control-allow-origin', origin);
      out.set('access-control-allow-credentials', 'true');
      out.set('vary', 'Origin');
      return new Response(upstream.body, { status: upstream.status, headers: out });
    }
    return env.ASSETS.fetch(request);
  },
};

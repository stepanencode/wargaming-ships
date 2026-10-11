// Mirrors "vars" in wrangler.jsonc.
interface Env {
  BUCKET_URL: string;
  API_ORIGIN: string;
}

// Conditional and range headers let the bucket answer 304/206.
const FORWARDED_HEADERS = ['if-none-match', 'if-modified-since', 'range'];
const HAS_EXTENSION = /\.[^/]+$/;
// Only the public encyclopedia is proxied, so the worker is not an open proxy to the whole API host.
const API_PREFIX = '/api/encyclopedia/';
// The API sends no caching headers or validators; a short TTL keeps data fresh while shielding the API.
const API_DEFAULT_CACHE_CONTROL = 'public, max-age=300';

function fetchFromBucket(request: Request, env: Env, pathname: string) {
  const headers = new Headers();
  for (const name of FORWARDED_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  return fetch(env.BUCKET_URL + pathname, {
    method: request.method,
    headers,
    // Hashed assets are cached at the edge; TTL comes from the bucket's Cache-Control.
    ...(pathname.startsWith('/assets/') && { cf: { cacheEverything: true } }),
  });
}

async function fetchFromApi(url: URL, env: Env, ctx: ExecutionContext) {
  const cacheKey = new Request(url.toString());
  const cached = await caches.default.match(cacheKey);
  if (cached) return cached;

  // No client headers are forwarded, and only safe headers are passed back (Set-Cookie would block caching).
  const upstream = await fetch(env.API_ORIGIN + url.pathname + url.search);
  const headers = new Headers({
    'Content-Type': upstream.headers.get('content-type') ?? 'application/json',
    'Cache-Control': upstream.ok ? (upstream.headers.get('cache-control') ?? API_DEFAULT_CACHE_CONTROL) : 'no-store',
  });
  const response = new Response(upstream.body, { status: upstream.status, headers });

  if (upstream.ok) {
    ctx.waitUntil(caches.default.put(cacheKey, response.clone()));
  }

  return response;
}

function withCleanHeaders(response: Response) {
  const headers = new Headers(response.headers);
  for (const name of [...headers.keys()]) {
    if (name.startsWith('x-goog-') || name === 'x-guploader-uploadid' || name === 'expires') {
      headers.delete(name);
    }
  }
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return new Response(response.body, { status: response.status, headers });
}

export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }

    const url = new URL(request.url);
    const { pathname } = url;

    if (pathname.startsWith('/api/')) {
      if (!pathname.startsWith(API_PREFIX)) {
        return new Response('Not Found', { status: 404 });
      }
      return withCleanHeaders(await fetchFromApi(url, env, ctx));
    }

    let response = await fetchFromBucket(request, env, pathname === '/' ? '/index.html' : pathname);

    // SPA fallback: extension-less page navigations are client-side routes.
    const isNavigation = request.headers.get('accept')?.includes('text/html') && !HAS_EXTENSION.test(pathname);
    if (response.status === 404 && isNavigation) {
      response = await fetchFromBucket(request, env, '/index.html');
    }

    if (response.status === 404) {
      return new Response('Not Found', { status: 404 });
    }

    return withCleanHeaders(response);
  },
} satisfies ExportedHandler<Env>;

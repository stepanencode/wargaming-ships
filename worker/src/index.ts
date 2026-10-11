// Conditional and range headers let the bucket answer 304/206.
const FORWARDED_HEADERS = ['if-none-match', 'if-modified-since', 'range'];
const HAS_EXTENSION = /\.[^/]+$/;

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
  async fetch(request, env) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }

    const { pathname } = new URL(request.url);
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

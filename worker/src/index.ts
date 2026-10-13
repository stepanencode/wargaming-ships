// Mirrors "vars" in wrangler.jsonc.
interface Env {
  BUCKET_URL: string;
  API_ORIGIN: string;
  MEDIA_ORIGIN: string;
}

// Conditional and range headers let the bucket answer 304/206.
const FORWARDED_HEADERS = ['if-none-match', 'if-modified-since', 'range'];
const HAS_EXTENSION = /\.[^/]+$/;
// Only the public encyclopedia is proxied, so the worker is not an open proxy to the whole API host.
const API_PREFIX = '/api/encyclopedia/';
// Minimal cache for anything whose freshness we cannot prove (the API, unverified images):
// keeps data near-fresh while shielding the origins, and any bad copy expires within minutes.
const SHORT_CACHE_CONTROL = 'public, max-age=300';
const IMMUTABLE_CACHE_CONTROL = 'public, max-age=31536000, immutable';
const NO_STORE = 'no-store';
// /vehicles/ is ~20 MB, mostly 19 translations; by default only what the app reads is kept.
const VEHICLES_PATH = /^\/api\/encyclopedia\/([a-z_-]+)\/vehicles\/$/i;
// Fixed list of query options; anything else is rejected so random params cannot bust the cache.
// `include` adds fields to the slim payload; `raw` returns the upstream body untouched, without parsing.
const INCLUDE_VALUES = ['description', 'icons', 'translations'] as const;

type Include = (typeof INCLUDE_VALUES)[number];

// Ship images are served through the worker so they get a long edge and browser cache;
// the image CDN itself sends no Cache-Control.
const MEDIA_PREFIX = '/media/';
const MEDIA_PATH = /^\/api\/encyclopedia\/[a-z_-]+\/media_path\/$/i;
// Image names end with the SHA-256 of their content, e.g. PHSC998_efab7e4f…a48.png.
// Only images whose bytes match that hash are cached as immutable: browsers cannot be purged,
// so a bad response (truncated file, placeholder) must never be pinned there for a year.
const HASHED_FILE = /_([0-9a-f]{64})\.[a-z0-9]+$/i;

function forwardedHeaders(request: Request) {
  const headers = new Headers();
  for (const name of FORWARDED_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  return headers;
}

// The edge cache is an optimisation: a failed read is treated as a miss and a failed write is only logged.
async function cacheMatch(cacheKey: Request) {
  try {
    return await caches.default.match(cacheKey);
  } catch (error) {
    console.warn(`Cache read failed: ${cacheKey.url}`, error);
    return undefined;
  }
}

function cachePut(ctx: ExecutionContext, cacheKey: Request, response: Response) {
  ctx.waitUntil(
    caches.default.put(cacheKey, response.clone()).catch((error: unknown) => {
      console.warn(`Cache write failed: ${cacheKey.url}`, error);
    }),
  );
}

// Never throws: a missing hash in the name, or any hashing error, just means "not verified".
async function matchesContentHash(pathname: string, body: ArrayBuffer) {
  const expected = HASHED_FILE.exec(pathname)?.[1].toLowerCase();
  if (!expected) return false;
  try {
    const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', body));
    return Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('') === expected;
  } catch (error) {
    console.warn(`Image hash check failed: ${pathname}`, error);
    return false;
  }
}

async function fetchFromMedia(url: URL, env: Env, ctx: ExecutionContext) {
  const cacheKey = new Request(url.origin + url.pathname);
  const cached = await cacheMatch(cacheKey);
  if (cached) return cached;

  let upstream: Response;
  let body: ArrayBuffer;
  try {
    upstream = await fetch(env.MEDIA_ORIGIN + url.pathname.slice(MEDIA_PREFIX.length - 1));
    if (!upstream.ok) {
      return new Response(upstream.body, {
        status: upstream.status,
        headers: { 'Content-Type': upstream.headers.get('content-type') ?? 'text/plain', 'Cache-Control': NO_STORE },
      });
    }
    // Buffering is fine here: images are tens of KB, and hashing runs only on a cache miss.
    body = await upstream.arrayBuffer();
  } catch (error) {
    console.warn(`Image fetch failed: ${url.pathname}`, error);
    return new Response('Bad Gateway', { status: 502, headers: { 'Cache-Control': NO_STORE } });
  }

  const verified = await matchesContentHash(url.pathname, body);
  if (!verified && HASHED_FILE.test(url.pathname)) {
    console.warn(`Image hash mismatch, using the short cache: ${url.pathname}`);
  }

  const headers = new Headers({
    'Content-Type': upstream.headers.get('content-type') ?? 'application/octet-stream',
    'Cache-Control': verified ? IMMUTABLE_CACHE_CONTROL : SHORT_CACHE_CONTROL,
  });
  for (const name of ['etag', 'last-modified']) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }

  const response = new Response(body, { status: upstream.status, headers });
  cachePut(ctx, cacheKey, response);
  return response;
}

function fetchFromBucket(request: Request, env: Env, pathname: string) {
  return fetch(env.BUCKET_URL + pathname, {
    method: request.method,
    headers: forwardedHeaders(request),
    // Hashed assets are cached at the edge; TTL comes from the bucket's Cache-Control.
    ...(pathname.startsWith('/assets/') && { cf: { cacheEverything: true } }),
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Keeps only the listed keys that exist; anything that is not an object passes through unchanged.
function pick(value: unknown, keys: string[]) {
  if (!isRecord(value)) return value;
  return Object.fromEntries(keys.filter((key) => key in value).map((key) => [key, value[key]]));
}

function parseApiOptions(url: URL): { raw: boolean; include: Set<Include> } | null {
  const params = url.searchParams;
  if ([...params.keys()].some((key) => key !== 'include' && key !== 'raw')) return null;

  const raw = params.has('raw');
  if (raw && (params.getAll('raw').some((value) => value !== '' && value !== '1') || params.has('include'))) return null;

  const values = params.getAll('include').flatMap((value) => value.split(',')).filter(Boolean);
  if (!values.every((value) => (INCLUDE_VALUES as readonly string[]).includes(value))) return null;
  return { raw, include: new Set(values as Include[]) };
}

function slimVehicle(vehicle: unknown, include: Set<Include>, language: string) {
  if (!isRecord(vehicle)) return vehicle;

  const slim: Record<string, unknown> = pick(vehicle, ['level', 'name', 'nation', 'tags']) as Record<string, unknown>;
  if ('icons' in vehicle) {
    slim.icons = include.has('icons') ? vehicle.icons : pick(vehicle.icons, ['medium']);
  }
  if ('localization' in vehicle) {
    const groups = include.has('description') ? ['mark', 'shortmark', 'description'] : ['mark', 'shortmark'];
    const localization = pick(vehicle.localization, groups);
    slim.localization =
      include.has('translations') || !isRecord(localization)
        ? localization
        : Object.fromEntries(Object.entries(localization).map(([group, texts]) => [group, pick(texts, [language])]));
  }
  return slim;
}

// Parsing ~20 MB of JSON costs ~60–80 ms of CPU; it runs only on a cache miss.
async function slimVehicles(upstream: Response, include: Set<Include>, language: string) {
  const text = await upstream.text();
  try {
    const payload: unknown = JSON.parse(text);
    if (!isRecord(payload) || !isRecord(payload.data)) return text;
    const data = Object.fromEntries(
      Object.entries(payload.data).map(([id, vehicle]) => [id, slimVehicle(vehicle, include, language)]),
    );
    return JSON.stringify({ ...payload, data });
  } catch {
    return text;
  }
}

// Points the app's image base URL at /media/ on this host. Only the known CDN value is replaced,
// so if the API ever moves images elsewhere they keep loading from the new host directly.
async function rewriteMediaPath(upstream: Response, env: Env) {
  const text = await upstream.text();
  try {
    const payload: unknown = JSON.parse(text);
    if (!isRecord(payload) || payload.data !== `${env.MEDIA_ORIGIN}/`) return text;
    return JSON.stringify({ ...payload, data: MEDIA_PREFIX });
  } catch {
    return text;
  }
}

async function fetchFromApi(url: URL, env: Env, ctx: ExecutionContext) {
  const vehiclesMatch = VEHICLES_PATH.exec(url.pathname);
  const options = parseApiOptions(url);
  if (!options || (!vehiclesMatch && options.include.size > 0)) {
    return new Response(`Supported options: "raw", and on /vehicles/ "include" with ${INCLUDE_VALUES.join(', ')}`, {
      status: 400,
    });
  }
  const { raw, include } = options;

  // Canonical cache key: the same options in any order or repetition share one cache entry.
  const search = raw ? '?raw' : include.size ? `?include=${[...include].sort().join(',')}` : '';
  const cacheKey = new Request(url.origin + url.pathname + search);
  const cached = await cacheMatch(cacheKey);
  if (cached) return cached;

  let upstream: Response;
  let body: BodyInit | null;
  try {
    // No client headers or query are forwarded, and only safe headers are passed back (Set-Cookie would block caching).
    upstream = await fetch(env.API_ORIGIN + url.pathname);
    const transform = upstream.ok && !raw;
    body =
      transform && vehiclesMatch
        ? await slimVehicles(upstream, include, vehiclesMatch[1])
        : transform && MEDIA_PATH.test(url.pathname)
          ? await rewriteMediaPath(upstream, env)
          : upstream.body;
  } catch (error) {
    console.warn(`API fetch failed: ${url.pathname}`, error);
    return new Response('Bad Gateway', { status: 502, headers: { 'Cache-Control': NO_STORE } });
  }

  const headers = new Headers({
    'Content-Type': upstream.headers.get('content-type') ?? 'application/json',
    'Cache-Control': upstream.ok ? (upstream.headers.get('cache-control') ?? SHORT_CACHE_CONTROL) : NO_STORE,
  });
  const response = new Response(body, { status: upstream.status, headers });
  if (upstream.ok) cachePut(ctx, cacheKey, response);
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

async function handleRequest(request: Request, env: Env, ctx: ExecutionContext) {
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

  if (pathname.startsWith(MEDIA_PREFIX)) {
    return withCleanHeaders(await fetchFromMedia(url, env, ctx));
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
}

export default {
  // Last line of defence: an unexpected error becomes an uncached 500 instead of Cloudflare's error page.
  async fetch(request, env, ctx) {
    try {
      return await handleRequest(request, env, ctx);
    } catch (error) {
      console.error(`Unhandled error: ${request.url}`, error);
      return new Response('Internal Server Error', { status: 500, headers: { 'Cache-Control': NO_STORE } });
    }
  },
} satisfies ExportedHandler<Env>;

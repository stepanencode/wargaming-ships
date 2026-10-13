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
// /vehicles/ is ~20 MB, mostly 19 translations; by default only what the app reads is kept.
const VEHICLES_PATH = /^\/api\/encyclopedia\/([a-z_-]+)\/vehicles\/$/i;
// Fixed list of query options; anything else is rejected so random params cannot bust the cache.
// `include` adds fields to the slim payload; `raw` returns the upstream body untouched, without parsing.
const INCLUDE_VALUES = ['description', 'icons', 'translations'] as const;

type Include = (typeof INCLUDE_VALUES)[number];

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

async function fetchFromApi(url: URL, env: Env, ctx: ExecutionContext) {
  const vehiclesMatch = VEHICLES_PATH.exec(url.pathname);
  const options = parseApiOptions(url);
  if (!options || (!vehiclesMatch && (options.raw || options.include.size > 0))) {
    return new Response(`Only /vehicles/ accepts "raw" or "include" with: ${INCLUDE_VALUES.join(', ')}`, {
      status: 400,
    });
  }
  const { raw, include } = options;

  // Canonical cache key: the same options in any order or repetition share one cache entry.
  const search = raw ? '?raw' : include.size ? `?include=${[...include].sort().join(',')}` : '';
  const cacheKey = new Request(url.origin + url.pathname + search);
  const cached = await caches.default.match(cacheKey);
  if (cached) return cached;

  // No client headers or query are forwarded, and only safe headers are passed back (Set-Cookie would block caching).
  const upstream = await fetch(env.API_ORIGIN + url.pathname);
  const headers = new Headers({
    'Content-Type': upstream.headers.get('content-type') ?? 'application/json',
    'Cache-Control': upstream.ok ? (upstream.headers.get('cache-control') ?? API_DEFAULT_CACHE_CONTROL) : 'no-store',
  });
  const shouldSlim = upstream.ok && vehiclesMatch && !raw;
  const body = shouldSlim ? await slimVehicles(upstream, include, vehiclesMatch[1]) : upstream.body;
  const response = new Response(body, { status: upstream.status, headers });

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

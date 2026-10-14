# World of Warships Fleet Explorer

A responsive React application for browsing the World of Warships ship catalogue.

**Live:** https://wargaming-ships.oksanastepanenko.com  
**GitHub:** https://github.com/stepanencode/wargaming-ships

The app loads data from the World of Warships encyclopedia API and lets users search and filter ships by nation, type, and tier, then open a ship to view more details.

## Features

- Ship catalogue with nation, type, tier, image, and description
- Search by ship name
- Filters by nation, ship type, and tier
- Combined filters, result count, reset, and empty state
- Ship details dialog
- Responsive desktop, tablet, and mobile UI
- Virtualized rendering for the full catalogue
- Lazy-loaded responsive images with fallbacks
- Loading, error, retry, and graceful-degradation states
- Client-side monitoring and performance tracking with Sentry

## Tech stack

- React 19
- TypeScript
- Vite
- TanStack Query
- TanStack Virtual
- Sentry
- Vitest + Testing Library
- Playwright
- Cloudflare Workers
- Google Cloud Storage
- GitHub Actions

## Quick start

Use the Node.js version defined in `.nvmrc`.

```bash
git clone https://github.com/stepanencode/wargaming-ships.git
cd wargaming-ships

nvm use
npm install
npm run dev
```

Vite prints the local development URL after startup.

In development, Vite proxies `/api/...` requests to the World of Warships API, so the frontend uses the same relative API boundary locally and in production.

## Available scripts

```bash
npm run dev
```

Starts the development server.

```bash
npm run build
npm run preview
```

Builds the application and previews the production bundle locally.

```bash
npm run lint
npm run test:run
```

Runs ESLint and the Vitest suite.

Install Chromium once before the first Playwright run:

```bash
npx playwright install chromium
npm run test:e2e
```

Viewport-specific E2E runs:

```bash
npm run test:e2e:desktop
npm run test:e2e:mobile
```

Cloudflare Worker type check:

```bash
npm run worker:check
```

## Architecture

External API data is kept separate from the UI.

```text
World of Warships API
        ↓
API client
        ↓
runtime parsing
        ↓
normalization
        ↓
TanStack Query
        ↓
search / filters
        ↓
virtualized ship list
        ↓
ship details
```

Raw API responses are treated as untrusted runtime data. They are parsed and mapped into a smaller internal domain model before reaching React components.

TanStack Query owns server state. Search, filters, selected ship, and mobile-filter visibility remain local UI state.

The project is grouped by responsibility:

```text
src/
  app/
  pages/
  entities/
  features/
  shared/
```

## API and resilience

The application uses four World of Warships encyclopedia endpoints:

- `vehicles/` — ship catalogue
- `nations/` — nation metadata
- `vehicle_types_common/` — ship type metadata
- `media_path/` — image base path

`vehicles/` is the critical request. If it fails, the page shows a recoverable error state with Retry.

Supporting metadata endpoints degrade gracefully where possible. Missing optional nation, type, image, or text data should not crash the catalogue.

Malformed individual ship records are handled at the API boundary instead of leaking invalid data into the UI.

Ship type is derived by matching known ship-type tags rather than relying on `tags[0]`.

## Search and filtering

Search and filters are combined with AND logic:

```text
search
+ nation
+ ship type
+ tier
```

Search normalizes casing, whitespace, punctuation, diacritics, and several Unicode character variants to make matching more tolerant of naming differences.

Filter options are derived from normalized data rather than hard-coded.

## Performance

### Summary

The largest production optimization is reducing the amount of ship data sent to the browser.

The original `vehicles/` response is about **20.1 MB**. The Cloudflare Worker reduces it to about **0.96 MB**, and the compressed network transfer is about **0.27 MB** — roughly **74× less data transferred** than the original uncompressed response.

Successful API responses are cached at the Cloudflare edge for **5 minutes**. On a cache hit, the Worker returns the cached response without another request to the World of Warships API and without reprocessing the full upstream payload.

### Client-side optimizations

The catalogue contains more than 1,000 ships, so the list is virtualized with TanStack Virtual instead of mounting the full collection in the DOM.

The app also uses:

- lazy-loaded ship images
- responsive image sources
- memoized derived filter data
- React Query caching
- disabled refetch-on-window-focus
- loading skeletons and image fallbacks

### Static asset caching

Vite-generated assets include content hashes in their filenames, so they can be cached long-term as immutable resources.

`index.html` is revalidated instead of cached immutably, allowing a new deployment to become visible without a global cache purge.

## Production infrastructure

The frontend is a static SPA hosted through Google Cloud Storage and Cloudflare.

```text
Browser
   ↓
Cloudflare
   ├─ static files → Google Cloud Storage
   ├─ /api/...     → World of Warships API
   └─ /media/...   → Wargaming CDN
```

The Google Cloud Storage bucket is located in `europe-west3` (Frankfurt). Cloudflare serves cached content from edge locations closer to users; during measurements from Belgrade, requests were served through the `BEG` edge location.

The Cloudflare Worker:

- provides a same-origin API proxy
- allows only the required encyclopedia endpoints
- caches successful API responses for 5 minutes
- does not cache failed API responses
- proxies ship images
- reduces the large `vehicles/` payload before it reaches the browser
- provides SPA fallback routing

The frontend therefore uses the same relative `/api/...` boundary in development and production and does not depend on direct browser access to the upstream API.

## Caching strategy

Caching is split between the browser and Cloudflare edge cache.

- Vite assets under `/assets/*` use long-lived immutable caching
- `index.html` uses revalidation so deployments are visible quickly
- API responses use `public, max-age=300`
- API and image failures use `no-store`
- ship images with verified content hashes can be cached long-term
- other ship images use a shorter cache lifetime

Static-file `Cache-Control` metadata is written when files are uploaded to Google Cloud Storage. API and media cache rules are set by the Cloudflare Worker.

The deployment does not require a full CDN cache purge because versioned assets get new filenames and `index.html` is revalidated.

## CI/CD

CI/CD is implemented with GitHub Actions.

The pipeline has two main stages:

```text
build
  ↓
deploy
```

The build stage installs dependencies, runs linting and type checks, builds the frontend, checks the Worker, and stores the production bundle as an artifact.

Deployment runs only after a successful build. New hashed assets are uploaded before `index.html`, so users cannot receive an HTML file that references assets that are not available yet.

If the build fails, production is not changed. If asset upload fails, the previous `index.html` remains active and users continue receiving the previous working version.

Old immutable assets are intentionally not deleted immediately after deployment because users with an already-open tab may still request files from the previous release. Automatic cleanup of old release assets after a safe retention period is not implemented yet.

## Monitoring

Sentry is used for both client-side error monitoring and performance measurement.

The app also marks the point at which fleet data has rendered. This helps distinguish upstream-loading problems from UI-rendering problems and makes it possible to track how long it takes for the main fleet content to become visible.

For deeper investigation, Sentry performance data can be used to inspect transactions and their child spans around loading and rendering work.

## Testing

The project currently has:

- **70 Vitest tests**
- **12 Playwright E2E tests** across desktop and mobile Chromium

Coverage includes:

- API parsing and normalization
- mapping
- search and filters
- filter options
- reset and empty state
- page loading/error/retry
- ship details
- API failure → Retry → recovery
- desktop/mobile user flows

Playwright mocks the external API while still exercising the real parser, mapper, TanStack Query layer, filters, and UI. This keeps the E2E suite stable without coupling it to upstream availability.

## Accessibility and responsive behaviour

The UI uses semantic controls and accessible names for search, filters, status messages, errors, dialogs, and actions.

Filters collapse into a mobile panel on small screens while keeping the same filtering behaviour across viewports.

The UI also respects `prefers-reduced-motion`.

## Key decisions

- **Normalize at the API boundary.** React components do not depend on raw backend response shapes.
- **Use TanStack Query only for server state.** Local UI state stays local.
- **Virtualize the large catalogue.** More than 1,000 ship cards are not mounted at once.
- **Degrade gracefully.** Only failure of the critical `vehicles/` request causes a page-level error.
- **Keep dependencies focused.** No global state manager or UI framework is required.
- **Keep one API boundary across environments.** The frontend uses relative `/api/...` paths locally and in production.
- **Cache by resource semantics.** Immutable build assets, revalidated HTML, short-lived API data, and uncached failures use different policies instead of one global TTL.

## Known limitations and trade-offs

- The task currently uses the English encyclopedia endpoints.
- `catalogueHidden`, `catalogueHiddenIfMissing`, `demoWithoutStats`, and `experimental` tags are intentionally not used for filtering, based on clarification received for the task.
- Some upstream image URLs can return a valid placeholder image with HTTP 200. In that case a standard `img onError` handler cannot distinguish it from a normal image.
- Old immutable build assets are not yet removed automatically after a retention period.
- The current list virtualization uses a single virtualized column; a true multi-column virtualized layout was kept out of scope.

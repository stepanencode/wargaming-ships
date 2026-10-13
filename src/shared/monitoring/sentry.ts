import * as Sentry from '@sentry/react';

const dsn = import.meta.env.VITE_SENTRY_DSN;

// Without a DSN (local dev) Sentry stays off and the helpers below are no-ops.
if (dsn) {
  Sentry.init({
    dsn,
    release: import.meta.env.VITE_SENTRY_RELEASE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 1.0,
  });

  // SDK 11 streams spans with attributes; scope tags are not applied to them.
  const branch = import.meta.env.VITE_SENTRY_BRANCH;
  if (branch) Sentry.setAttribute('branch', branch);
}

export function measure<T>(name: string, op: string, callback: () => T): T {
  return Sentry.startSpan({ name, op }, callback);
}

let shipsRenderedMarked = false;

// Time from navigation start until the ship list is first on screen, attached to the pageload trace.
export function markShipsRendered() {
  if (shipsRenderedMarked) return;
  shipsRenderedMarked = true;
  const activeSpan = Sentry.getActiveSpan();
  if (activeSpan) Sentry.getRootSpan(activeSpan).setAttribute('ships_rendered', performance.now());
}

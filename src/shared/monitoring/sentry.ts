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

  const branch = import.meta.env.VITE_SENTRY_BRANCH;
  if (branch) Sentry.setTag('branch', branch);
}

export function measure<T>(name: string, op: string, callback: () => T): T {
  return Sentry.startSpan({ name, op }, callback);
}

let shipsRenderedMarked = false;

// Time from navigation start until the ship list is first on screen, attached to the pageload trace.
export function markShipsRendered() {
  if (shipsRenderedMarked) return;
  shipsRenderedMarked = true;
  Sentry.setMeasurement('ships_rendered', performance.now(), 'millisecond');
}

export {};

// Loaded automatically by @sentry/nextjs in the browser bundle.
// Skip silently if SDK / DSN is not configured (e.g. local dev without Sentry).
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Sentry = require('@sentry/nextjs');
    Sentry.init({
      dsn,
      environment: process.env.NEXT_PUBLIC_SENTRY_ENV || process.env.NODE_ENV,
      tracesSampleRate: Number(
        process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? '0.1',
      ),
      replaysSessionSampleRate: 0,
      replaysOnErrorSampleRate: 0,
    });
  } catch {
    // @sentry/nextjs not installed — no-op
  }
}

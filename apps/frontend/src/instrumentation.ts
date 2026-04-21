// Next.js 14+ instrumentation entrypoint. Loaded once when the runtime starts.
// We delegate to Sentry's runtime-specific config files so the SDK is only
// pulled in when @sentry/nextjs is installed.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

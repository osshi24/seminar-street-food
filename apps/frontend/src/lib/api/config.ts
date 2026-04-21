/**
 * Returns the correct API base URL depending on the execution context.
 * - Server-side (SSR/server components): direct backend URL (server-to-server, no CORS)
 * - Client-side (browser): relative proxy path routed through Next.js rewrites
 */
export function getApiUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.BACKEND_URL
      ? `${process.env.BACKEND_URL}/api`
      : 'http://localhost:3001/api';
  }
  return '/api/backend';
}

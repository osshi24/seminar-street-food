export const BACKEND_URL =
  typeof window === 'undefined'
    ? (process.env.BACKEND_URL ?? 'http://localhost:3001')
    : (process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001');

export function getApiUrl(): string {
  return `${BACKEND_URL}/api`;
}

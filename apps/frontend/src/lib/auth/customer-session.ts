'use client';

const TOKEN_KEY = 'customer_token';
const RETURN_URL_KEY = 'oauth_return_url';

export function saveCustomerToken(token: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(TOKEN_KEY, token);
  }
}

export function getCustomerToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function clearCustomerToken(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(TOKEN_KEY);
  }
}

export function isCustomerLoggedIn(): boolean {
  return getCustomerToken() !== null;
}

export function saveReturnUrl(url: string): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(RETURN_URL_KEY, url);
  }
}

export function getReturnUrl(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(RETURN_URL_KEY);
}

export function clearReturnUrl(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(RETURN_URL_KEY);
  }
}

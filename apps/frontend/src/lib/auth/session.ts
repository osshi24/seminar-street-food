'use client';

import Cookies from 'js-cookie';
import { setAccessToken } from '../api/client';

const COOKIE_OPTIONS = { expires: 1 / 3, path: '/', sameSite: 'lax' as const };

let memoryToken: string | null = null;

export function saveAccessToken(token: string): void {
  memoryToken = token;
  setAccessToken(token);
  Cookies.set('access_token', token, COOKIE_OPTIONS);
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem('access_token', token);
    } catch {
      // sessionStorage not available
    }
  }
}

export function getAccessToken(): string | null {
  if (memoryToken) return memoryToken;
  const cookie = Cookies.get('access_token');
  if (cookie) return cookie;
  if (typeof window !== 'undefined') {
    try {
      return sessionStorage.getItem('access_token');
    } catch {
      return null;
    }
  }
  return null;
}

export function clearAccessToken(): void {
  memoryToken = null;
  setAccessToken(null);
  Cookies.remove('access_token', { path: '/' });
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem('access_token');
    } catch {
      // ignore
    }
  }
}

export function isAuthenticated(): boolean {
  const token = getAccessToken();
  if (!token) return false;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

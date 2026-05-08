'use client';

import { useEffect } from 'react';

const HEARTBEAT_INTERVAL_MS = 30_000;
const STORAGE_KEY = 'public_visitor_id';

function getOrCreateVisitorId(): string {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

/**
 * Pings /api/public/presence/heartbeat every 30s while the tab is visible.
 * The visitor_id is stable across tabs in the same browser profile (localStorage),
 * so multi-tab visitors are deduplicated by the backend.
 */
export function usePublicPresence(): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const visitorId = getOrCreateVisitorId();

    const send = () => {
      if (document.visibilityState !== 'visible') return;
      void fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001'}/api/public/presence/heartbeat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId }),
        keepalive: true,
      }).catch(() => {});
    };

    send();
    const timer = window.setInterval(send, HEARTBEAT_INTERVAL_MS);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') send();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
}

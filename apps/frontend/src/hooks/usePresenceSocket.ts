'use client';

import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

export type PresenceRole = 'admin' | 'store_owner' | 'customer';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split(';')
    .find((c) => c.trim().startsWith(`${name}=`));
  return match ? decodeURIComponent(match.trim().slice(name.length + 1)) : null;
}

function resolveToken(role: PresenceRole): string | null {
  if (role === 'admin') return readCookie('admin_access_token');
  if (role === 'store_owner') return readCookie('store_owner_access_token');
  return readCookie('customer_access_token');
}

/**
 * Mount once in an authenticated layout to register the current user's
 * presence with the backend. The socket stays alive for the lifetime of
 * the layout and is closed on unmount (tab close, route change to a
 * non-authenticated section).
 */
export function usePresenceSocket(role: PresenceRole): void {
  useEffect(() => {
    let socket: Socket | null = null;
    const token = resolveToken(role);

    socket = io('/presence', {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: { token: token ?? undefined, role },
      reconnection: true,
      reconnectionDelay: 2000,
    });

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [role]);
}

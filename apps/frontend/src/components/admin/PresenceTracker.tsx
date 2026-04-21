'use client';

import { usePresenceSocket, type PresenceRole } from '../../hooks/usePresenceSocket';

export default function PresenceTracker({ role }: { role: PresenceRole }) {
  usePresenceSocket(role);
  return null;
}

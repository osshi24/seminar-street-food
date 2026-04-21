'use client';

import { usePublicPresence } from '../../hooks/usePublicPresence';

export default function PublicPresenceTracker() {
  usePublicPresence();
  return null;
}

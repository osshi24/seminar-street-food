'use client';

import dynamic from 'next/dynamic';
import { ComponentType } from 'react';

/**
 * Wrap any Leaflet component with this helper to avoid SSR issues.
 * Leaflet requires `window`, so it must only render client-side.
 *
 * Usage:
 *   const MyMap = withNoSSR(() => import('./MyMap'));
 */
export function withNoSSR<T extends object>(
  loader: () => Promise<{ default: ComponentType<T> }>,
  fallback: React.ReactNode = null,
) {
  return dynamic(loader, {
    ssr: false,
    loading: () => <>{fallback}</>,
  });
}

'use client';

import { useEffect } from 'react';
import { trackStoreVisit } from '../../lib/api/analytics';

export default function StoreVisitTracker({ storeId }: { storeId: string }) {
  useEffect(() => {
    trackStoreVisit(storeId);
  }, [storeId]);
  return null;
}

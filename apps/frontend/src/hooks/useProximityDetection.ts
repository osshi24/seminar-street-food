'use client';

import { useEffect, useRef, useState } from 'react';
import { getPublicPins } from '../lib/api/map';
import { haversineMeters } from '../lib/gps/haversine';
import type { NearbyStore } from '../lib/gps/proximitySession';

const PROXIMITY_RADIUS_METERS = 4;
const DEBOUNCE_MS = 500;

export function useProximityDetection(
  position: GeolocationCoordinates | null,
) {
  const [pins, setPins] = useState<Awaited<ReturnType<typeof getPublicPins>>['pins']>([]);
  const [nearbyStores, setNearbyStores] = useState<NearbyStore[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch pins once on mount
  useEffect(() => {
    getPublicPins()
      .then((data) => setPins(data.pins))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!position) {
      setNearbyStores([]);
      return;
    }

    // Debounce position updates to avoid rapid trigger at boundary
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const nearby: NearbyStore[] = [];

      for (const pin of pins) {
        const dist = haversineMeters(
          position.latitude,
          position.longitude,
          pin.latitude,
          pin.longitude,
        );
        if (dist <= PROXIMITY_RADIUS_METERS) {
          nearby.push({
            storeId: pin.storeId,
            storeName: pin.storeName,
            distanceMeters: dist,
            lat: pin.latitude,
            lng: pin.longitude,
          });
        }
      }

      // Sort ascending so index 0 is always the closest store
      nearby.sort((a, b) => a.distanceMeters - b.distanceMeters);
      setNearbyStores(nearby);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [position, pins]);

  return { nearbyStores };
}

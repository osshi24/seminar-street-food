'use client';

import { useEffect, useRef, useState } from 'react';
import type { GPSStatus } from '../lib/gps/proximitySession';

const WATCH_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0,
};

export function useGeolocation() {
  const [position, setPosition] = useState<GeolocationCoordinates | null>(null);
  const [gpsStatus, setGpsStatus] = useState<GPSStatus>('idle');
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsStatus('unavailable');
      return;
    }

    setGpsStatus('requesting');

    const onSuccess = (pos: GeolocationPosition) => {
      setPosition(pos.coords);
      setGpsStatus('granted');
      setError(null);
    };

    const onError = (err: GeolocationPositionError) => {
      setError(err);
      if (err.code === err.PERMISSION_DENIED) {
        setGpsStatus('denied');
      } else {
        setGpsStatus('unavailable');
      }
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      onSuccess,
      onError,
      WATCH_OPTIONS,
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  return { position, gpsStatus, error };
}

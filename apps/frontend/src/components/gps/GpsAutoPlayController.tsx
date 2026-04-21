'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useProximityDetection } from '../../hooks/useProximityDetection';
import { useAutoPlay } from '../../hooks/useAutoPlay';
import { createProximitySession, markPlayed } from '../../lib/gps/proximitySession';
import GpsStatusBar from './GpsStatusBar';
import AutoplayBanner from './AutoplayBanner';
import AudioControls from './AudioControls';

export default function GpsAutoPlayController() {
  const { position, gpsStatus } = useGeolocation();
  const { nearbyStores } = useProximityDetection(position);

  const [session, setSession] = useState(() => createProximitySession());

  const onMarkPlayed = useCallback((storeId: string) => {
    setSession((prev) => markPlayed(prev, storeId));
  }, []);

  // Pick the closest store that hasn't been played yet in this session.
  // This handles the case where the user stands equidistant between two stores:
  // if store 1 (index 0) was already played, store 2 (index 1) is selected next.
  const nearestStore = nearbyStores.find((s) => !session.get(s.storeId)) ?? null;

  const {
    bannerVisible,
    currentStoreName,
    triggerManualPlay,
    stopAudio,
    skipAudio,
    tryPlay,
  } = useAutoPlay(nearestStore, session, onMarkPlayed);

  // Trigger auto-play when the active store changes
  useEffect(() => {
    if (nearestStore && gpsStatus === 'granted') {
      tryPlay(nearestStore);
    }
  }, [nearestStore, gpsStatus, tryPlay]);

  return (
    <div className="space-y-2">
      <GpsStatusBar gpsStatus={gpsStatus} />
      <AudioControls
        storeName={currentStoreName}
        onStop={stopAudio}
        onSkip={skipAudio}
      />
      <AutoplayBanner
        visible={bannerVisible}
        storeName={nearestStore?.storeName ?? null}
        onPlay={triggerManualPlay}
      />
    </div>
  );
}

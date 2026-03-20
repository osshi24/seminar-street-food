'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useProximityDetection } from '../../hooks/useProximityDetection';
import { useAutoPlay } from '../../hooks/useAutoPlay';
import { createProximitySession, markPlayed } from '../../lib/gps/proximitySession';
import GpsPermissionBanner from './GpsPermissionBanner';
import GpsStatusBar from './GpsStatusBar';
import AutoplayBanner from './AutoplayBanner';
import AudioControls from './AudioControls';

export default function GpsAutoPlayController() {
  const { position, gpsStatus } = useGeolocation();
  const { nearestStore } = useProximityDetection(position);

  const [session, setSession] = useState(() => createProximitySession());

  const onMarkPlayed = useCallback((storeId: string) => {
    setSession((prev) => markPlayed(prev, storeId));
  }, []);

  const {
    bannerVisible,
    currentStoreName,
    triggerManualPlay,
    stopAudio,
    skipAudio,
    tryPlay,
  } = useAutoPlay(nearestStore, session, onMarkPlayed);

  // Trigger auto-play when nearest store changes
  useEffect(() => {
    if (nearestStore && gpsStatus === 'granted') {
      tryPlay(nearestStore);
    }
  }, [nearestStore, gpsStatus, tryPlay]);

  return (
    <div className="space-y-2">
      <GpsStatusBar gpsStatus={gpsStatus} />
      <GpsPermissionBanner gpsStatus={gpsStatus} />
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

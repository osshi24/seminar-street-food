'use client';

import { useCallback, useRef, useState } from 'react';
import { getStoreCommentary } from '../lib/api/commentary';
import { useLang } from '../contexts/LanguageContext';
import type { NearbyStore } from '../lib/gps/proximitySession';

export function useAutoPlay(
  nearestStore: NearbyStore | null,
  session: Map<string, boolean>,
  onMarkPlayed: (storeId: string) => void,
) {
  const { lang } = useLang();
  const [bannerVisible, setBannerVisible] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [currentStoreName, setCurrentStoreName] = useState<string | null>(null);
  const pendingAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastTriggeredRef = useRef<string | null>(null);

  const tryPlay = useCallback(
    async (store: NearbyStore) => {
      if (session.get(store.storeId) === true) return;
      if (lastTriggeredRef.current === store.storeId) return;
      lastTriggeredRef.current = store.storeId;

      try {
        const commentary = await getStoreCommentary(store.storeId, lang);
        const audioUrl = commentary.data?.audioUrl;
        if (!audioUrl) return;

        const audio = new Audio(audioUrl);
        pendingAudioRef.current = audio;

        audio.onended = () => {
          setCurrentAudio(null);
          setCurrentStoreName(null);
        };

        try {
          await audio.play();
          onMarkPlayed(store.storeId);
          setCurrentAudio(audio);
          setCurrentStoreName(store.storeName);
          setBannerVisible(false);
        } catch (err) {
          if (err instanceof DOMException && err.name === 'NotAllowedError') {
            setBannerVisible(true);
          }
        }
      } catch {
        lastTriggeredRef.current = null;
      }
    },
    [lang, session, onMarkPlayed],
  );

  const triggerManualPlay = useCallback(async () => {
    const audio = pendingAudioRef.current;
    const store = nearestStore;
    if (!audio || !store) return;

    try {
      await audio.play();
      onMarkPlayed(store.storeId);
      setCurrentAudio(audio);
      setCurrentStoreName(store.storeName);
      setBannerVisible(false);
    } catch {
      setBannerVisible(false);
    }
  }, [nearestStore, onMarkPlayed]);

  const stopAudio = useCallback(() => {
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
      setCurrentStoreName(null);
    }
  }, [currentAudio]);

  const skipAudio = useCallback(() => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setCurrentAudio(null);
      setCurrentStoreName(null);
    }
  }, [currentAudio]);

  return {
    bannerVisible,
    setBannerVisible,
    currentAudio,
    currentStoreName,
    triggerManualPlay,
    stopAudio,
    skipAudio,
    tryPlay,
  };
}

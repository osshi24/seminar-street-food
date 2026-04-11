'use client';

import { useCallback, useRef, useState } from 'react';
import { getStoreCommentary } from '../lib/api/commentary';
import type { NearbyStore } from '../lib/gps/proximitySession';

export function useAutoPlay(
  nearestStore: NearbyStore | null,
  session: Map<string, boolean>,
  onMarkPlayed: (storeId: string) => void,
) {
  const [bannerVisible, setBannerVisible] = useState(false);
  const [currentStoreName, setCurrentStoreName] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const pendingTextRef = useRef<string | null>(null);
  const pendingStoreRef = useRef<NearbyStore | null>(null);
  // Use ref to always read latest session without stale closure
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const playingStoreIdRef = useRef<string | null>(null);

  const speakText = useCallback((text: string, storeName: string, storeId: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = 0.95;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setCurrentStoreName(storeName);
      playingStoreIdRef.current = storeId;
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setCurrentStoreName(null);
      playingStoreIdRef.current = null;
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setCurrentStoreName(null);
      playingStoreIdRef.current = null;
    };

    window.speechSynthesis.speak(utterance);
    onMarkPlayed(storeId);
    setBannerVisible(false);
  }, [onMarkPlayed]);

  const tryPlay = useCallback(
    async (store: NearbyStore) => {
      if (sessionRef.current.get(store.storeId) === true) return;
      if (window.speechSynthesis?.speaking) return;
      if (playingStoreIdRef.current === store.storeId) return;

      try {
        const commentary = await getStoreCommentary(store.storeId, 'vi');
        const text = commentary.data?.translatedText;
        if (!text) return;

        // Double-check session after async call
        if (sessionRef.current.get(store.storeId) === true) return;

        pendingTextRef.current = text;
        pendingStoreRef.current = store;

        try {
          speakText(text, store.storeName, store.storeId);
        } catch {
          setBannerVisible(true);
        }
      } catch {
        // silent
      }
    },
    [speakText],
  );

  const triggerManualPlay = useCallback(() => {
    const text = pendingTextRef.current;
    const store = pendingStoreRef.current;
    if (!text || !store) return;
    speakText(text, store.storeName, store.storeId);
  }, [speakText]);

  const stopAudio = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setCurrentStoreName(null);
    playingStoreIdRef.current = null;
  }, []);

  const skipAudio = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setCurrentStoreName(null);
    playingStoreIdRef.current = null;
  }, []);

  return {
    bannerVisible,
    setBannerVisible,
    currentAudio: isSpeaking ? ({} as HTMLAudioElement) : null,
    currentStoreName,
    triggerManualPlay,
    stopAudio,
    skipAudio,
    tryPlay,
  };
}

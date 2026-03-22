'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useCommentary } from '../../hooks/useCommentary';
import { useLang } from '../../contexts/LanguageContext';
import PipelineBanner from './PipelineBanner';

interface CommentaryPlayerProps {
  storeId: string;
}

export default function CommentaryPlayer({ storeId }: CommentaryPlayerProps) {
  const { t } = useTranslation();
  const { lang, speechCode } = useLang();
  const { translatedText, pipelineStatus, message, isLoading } = useCommentary(storeId, lang);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Cancel speech on unmount
  useEffect(() => {
    return () => { window.speechSynthesis?.cancel(); };
  }, []);

  // Cancel speech when language or text changes
  useEffect(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, [translatedText, lang]);

  const speak = useCallback(() => {
    if (!translatedText || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(translatedText);
    utterance.lang = speechCode;
    utterance.rate = 0.95;
    utterance.pitch = 1;

    utterance.onstart = () => { setIsSpeaking(true); setIsPaused(false); };
    utterance.onend = () => { setIsSpeaking(false); setIsPaused(false); };
    utterance.onerror = () => { setIsSpeaking(false); setIsPaused(false); };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [translatedText, speechCode]);

  const pause = useCallback(() => {
    if (window.speechSynthesis?.speaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if (window.speechSynthesis?.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-10 bg-gray-200 rounded" />
      </div>
    );
  }

  if (!translatedText && !pipelineStatus) {
    return (
      <p className="text-sm text-gray-500 italic">{t('storeDetail.noCommentary')}</p>
    );
  }

  const canSpeak = !!translatedText && message !== 'pipeline_running' && message !== 'pipeline_failed';

  return (
    <div className="space-y-3">
      <PipelineBanner storeId={storeId} pipelineStatus={pipelineStatus} lang={lang} />

      {translatedText && (
        <p className="text-sm text-gray-700 leading-relaxed">{translatedText}</p>
      )}

      {canSpeak && (
        <div className="flex items-center gap-2">
          {!isSpeaking ? (
            <button
              onClick={speak}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-full transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              {t('storeDetail.listen')}
            </button>
          ) : (
            <>
              {isPaused ? (
                <button
                  onClick={resume}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-full transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  {t('storeDetail.resume')}
                </button>
              ) : (
                <button
                  onClick={pause}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-full transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM6 6h2v8H6V6zm6 0h2v8h-2V6z" clipRule="evenodd" />
                  </svg>
                  {t('storeDetail.pause')}
                </button>
              )}
              <button
                onClick={stop}
                className="flex items-center gap-2 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-medium rounded-full transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
                </svg>
                {t('storeDetail.stop')}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

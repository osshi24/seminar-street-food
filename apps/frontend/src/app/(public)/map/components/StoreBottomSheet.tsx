'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PublicPin } from '../../../../lib/api/map';
import CommentaryPlayer from '../../../../components/stores/CommentaryPlayer';

interface StoreBottomSheetProps {
  pin: PublicPin | null;
  onClose: () => void;
}

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export default function StoreBottomSheet({ pin, onClose }: StoreBottomSheetProps) {
  const { t } = useTranslation();
  const sheetRef = useRef<HTMLDivElement>(null);
  const [showCommentary, setShowCommentary] = useState(false);

  // Reset commentary panel when pin changes
  useEffect(() => { setShowCommentary(false); }, [pin?.storeId]);

  // Stop speech and close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        window.speechSynthesis?.cancel();
        onClose();
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Stop speech when sheet closes
  useEffect(() => {
    if (!pin) {
      window.speechSynthesis?.cancel();
      setShowCommentary(false);
    }
  }, [pin]);

  function openDirections() {
    if (!pin) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${pin.latitude},${pin.longitude}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[999] transition-opacity duration-200 ${
          pin ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={pin?.storeName ?? t('map.title')}
        className={`fixed bottom-0 left-0 right-0 z-[1000] bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 max-h-[60vh] flex flex-col ${
          pin ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          aria-label={t('map.close')}
          className="absolute top-3 right-4 text-gray-400 hover:text-gray-600 text-xl leading-none"
        >
          ×
        </button>

        {pin && (
          <div className="overflow-y-auto flex-1 px-4 pb-6">
            {/* Thumbnail */}
            {pin.thumbnailUrl && (
              <div className="relative w-full h-36 rounded-xl overflow-hidden mb-3 mt-1">
                <Image
                  src={pin.thumbnailUrl}
                  alt={pin.storeName}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 500px"
                />
              </div>
            )}

            {/* Store name */}
            <h2 className="text-lg font-bold text-gray-900 mb-1">{pin.storeName}</h2>

            {/* Short description */}
            {pin.shortDescription && (
              <p className="text-sm text-gray-500 line-clamp-2 mb-2">{pin.shortDescription}</p>
            )}

            {/* Price range */}
            {pin.priceRange && (
              <p className="text-sm font-medium text-orange-600 mb-4">
                {pin.priceRange.min === pin.priceRange.max
                  ? formatVND(pin.priceRange.min)
                  : `${formatVND(pin.priceRange.min)} – ${formatVND(pin.priceRange.max)}`}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={openDirections}
                aria-label={`${t('map.directions')} ${pin.storeName}`}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                {t('map.directions')}
              </button>

              {pin.hasCommentary && (
                <button
                  onClick={() => setShowCommentary((v) => !v)}
                  aria-label={`${t('map.listenCommentary')} ${pin.storeName}`}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                    showCommentary
                      ? 'bg-orange-600 text-white'
                      : 'bg-orange-500 hover:bg-orange-600 text-white'
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0 0l-3-3m3 3l3-3M6.343 6.343a8 8 0 000 11.314" />
                  </svg>
                  {t('map.listenCommentary')}
                </button>
              )}

              <Link
                href={`/stores/${pin.storeId}`}
                className="flex items-center gap-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {t('map.viewDetails')}
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Inline commentary player */}
            {showCommentary && (
              <div className="mt-4 rounded-xl bg-orange-50 border border-orange-100 p-3">
                <CommentaryPlayer storeId={pin.storeId} />
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

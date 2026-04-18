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
  onDirections?: (lat: number, lng: number) => void;
  onStartNavigation?: (lat: number, lng: number) => void;
  onStopNavigation?: () => void;
  isRouting?: boolean;
  routeInfo?: { distance: string; duration: string } | null;
  isNavigating?: boolean;
  arrived?: boolean;
}

function formatVND(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export default function StoreBottomSheet({
  pin,
  onClose,
  onDirections,
  onStartNavigation,
  onStopNavigation,
  isRouting,
  routeInfo,
  isNavigating,
  arrived,
}: StoreBottomSheetProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [showCommentary, setShowCommentary] = useState(false);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    setShowCommentary(false);
    setExpanded(false);
  }, [pin?.storeId]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        window.speechSynthesis?.cancel();
        if (expanded) setExpanded(false);
        else onClose();
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, expanded]);

  useEffect(() => {
    if (!pin) {
      window.speechSynthesis?.cancel();
      setShowCommentary(false);
      setExpanded(false);
    }
  }, [pin]);

  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartY.current === null) return;
    const delta = touchStartY.current - e.changedTouches[0].clientY;
    if (delta > 40) setExpanded(true);
    else if (delta < -40) {
      if (expanded) setExpanded(false);
      else onClose();
    }
    touchStartY.current = null;
  }

  if (!pin) return null;

  // ── Arrived banner ──────────────────────────────────────────────────────
  if (arrived) {
    return (
      <div className="fixed bottom-14 sm:bottom-4 left-3 right-3 z-[1000]">
        <div className="bg-green-500 text-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-400 flex items-center justify-center shrink-0">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">Bạn đã đến nơi!</p>
            <p className="text-xs text-green-100 truncate">{pin.storeName}</p>
          </div>
          <Link
            href={`/stores/${pin.storeId}`}
            className="shrink-0 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-medium hover:bg-white/30 transition-colors"
          >
            {t('map.viewDetails')}
          </Link>
          <button onClick={onStopNavigation} className="shrink-0 p-1 text-green-200 hover:text-white">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // ── Navigation mini bar ─────────────────────────────────────────────────
  if (isNavigating && routeInfo) {
    return (
      <div className="fixed bottom-14 sm:bottom-4 left-3 right-3 z-[1000]">
        <div className="bg-blue-600 text-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
            <svg className="h-5 w-5 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{pin.storeName}</p>
            <p className="text-xs text-blue-200">
              <span className="text-white font-medium">{routeInfo.distance}</span>
              {' · '}
              <span className="text-white font-medium">{routeInfo.duration}</span>
            </p>
          </div>
          <button
            onClick={onStopNavigation}
            className="shrink-0 rounded-xl bg-red-500 px-3 py-2 text-xs font-semibold hover:bg-red-600 transition-colors flex items-center gap-1"
          >
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h12v12H6z" />
            </svg>
            Dừng
          </button>
        </div>
      </div>
    );
  }

  // ── Collapsed / expanded sheet ──────────────────────────────────────────
  return (
    <>
      {expanded && (
        <div
          className="fixed inset-0 z-[999]"
          onClick={() => setExpanded(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed bottom-0 left-0 right-0 z-[1000] bg-white rounded-t-2xl shadow-2xl transition-all duration-300 flex flex-col ${expanded ? 'overflow-hidden' : ''}`}
        style={{ maxHeight: expanded ? '80vh' : undefined }}
      >
        {/* Drag handle — touch/tap to toggle */}
        <button
          onClick={() => setExpanded((v) => !v)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="flex justify-center pt-3 pb-2 flex-shrink-0 w-full"
          aria-label={expanded ? 'Thu gọn' : 'Mở rộng'}
        >
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </button>

        {/* ── COLLAPSED view ── */}
        {!expanded && (
          <div className="px-4 pb-4 flex-shrink-0">
            {/* Store mini card */}
            <div
              className="flex items-center gap-3 mb-3 cursor-pointer"
              onClick={() => setExpanded(true)}
            >
              {pin.thumbnailUrl ? (
                <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  <Image src={pin.thumbnailUrl} alt={pin.storeName} fill className="object-cover" sizes="56px" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-xl bg-orange-50 flex items-center justify-center text-2xl shrink-0">
                  🍜
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate">{pin.storeName}</p>
                {pin.priceRange && (
                  <p className="text-xs text-orange-600 font-medium mt-0.5">
                    {pin.priceRange.min === pin.priceRange.max
                      ? formatVND(pin.priceRange.min)
                      : `${formatVND(pin.priceRange.min)} – ${formatVND(pin.priceRange.max)}`}
                  </p>
                )}
                <p className="text-[10px] text-gray-400 mt-0.5">Kéo lên để xem chi tiết</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="shrink-0 p-1 text-gray-400 hover:text-gray-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (pin && onDirections) onDirections(Number(pin.latitude), Number(pin.longitude));
                }}
                disabled={isRouting}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-blue-600 text-blue-600 py-2.5 text-sm font-medium disabled:opacity-60 transition-colors"
              >
                {isRouting ? (
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                )}
                Chỉ đường
              </button>

              <button
                onClick={() => {
                  if (pin && onStartNavigation) onStartNavigation(Number(pin.latitude), Number(pin.longitude));
                }}
                disabled={isRouting}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-white py-2.5 text-sm font-medium disabled:opacity-60 hover:bg-blue-700 transition-colors"
              >
                {isRouting ? (
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 3L3 10.53v.98l6.84 2.65L12.48 21h.98L21 3z" />
                  </svg>
                )}
                Bắt đầu đi
              </button>
            </div>
          </div>
        )}

        {/* ── EXPANDED view ── */}
        {expanded && (
          <>
            <button
              onClick={() => { setExpanded(false); onClose(); }}
              className="absolute top-3 right-4 text-gray-400 hover:text-gray-600 text-xl leading-none z-10"
            >
              ×
            </button>

            <div className="overflow-y-auto flex-1 min-h-0 px-4 pb-6">
              {pin.thumbnailUrl && (
                <div className="relative w-full h-40 rounded-xl overflow-hidden mb-3 mt-1">
                  <Image
                    src={pin.thumbnailUrl}
                    alt={pin.storeName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 500px"
                  />
                </div>
              )}

              <h2 className="text-lg font-bold text-gray-900 mb-1">{pin.storeName}</h2>

              {pin.shortDescription && (
                <p className="text-sm text-gray-500 mb-2">{pin.shortDescription}</p>
              )}

              {pin.priceRange && (
                <p className="text-sm font-medium text-orange-600 mb-4">
                  {pin.priceRange.min === pin.priceRange.max
                    ? formatVND(pin.priceRange.min)
                    : `${formatVND(pin.priceRange.min)} – ${formatVND(pin.priceRange.max)}`}
                </p>
              )}

              <div className="flex gap-2 flex-wrap mb-4">
                <button
                  onClick={() => {
                    if (pin && onDirections) onDirections(Number(pin.latitude), Number(pin.longitude));
                  }}
                  disabled={isRouting}
                  className="flex items-center gap-1.5 rounded-xl border border-blue-600 text-blue-600 px-4 py-2.5 text-sm font-medium disabled:opacity-60 transition-colors"
                >
                  Chỉ đường
                </button>

                <button
                  onClick={() => {
                    if (pin && onStartNavigation) onStartNavigation(Number(pin.latitude), Number(pin.longitude));
                  }}
                  disabled={isRouting}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 text-white px-4 py-2.5 text-sm font-medium disabled:opacity-60 hover:bg-blue-700 transition-colors"
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 3L3 10.53v.98l6.84 2.65L12.48 21h.98L21 3z" />
                  </svg>
                  Bắt đầu đi
                </button>

                {pin.hasCommentary && (
                  <button
                    onClick={() => setShowCommentary((v) => !v)}
                    className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                      showCommentary ? 'bg-orange-600 text-white' : 'bg-orange-500 hover:bg-orange-600 text-white'
                    }`}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0 0l-3-3m3 3l3-3M6.343 6.343a8 8 0 000 11.314" />
                    </svg>
                    Nghe thuyết minh
                  </button>
                )}

                <Link
                  href={`/stores/${pin.storeId}`}
                  className="flex items-center gap-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {t('map.viewDetails')}
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              {showCommentary && (
                <div className="rounded-xl bg-orange-50 border border-orange-100 p-3">
                  <CommentaryPlayer storeId={pin.storeId} />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

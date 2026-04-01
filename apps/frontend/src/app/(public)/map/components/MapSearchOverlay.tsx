'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { PublicPin } from '../../../../lib/api/map';

interface MapSearchOverlayProps {
  pins: PublicPin[];
  onSelectPin: (pin: PublicPin) => void;
}

export default function MapSearchOverlay({ pins, onSelectPin }: MapSearchOverlayProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PublicPin[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);
      if (!value.trim()) {
        setResults([]);
        return;
      }
      const q = value.toLowerCase();
      const matched = pins.filter(
        (p) =>
          p.storeName.toLowerCase().includes(q) ||
          (p.shortDescription && p.shortDescription.toLowerCase().includes(q)),
      );
      setResults(matched);
    },
    [pins],
  );

  const handleSelect = useCallback(
    (pin: PublicPin) => {
      onSelectPin(pin);
      setIsOpen(false);
      setQuery('');
      setResults([]);
    },
    [onSelectPin],
  );

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setQuery('');
        setResults([]);
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="bg-white rounded-lg shadow-md px-3 py-2 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 hover:shadow-lg transition-all"
        aria-label={t('stores.search')}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {t('stores.search')}
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg w-72 sm:w-80 overflow-hidden">
      {/* Search input */}
      <div className="relative flex items-center border-b border-gray-100">
        <svg className="absolute left-3 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Tìm gian hàng..."
          className="w-full py-2.5 pl-9 pr-9 text-sm focus:outline-none"
        />
        <button
          onClick={() => {
            setIsOpen(false);
            setQuery('');
            setResults([]);
          }}
          className="absolute right-2 p-1 text-gray-400 hover:text-gray-600 rounded"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Results */}
      {query.trim() && (
        <div className="max-h-60 overflow-y-auto">
          {results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-400">Không tìm thấy gian hàng</p>
          ) : (
            results.map((pin) => (
              <button
                key={pin.storeId}
                onClick={() => handleSelect(pin)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 transition-colors text-left"
              >
                {/* Thumbnail */}
                {pin.thumbnailUrl ? (
                  <img
                    src={pin.thumbnailUrl}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover flex-shrink-0 border border-gray-200"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 text-orange-600 font-bold text-sm">
                    {pin.storeName.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{pin.storeName}</p>
                  {pin.shortDescription && (
                    <p className="text-xs text-gray-400 truncate">{pin.shortDescription}</p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

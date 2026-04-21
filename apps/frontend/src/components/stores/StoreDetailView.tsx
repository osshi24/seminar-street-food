'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import CommentaryPlayer from './CommentaryPlayer';
import { useLang } from '../../contexts/LanguageContext';

interface MenuItem {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  tags?: { id: number; nameVi: string }[];
}

interface StoreImage {
  id: string;
  url: string;
  orderIndex: number;
}

interface StoreDetailViewProps {
  storeId: string;
  name: string;
  description?: string | null;
  menuItems: MenuItem[];
  images: StoreImage[];
  hasCommentary?: boolean;
  autoPlay?: boolean;
}

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export default function StoreDetailView({
  storeId,
  name,
  description,
  menuItems,
  images,
  hasCommentary = false,
  autoPlay = false,
}: StoreDetailViewProps) {
  const { t } = useTranslation();
  const { lang } = useLang();
  const [activeImage, setActiveImage] = useState(0);
  const sortedImages = [...images].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <div className="space-y-6">
      {/* Image carousel */}
      {sortedImages.length > 0 && (
        <div className="space-y-2">
          <div className="relative h-64 w-full rounded-lg overflow-hidden">
            <Image
              src={sortedImages[activeImage]?.url}
              alt={name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>
          {sortedImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {sortedImages.map((img, i) => (
                <button key={img.id} onClick={() => setActiveImage(i)} className="flex-shrink-0">
                  <div className={`relative h-16 w-16 rounded overflow-hidden ${i === activeImage ? 'ring-2 ring-blue-500' : 'opacity-70'}`}>
                    <Image src={img.url} alt="" fill className="object-cover" sizes="64px" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Commentary player — above the fold, right after images */}
      {hasCommentary ? (
        <div className="rounded-xl bg-orange-50 border border-orange-100 p-4 flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0 0l-3-3m3 3l3-3M6.343 6.343a8 8 0 000 11.314" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-orange-800 mb-1">{t('storeDetail.commentaryTitle')}</p>
            <CommentaryPlayer
              storeId={storeId}
              autoPlay={autoPlay}
              autoPlayKey={autoPlay ? 'qrscan' : null}
            />
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-400 italic">{t('storeDetail.noCommentary')}</p>
      )}

      {/* Store name + description */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-2">
          <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
          <Link
            href={`/map?storeId=${storeId}`}
            className="flex-shrink-0 flex items-center gap-1 text-sm text-blue-600 hover:underline mt-1"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {t('storeDetail.viewOnMap')}
          </Link>
        </div>
        {description && <p className="text-gray-600">{description}</p>}
      </div>

      {/* Menu items */}
      {menuItems.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">{t('storeDetail.menu')}</h2>
          <ul className="space-y-3">
            {menuItems.map((item) => (
              <li key={item.id} className="rounded-lg border bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  {item.imageUrl && (
                    <div className="flex-shrink-0">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="h-14 w-14 rounded-md object-cover border"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-800">{item.name}</p>
                    {item.description && (
                      <p className="text-sm text-gray-500">{item.description}</p>
                    )}
                    {item.tags && item.tags.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="rounded-full bg-orange-50 px-2 py-0.5 text-xs text-orange-600"
                          >
                            {tag.nameVi}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="flex-shrink-0 font-semibold text-red-600 ml-2">
                    {formatVND(item.price)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

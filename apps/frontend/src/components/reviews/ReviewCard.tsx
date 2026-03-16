'use client';

import { useState } from 'react';
import StarRating from './StarRating';
import type { Review } from '../../types/review';
import ReportModal from '../reports/ReportModal';

interface ReviewCardProps {
  review: Review;
  storeId?: string;
  isStoreOwner?: boolean;
  storeOwnerToken?: string;
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return new Date(dateStr).toLocaleDateString('vi-VN');
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function ReviewCard({ review, storeId, isStoreOwner = false, storeOwnerToken }: ReviewCardProps) {
  const [showReport, setShowReport] = useState(false);

  return (
    <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {review.customer.avatarUrl ? (
            <img
              src={review.customer.avatarUrl}
              alt={review.customer.displayName}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-sm font-semibold text-orange-600">
              {getInitials(review.customer.displayName)}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-800">{review.customer.displayName}</p>
            <StarRating value={review.stars} readonly />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">{formatRelativeTime(review.createdAt)}</span>
          {isStoreOwner && storeId && storeOwnerToken && (
            <button
              type="button"
              onClick={() => setShowReport(true)}
              className="text-xs text-gray-400 hover:text-red-500"
            >
              Báo cáo
            </button>
          )}
        </div>
      </div>
      {review.content && (
        <p className="mt-3 text-sm text-gray-600">{review.content}</p>
      )}
      {showReport && storeId && storeOwnerToken && (
        <ReportModal
          reviewId={review.id}
          storeId={storeId}
          token={storeOwnerToken}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}

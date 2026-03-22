'use client';

import { useEffect, useState } from 'react';
import ReviewCard from './ReviewCard';
import ReviewListSkeleton from './ReviewListSkeleton';
import StarRating from './StarRating';
import { listReviews } from '../../lib/api/reviews';
import type { Review, ReviewMeta, ReviewSummary } from '../../types/review';

interface ReviewListProps {
  storeId: string;
  isStoreOwner?: boolean;
  storeOwnerToken?: string;
}

export default function ReviewList({ storeId, isStoreOwner = false, storeOwnerToken }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [meta, setMeta] = useState<ReviewMeta | null>(null);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);

  const fetchPage = async (p: number, append = false) => {
    try {
      const res = await listReviews(storeId, p);
      if (append) {
        setReviews((prev) => [...prev, ...res.data]);
      } else {
        setReviews(res.data);
      }
      setMeta(res.meta);
      setSummary(res.summary);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchPage(1).finally(() => setLoading(false));
  }, [storeId]);

  const handleLoadMore = async () => {
    const next = page + 1;
    setLoadingMore(true);
    await fetchPage(next, true);
    setPage(next);
    setLoadingMore(false);
  };

  const hasMore = meta ? page < meta.totalPages : false;

  return (
    <div className="space-y-4">
      {summary && (
        <div className="flex items-center gap-3 rounded-lg bg-orange-50 p-3">
          <div className="text-3xl font-bold text-orange-600">{summary.avgRating.toFixed(1)}</div>
          <div>
            <StarRating value={Math.round(summary.avgRating)} readonly />
            <p className="text-xs text-gray-500">{summary.reviewCount} đánh giá</p>
          </div>
        </div>
      )}
      {loading ? (
        <ReviewListSkeleton />
      ) : reviews.length === 0 ? (
        <p className="text-center text-sm text-gray-400">Chưa có đánh giá nào.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <ReviewCard
              key={r.id}
              review={r}
              storeId={storeId}
              isStoreOwner={isStoreOwner}
              storeOwnerToken={storeOwnerToken}
            />
          ))}
        </div>
      )}
      {hasMore && (
        <button
          type="button"
          onClick={handleLoadMore}
          disabled={loadingMore}
          className="w-full rounded border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-60"
        >
          {loadingMore ? 'Đang tải...' : 'Xem thêm'}
        </button>
      )}
    </div>
  );
}

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

const STAR_OPTIONS = [5, 4, 3, 2, 1] as const;

export default function ReviewList({ storeId, isStoreOwner = false, storeOwnerToken }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [meta, setMeta] = useState<ReviewMeta | null>(null);
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [filterStars, setFilterStars] = useState<number | null>(null);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setReviews([]);
      setPage(1);
      try {
        const res = await listReviews(storeId, 1, 20, {
          stars: filterStars ?? undefined,
          sort: sortOrder,
        });
        if (!cancelled) {
          setReviews(res.data);
          setMeta(res.meta);
          setSummary(res.summary);
        }
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, [storeId, filterStars, sortOrder]);

  const handleLoadMore = async () => {
    const next = page + 1;
    setLoadingMore(true);
    try {
      const res = await listReviews(storeId, next, 20, {
        stars: filterStars ?? undefined,
        sort: sortOrder,
      });
      setReviews((prev) => [...prev, ...res.data]);
      setMeta(res.meta);
      setPage(next);
    } catch {
      // silent
    } finally {
      setLoadingMore(false);
    }
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

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Lọc sao</span>
        <button
          onClick={() => setFilterStars(null)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            filterStars === null
              ? 'bg-blue-600 text-white shadow-sm'
              : 'border border-gray-300 bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          Tất cả
        </button>
        {STAR_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setFilterStars(filterStars === s ? null : s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              filterStars === s
                ? 'bg-orange-500 text-white shadow-sm'
                : 'border border-gray-300 bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            {'★'.repeat(s)}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Sắp xếp</span>
          <button
            onClick={() => setSortOrder((s) => (s === 'desc' ? 'asc' : 'desc'))}
            className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {sortOrder === 'desc' ? '↓ Mới nhất' : '↑ Cũ nhất'}
          </button>
        </div>
      </div>

      {loading ? (
        <ReviewListSkeleton />
      ) : reviews.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 py-10 text-center text-sm text-gray-400">
          {filterStars
            ? `Không có đánh giá ${'★'.repeat(filterStars)} nào.`
            : 'Chưa có đánh giá nào.'}
        </p>
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
          onClick={() => void handleLoadMore()}
          disabled={loadingMore}
          className="w-full rounded border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-60"
        >
          {loadingMore ? 'Đang tải...' : `Xem thêm${meta ? ` (${meta.total - reviews.length} còn lại)` : ''}`}
        </button>
      )}
    </div>
  );
}

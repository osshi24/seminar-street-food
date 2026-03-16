'use client';

import { useState, useEffect, useCallback } from 'react';
import AdminReviewTable from '../../../../components/admin/AdminReviewTable';
import ReviewFilterBar, { type ReviewFilters } from '../../../../components/admin/ReviewFilterBar';
import apiClient from '../../../../lib/api/client';

interface ReviewRow {
  id: string;
  stars: number;
  content: string | null;
  isHidden: boolean;
  hiddenAt: string | null;
  createdAt: string;
  reportCount: number;
  customer: { displayName: string; avatarUrl: string | null } | null;
  store: { id: string; name: string } | null;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<ReviewFilters>({});
  const [page, setPage] = useState(1);

  const fetchReviews = useCallback(async (f: ReviewFilters, p: number) => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/admin/reviews', {
        params: { ...f, page: p, limit: 20 },
      });
      setReviews(data.data);
      setTotal(data.meta.total);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReviews(filters, page); }, []);

  const handleFilter = (f: ReviewFilters) => {
    setFilters(f);
    setPage(1);
    fetchReviews(f, 1);
  };

  const handleHide = async (id: string) => {
    await apiClient.patch(`/admin/reviews/${id}/hide`);
    fetchReviews(filters, page);
  };
  const handleUnhide = async (id: string) => {
    await apiClient.patch(`/admin/reviews/${id}/unhide`);
    fetchReviews(filters, page);
  };
  const handleDelete = async (id: string) => {
    await apiClient.delete(`/admin/reviews/${id}`);
    fetchReviews(filters, page);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Quản lý bình luận</h1>
        <span className="rounded-full bg-gray-100 px-3 py-0.5 text-sm font-medium text-gray-600">
          {total} bình luận
        </span>
      </div>

      <ReviewFilterBar onFilter={handleFilter} />

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded bg-gray-100" />)}
        </div>
      ) : (
        <AdminReviewTable
          reviews={reviews}
          onHide={handleHide}
          onUnhide={handleUnhide}
          onDelete={handleDelete}
        />
      )}

      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => { const p = page - 1; setPage(p); fetchReviews(filters, p); }}
            className="rounded border px-3 py-1 text-sm disabled:opacity-40"
          >
            Trước
          </button>
          <span className="py-1 text-sm text-gray-500">Trang {page}</span>
          <button
            disabled={page * 20 >= total}
            onClick={() => { const p = page + 1; setPage(p); fetchReviews(filters, p); }}
            className="rounded border px-3 py-1 text-sm disabled:opacity-40"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}

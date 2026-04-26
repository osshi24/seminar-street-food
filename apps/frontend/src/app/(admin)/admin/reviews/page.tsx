'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Eye, EyeOff, MessageSquare, Flag } from 'lucide-react';
import AdminReviewTable from '../../../../components/admin/AdminReviewTable';
import ReviewFilterBar, {
  type ReviewFilters,
} from '../../../../components/admin/ReviewFilterBar';
import AdminMetricGrid from '../../../../components/admin/common/AdminMetricGrid';
import AdminPageHeader from '../../../../components/admin/common/AdminPageHeader';
import AdminPagination from '../../../../components/admin/common/AdminPagination';
import { Button } from '../../../../components/ui/button';
import { getAdminOverview, type AdminOverviewResponse } from '../../../../lib/api/admin-overview';
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

interface ReviewListResponse {
  data: ReviewRow[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<ReviewFilters>({});
  const [page, setPage] = useState(1);
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  const loadReviews = useCallback(async (nextFilters: ReviewFilters, nextPage: number) => {
    setLoading(true);
    try {
      const { data } = await apiClient.get<ReviewListResponse>('/admin/reviews', {
        params: {
          keyword: nextFilters.keyword,
          status: nextFilters.status,
          page: nextPage,
          limit: 12,
        },
      });

      setReviews(data.data);
      setTotal(data.meta.total);
      setTotalPages(data.meta.totalPages);
    } catch {
      showToast('Không thể tải danh sách bình luận.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const refreshOverview = useCallback(async () => {
    try {
      const data = await getAdminOverview();
      setOverview(data);
    } catch {
      setOverview(null);
    }
  }, []);

  useEffect(() => {
    void loadReviews(filters, page);
  }, [filters, loadReviews, page]);

  useEffect(() => {
    void refreshOverview();
  }, [refreshOverview]);

  const applyFilters = (nextFilters: ReviewFilters) => {
    setFilters(nextFilters);
    setPage(1);
  };

  const resetFilters = () => {
    setFilters({});
    setPage(1);
  };

  const handleAction = async (
    reviewId: string,
    action: 'hide' | 'unhide' | 'delete',
    successMessage: string,
  ) => {
    setProcessingId(reviewId);
    try {
      if (action === 'hide') {
        await apiClient.patch(`/admin/reviews/${reviewId}/hide`);
      } else if (action === 'unhide') {
        await apiClient.patch(`/admin/reviews/${reviewId}/unhide`);
      } else {
        await apiClient.delete(`/admin/reviews/${reviewId}`);
      }

      showToast(successMessage, 'success');
      await Promise.all([loadReviews(filters, page), refreshOverview()]);
    } catch {
      showToast('Thao tác với bình luận không thành công.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const stats = useMemo(() => {
    if (!overview) {
      return [
        {
          label: 'Bình luận',
          value: total,
          tone: 'violet' as const,
          icon: <MessageSquare />,
          description: 'Bình luận trong tập dữ liệu đang tải.',
        },
      ];
    }

    return [
      {
        label: 'Tổng bình luận',
        value: overview.metrics.reviews.total,
        tone: 'violet' as const,
        icon: <MessageSquare />,
        description: 'Phản hồi khách hàng có trong hệ thống.',
      },
      {
        label: 'Đang hiển thị',
        value: overview.metrics.reviews.visible,
        tone: 'emerald' as const,
        icon: <Eye />,
        description: 'Còn hiển thị trên giao diện người dùng.',
      },
      {
        label: 'Đang ẩn',
        value: overview.metrics.reviews.hidden,
        tone: 'slate' as const,
        icon: <EyeOff />,
        description: 'Đã bị ẩn khỏi giao diện công khai.',
      },
      {
        label: 'Báo cáo chờ xử lý',
        value: overview.metrics.reports.pending,
        tone: 'amber' as const,
        icon: <Flag />,
        description: 'Báo cáo bình luận đang chờ quyết định.',
      },
    ];
  }, [overview, total]);

  return (
    <div className="space-y-5">
      <AdminPageHeader
        badge="Kiểm duyệt"
        title="Quản lý bình luận"
        description="Theo dõi phản hồi khách hàng, ẩn nội dung không phù hợp và giữ luồng kiểm duyệt nhất quán."
        meta={`${total} bình luận phù hợp bộ lọc hiện tại`}
        action={
          <Button asChild>
            <Link href="/admin/reports">
              Mở màn báo cáo
              <ArrowRight />
            </Link>
          </Button>
        }
      />

      <AdminMetricGrid items={stats} />

      <ReviewFilterBar filters={filters} onApply={applyFilters} onReset={resetFilters} />

      {loading ? (
        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-md bg-slate-50" />
          ))}
        </div>
      ) : (
        <AdminReviewTable
          reviews={reviews}
          processingId={processingId}
          onHide={(id) => handleAction(id, 'hide', 'Đã ẩn bình luận.')}
          onUnhide={(id) => handleAction(id, 'unhide', 'Đã cho hiển thị lại bình luận.')}
          onDelete={(id) => handleAction(id, 'delete', 'Đã xóa bình luận.')}
        />
      )}

      {totalPages > 1 ? (
        <AdminPagination
          currentPage={page}
          totalPages={totalPages}
          total={total}
          limit={12}
          onPageChange={setPage}
        />
      ) : null}

      {toast ? (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-md px-4 py-2.5 text-sm font-medium text-white shadow-lg ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}

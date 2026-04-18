'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/api/client';
import DraftCompareView from '@/components/admin/DraftCompareView';
import RejectReasonModal from '@/components/admin/RejectReasonModal';
import AdminPageHeader from '@/components/admin/common/AdminPageHeader';

export default function StoreDraftDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<{
    draft: { id: string; status: string };
    current: { name: string; description?: string | null; menuItems: Array<{ id: string; name: string; price: number }> };
    proposed: { name: string; description?: string | null; menuItems: Array<{ id: string; name: string; price: number; action?: 'added' | 'modified' | 'removed' }> };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get(`/admin/store-drafts/${id}`)
      .then((res) => {
        setDetail(res.data?.data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  function showToastMessage(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleApprove() {
    setActionLoading(true);
    try {
      await apiClient.patch(`/admin/store-drafts/${id}/approve`);
      showToastMessage('Đã phê duyệt bản nháp');
      setTimeout(() => router.push('/admin/store-drafts'), 1500);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject(reason: string) {
    setActionLoading(true);
    try {
      await apiClient.patch(`/admin/store-drafts/${id}/reject`, { reason });
      setShowRejectModal(false);
      showToastMessage('Đã từ chối bản nháp');
      setTimeout(() => router.push('/admin/store-drafts'), 1500);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-44 animate-pulse rounded-[32px] bg-white/70" />
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="h-[420px] animate-pulse rounded-[32px] bg-white/70" />
          <div className="h-[420px] animate-pulse rounded-[32px] bg-white/70" />
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="rounded-[32px] border border-rose-200 bg-rose-50 p-6 text-rose-700">
        Không tìm thấy bản nháp.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast ? (
        <div className="fixed right-6 top-6 z-50 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          {toast}
        </div>
      ) : null}

      {showRejectModal ? (
        <RejectReasonModal
          onConfirm={handleReject}
          onCancel={() => setShowRejectModal(false)}
          isLoading={actionLoading}
        />
      ) : null}

      <AdminPageHeader
        badge="Draft review"
        title="Chi tiết bản nháp chờ duyệt"
        description="So sánh nội dung hiện tại với phiên bản được đề xuất trước khi chấp thuận publish. Ưu tiên đánh giá tính đầy đủ, độ rõ ràng và tính nhất quán dữ liệu."
        meta={`Draft ID: ${detail.draft.id}`}
        action={
          <button
            onClick={() => router.push('/admin/store-drafts')}
            className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Quay lại hàng chờ
          </button>
        }
      />

      <DraftCompareView current={detail.current} proposed={detail.proposed} />

      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">Hành động duyệt</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">Ra quyết định cho bản nháp này</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={actionLoading}
              className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
            >
              Từ chối
            </button>
            <button
              onClick={handleApprove}
              disabled={actionLoading}
              className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {actionLoading ? 'Đang xử lý...' : 'Phê duyệt'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

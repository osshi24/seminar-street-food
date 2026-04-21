'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/api/client';
import DraftCompareView from '@/components/admin/DraftCompareView';
import RejectReasonModal from '@/components/admin/RejectReasonModal';
import AdminPageHeader from '@/components/admin/common/AdminPageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

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
      .then((res) => setDetail(res.data?.data))
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
      <div className="space-y-5">
        <div className="h-24 animate-pulse rounded-xl bg-white" />
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="h-96 animate-pulse rounded-xl bg-white" />
          <div className="h-96 animate-pulse rounded-xl bg-white" />
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <Card className="border-rose-200 bg-rose-50">
        <CardContent className="p-5 text-sm text-rose-700">Không tìm thấy bản nháp.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {toast ? (
        <div className="fixed right-6 top-6 z-50 rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
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
        badge="Duyệt bản nháp"
        title="Chi tiết bản nháp chờ duyệt"
        description="So sánh nội dung hiện tại với phiên bản đề xuất trước khi chấp thuận publish."
        meta={`Draft ID: ${detail.draft.id}`}
        action={
          <Button variant="outline" onClick={() => router.push('/admin/store-drafts')}>
            Quay lại hàng chờ
          </Button>
        }
      />

      <DraftCompareView current={detail.current} proposed={detail.proposed} />

      <Card>
        <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-700">
              Hành động duyệt
            </p>
            <h2 className="mt-1 text-base font-semibold text-slate-900">
              Ra quyết định cho bản nháp này
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setShowRejectModal(true)}
              disabled={actionLoading}
              className="border-rose-200 text-rose-700 hover:bg-rose-50"
            >
              Từ chối
            </Button>
            <Button
              onClick={handleApprove}
              disabled={actionLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {actionLoading ? 'Đang xử lý...' : 'Phê duyệt'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

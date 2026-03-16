'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import apiClient from '../../../../../lib/api/client';
import DraftCompareView from '../../../../../components/admin/DraftCompareView';
import RejectReasonModal from '../../../../../components/admin/RejectReasonModal';

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
    apiClient.get(`/admin/store-drafts/${id}`).then((res) => {
      setDetail(res.data?.data);
    }).finally(() => setLoading(false));
  }, [id]);

  function showToastMessage(msg: string) {
    setToast(msg);
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

  if (loading) return <div className="flex justify-center py-12">Đang tải...</div>;
  if (!detail) return <div className="p-6 text-red-600">Không tìm thấy bản nháp</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-md bg-green-600 px-4 py-2 text-white shadow-lg">
          {toast}
        </div>
      )}
      {showRejectModal && (
        <RejectReasonModal
          onConfirm={handleReject}
          onCancel={() => setShowRejectModal(false)}
          isLoading={actionLoading}
        />
      )}

      <header className="border-b bg-white px-6 py-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin/store-drafts')} className="text-sm text-blue-600 hover:underline">
            ← Quay lại
          </button>
          <h1 className="text-xl font-bold">Chi tiết bản nháp</h1>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8 space-y-6">
        <DraftCompareView current={detail.current} proposed={detail.proposed} />

        <div className="flex gap-3 pt-4">
          <button
            onClick={handleApprove}
            disabled={actionLoading}
            className="rounded-md bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            Phê duyệt
          </button>
          <button
            onClick={() => setShowRejectModal(true)}
            disabled={actionLoading}
            className="rounded-md bg-red-600 px-6 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            Từ chối
          </button>
        </div>
      </main>
    </div>
  );
}

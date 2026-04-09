'use client';

import { useEffect, useState } from 'react';
import ReportReasonSelect from './ReportReasonSelect';
import { fetchReportReasons, submitReport } from '../../lib/api/reports';
import type { ReportReason } from '../../types/report';

interface ReportModalProps {
  reviewId: string;
  storeId: string;
  token: string;
  onClose: () => void;
}

export default function ReportModal({ reviewId, storeId, token, onClose }: ReportModalProps) {
  const [reasons, setReasons] = useState<ReportReason[]>([]);
  const [selectedReason, setSelectedReason] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReportReasons().then(setReasons).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) {
      setError('Vui lòng chọn lý do báo cáo');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await submitReport(storeId, reviewId, { reasonId: selectedReason }, token);
      setToast('Báo cáo đã được gửi. Cảm ơn bạn!');
      setTimeout(onClose, 2000);
    } catch (err: any) {
      if (err?.status === 409) {
        setError('Bạn đã báo cáo bình luận này rồi');
      } else {
        setError('Có lỗi xảy ra, vui lòng thử lại');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-3 text-sm font-semibold text-gray-800">Báo cáo bình luận vi phạm</h3>
        {toast ? (
          <p className="text-sm text-green-600">{toast}</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <ReportReasonSelect reasons={reasons} value={selectedReason} onChange={setSelectedReason} />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-60"
              >
                {loading ? 'Đang gửi...' : 'Gửi báo cáo'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

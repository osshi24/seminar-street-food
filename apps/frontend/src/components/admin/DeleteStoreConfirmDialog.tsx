'use client';

import { useEffect, useState } from 'react';
import { deleteStore, getDeleteImpact, type DeleteImpact } from '../../lib/api/admin-stores';

type Props = {
  storeId: string;
  storeName: string;
  onClose: () => void;
  onDeleted: () => void;
};

export default function DeleteStoreConfirmDialog({ storeId, storeName, onClose, onDeleted }: Props) {
  const [impact, setImpact] = useState<DeleteImpact | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await getDeleteImpact(storeId);
        if (mounted) setImpact(res.data);
      } catch (e: unknown) {
        if (mounted) setError((e as any)?.response?.data?.message ?? 'Không thể tải thông tin ảnh hưởng khi xóa.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [storeId]);

  const doDelete = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await deleteStore(storeId, true);
      onDeleted();
    } catch (e: unknown) {
      setError((e as any)?.response?.data?.message ?? 'Xóa gian hàng thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="border-b px-5 py-4">
          <h3 className="text-base font-semibold text-gray-900">Xóa gian hàng</h3>
          <p className="mt-1 text-sm text-gray-600">
            Bạn sắp xóa gian hàng <span className="font-medium">{storeName}</span>.
          </p>
        </div>

        <div className="px-5 py-4">
          {error && (
            <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-4 w-2/3 rounded bg-gray-100" />
              <div className="h-4 w-1/2 rounded bg-gray-100" />
            </div>
          ) : impact ? (
            <div className="rounded-lg border bg-gray-50 p-3 text-sm text-gray-700">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-gray-500">Đánh giá:</span> {impact.reviewCount}
                </div>
                <div>
                  <span className="text-gray-500">Báo cáo:</span> {impact.reportCount}
                </div>
                <div>
                  <span className="text-gray-500">Ghim bản đồ:</span> {impact.locationPinCount}
                </div>
                <div>
                  <span className="text-gray-500">Bản nháp pending:</span> {impact.pendingDraft ? 'Có' : 'Không'}
                </div>
              </div>
              {impact.hasRelatedData && (
                <p className="mt-3 text-red-700">
                  Gian hàng còn dữ liệu liên quan. Xác nhận xóa sẽ xóa toàn bộ dữ liệu liên quan.
                </p>
              )}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t px-5 py-4">
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={doDelete}
            disabled={submitting}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {submitting ? 'Đang xóa...' : 'Xác nhận xóa'}
          </button>
        </div>
      </div>
    </div>
  );
}


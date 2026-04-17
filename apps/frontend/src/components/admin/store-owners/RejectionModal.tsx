'use client';

import { useState } from 'react';

interface RejectionModalProps {
  isOpen: boolean;
  isLoading?: boolean;
  onReject: (reason: string) => void;
  onCancel: () => void;
  storeOwnerName?: string;
}

export default function RejectionModal({
  isOpen,
  isLoading = false,
  onReject,
  onCancel,
  storeOwnerName = 'Chủ gian hàng',
}: RejectionModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (reason.trim().length < 10) {
      setError('Lý do phải có ít nhất 10 ký tự');
      return;
    }
    onReject(reason.trim());
  };

  const handleClose = () => {
    setReason('');
    setError(null);
    onCancel();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <span className="text-xl">✕</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Từ chối tài khoản</h3>
        </div>

        <p className="mb-4 text-sm text-gray-600">
          Bạn sắp từ chối yêu cầu của <strong>{storeOwnerName}</strong>. Vui lòng nhập lý do
          chi tiết để gửi cho chủ gian hàng.
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lý do từ chối <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={4}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError(null);
            }}
            placeholder="Ví dụ: Hồ sơ không đầy đủ, cần cung cấp giấy phép kinh doanh..."
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
          <p className="mt-1 text-xs text-gray-500">{reason.length} / tối thiểu 10 ký tự</p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading || reason.trim().length < 10}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>}
            Xác nhận từ chối
          </button>
        </div>
      </div>
    </div>
  );
}

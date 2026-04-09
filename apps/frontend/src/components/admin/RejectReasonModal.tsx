'use client';

import { useState } from 'react';

interface RejectReasonModalProps {
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function RejectReasonModal({ onConfirm, onCancel, isLoading }: RejectReasonModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleConfirm() {
    if (reason.trim().length < 10) {
      setError('Lý do phải có ít nhất 10 ký tự');
      return;
    }
    onConfirm(reason.trim());
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">Từ chối bản nháp</h3>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700">
            Lý do từ chối <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={4}
            value={reason}
            onChange={(e) => { setReason(e.target.value); setError(null); }}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none"
            placeholder="Vui lòng nhập lý do từ chối (ít nhất 10 ký tự)..."
          />
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-md border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? 'Đang xử lý...' : 'Xác nhận từ chối'}
          </button>
        </div>
      </div>
    </div>
  );
}

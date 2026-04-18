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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
      <div className="w-full max-w-xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_40px_100px_-50px_rgba(15,23,42,0.75)]">
        <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_right,_rgba(251,191,36,0.16),_transparent_35%),linear-gradient(180deg,_#ffffff_0%,_#fffaf0_100%)] px-6 py-6">
          <h3 className="text-2xl font-semibold text-slate-950">Từ chối bản nháp</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Hãy ghi lý do thật rõ để store owner hiểu chính xác phần nào cần sửa trước khi gửi lại.
          </p>
        </div>

        <div className="space-y-5 px-6 py-6">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">
              Lý do từ chối <span className="text-rose-500">*</span>
            </span>
            <textarea
              rows={5}
              value={reason}
              onChange={(event) => {
                setReason(event.target.value);
                setError(null);
              }}
              className="w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white"
              placeholder="Ví dụ: Nội dung mô tả còn quá ngắn, ảnh menu chưa đủ rõ, hoặc thiếu thông tin món chính..."
            />
          </label>

          {error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="rounded-2xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
            >
              {isLoading ? 'Đang xử lý...' : 'Xác nhận từ chối'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

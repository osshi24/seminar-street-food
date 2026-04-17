'use client';

import { useState } from 'react';

interface ResolveReportModalProps {
  isOpen: boolean;
  isLoading?: boolean;
  onResolve: (action: 'hide' | 'delete') => void;
  onCancel: () => void;
  storeName?: string;
  reviewContent?: string;
}

export default function ResolveReportModal({
  isOpen,
  isLoading = false,
  onResolve,
  onCancel,
  storeName = 'Bình luận',
  reviewContent = '',
}: ResolveReportModalProps) {
  const [selectedAction, setSelectedAction] = useState<'hide' | 'delete'>('hide');

  if (!isOpen) return null;

  const handleSubmit = () => {
    onResolve(selectedAction);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
            <span className="text-xl">✓</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Xử lý báo cáo</h3>
        </div>

        <p className="mb-4 text-sm text-gray-600">
          Chọn hành động xử lý cho báo cáo về <strong>{storeName}</strong>
        </p>

        {reviewContent && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-medium text-gray-600 mb-1">Nội dung bình luận:</p>
            <p className="text-sm text-gray-700 line-clamp-3">{reviewContent}</p>
          </div>
        )}

        <div className="mb-4 space-y-3">
          <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="action"
              value="hide"
              checked={selectedAction === 'hide'}
              onChange={(e) => setSelectedAction(e.target.value as 'hide')}
              className="mt-1"
            />
            <div>
              <div className="text-sm font-medium text-gray-900">Ẩn bình luận</div>
              <div className="text-xs text-gray-600">Bình luận sẽ bị ẩn khỏi công khai</div>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="action"
              value="delete"
              checked={selectedAction === 'delete'}
              onChange={(e) => setSelectedAction(e.target.value as 'delete')}
              className="mt-1"
            />
            <div>
              <div className="text-sm font-medium text-gray-900">Xóa vĩnh viễn</div>
              <div className="text-xs text-gray-600">Bình luận sẽ bị xóa hoàn toàn, không thể khôi phục</div>
            </div>
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>}
            Xử lý
          </button>
        </div>
      </div>
    </div>
  );
}

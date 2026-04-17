'use client';

import { useState } from 'react';

interface ApprovalModalProps {
  isOpen: boolean;
  isLoading?: boolean;
  onApprove: () => void;
  onCancel: () => void;
  storeOwnerName?: string;
}

export default function ApprovalModal({
  isOpen,
  isLoading = false,
  onApprove,
  onCancel,
  storeOwnerName = 'Chủ gian hàng',
}: ApprovalModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
            <span className="text-xl">✓</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Phê duyệt tài khoản</h3>
        </div>

        <p className="mb-6 text-sm text-gray-600">
          Xác nhận phê duyệt tài khoản cho <strong>{storeOwnerName}</strong>? Chủ gian hàng
          sẽ nhận thông báo qua email và có thể đăng nhập ngay.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={onApprove}
            disabled={isLoading}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>}
            Phê duyệt
          </button>
        </div>
      </div>
    </div>
  );
}

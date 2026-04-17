'use client';

import type { StoreOwner } from '../../../types/store-owner';

interface StoreOwnerDetailHeaderProps {
  owner: StoreOwner;
  onBack: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ duyệt',
  active: 'Đang hoạt động',
  inactive: 'Vô hiệu hóa',
  rejected: 'Đã từ chối',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  active: 'bg-emerald-100 text-emerald-800',
  inactive: 'bg-slate-100 text-slate-800',
  rejected: 'bg-red-100 text-red-800',
};

export default function StoreOwnerDetailHeader({
  owner,
  onBack,
}: StoreOwnerDetailHeaderProps) {
  return (
    <div className="rounded-lg bg-white border border-gray-200 p-6 mb-6">
      <button
        onClick={onBack}
        className="mb-4 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
      >
        ← Quay lại danh sách
      </button>

      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
          <span className="text-2xl font-bold text-blue-700">
            {owner.fullName.charAt(0).toUpperCase()}
          </span>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{owner.fullName}</h1>
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_COLORS[owner.status]}`}>
              {STATUS_LABELS[owner.status]}
            </span>
          </div>
          <p className="text-gray-600 text-sm">{owner.email}</p>
          {owner.phone && <p className="text-gray-600 text-sm">{owner.phone}</p>}
        </div>

        <div className="text-right text-sm text-gray-600">
          <div className="font-medium">Đăng ký: {new Date(owner.createdAt).toLocaleDateString('vi-VN')}</div>
        </div>
      </div>
    </div>
  );
}

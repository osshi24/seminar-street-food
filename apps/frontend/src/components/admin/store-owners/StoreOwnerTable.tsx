'use client';

import type { StoreOwner } from '../../../types/store-owner';
import StoreOwnerTableRow from './StoreOwnerTableRow';

interface StoreOwnerTableProps {
  owners: StoreOwner[];
  onQuickAction?: (action: 'approve' | 'reject', id: string) => void;
}

export default function StoreOwnerTable({
  owners,
  onQuickAction,
}: StoreOwnerTableProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Tên
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Email
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Gian hàng
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Trạng thái
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Ngày đăng ký
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Hành động
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {owners.map((owner) => (
            <StoreOwnerTableRow
              key={owner.id}
              owner={owner}
              onQuickAction={onQuickAction}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

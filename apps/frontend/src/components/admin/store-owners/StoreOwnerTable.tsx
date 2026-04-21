'use client';

import type { StoreOwner } from '../../../types/store-owner';
import StoreOwnerTableRow from './StoreOwnerTableRow';

interface StoreOwnerTableProps {
  owners: StoreOwner[];
  onQuickAction?: (action: 'approve' | 'reject', id: string) => void;
}

export default function StoreOwnerTable({ owners, onQuickAction }: StoreOwnerTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="border-b border-slate-200 bg-slate-50/50">
            <tr>
              {['Tên', 'Email', 'Gian hàng', 'Trạng thái', 'Đăng ký', 'Tác vụ'].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500 ${
                    i === 5 ? 'text-right' : 'text-left'
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {owners.map((owner) => (
              <StoreOwnerTableRow key={owner.id} owner={owner} onQuickAction={onQuickAction} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

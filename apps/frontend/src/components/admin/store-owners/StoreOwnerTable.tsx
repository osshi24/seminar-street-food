'use client';

import type { StoreOwner } from '../../../types/store-owner';
import StoreOwnerTableRow from './StoreOwnerTableRow';

interface StoreOwnerTableProps {
  owners: StoreOwner[];
  onQuickAction?: (action: 'approve' | 'reject', id: string) => void;
}

export default function StoreOwnerTable({ owners, onQuickAction }: StoreOwnerTableProps) {
  return (
    <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)]">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-50/80">
            <tr className="border-b border-slate-200">
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Tên
              </th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Email
              </th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Gian hàng
              </th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Trạng thái
              </th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Ngày đăng ký
              </th>
              <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Tác vụ
              </th>
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

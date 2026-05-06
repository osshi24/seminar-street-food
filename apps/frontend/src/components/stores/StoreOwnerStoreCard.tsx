'use client';

import Link from 'next/link';
import { ArrowRight, ImageOff } from 'lucide-react';
import { Badge } from '../ui/badge';
import Thumbnail from '../ui/thumbnail';
import { cn } from '../../lib/cn';
import { type StoreListItem } from '../../lib/api/stores';

interface StoreOwnerStoreCardProps {
  store: StoreListItem;
}

const APPROVAL_BADGE: Record<
  StoreListItem['approvalStatus'],
  { label: string; variant: 'warning' | 'info' | 'danger' }
> = {
  pending: { label: 'Chờ duyệt', variant: 'warning' },
  approved: { label: 'Đã duyệt', variant: 'info' },
  rejected: { label: 'Bị từ chối', variant: 'danger' },
};

export default function StoreOwnerStoreCard({ store }: StoreOwnerStoreCardProps) {
  const approval = APPROVAL_BADGE[store.approvalStatus];
  const isActive = store.status === 'active';

  return (
    <Link
      href={`/dashboard/stores/${store.id}`}
      className={cn(
        'group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all',
        'hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md',
      )}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
        <Thumbnail
          src={store.thumbnailUrl}
          alt={store.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          fallback={
            <div className="flex h-full items-center justify-center text-slate-300">
              <ImageOff className="h-10 w-10" />
            </div>
          }
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge variant={approval.variant}>{approval.label}</Badge>
          {store.approvalStatus === 'approved' && (
            <Badge variant={isActive ? 'success' : 'muted'}>
              {isActive ? 'Hoạt động' : 'Tạm ẩn'}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-1 text-base font-semibold tracking-tight text-slate-900">
          {store.name}
        </h3>
        {store.description ? (
          <p className="line-clamp-2 text-sm leading-5 text-slate-500">{store.description}</p>
        ) : (
          <p className="text-sm italic text-slate-400">Chưa có mô tả</p>
        )}

        <div className="mt-auto flex items-center justify-end pt-1 text-xs font-medium text-orange-600 transition-colors group-hover:text-orange-700">
          Quản lý gian hàng
          <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </Link>
  );
}

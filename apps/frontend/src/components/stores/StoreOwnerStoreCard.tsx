'use client';

import Link from 'next/link';
import { type StoreListItem } from '../../lib/api/stores';

interface StoreOwnerStoreCardProps {
  store: StoreListItem;
}

const approvalStatusColors = {
  pending: { border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-800' },
  approved: { border: 'border-gray-200', badge: 'bg-blue-100 text-blue-800' },
  rejected: { border: 'border-red-200', badge: 'bg-red-100 text-red-800' },
};

const statusLabels = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Bị từ chối',
};

export default function StoreOwnerStoreCard({ store }: StoreOwnerStoreCardProps) {
  const colors = approvalStatusColors[store.approvalStatus];

  return (
    <Link href={`/dashboard/stores/${store.id}`}>
      <div className={`rounded-xl border bg-white overflow-hidden transition-all hover:shadow-md cursor-pointer ${colors.border}`}>
        {/* Thumbnail */}
        <div className="relative h-36 bg-gray-100">
          {store.thumbnailUrl ? (
            <img
              src={store.thumbnailUrl}
              alt={store.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <svg className="h-10 w-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="text-base font-semibold text-gray-900 truncate">{store.name}</h3>
          {store.description && (
            <p className="text-sm text-gray-500 line-clamp-2 mt-1">{store.description}</p>
          )}

          <div className="flex items-center gap-2 flex-wrap mt-3">
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.badge}`}>
              {statusLabels[store.approvalStatus]}
            </span>
            {store.approvalStatus === 'approved' && (
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                store.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {store.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

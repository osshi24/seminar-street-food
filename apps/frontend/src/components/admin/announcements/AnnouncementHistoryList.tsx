'use client';

import type { Announcement, AnnouncementStatus } from '@/lib/api/admin-announcements';

interface AnnouncementHistoryListProps {
  items: Announcement[];
  loading?: boolean;
  onEdit?: (announcement: Announcement) => void;
  onSend?: (announcement: Announcement) => void;
  currentPage: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  status?: AnnouncementStatus;
  onStatusChange?: (status?: AnnouncementStatus) => void;
  actionLoading?: string | null;
}

const STATUS_CONFIG: Record<
  AnnouncementStatus,
  { label: string; icon: string; bg: string; text: string }
> = {
  draft: { label: '💾 Nháp', icon: '💾', bg: 'bg-slate-100', text: 'text-slate-700' },
  sent: { label: '✓ Đã gửi', icon: '✓', bg: 'bg-emerald-100', text: 'text-emerald-700' },
};

export default function AnnouncementHistoryList({
  items,
  loading,
  onEdit,
  onSend,
  currentPage,
  totalPages,
  total,
  limit,
  onPageChange,
  status,
  onStatusChange,
  actionLoading,
}: AnnouncementHistoryListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-white p-4 animate-pulse">
            <div className="h-5 w-1/3 rounded bg-gray-200 mb-2"></div>
            <div className="h-4 w-full rounded bg-gray-200 mb-2"></div>
            <div className="h-3 w-2/3 rounded bg-gray-100"></div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 py-12 text-center">
        <div className="text-4xl mb-2">📭</div>
        <p className="text-gray-600">Chưa có thông báo nào</p>
        <p className="text-xs text-gray-500 mt-1">Hãy soạn và gửi thông báo đầu tiên</p>
      </div>
    );
  }

  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, total);

  return (
    <div className="space-y-4">
      {/* Status Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-3">
        {[
          { label: 'Tất cả', value: undefined },
          { label: '💾 Nháp', value: 'draft' as const },
          { label: '✓ Đã gửi', value: 'sent' as const },
        ].map((filter) => (
          <button
            key={String(filter.value)}
            onClick={() => {
              onStatusChange?.(filter.value);
              onPageChange(1);
            }}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              status === filter.value
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {items.map((item) => {
          const config = STATUS_CONFIG[item.status];
          return (
            <div
              key={item.id}
              className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{item.title}</h3>
                    <span className={`${config.bg} ${config.text} inline-flex rounded-full px-2 py-0.5 text-xs font-medium shrink-0`}>
                      {config.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">{item.body}</p>
                </div>
              </div>

              <div className="mb-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                <div>📨 {item.recipientCount} người nhận</div>
                <div>🕐 {new Date(item.createdAt).toLocaleDateString('vi-VN')}</div>
                {item.failedEmailDetails?.length ? (
                  <div className="col-span-2 text-red-600">⚠️ {item.failedEmailDetails.length} email lỗi</div>
                ) : null}
              </div>

              {/* Actions */}
              {item.status === 'draft' && (
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => onEdit?.(item)}
                    disabled={actionLoading !== null}
                    className="flex-1 rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                  >
                    ✏️ Sửa
                  </button>
                  <button
                    onClick={() => onSend?.(item)}
                    disabled={actionLoading !== null}
                    className="flex-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    {actionLoading === item.id ? '⏳ Gửi...' : '📨 Gửi'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3">
          <div className="text-xs text-gray-600">
            Hiển thị <span className="font-semibold">{startItem}</span> đến{' '}
            <span className="font-semibold">{endItem}</span> của <span className="font-semibold">{total}</span>{' '}
            mục
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              ← Trước
            </button>

            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`min-w-8 rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                      pageNum === currentPage
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Tiếp →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

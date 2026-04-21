'use client';

import { MessageSquare } from 'lucide-react';
import StarRating from '../reviews/StarRating';
import AdminEmptyState from './common/AdminEmptyState';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface ReviewRow {
  id: string;
  stars: number;
  content: string | null;
  isHidden: boolean;
  hiddenAt: string | null;
  createdAt: string;
  reportCount: number;
  customer: { displayName: string; avatarUrl: string | null } | null;
  store: { id: string; name: string } | null;
}

interface AdminReviewTableProps {
  reviews: ReviewRow[];
  processingId?: string | null;
  onHide: (id: string) => Promise<void>;
  onUnhide: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function getInitials(name?: string | null) {
  if (!name) return 'KH';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export default function AdminReviewTable({
  reviews,
  processingId,
  onHide,
  onUnhide,
  onDelete,
}: AdminReviewTableProps) {
  const list = Array.isArray(reviews) ? reviews : [];
  if (list.length === 0) {
    return (
      <AdminEmptyState
        icon={MessageSquare}
        title="Không có bình luận phù hợp"
        description="Đổi bộ lọc hoặc quay lại sau khi hệ thống có thêm phản hồi từ khách hàng."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="border-b border-slate-200 bg-slate-50/50">
            <tr>
              {['Khách hàng', 'Nội dung', 'Gian hàng', 'Trạng thái', 'Báo cáo', 'Tác vụ'].map(
                (h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500 ${
                      i === 5 ? 'text-right' : 'text-left'
                    }`}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {list.map((review) => {
              const busy = processingId === review.id;

              return (
                <tr key={review.id} className="transition-colors hover:bg-slate-50">
                  <td className="px-4 py-3 align-top">
                    <div className="flex min-w-[200px] items-start gap-2.5">
                      {review.customer?.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={review.customer.avatarUrl}
                          alt={review.customer.displayName}
                          referrerPolicy="no-referrer"
                          className="h-9 w-9 rounded-md object-cover ring-1 ring-slate-200"
                        />
                      ) : (
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-slate-900 text-xs font-semibold text-white">
                          {getInitials(review.customer?.displayName)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {review.customer?.displayName ?? 'Khách ẩn danh'}
                        </p>
                        <div className="mt-0.5">
                          <StarRating value={review.stars} readonly />
                        </div>
                        <p className="mt-1 text-[11px] uppercase tracking-wider text-slate-400">
                          {new Date(review.createdAt).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <p className="line-clamp-3 max-w-[380px] text-sm leading-5 text-slate-600">
                      {review.content || 'Bình luận chỉ có điểm sao.'}
                    </p>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <p className="text-sm font-medium text-slate-900">
                      {review.store?.name ?? 'Chưa gắn'}
                    </p>
                    <p className="mt-0.5 text-[11px] uppercase tracking-wider text-slate-400">
                      {review.store?.id ? review.store.id.slice(0, 8) : 'N/A'}
                    </p>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Badge variant={review.isHidden ? 'default' : 'success'}>
                      {review.isHidden ? 'Đang ẩn' : 'Hiển thị'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 align-top">
                    {review.reportCount > 0 ? (
                      <Badge variant="warning">{review.reportCount} báo cáo</Badge>
                    ) : (
                      <span className="text-xs text-slate-400">Không có</span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex justify-end gap-1">
                      {review.isHidden ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onUnhide(review.id)}
                          disabled={busy}
                          className="text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                        >
                          {busy ? 'Đang...' : 'Bỏ ẩn'}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (window.confirm('Ẩn bình luận này khỏi giao diện khách?')) {
                              void onHide(review.id);
                            }
                          }}
                          disabled={busy}
                          className="text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                        >
                          {busy ? 'Đang...' : 'Ẩn'}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (
                            window.confirm(
                              'Xóa vĩnh viễn bình luận này? Hành động không thể hoàn tác.',
                            )
                          ) {
                            void onDelete(review.id);
                          }
                        }}
                        disabled={busy}
                      >
                        {busy ? 'Đang...' : 'Xóa'}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

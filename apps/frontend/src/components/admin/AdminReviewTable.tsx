'use client';

import StarRating from '../reviews/StarRating';

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
  if (reviews.length === 0) {
    return (
      <div className="rounded-[32px] border border-slate-200 bg-white px-6 py-14 text-center shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)]">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-slate-50 text-2xl">
          💬
        </div>
        <h3 className="mt-4 text-lg font-semibold text-slate-900">Không có bình luận phù hợp</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Hãy đổi bộ lọc hoặc quay lại sau khi hệ thống có thêm phản hồi từ khách hàng.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)]">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <th className="px-5 py-4">Khách hàng</th>
              <th className="px-5 py-4">Nội dung</th>
              <th className="px-5 py-4">Gian hàng</th>
              <th className="px-5 py-4">Trạng thái</th>
              <th className="px-5 py-4">Báo cáo</th>
              <th className="px-5 py-4 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reviews.map((review) => {
              const busy = processingId === review.id;

              return (
                <tr key={review.id} className="transition hover:bg-cyan-50/40">
                  <td className="px-5 py-4 align-top">
                    <div className="flex min-w-[220px] items-start gap-3">
                      {review.customer?.avatarUrl ? (
                        <img
                          src={review.customer.avatarUrl}
                          alt={review.customer.displayName}
                          referrerPolicy="no-referrer"
                          className="h-12 w-12 rounded-2xl object-cover ring-1 ring-slate-200"
                        />
                      ) : (
                        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
                          {getInitials(review.customer?.displayName)}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-slate-900">
                          {review.customer?.displayName ?? 'Khách hàng ẩn danh'}
                        </p>
                        <div className="mt-1">
                          <StarRating value={review.stars} readonly />
                        </div>
                        <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                          {new Date(review.createdAt).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <div className="max-w-[420px]">
                      <p className="line-clamp-3 text-sm leading-6 text-slate-600">
                        {review.content || 'Bình luận chỉ có điểm sao, chưa có nội dung chữ.'}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <div className="min-w-[180px]">
                      <p className="font-semibold text-slate-900">
                        {review.store?.name ?? 'Chưa gắn gian hàng'}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        ID: {review.store?.id ? `${review.store.id.slice(0, 8)}...` : 'N/A'}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-4 align-top">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                        review.isHidden
                          ? 'bg-slate-950 text-white ring-slate-900'
                          : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                      }`}
                    >
                      {review.isHidden ? 'Đang ẩn' : 'Hiển thị'}
                    </span>
                  </td>
                  <td className="px-5 py-4 align-top">
                    {review.reportCount > 0 ? (
                      <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                        {review.reportCount} báo cáo
                      </span>
                    ) : (
                      <span className="text-sm text-slate-400">Không có</span>
                    )}
                  </td>
                  <td className="px-5 py-4 align-top">
                    <div className="flex justify-end gap-2">
                      {review.isHidden ? (
                        <button
                          onClick={() => onUnhide(review.id)}
                          disabled={busy}
                          className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60"
                        >
                          {busy ? 'Đang xử lý...' : 'Bỏ ẩn'}
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (window.confirm('Ẩn bình luận này khỏi giao diện khách?')) {
                              void onHide(review.id);
                            }
                          }}
                          disabled={busy}
                          className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 disabled:opacity-60"
                        >
                          {busy ? 'Đang xử lý...' : 'Ẩn'}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (window.confirm('Xóa vĩnh viễn bình luận này? Hành động không thể hoàn tác.')) {
                            void onDelete(review.id);
                          }
                        }}
                        disabled={busy}
                        className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
                      >
                        {busy ? 'Đang xử lý...' : 'Xóa'}
                      </button>
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

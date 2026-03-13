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
  onHide: (id: string) => Promise<void>;
  onUnhide: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function AdminReviewTable({ reviews, onHide, onUnhide, onDelete }: AdminReviewTableProps) {
  if (reviews.length === 0) {
    return <p className="text-center text-sm text-gray-400 py-8">Không có bình luận nào.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase">
            <th className="pb-2 pr-4">Bình luận</th>
            <th className="pb-2 pr-4">Gian hàng</th>
            <th className="pb-2 pr-4">Trạng thái</th>
            <th className="pb-2 pr-4">Báo cáo</th>
            <th className="pb-2">Hành động</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {reviews.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50">
              <td className="py-3 pr-4 max-w-xs">
                <p className="font-medium text-gray-800">{r.customer?.displayName}</p>
                <StarRating value={r.stars} readonly />
                <p className="text-xs text-gray-500 truncate">{r.content ?? '(không có nội dung)'}</p>
                <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString('vi-VN')}</p>
              </td>
              <td className="py-3 pr-4 text-xs text-gray-600">{r.store?.name ?? '-'}</td>
              <td className="py-3 pr-4">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    r.isHidden ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'
                  }`}
                >
                  {r.isHidden ? 'Đã ẩn' : 'Hiển thị'}
                </span>
              </td>
              <td className="py-3 pr-4 text-xs text-gray-600">{r.reportCount > 0 ? r.reportCount : '-'}</td>
              <td className="py-3">
                <div className="flex flex-col gap-1">
                  {r.isHidden ? (
                    <button
                      onClick={() => onUnhide(r.id)}
                      className="rounded bg-green-50 px-2 py-1 text-xs text-green-700 hover:bg-green-100"
                    >
                      Bỏ ẩn
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (confirm('Ẩn bình luận này?')) onHide(r.id);
                      }}
                      className="rounded bg-orange-50 px-2 py-1 text-xs text-orange-700 hover:bg-orange-100"
                    >
                      Ẩn
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm('Xóa vĩnh viễn bình luận? Không thể hoàn tác.')) onDelete(r.id);
                    }}
                    className="rounded bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100"
                  >
                    Xóa
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

'use client';

import StarRating from '../reviews/StarRating';

interface ReportRow {
  id: string;
  status: string;
  createdAt: string;
  reason: { id: number; labelVi: string } | null;
  reporter: { id: string; fullName: string } | null;
  review: {
    id: string;
    stars: number;
    content: string | null;
    isHidden: boolean;
    customer: { displayName: string } | null;
    store: { id: string; name: string } | null;
  } | null;
}

interface AdminReportTableProps {
  reports: ReportRow[];
  onResolve: (id: string, action: 'hide' | 'delete') => Promise<void>;
  onDismiss: (id: string) => Promise<void>;
}

export default function AdminReportTable({ reports, onResolve, onDismiss }: AdminReportTableProps) {
  if (reports.length === 0) {
    return <p className="text-center text-sm text-gray-400 py-8">Không có báo cáo nào.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase">
            <th className="pb-2 pr-4">Bình luận</th>
            <th className="pb-2 pr-4">Lý do</th>
            <th className="pb-2 pr-4">Store Owner</th>
            <th className="pb-2 pr-4">Trạng thái</th>
            <th className="pb-2">Hành động</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {reports.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50">
              <td className="py-3 pr-4 max-w-xs">
                {r.review ? (
                  <div>
                    <p className="font-medium text-gray-800">{r.review.store?.name}</p>
                    <StarRating value={r.review.stars} readonly />
                    <p className="text-xs text-gray-500 truncate">{r.review.content ?? '(không có nội dung)'}</p>
                    <p className="text-xs text-gray-400">bởi {r.review.customer?.displayName}</p>
                    {r.review.isHidden && <span className="text-xs text-orange-500">Đã ẩn</span>}
                  </div>
                ) : (
                  <span className="text-gray-400">Đã xóa</span>
                )}
              </td>
              <td className="py-3 pr-4 text-xs text-gray-600">{r.reason?.labelVi ?? '-'}</td>
              <td className="py-3 pr-4 text-xs text-gray-600">{r.reporter?.fullName ?? '-'}</td>
              <td className="py-3 pr-4">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    r.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : r.status === 'resolved'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {r.status === 'pending' ? 'Chờ xử lý' : r.status === 'resolved' ? 'Đã xử lý' : 'Bác bỏ'}
                </span>
              </td>
              <td className="py-3">
                {r.status === 'pending' && r.review && (
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => {
                        if (confirm('Ẩn bình luận này?')) onResolve(r.id, 'hide');
                      }}
                      className="rounded bg-orange-50 px-2 py-1 text-xs text-orange-700 hover:bg-orange-100"
                    >
                      Ẩn bình luận
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Xóa vĩnh viễn bình luận này? Không thể hoàn tác.')) onResolve(r.id, 'delete');
                      }}
                      className="rounded bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100"
                    >
                      Xóa vĩnh viễn
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Bác bỏ báo cáo này?')) onDismiss(r.id);
                      }}
                      className="rounded bg-gray-50 px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
                    >
                      Bác bỏ báo cáo
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

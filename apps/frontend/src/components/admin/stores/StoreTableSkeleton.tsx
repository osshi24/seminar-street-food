'use client';

export default function StoreTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full">
        <thead className="border-b border-slate-200 bg-slate-50/50">
          <tr>
            {['Gian hàng', 'Chủ gian hàng', 'Trạng thái', 'Ngày tạo', 'Tác vụ'].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-500"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="animate-pulse">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-md bg-slate-200" />
                  <div className="space-y-2">
                    <div className="h-3.5 w-28 rounded bg-slate-200" />
                    <div className="h-2.5 w-20 rounded bg-slate-100" />
                  </div>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="space-y-2">
                  <div className="h-3.5 w-32 rounded bg-slate-200" />
                  <div className="h-2.5 w-40 rounded bg-slate-100" />
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="h-5 w-24 rounded-md bg-slate-200" />
              </td>
              <td className="px-4 py-3">
                <div className="h-3.5 w-20 rounded bg-slate-200" />
              </td>
              <td className="px-4 py-3">
                <div className="h-7 w-16 rounded-md bg-slate-200" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

'use client';

export default function StoreTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border bg-white">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Gian hàng
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Chủ gian hàng
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Trạng thái
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Hành động
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="animate-pulse">
              <td className="px-6 py-4">
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gray-200"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 rounded bg-gray-200"></div>
                    <div className="h-3 w-20 rounded bg-gray-100"></div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="space-y-2">
                  <div className="h-4 w-32 rounded bg-gray-200"></div>
                  <div className="h-3 w-40 rounded bg-gray-100"></div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="h-6 w-24 rounded-full bg-gray-200"></div>
              </td>
              <td className="px-6 py-4">
                <div className="h-8 w-20 rounded bg-gray-200"></div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

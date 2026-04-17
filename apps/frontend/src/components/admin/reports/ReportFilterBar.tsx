'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface ReportFilterBarProps {
  currentStatus: string;
  currentSearch: string;
}

export default function ReportFilterBar({
  currentStatus,
  currentSearch,
}: ReportFilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const statuses = [
    { value: '', label: 'Tất cả' },
    { value: 'pending', label: 'Chờ xử lý' },
    { value: 'resolved', label: 'Đã xử lý' },
    { value: 'dismissed', label: 'Bác bỏ' },
  ];

  const handleStatusChange = (status: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (status) {
      params.set('status', status);
    } else {
      params.delete('status');
    }
    params.set('page', '1');
    router.push(`/admin/reports?${params.toString()}`);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) {
      params.set('search', e.target.value);
    } else {
      params.delete('search');
    }
    params.set('page', '1');
    router.push(`/admin/reports?${params.toString()}`);
  };

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
      {/* Status tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-4">
        {statuses.map((status) => (
          <button
            key={status.value}
            onClick={() => handleStatusChange(status.value)}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
              (currentStatus.toLowerCase() || '') === status.value
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {status.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Tìm theo gian hàng, khách hàng, lý do..."
            defaultValue={currentSearch}
            onChange={handleSearch}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}

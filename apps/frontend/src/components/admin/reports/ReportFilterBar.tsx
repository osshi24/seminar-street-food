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
    if (status) params.set('status', status);
    else params.delete('status');
    params.set('page', '1');
    router.push(`/admin/reports?${params.toString()}`);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const params = new URLSearchParams(searchParams.toString());
    if (event.target.value) params.set('search', event.target.value);
    else params.delete('search');
    params.set('page', '1');
    router.push(`/admin/reports?${params.toString()}`);
  };

  return (
    <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)]">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">
            Bộ lọc báo cáo
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">
            Ưu tiên xử lý đúng nhóm vấn đề
          </h2>
        </div>

        <label className="relative block min-w-[280px]">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
            🔎
          </span>
          <input
            type="text"
            placeholder="Tìm theo gian hàng, khách hàng, lý do..."
            defaultValue={currentSearch}
            onChange={handleSearch}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-300 focus:bg-white focus:outline-none"
          />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {statuses.map((status) => (
          <button
            key={status.value}
            onClick={() => handleStatusChange(status.value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              (currentStatus.toLowerCase() || '') === status.value
                ? 'bg-slate-950 text-white'
                : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {status.label}
          </button>
        ))}
      </div>
    </div>
  );
}

'use client';

interface StoreOwnerStatsCardProps {
  total: number;
  pending: number;
  active: number;
  inactive: number;
  rejected: number;
}

export default function StoreOwnerStatsCard({
  total,
  pending,
  active,
  inactive,
  rejected,
}: StoreOwnerStatsCardProps) {
  const stats = [
    {
      label: 'Tổng chủ gian hàng',
      value: total,
      bg: 'from-blue-50 to-white',
      text: 'text-blue-700',
      icon: '👥',
    },
    {
      label: 'Chờ duyệt',
      value: pending,
      bg: 'from-amber-50 to-white',
      text: 'text-amber-700',
      icon: '⏳',
    },
    {
      label: 'Đang hoạt động',
      value: active,
      bg: 'from-emerald-50 to-white',
      text: 'text-emerald-700',
      icon: '✅',
    },
    {
      label: 'Vô hiệu hóa',
      value: inactive,
      bg: 'from-slate-50 to-white',
      text: 'text-slate-700',
      icon: '⛔',
    },
    {
      label: 'Đã từ chối',
      value: rejected,
      bg: 'from-red-50 to-white',
      text: 'text-red-700',
      icon: '❌',
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`rounded-lg border border-gray-200 bg-gradient-to-br ${stat.bg} px-4 py-3`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                {stat.label}
              </div>
              <div className={`mt-2 text-3xl font-bold ${stat.text}`}>{stat.value}</div>
            </div>
            <div className="text-2xl">{stat.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

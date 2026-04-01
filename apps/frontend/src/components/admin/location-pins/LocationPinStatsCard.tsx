'use client';

interface LocationPinStatsCardProps {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  superseded: number;
}

export default function LocationPinStatsCard({
  total,
  pending,
  approved,
  rejected,
  superseded,
}: LocationPinStatsCardProps) {
  const stats = [
    {
      label: 'Tổng ghim',
      value: total,
      bg: 'from-blue-50 to-white',
      text: 'text-blue-700',
      icon: '📍',
    },
    {
      label: 'Chờ duyệt',
      value: pending,
      bg: 'from-amber-50 to-white',
      text: 'text-amber-700',
      icon: '⏳',
    },
    {
      label: 'Đã duyệt',
      value: approved,
      bg: 'from-emerald-50 to-white',
      text: 'text-emerald-700',
      icon: '✅',
    },
    {
      label: 'Bị từ chối',
      value: rejected,
      bg: 'from-red-50 to-white',
      text: 'text-red-700',
      icon: '❌',
    },
    {
      label: 'Đã thay thế',
      value: superseded,
      bg: 'from-purple-50 to-white',
      text: 'text-purple-700',
      icon: '🔄',
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

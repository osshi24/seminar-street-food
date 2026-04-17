'use client';

interface ReportStatsCardProps {
  total: number;
  pending: number;
  resolved: number;
  dismissed: number;
}

export default function ReportStatsCard({
  total,
  pending,
  resolved,
  dismissed,
}: ReportStatsCardProps) {
  const stats = [
    {
      label: 'Tổng cộng',
      value: total,
      bgColor: 'bg-slate-100',
      textColor: 'text-slate-800',
      emoji: '📋',
    },
    {
      label: 'Chờ xử lý',
      value: pending,
      bgColor: 'bg-amber-100',
      textColor: 'text-amber-800',
      emoji: '⏳',
    },
    {
      label: 'Đã xử lý',
      value: resolved,
      bgColor: 'bg-emerald-100',
      textColor: 'text-emerald-800',
      emoji: '✅',
    },
    {
      label: 'Bác bỏ',
      value: dismissed,
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-800',
      emoji: '✕',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`rounded-lg border border-gray-200 p-4 ${stat.bgColor}`}
        >
          <div className="mb-2 text-2xl">{stat.emoji}</div>
          <div className={`text-sm font-medium ${stat.textColor}`}>{stat.label}</div>
          <div className={`text-2xl font-bold ${stat.textColor} mt-1`}>{stat.value}</div>
        </div>
      ))}
    </div>
  );
}

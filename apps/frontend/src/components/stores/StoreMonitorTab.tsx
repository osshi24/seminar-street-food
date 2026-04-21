'use client';

import { useEffect, useState } from 'react';
import { QrCode, Users, Star, BarChart2, TrendingUp } from 'lucide-react';
import { getStoreAnalytics, type AnalyticsSummary } from '../../lib/api/analytics';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  total: number;
  today: number;
  thisWeek: number;
  color: string;
}

function StatCard({ icon, label, total, today, thisWeek, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className={`p-2 rounded-xl ${color}`}>{icon}</span>
        <span className="text-sm font-semibold text-gray-700">{label}</span>
      </div>
      <div className="text-3xl font-bold text-gray-900">{total.toLocaleString()}</div>
      <div className="flex gap-4 text-xs text-gray-500">
        <span>
          Hôm nay: <strong className="text-gray-700">{today}</strong>
        </span>
        <span>
          7 ngày: <strong className="text-gray-700">{thisWeek}</strong>
        </span>
      </div>
    </div>
  );
}

function MiniBarChart({ daily }: { daily: AnalyticsSummary['daily'] }) {
  const maxVal = Math.max(...daily.flatMap((d) => [d.qrScans, d.storeVisits]), 1);
  const fmt = (iso: string) => {
    const d = new Date(iso);
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  // Show every other label to avoid crowding
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <div className="flex items-center gap-2 mb-4">
        <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
          <BarChart2 size={16} />
        </span>
        <span className="text-sm font-semibold text-gray-700">14 ngày gần nhất</span>
      </div>
      <div className="flex items-end gap-1 h-24">
        {daily.map((d, i) => {
          const qrH = Math.round((d.qrScans / maxVal) * 88);
          const visitH = Math.round((d.storeVisits / maxVal) * 88);
          return (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="flex items-end gap-px w-full justify-center" style={{ height: 88 }}>
                <div
                  title={`Quét QR: ${d.qrScans}`}
                  className="w-2 rounded-t bg-orange-400 transition-all"
                  style={{ height: qrH || 2 }}
                />
                <div
                  title={`Ghé trang: ${d.storeVisits}`}
                  className="w-2 rounded-t bg-blue-400 transition-all"
                  style={{ height: visitH || 2 }}
                />
              </div>
              {i % 2 === 0 && (
                <span className="text-[9px] text-gray-400 leading-none">{fmt(d.date)}</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-orange-400 inline-block" /> Quét QR
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-blue-400 inline-block" /> Ghé trang
        </span>
      </div>
    </div>
  );
}

export default function StoreMonitorTab({ storeId }: { storeId: string }) {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    getStoreAnalytics(storeId)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [storeId]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 h-28 animate-pulse" />
        ))}
      </div>
    );
  }

  if (error || !data || !data.qrScans || !data.storeVisits || !data.reviews) {
    return (
      <div className="text-center py-10 text-gray-400 text-sm">
        Không thể tải dữ liệu thống kê.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<QrCode size={16} />}
          label="Lượt quét QR"
          color="bg-orange-50 text-orange-600"
          total={data.qrScans.total}
          today={data.qrScans.today}
          thisWeek={data.qrScans.thisWeek}
        />
        <StatCard
          icon={<Users size={16} />}
          label="Ghé trang"
          color="bg-blue-50 text-blue-600"
          total={data.storeVisits.total}
          today={data.storeVisits.today}
          thisWeek={data.storeVisits.thisWeek}
        />
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-yellow-50 text-yellow-600">
              <Star size={16} />
            </span>
            <span className="text-sm font-semibold text-gray-700">Đánh giá</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">{data.reviews.total}</div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Star size={11} className="fill-yellow-400 text-yellow-400" />
            <span className="font-semibold text-gray-700">
              {data.reviews.avgRating > 0 ? data.reviews.avgRating.toFixed(1) : '—'}
            </span>
            <span>trung bình</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-green-50 text-green-600">
              <TrendingUp size={16} />
            </span>
            <span className="text-sm font-semibold text-gray-700">Tỷ lệ chuyển đổi</span>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {data.storeVisits.total > 0
              ? `${Math.round((data.qrScans.total / data.storeVisits.total) * 100)}%`
              : '—'}
          </div>
          <div className="text-xs text-gray-500">QR / lượt ghé trang</div>
        </div>
      </div>

      <MiniBarChart daily={data.daily} />
    </div>
  );
}

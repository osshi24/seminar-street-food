'use client';

interface LocationPinDetailHeaderProps {
  storeName: string;
  latitude: number | string;
  longitude: number | string;
  status: 'pending' | 'approved' | 'rejected' | 'superseded';
  submittedAt: string;
  submittedBy?: string;
}

const STATUS_CONFIG: Record<string, { label: string; badge: string; emoji: string }> = {
  pending: {
    label: 'Chờ duyệt',
    badge: 'bg-amber-50 text-amber-700 ring-amber-200',
    emoji: '⏳',
  },
  approved: {
    label: 'Đã duyệt',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    emoji: '✅',
  },
  rejected: {
    label: 'Bị từ chối',
    badge: 'bg-rose-50 text-rose-700 ring-rose-200',
    emoji: '❌',
  },
  superseded: {
    label: 'Đã thay thế',
    badge: 'bg-violet-50 text-violet-700 ring-violet-200',
    emoji: '🔄',
  },
};

export default function LocationPinDetailHeader({
  storeName,
  latitude,
  longitude,
  status,
  submittedAt,
  submittedBy,
}: LocationPinDetailHeaderProps) {
  const statusConfig = STATUS_CONFIG[status];

  return (
    <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)]">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">
            Location pin detail
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            {storeName}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Ghim vị trí đang được xem xét trong hệ thống moderation bản đồ.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Tọa độ</p>
              <code className="mt-2 block text-sm font-semibold text-slate-800">
                {Number(latitude).toFixed(5)}, {Number(longitude).toFixed(5)}
              </code>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Ngày gửi</p>
              <p className="mt-2 text-sm font-semibold text-slate-800">
                {new Date(submittedAt).toLocaleString('vi-VN')}
              </p>
              {submittedBy ? (
                <p className="mt-1 text-xs text-slate-500">bởi {submittedBy}</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="shrink-0 rounded-[28px] border border-slate-200 bg-slate-50 p-4">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white text-2xl shadow-sm">
            {statusConfig.emoji}
          </div>
          <span className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${statusConfig.badge}`}>
            {statusConfig.label}
          </span>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import { getBoundary, updateBoundary, Boundary } from '@/lib/api/admin-location';
import AdminPageHeader from '@/components/admin/common/AdminPageHeader';
import AdminMetricGrid from '@/components/admin/common/AdminMetricGrid';

const SAMPLE_COORDINATES = [
  { lat: 10.7625, lng: 106.6601 },
  { lat: 10.7632, lng: 106.6615 },
  { lat: 10.7628, lng: 106.6623 },
  { lat: 10.7619, lng: 106.6612 },
];

export default function AdminBoundariesPage() {
  const [boundary, setBoundary] = useState<Boundary | null>(null);
  const [coordsText, setCoordsText] = useState('');
  const [name, setName] = useState('Ranh giới phố ẩm thực');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    getBoundary()
      .then((data) => {
        setBoundary(data);
        if (data) {
          setName(data.name);
          setCoordsText(JSON.stringify(data.polygonCoordinates, null, 2));
        } else {
          setCoordsText(JSON.stringify(SAMPLE_COORDINATES, null, 2));
        }
      })
      .catch(() => showToast('error', 'Không tải được ranh giới'))
      .finally(() => setLoading(false));
  }, []);

  const coordinatePreview = useMemo(() => {
    try {
      const parsed = JSON.parse(coordsText) as Array<{ lat: number; lng: number }>;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [coordsText]);

  const handleSave = async () => {
    let coordinates: { lat: number; lng: number }[];
    try {
      coordinates = JSON.parse(coordsText) as { lat: number; lng: number }[];
      if (!Array.isArray(coordinates) || coordinates.length < 3) {
        showToast('error', 'Cần ít nhất 3 điểm tọa độ');
        return;
      }
    } catch {
      showToast('error', 'JSON tọa độ không hợp lệ');
      return;
    }

    setSaving(true);
    try {
      const updated = await updateBoundary({ name, coordinates });
      setBoundary(updated);
      showToast('success', 'Đã cập nhật ranh giới');
    } catch {
      showToast('error', 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-44 animate-pulse rounded-[32px] bg-white/70" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-[28px] bg-white/70" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        badge="Geo admin"
        title="Cấu hình ranh giới phố ẩm thực"
        description="Thiết lập vùng hợp lệ để kiểm soát vị trí cửa hàng và các đề xuất ghim trên bản đồ. Dữ liệu được lưu dưới dạng polygon coordinates."
        meta={boundary ? `Đang dùng: ${boundary.name}` : 'Chưa có ranh giới hoạt động'}
        action={
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? 'Đang lưu...' : 'Lưu ranh giới'}
          </button>
        }
      />

      <AdminMetricGrid
        items={[
          {
            label: 'Trạng thái',
            value: boundary ? 'Đang hoạt động' : 'Chưa cấu hình',
            tone: boundary ? 'emerald' : 'rose',
            icon: boundary ? '🧭' : '⚠️',
            description: boundary
              ? 'Ranh giới hiện tại đang được áp dụng cho luồng gửi vị trí.'
              : 'Store owner sẽ không thể gửi vị trí chính xác nếu chưa cấu hình.',
          },
          {
            label: 'Số đỉnh',
            value: coordinatePreview.length,
            tone: 'blue',
            icon: '📐',
            description: 'Một polygon hợp lệ cần tối thiểu 3 điểm tọa độ.',
          },
          {
            label: 'Tên vùng',
            value: boundary?.name || 'Chưa đặt',
            tone: 'slate',
            icon: '🏷️',
            description: 'Tên này dùng để nhận diện cấu hình đang active trong admin.',
          },
          {
            label: 'Mẫu mặc định',
            value: SAMPLE_COORDINATES.length,
            tone: 'amber',
            icon: '🧪',
            description: 'Số điểm mẫu được nạp khi hệ thống chưa có boundary nào.',
          },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">
            Chỉnh sửa dữ liệu
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">JSON polygon coordinates</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Nhập danh sách tọa độ dạng <code>[&#123; lat, lng &#125;]</code>. Hệ thống sẽ tự đóng polygon bằng điểm đầu tiên khi lưu.
          </p>

          <div className="mt-6 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Tên ranh giới</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Tọa độ (JSON Array of {'{lat, lng}'})
              </span>
              <textarea
                value={coordsText}
                onChange={(event) => setCoordsText(event.target.value)}
                className="min-h-[320px] w-full resize-y rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-4 font-mono text-sm text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white"
                spellCheck={false}
              />
            </label>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">
              Xem trước
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-950">Danh sách các điểm hiện tại</h3>

            <div className="mt-5 space-y-3">
              {coordinatePreview.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  JSON hiện tại chưa hợp lệ hoặc chưa có điểm nào để xem trước.
                </p>
              ) : (
                coordinatePreview.map((point, index) => (
                  <div
                    key={`${point.lat}-${point.lng}-${index}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <p className="text-sm font-semibold text-slate-900">Điểm {index + 1}</p>
                    <p className="mt-2 text-sm text-slate-600">lat: {point.lat}</p>
                    <p className="text-sm text-slate-600">lng: {point.lng}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">
              Lưu ý vận hành
            </p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <p>Chỉ nên thêm ranh giới mới khi thật sự có thay đổi phạm vi hoạt động.</p>
              <p>Giữ thứ tự điểm nhất quán để dễ review và tránh polygon tự cắt nhau.</p>
              <p>Boundary ảnh hưởng trực tiếp đến luồng gửi vị trí của store owner.</p>
            </div>
          </div>
        </aside>
      </div>

      {toast ? (
        <div
          className={`fixed bottom-6 right-6 rounded-2xl px-4 py-3 text-sm font-semibold text-white shadow-lg ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
          }`}
        >
          {toast.msg}
        </div>
      ) : null}
    </div>
  );
}

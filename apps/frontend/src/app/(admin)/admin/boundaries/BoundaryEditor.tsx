'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { withNoSSR } from '../../../../components/map/LeafletDynamic';
import { Boundary, createBoundary, getBoundaryById, listBoundaries, updateBoundaryById } from '../../../../lib/api/admin-location';

const BoundaryMapEditor = withNoSSR(() => import('./BoundaryMapEditor'), (
  <div className="h-[420px] w-full animate-pulse rounded-lg bg-gray-100" />
));

function defaultCoords4() {
  return [
    { lat: 10.7625, lng: 106.6601 },
    { lat: 10.7632, lng: 106.6615 },
    { lat: 10.7628, lng: 106.6623 },
    { lat: 10.7619, lng: 106.6612 },
  ];
}

export default function BoundaryEditor({ boundaryId }: { boundaryId?: string }) {
  const isNew = !boundaryId;
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const [name, setName] = useState('Ranh giới phố ẩm thực');
  const [isActive, setIsActive] = useState(true);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }[]>(defaultCoords4());
  const [allBoundaries, setAllBoundaries] = useState<Boundary[]>([]);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    listBoundaries()
      .then(setAllBoundaries)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!boundaryId) return;
    setLoading(true);
    getBoundaryById(boundaryId)
      .then((b: Boundary) => {
        setName(b.name);
        setIsActive(b.isActive);
        setCoordinates(b.polygonCoordinates ?? []);
      })
      .catch(() => showToast('error', 'Không tải được ranh giới'))
      .finally(() => setLoading(false));
  }, [boundaryId]);

  const backgroundBoundaries = useMemo(
    () =>
      allBoundaries
        .filter((b) => b.id !== boundaryId)
        .map((b) => ({
          id: b.id,
          name: `${b.name}${b.isActive ? '' : ' (tắt)'}`,
          coordinates: b.polygonCoordinates ?? [],
        })),
    [allBoundaries, boundaryId],
  );

  const coordsInfo = useMemo(() => {
    const n = coordinates.length;
    if (isNew) {
      if (n !== 4) return { ok: false, text: 'Ranh giới mới cần đúng 4 điểm. Kéo 4 ghim cam để chỉnh vị trí.' };
      return { ok: true, text: 'Đúng 4 điểm. Kéo ghim để chỉnh; các ranh giới xám là ranh giới đã có (tránh trùng).' };
    }
    if (n < 3) return { ok: false, text: 'Cần ít nhất 3 điểm.' };
    return { ok: true, text: `Số điểm: ${n}. Click bản đồ để thêm điểm, kéo ghim để chỉnh. Ranh giới xám là các ranh giới khác.` };
  }, [coordinates.length, isNew]);

  const handleSave = useCallback(async () => {
    if (isNew) {
      if (coordinates.length !== 4) {
        showToast('error', 'Ranh giới mới phải có đúng 4 điểm');
        return;
      }
    } else if (coordinates.length < 3) {
      showToast('error', 'Cần ít nhất 3 điểm tọa độ');
      return;
    }
    setSaving(true);
    try {
      if (boundaryId) {
        await updateBoundaryById(boundaryId, { name, coordinates, isActive });
        showToast('success', 'Đã cập nhật ranh giới');
      } else {
        await createBoundary({ name, coordinates, isActive });
        showToast('success', 'Đã tạo ranh giới');
      }
      const fresh = await listBoundaries();
      setAllBoundaries(fresh);
    } catch {
      showToast('error', 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  }, [boundaryId, name, coordinates, isActive, isNew]);

  if (loading) return <div className="p-6 text-gray-400">Đang tải...</div>;

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <div className="mb-4 flex items-center gap-3">
        <Link href="/admin/boundaries" className="text-sm text-gray-600 hover:underline">
          ← Quay lại
        </Link>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">{isNew ? 'Tạo ranh giới' : 'Chỉnh sửa ranh giới'}</h1>
          <p className="mt-1 text-sm text-gray-500">{coordsInfo.text}</p>
        </div>
        <button
          onClick={() => void handleSave()}
          disabled={saving}
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50"
        >
          {saving ? 'Đang lưu...' : 'Lưu'}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="md:col-span-2 rounded-lg border bg-white p-3">
          <BoundaryMapEditor
            value={coordinates}
            onChange={setCoordinates}
            clickToAdd={!isNew}
            maxPoints={isNew ? 4 : undefined}
            backgroundBoundaries={backgroundBoundaries}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {!isNew && (
              <button
                type="button"
                onClick={() => setCoordinates((prev) => (prev.length > 0 ? prev.slice(0, -1) : prev))}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Xóa điểm cuối
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (isNew) setCoordinates(defaultCoords4());
                else if (confirm('Thay toàn bộ bằng 4 điểm mẫu?')) setCoordinates(defaultCoords4());
              }}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Reset 4 điểm mẫu
            </button>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(JSON.stringify(coordinates, null, 2))}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              Copy JSON tọa độ
            </button>
          </div>
        </div>

        <div className="rounded-lg border bg-white p-4">
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-gray-700">Tên ranh giới</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={200}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            Bật ranh giới này (có hiệu lực)
          </label>

          {isNew && (
            <p className="mt-3 text-xs text-gray-500">
              Tạo mới chỉ dùng đúng 4 đỉnh (không thêm điểm bằng click). So sánh với các vùng xám để tránh chồng lấn.
            </p>
          )}

          {!coordsInfo.ok && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {coordsInfo.text}
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg text-white text-sm ${
            toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

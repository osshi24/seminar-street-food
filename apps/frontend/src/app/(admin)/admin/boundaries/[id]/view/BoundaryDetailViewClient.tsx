'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { withNoSSR } from '../../../../../../components/map/LeafletDynamic';
import { Boundary, getBoundaryById, listBoundaries } from '../../../../../../lib/api/admin-location';

const BoundaryMapEditor = withNoSSR(() => import('../../BoundaryMapEditor'), (
  <div className="h-[480px] w-full animate-pulse rounded-lg bg-gray-100" />
));

export default function BoundaryDetailViewClient({ id }: { id: string }) {
  const [boundary, setBoundary] = useState<Boundary | null>(null);
  const [others, setOthers] = useState<Boundary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [b, all] = await Promise.all([getBoundaryById(id), listBoundaries()]);
        if (!cancelled) {
          setBoundary(b);
          setOthers(all.filter((x) => x.id !== id));
        }
      } catch {
        if (!cancelled) setBoundary(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const backgroundBoundaries = useMemo(
    () =>
      others.map((b) => ({
        id: b.id,
        name: `${b.name}${b.isActive ? '' : ' (tắt)'}`,
        coordinates: b.polygonCoordinates ?? [],
      })),
    [others],
  );

  if (loading) return <div className="p-6 text-gray-400">Đang tải...</div>;
  if (!boundary) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-6">
        <p className="text-red-600">Không tìm thấy ranh giới.</p>
        <Link href="/admin/boundaries" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
          ← Quay lại danh sách
        </Link>
      </div>
    );
  }

  const coords = boundary.polygonCoordinates ?? [];

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link href="/admin/boundaries" className="text-sm text-gray-600 hover:underline">
          ← Quay lại
        </Link>
        <Link href={`/admin/boundaries/${id}`} className="text-sm text-blue-600 hover:underline">
          Sửa ranh giới
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">Chi tiết ranh giới</h1>
        <p className="mt-1 text-sm text-gray-600">
          <span className="font-medium text-gray-900">{boundary.name}</span>
          {' · '}
          {boundary.isActive ? (
            <span className="text-green-700">Đang bật</span>
          ) : (
            <span className="text-gray-500">Đang tắt</span>
          )}
          {' · '}
          {coords.length} điểm
        </p>
        <p className="mt-2 text-xs text-gray-500">
          Ranh giới xám nét đứt là các ranh giới khác (tham chiếu để tránh trùng).
        </p>
      </div>

      <div className="rounded-lg border bg-white p-3">
        <BoundaryMapEditor
          value={coords}
          readOnly
          height={480}
          backgroundBoundaries={backgroundBoundaries}
        />
      </div>
    </div>
  );
}

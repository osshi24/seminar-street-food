'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Compass, AlertTriangle, Spline, Tag, Eraser, RotateCcw } from 'lucide-react';
import {
  getBoundary,
  listPins,
  updateBoundary,
  Boundary,
} from '@/lib/api/admin-location';
import AdminPageHeader from '@/components/admin/common/AdminPageHeader';
import AdminMetricGrid from '@/components/admin/common/AdminMetricGrid';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const BoundaryMapEditor = dynamic(() => import('./BoundaryMapEditor'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[480px] w-full items-center justify-center rounded-lg bg-slate-100 text-sm text-slate-500">
      Đang tải bản đồ...
    </div>
  ),
});

const SAMPLE_COORDINATES = [
  { lat: 10.7625, lng: 106.6601 },
  { lat: 10.7632, lng: 106.6615 },
  { lat: 10.7628, lng: 106.6623 },
  { lat: 10.7619, lng: 106.6612 },
];

export default function AdminBoundariesPage() {
  const [boundary, setBoundary] = useState<Boundary | null>(null);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }[]>([]);
  const [name, setName] = useState('Ranh giới phố ẩm thực');
  const [approvedPins, setApprovedPins] = useState<{ lat: number; lng: number }[]>([]);
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
          setCoordinates(data.polygonCoordinates);
        } else {
          setCoordinates(SAMPLE_COORDINATES);
        }
      })
      .catch(() => showToast('error', 'Không tải được ranh giới'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    listPins({ status: 'approved', limit: 1000 })
      .then((res) => {
        setApprovedPins(
          (res.data ?? []).map((p) => ({
            lat: Number(p.latitude),
            lng: Number(p.longitude),
          })),
        );
      })
      .catch(() => {
        // Pin overlay là tính năng phụ — không cần báo lỗi nếu fail
      });
  }, []);

  const coordsJson = useMemo(() => JSON.stringify(coordinates, null, 2), [coordinates]);
  const isDirty = useMemo(() => {
    if (!boundary) return coordinates.length > 0;
    return JSON.stringify(boundary.polygonCoordinates) !== JSON.stringify(coordinates);
  }, [boundary, coordinates]);

  const handleSave = async () => {
    if (coordinates.length < 3) {
      showToast('error', 'Cần ít nhất 3 điểm để tạo polygon');
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

  const handleClear = () => {
    if (coordinates.length === 0) return;
    if (!window.confirm('Xóa toàn bộ điểm trên bản đồ? Bạn sẽ phải vẽ lại từ đầu.')) return;
    setCoordinates([]);
  };

  const handleResetToSaved = () => {
    if (!boundary) return;
    setCoordinates(boundary.polygonCoordinates);
  };

  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(coordsJson);
      showToast('success', 'Đã copy JSON vào clipboard');
    } catch {
      showToast('error', 'Không thể copy');
    }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-24 animate-pulse rounded-xl bg-white" />
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-xl bg-white" />
          ))}
        </div>
        <div className="h-[480px] animate-pulse rounded-xl bg-white" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <AdminPageHeader
        badge="Bản đồ"
        title="Cấu hình ranh giới phố ẩm thực"
        description="Vẽ vùng hợp lệ trực tiếp trên bản đồ. Click để thêm điểm, kéo để di chuyển, click vào điểm để xóa."
        meta={boundary ? `Đang dùng: ${boundary.name}` : 'Chưa có ranh giới hoạt động'}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {boundary && isDirty ? (
              <Button variant="outline" onClick={handleResetToSaved}>
                <RotateCcw />
                Hoàn về bản đã lưu
              </Button>
            ) : null}
            <Button onClick={handleSave} disabled={saving || !isDirty}>
              {saving ? 'Đang lưu...' : 'Lưu ranh giới'}
            </Button>
          </div>
        }
      />

      <AdminMetricGrid
        items={[
          {
            label: 'Trạng thái',
            value: boundary ? 'Đang hoạt động' : 'Chưa cấu hình',
            tone: boundary ? 'emerald' : 'rose',
            icon: boundary ? <Compass /> : <AlertTriangle />,
            description: boundary
              ? 'Đang áp dụng cho luồng gửi vị trí.'
              : 'Store owner không thể gửi vị trí chính xác.',
          },
          {
            label: 'Số đỉnh',
            value: coordinates.length,
            tone: coordinates.length >= 3 ? 'blue' : 'amber',
            icon: <Spline />,
            description:
              coordinates.length >= 3
                ? 'Polygon hợp lệ.'
                : 'Polygon cần ≥ 3 điểm để hợp lệ.',
          },
          {
            label: 'Tên vùng',
            value: boundary?.name || 'Chưa đặt',
            tone: 'slate',
            icon: <Tag />,
            description: 'Nhận diện cấu hình đang active.',
          },
          {
            label: 'Ghim đã duyệt',
            value: approvedPins.length,
            tone: 'cyan',
            icon: <Compass />,
            description: 'Hiện trên map (chấm xám) để bạn vẽ ôm trọn.',
          },
        ]}
      />

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 border-b border-slate-100">
          <div className="min-w-0">
            <CardTitle className="text-base">Trình vẽ ranh giới</CardTitle>
            <p className="mt-1 text-xs text-slate-500">
              Click trên bản đồ để thêm điểm theo thứ tự. Drag điểm để di chuyển. Click lên điểm để xóa.
              {approvedPins.length > 0 ? ` Chấm xám là ${approvedPins.length} ghim gian hàng đã duyệt.` : ''}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleClear}
              disabled={coordinates.length === 0}
              className="text-rose-700 hover:bg-rose-50 hover:text-rose-800"
            >
              <Eraser />
              Xóa hết
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          <BoundaryMapEditor
            coordinates={coordinates}
            onChange={setCoordinates}
            approvedPins={approvedPins}
            height={520}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-base">Thông tin ranh giới</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Tên ranh giới</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400"
              />
            </label>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-600">
              <p className="font-medium text-slate-700">Lưu ý</p>
              <ul className="mt-1.5 list-disc space-y-1 pl-4 text-xs">
                <li>Polygon hợp lệ cần tối thiểu 3 điểm.</li>
                <li>Hệ thống tự đóng polygon bằng cách nối điểm cuối về điểm đầu.</li>
                <li>Boundary ảnh hưởng trực tiếp đến luồng gửi vị trí của store owner.</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-slate-100">
            <CardTitle className="text-base">JSON polygon (chỉ đọc)</CardTitle>
            <Button size="sm" variant="outline" onClick={copyJson} disabled={coordinates.length === 0}>
              Copy
            </Button>
          </CardHeader>
          <CardContent className="pt-5">
            <pre className="max-h-72 overflow-auto rounded-md border border-slate-200 bg-slate-50 p-3 font-mono text-xs leading-5 text-slate-700">
              {coordsJson}
            </pre>
          </CardContent>
        </Card>
      </div>

      {toast ? (
        <div
          className={`fixed bottom-6 right-6 z-50 rounded-md px-4 py-2.5 text-sm font-medium text-white shadow-lg ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          {toast.msg}
        </div>
      ) : null}
    </div>
  );
}

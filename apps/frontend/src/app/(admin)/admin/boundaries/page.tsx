'use client';

import { useState, useEffect } from 'react';
import { getBoundary, updateBoundary, Boundary } from '../../../../lib/api/admin-location';

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
      .then((b) => {
        setBoundary(b);
        if (b) {
          setName(b.name);
          setCoordsText(JSON.stringify(b.polygonCoordinates, null, 2));
        } else {
          setCoordsText(JSON.stringify(
            [
              { lat: 10.762500, lng: 106.660100 },
              { lat: 10.763200, lng: 106.661500 },
              { lat: 10.762800, lng: 106.662300 },
              { lat: 10.761900, lng: 106.661200 },
            ],
            null,
            2,
          ));
        }
      })
      .catch(() => showToast('error', 'Không tải được ranh giới'))
      .finally(() => setLoading(false));
  }, []);

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

  if (loading) return <div className="p-6 text-gray-400">Đang tải...</div>;

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Cấu hình ranh giới phố ẩm thực</h1>
      <p className="text-gray-500 text-sm mb-6">
        Nhập danh sách tọa độ (JSON) để xác định ranh giới. Tối thiểu 3 điểm.
      </p>

      {boundary ? (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
          Ranh giới hiện tại: <strong>{boundary.name}</strong> ({boundary.polygonCoordinates.length} điểm)
        </div>
      ) : (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
          Chưa có ranh giới nào. Store Owner sẽ không thể gửi vị trí cho đến khi bạn cấu hình.
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Tên ranh giới</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tọa độ (JSON Array of {'{lat, lng}'})
        </label>
        <textarea
          value={coordsText}
          onChange={(e) => setCoordsText(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono min-h-[240px] resize-y"
          spellCheck={false}
        />
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-medium py-2 px-4 rounded-lg transition"
      >
        {saving ? 'Đang lưu...' : 'Lưu ranh giới'}
      </button>

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

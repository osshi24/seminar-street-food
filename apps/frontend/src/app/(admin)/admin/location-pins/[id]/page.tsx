'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  getPinDetail,
  approvePin,
  rejectPin,
  deletePin,
  AdminLocationPin,
  NearbyPin,
} from '../../../../../lib/api/admin-location';

const MiniMap = dynamic(() => import('./MiniMap'), {
  ssr: false,
  loading: () => <div className="h-48 bg-gray-100 animate-pulse rounded-lg" />,
});

export default function PinDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [pin, setPin] = useState<AdminLocationPin | null>(null);
  const [currentApproved, setCurrentApproved] = useState<AdminLocationPin | null>(null);
  const [duplicateWarnings, setDuplicateWarnings] = useState<NearbyPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [overrideLat, setOverrideLat] = useState('');
  const [overrideLng, setOverrideLng] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    getPinDetail(params.id)
      .then((res) => {
        setPin(res.pin);
        setCurrentApproved(res.currentApproved);
        setDuplicateWarnings(res.duplicateWarnings);
      })
      .catch(() => showToast('error', 'Không tải được chi tiết ghim'))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleApprove = async () => {
    const body: { lat?: number; lng?: number } = {};
    if (overrideLat) body.lat = parseFloat(overrideLat);
    if (overrideLng) body.lng = parseFloat(overrideLng);
    try {
      await approvePin(params.id, body);
      showToast('success', 'Đã duyệt ghim vị trí');
      setTimeout(() => router.push('/admin/location-pins'), 1500);
    } catch {
      showToast('error', 'Duyệt thất bại');
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      showToast('error', 'Vui lòng nhập lý do từ chối');
      return;
    }
    try {
      await rejectPin(params.id, { reason: rejectReason });
      showToast('success', 'Đã từ chối ghim vị trí');
      setTimeout(() => router.push('/admin/location-pins'), 1500);
    } catch {
      showToast('error', 'Từ chối thất bại');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Bạn có chắc muốn xóa ghim này?')) return;
    try {
      await deletePin(params.id);
      router.push('/admin/location-pins');
    } catch {
      showToast('error', 'Xóa thất bại');
    }
  };

  if (loading) return <div className="p-6 text-gray-400">Đang tải...</div>;
  if (!pin) return <div className="p-6 text-red-500">Không tìm thấy ghim</div>;

  const isPending = pin.status === 'pending';

  return (
    <div className="p-6 max-w-2xl">
      <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-4">
        ← Quay lại
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">Chi tiết ghim vị trí</h1>
      <p className="text-sm text-gray-500 mb-6">ID: {pin.id}</p>

      {/* Mini map */}
      <div className="mb-6">
        <MiniMap lat={Number(pin.latitude)} lng={Number(pin.longitude)} />
      </div>

      {/* Pin info */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="border rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase mb-1">Tọa độ gửi</p>
          <p className="text-sm font-medium">{Number(pin.latitude).toFixed(6)}</p>
          <p className="text-sm font-medium">{Number(pin.longitude).toFixed(6)}</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase mb-1">Gian hàng</p>
          <p className="text-sm font-medium">{pin.store?.name ?? pin.storeId.slice(0, 8)}</p>
          <p className="text-xs text-gray-500 mt-1">Ngày gửi: {new Date(pin.submittedAt).toLocaleDateString('vi-VN')}</p>
        </div>
      </div>

      {/* Duplicate warning */}
      {duplicateWarnings.length > 0 && (
        <div className="mb-6 border border-orange-300 bg-orange-50 rounded-lg p-4">
          <p className="text-sm font-semibold text-orange-800 mb-2">
            ⚠ Cảnh báo trùng tọa độ ({duplicateWarnings.length} ghim gần đây)
          </p>
          <ul className="text-xs text-orange-700 space-y-1">
            {duplicateWarnings.map((w) => (
              <li key={w.storeId}>
                {w.storeName} — cách {w.distanceMeters.toFixed(1)}m
              </li>
            ))}
          </ul>
        </div>
      )}

      {currentApproved && (
        <div className="mb-6 border border-blue-200 bg-blue-50 rounded-lg p-4">
          <p className="text-xs text-blue-700 font-medium mb-1">Ghim đã duyệt hiện tại của store này:</p>
          <p className="text-xs text-blue-600">
            {Number(currentApproved.latitude).toFixed(6)}, {Number(currentApproved.longitude).toFixed(6)}
          </p>
        </div>
      )}

      {isPending && (
        <>
          {/* Approve form */}
          <div className="border rounded-lg p-4 mb-4">
            <p className="font-medium text-gray-900 mb-3">Duyệt ghim</p>
            <p className="text-xs text-gray-500 mb-3">Tùy chọn: điều chỉnh tọa độ trước khi duyệt</p>
            <div className="flex gap-3 mb-3">
              <input
                type="number"
                step="any"
                placeholder="Lat (tùy chọn)"
                value={overrideLat}
                onChange={(e) => setOverrideLat(e.target.value)}
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
              />
              <input
                type="number"
                step="any"
                placeholder="Lng (tùy chọn)"
                value={overrideLng}
                onChange={(e) => setOverrideLng(e.target.value)}
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={handleApprove}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              Duyệt ghim
            </button>
          </div>

          {/* Reject form */}
          <div className="border rounded-lg p-4 mb-4">
            <p className="font-medium text-gray-900 mb-3">Từ chối ghim</p>
            <textarea
              placeholder="Lý do từ chối (bắt buộc)..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm mb-3 min-h-[80px] resize-none"
            />
            <button
              onClick={handleReject}
              className="w-full border border-red-400 text-red-600 hover:bg-red-50 font-medium py-2 px-4 rounded-lg transition"
            >
              Từ chối
            </button>
          </div>
        </>
      )}

      {/* Delete */}
      <div className="border border-red-200 rounded-lg p-4">
        <p className="font-medium text-gray-900 mb-2">Xóa ghim</p>
        <p className="text-xs text-gray-500 mb-3">Xóa bất kể trạng thái, không thể hoàn tác.</p>
        <button
          onClick={handleDelete}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition"
        >
          Xóa ghim
        </button>
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

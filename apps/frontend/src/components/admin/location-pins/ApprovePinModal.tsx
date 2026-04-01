'use client';

import { useState } from 'react';

interface ApprovePinModalProps {
  isOpen: boolean;
  isLoading?: boolean;
  onApprove: (overrideLat?: number, overrideLng?: number) => void;
  onCancel: () => void;
  currentLat?: number;
  currentLng?: number;
  storeName?: string;
}

export default function ApprovePinModal({
  isOpen,
  isLoading = false,
  onApprove,
  onCancel,
  currentLat,
  currentLng,
  storeName = 'Ghim vị trí',
}: ApprovePinModalProps) {
  const [overrideLat, setOverrideLat] = useState('');
  const [overrideLng, setOverrideLng] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    onApprove(
      overrideLat ? parseFloat(overrideLat) : undefined,
      overrideLng ? parseFloat(overrideLng) : undefined
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
            <span className="text-xl">✓</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Phê duyệt ghim vị trí</h3>
        </div>

        <p className="mb-4 text-sm text-gray-600">
          Xác nhận phê duyệt ghim vị trí cho <strong>{storeName}</strong>
        </p>

        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-xs font-medium text-blue-700 mb-2">📍 Tọa độ hiện tại:</div>
          <div className="text-sm text-blue-900 font-mono">
            {currentLat?.toFixed(5)}, {currentLng?.toFixed(5)}
          </div>
        </div>

        <div className="mb-4 space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Ghi đè vĩ độ (tuỳ chọn)
          </label>
          <input
            type="number"
            step="0.00001"
            value={overrideLat}
            onChange={(e) => setOverrideLat(e.target.value)}
            placeholder="Để trống để giữ nguyên"
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4 space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Ghi đè kinh độ (tuỳ chọn)
          </label>
          <input
            type="number"
            step="0.00001"
            value={overrideLng}
            onChange={(e) => setOverrideLng(e.target.value)}
            placeholder="Để trống để giữ nguyên"
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>}
            Phê duyệt
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useActiveStore } from '../../../../contexts/ActiveStoreContext';
import { createQr } from '../../../../lib/api/qr';
import type { CreateQrResponse } from '../../../../lib/api/qr';
import QRCodeDisplay from '../../../../components/qr/QRCodeDisplay';
import QRDownloadButtons from '../../../../components/qr/QRDownloadButtons';

interface StoreInfo {
  id: string;
  name: string;
  status: string;
}

export default function DashboardQrPage() {
  const { activeStoreId, activeStore, loading: storeLoading } = useActiveStore();
  const [qrData, setQrData] = useState<CreateQrResponse | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loading = storeLoading;
  const store = activeStore ? { id: activeStore.id, name: activeStore.name, status: activeStore.status } : null;

  const handleCreate = async () => {
    if (!activeStoreId) return;
    setCreating(true);
    setError(null);
    try {
      const data = await createQr(activeStoreId);
      setQrData(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3 px-6 py-6">
        <div className="h-6 w-48 rounded bg-gray-100" />
        <div className="h-48 w-48 rounded-lg bg-gray-100" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="px-6 py-6 text-sm text-gray-400">
        Không tìm thấy thông tin gian hàng.
      </div>
    );
  }

  const isInactive = store.status === 'inactive';
  const displayQrImageUrl = qrData?.qrImageUrl
    ? (qrData.qrImageUrl.startsWith('data:')
      ? qrData.qrImageUrl
      : `${qrData.qrImageUrl}${qrData.qrImageUrl.includes('?') ? '&' : '?'}v=${encodeURIComponent(qrData.token)}`)
    : null;

  return (
    <div className="mx-auto max-w-2xl px-6 py-6">
      <h1 className="mb-1 text-xl font-bold text-gray-800">QR Code gian hàng</h1>
      <p className="mb-6 text-sm text-gray-500">
        Tạo và tải QR code cho gian hàng <span className="font-medium">{store.name}</span>.
        Khi tạo QR mới, QR cũ sẽ bị vô hiệu hoá ngay lập tức.
      </p>

      {isInactive && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Gian hàng cần được Admin kích hoạt trước khi tạo QR code.
        </div>
      )}

      <div className="space-y-4">
        <button
          onClick={handleCreate}
          disabled={creating || isInactive}
          className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
          {creating ? 'Đang tạo...' : 'Tạo QR code mới'}
        </button>

        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}

        {qrData && (
          <div className="space-y-4 rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
            <QRCodeDisplay
              qrImageUrl={displayQrImageUrl}
              storeName={store.name}
            />
            <div className="text-xs text-gray-400">
              <p>Token: <span className="font-mono">{qrData.token}</span></p>
              <p>URL: <span className="break-all">{qrData.scanUrl}</span></p>
            </div>
            <QRDownloadButtons storeId={store.id} storeName={store.name} />
          </div>
        )}
      </div>
    </div>
  );
}

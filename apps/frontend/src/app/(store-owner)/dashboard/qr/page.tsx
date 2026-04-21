'use client';

import { useEffect, useState } from 'react';
import { getMyStore } from '../../../../lib/api/stores';
import { createQr, getActiveQr } from '../../../../lib/api/qr';
import type { CreateQrResponse } from '../../../../lib/api/qr';
import QRCodeDisplay from '../../../../components/qr/QRCodeDisplay';
import QRDownloadButtons from '../../../../components/qr/QRDownloadButtons';

interface StoreInfo {
  id: string;
  name: string;
  status: string;
}

export default function DashboardQrPage() {
  const [store, setStore] = useState<StoreInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrData, setQrData] = useState<CreateQrResponse | null>(null);
  const [creating, setCreating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMyStore()
      .then(async (res) => {
        const s = res.data;
        setStore(s);
        const existing = await getActiveQr(s.id).catch(() => null);
        if (existing) setQrData(existing);
      })
      .catch(() => setStore(null))
      .finally(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!store) return;
    setCreating(true);
    setShowConfirm(false);
    setError(null);
    try {
      const data = await createQr(store.id);
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

  return (
    <div className="mx-auto max-w-2xl px-6 py-6">
      <h1 className="mb-1 text-xl font-bold text-gray-800">QR Code gian hàng</h1>
      <p className="mb-6 text-sm text-gray-500">
        QR code để khách hàng quét và xem thông tin gian hàng{' '}
        <span className="font-medium">{store.name}</span> kèm thuyết minh tự động.
      </p>

      {isInactive && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Gian hàng cần được Admin kích hoạt trước khi tạo QR code.
        </div>
      )}

      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

      {qrData ? (
        /* QR đã tồn tại — chỉ hiển thị và cho tải về */
        <div className="space-y-5 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <QRCodeDisplay
              qrImageUrl={qrData.qrImageUrl}
              loading={creating}
              storeName={store.name}
            />
            <div className="space-y-1 text-xs text-gray-400 break-all">
              <p>
                <span className="font-medium text-gray-500">Token:</span>{' '}
                <span className="font-mono">{qrData.token}</span>
              </p>
              <p>
                <span className="font-medium text-gray-500">Link quét:</span>{' '}
                {qrData.scanUrl}
              </p>
              <p className="text-gray-400 text-xs italic mt-2">
                Khi khách quét QR sẽ được chuyển đến trang gian hàng và thuyết minh tự động phát.
              </p>
            </div>
          </div>

          <QRDownloadButtons storeId={store.id} storeName={store.name} />

          {/* Tạo lại QR — action nguy hiểm, yêu cầu xác nhận */}
          <div className="border-t border-gray-100 pt-4">
            {!showConfirm ? (
              <button
                onClick={() => setShowConfirm(true)}
                disabled={creating || isInactive}
                className="text-sm text-gray-400 hover:text-red-500 underline underline-offset-2 transition-colors disabled:opacity-40"
              >
                Tạo lại QR mới (vô hiệu hoá QR hiện tại)
              </button>
            ) : (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
                <p className="text-sm text-red-700 font-medium">
                  QR hiện tại sẽ bị vô hiệu hoá ngay lập tức. Tiếp tục?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreate}
                    disabled={creating}
                    className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    {creating ? 'Đang tạo...' : 'Xác nhận tạo lại'}
                  </button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Huỷ
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Chưa có QR — hiện nút tạo */
        <div className="space-y-4">
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-6 py-10 text-center">
            <svg
              className="mx-auto mb-3 h-12 w-12 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
              />
            </svg>
            <p className="mb-1 text-sm font-medium text-gray-600">Gian hàng chưa có QR code</p>
            <p className="mb-4 text-xs text-gray-400">
              Tạo QR code để khách hàng quét và xem thuyết minh tự động
            </p>
            <button
              onClick={handleCreate}
              disabled={creating || isInactive}
              className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {creating ? 'Đang tạo...' : 'Tạo QR code'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

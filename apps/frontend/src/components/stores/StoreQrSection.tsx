'use client';

import { useEffect, useRef, useState } from 'react';
import { createQr, getActiveQr, downloadQrPng, downloadQrPdf } from '../../lib/api/qr';
import type { CreateQrResponse } from '../../lib/api/qr';

interface Props {
  storeId: string;
  storeName: string;
  storeStatus: string;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function StoreQrSection({ storeId, storeName, storeStatus }: Props) {
  const [qrData, setQrData] = useState<CreateQrResponse | null>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgLoading, setImgLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pngLoading, setPngLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  const isInactive = storeStatus === 'inactive';

  // Revoke blob URL on unmount to avoid memory leak
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  // Fetch PNG blob and create an object URL for display
  const loadImage = async (id: string) => {
    setImgLoading(true);
    try {
      const blob = await downloadQrPng(id);
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;
      setImgSrc(url);
    } catch {
      setImgSrc(null);
    } finally {
      setImgLoading(false);
    }
  };

  useEffect(() => {
    getActiveQr(storeId)
      .then((data) => {
        setQrData(data);
        if (data) loadImage(storeId);
      })
      .catch(() => setQrData(null))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const handleCreate = async () => {
    setCreating(true);
    setShowConfirm(false);
    setError(null);
    try {
      const data = await createQr(storeId);
      setQrData(data);
      await loadImage(storeId);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const handlePng = async () => {
    setPngLoading(true);
    setError(null);
    try {
      const blob = await downloadQrPng(storeId);
      triggerDownload(blob, `qr-${storeName}.png`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPngLoading(false);
    }
  };

  const handlePdf = async () => {
    setPdfLoading(true);
    setError(null);
    try {
      const blob = await downloadQrPdf(storeId);
      triggerDownload(blob, `qr-${storeName}.pdf`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3 rounded-lg border bg-white p-5 shadow-sm">
        <div className="h-5 w-32 rounded bg-gray-200" />
        <div className="h-48 w-48 rounded-lg bg-gray-100" />
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-5 shadow-sm space-y-5">
      <div>
        <h2 className="text-base font-semibold text-gray-800">QR Code</h2>
        <p className="mt-0.5 text-sm text-gray-500">
          Khách hàng quét QR để xem thông tin gian hàng kèm thuyết minh tự động.
        </p>
      </div>

      {isInactive && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Gian hàng cần được Admin kích hoạt trước khi tạo QR code.
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {qrData ? (
        <div className="space-y-4">
          {/* QR image */}
          <div className="inline-block rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
            {imgLoading || !imgSrc ? (
              <div className="h-48 w-48 animate-pulse rounded bg-gray-100" />
            ) : (
              <img
                src={imgSrc}
                alt={`QR code ${storeName}`}
                className="h-48 w-48"
              />
            )}
          </div>

          {/* Download buttons */}
          <div className="flex gap-2">
            <button
              onClick={handlePng}
              disabled={pngLoading || imgLoading}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {pngLoading ? 'Đang tải...' : 'Tải PNG'}
            </button>
            <button
              onClick={handlePdf}
              disabled={pdfLoading || imgLoading}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {pdfLoading ? 'Đang tải...' : 'Tải PDF'}
            </button>
          </div>

          {/* Regenerate — requires confirmation */}
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
        /* No QR yet */
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
            Tạo một lần, lưu vĩnh viễn — dùng để khách quét và nghe thuyết minh
          </p>
          <button
            onClick={handleCreate}
            disabled={creating || isInactive}
            className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {creating ? 'Đang tạo...' : 'Tạo QR code'}
          </button>
        </div>
      )}
    </div>
  );
}

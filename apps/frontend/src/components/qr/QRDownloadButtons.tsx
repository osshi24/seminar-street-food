'use client';

import { useState } from 'react';
import { downloadQrPng, downloadQrPdf } from '../../lib/api/qr';

interface Props {
  storeId: string;
  storeName: string;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function QRDownloadButtons({ storeId, storeName }: Props) {
  const [pngLoading, setPngLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          onClick={handlePng}
          disabled={pngLoading}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {pngLoading ? 'Đang tải...' : 'Tải PNG'}
        </button>
        <button
          onClick={handlePdf}
          disabled={pdfLoading}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {pdfLoading ? 'Đang tải...' : 'Tải PDF'}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

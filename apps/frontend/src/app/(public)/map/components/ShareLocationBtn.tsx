'use client';

import { useState } from 'react';

export default function ShareLocationBtn() {
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleShare = () => {
    if (!navigator.geolocation) {
      showToast('Trình duyệt không hỗ trợ GPS');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const url = `${window.location.origin}/map?lat=${latitude.toFixed(6)}&lng=${longitude.toFixed(6)}`;
        navigator.clipboard
          .writeText(url)
          .then(() => showToast('Đã sao chép link vị trí!'))
          .catch(() => showToast('Không thể sao chép, vui lòng thử lại'));
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          showToast('Cần bật GPS để sử dụng chức năng này');
        } else if (err.code === err.TIMEOUT) {
          showToast('GPS timeout, vui lòng thử lại');
        } else {
          showToast('Lỗi GPS, vui lòng thử lại');
        }
      },
      { timeout: 10000 },
    );
  };

  return (
    <>
      <button
        onClick={handleShare}
        className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium py-2 px-4 rounded-lg shadow transition"
      >
        📤 Chia sẻ vị trí của tôi
      </button>

      {toast && (
        <div className="fixed bottom-6 right-6 px-4 py-3 rounded-lg shadow-lg bg-gray-800 text-white text-sm">
          {toast}
        </div>
      )}
    </>
  );
}

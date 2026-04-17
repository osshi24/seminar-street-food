'use client';

interface DeactivateModalProps {
  isOpen: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  storeOwnerName?: string;
  storeName?: string;
}

export default function DeactivateModal({
  isOpen,
  isLoading = false,
  onConfirm,
  onCancel,
  storeOwnerName = 'Chủ gian hàng',
  storeName,
}: DeactivateModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
            <span className="text-xl">⚠️</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Vô hiệu hóa tài khoản</h3>
        </div>

        <div className="mb-6 space-y-3">
          <p className="text-sm text-gray-600">
            Bạn sắp vô hiệu hóa tài khoản của <strong>{storeOwnerName}</strong>.
          </p>

          <div className="rounded-lg bg-amber-50 p-3 border border-amber-200">
            <p className="text-sm font-medium text-amber-900 mb-2">⚠️ Ảnh hưởng:</p>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• Chủ gian hàng sẽ không thể đăng nhập</li>
              {storeName && <li>• Gian hàng "{storeName}" sẽ bị ẩn khỏi ứng dụng</li>}
              <li>• Khách hàng sẽ không thấy gian hàng này</li>
              <li>• Dữ liệu sẽ được giữ lại để khôi phục sau</li>
            </ul>
          </div>

          <p className="text-sm text-gray-600">
            Hành động này có thể được hoàn tác bằng cách kích hoạt lại tài khoản.
          </p>
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
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>}
            Xác nhận vô hiệu hóa
          </button>
        </div>
      </div>
    </div>
  );
}

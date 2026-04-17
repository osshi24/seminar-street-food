'use client';

interface DeletePinModalProps {
  isOpen: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  storeName?: string;
}

export default function DeletePinModal({
  isOpen,
  isLoading = false,
  onConfirm,
  onCancel,
  storeName = 'Ghim vị trí',
}: DeletePinModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
            <span className="text-xl">🗑️</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Xóa ghim vị trí</h3>
        </div>

        <div className="mb-6 space-y-3">
          <p className="text-sm text-gray-600">
            Bạn sắp xóa ghim vị trí của <strong>{storeName}</strong>.
          </p>

          <div className="rounded-lg bg-red-50 p-3 border border-red-200">
            <p className="text-sm font-medium text-red-900 mb-2">⚠️ Cảnh báo:</p>
            <ul className="text-sm text-red-800 space-y-1">
              <li>• Hành động này không thể hoàn tác</li>
              <li>• Dữ liệu sẽ được xóa vĩnh viễn</li>
              <li>• Không có bản sao lưu</li>
            </ul>
          </div>

          <p className="text-sm text-gray-600">
            Bạn có chắc chắn muốn tiếp tục?
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
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>}
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}

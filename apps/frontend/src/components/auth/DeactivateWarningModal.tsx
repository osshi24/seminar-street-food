'use client';

interface DeactivateWarningModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function DeactivateWarningModal({
  onConfirm,
  onCancel,
  isLoading = false,
}: DeactivateWarningModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">Xác nhận vô hiệu hóa</h3>
        <p className="mt-2 text-sm text-gray-600">
          Tài khoản này có nội dung đang chờ duyệt. Vô hiệu hóa sẽ ảnh hưởng đến nội dung đó.
          Bạn có chắc muốn tiếp tục không?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isLoading ? 'Đang xử lý...' : 'Xác nhận vô hiệu hóa'}
          </button>
        </div>
      </div>
    </div>
  );
}

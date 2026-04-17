'use client';

interface DismissReportModalProps {
  isOpen: boolean;
  isLoading?: boolean;
  onDismiss: () => void;
  onCancel: () => void;
  storeName?: string;
}

export default function DismissReportModal({
  isOpen,
  isLoading = false,
  onDismiss,
  onCancel,
  storeName = 'Báo cáo',
}: DismissReportModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
            <span className="text-xl">✕</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Bác bỏ báo cáo</h3>
        </div>

        <div className="mb-6 space-y-3">
          <p className="text-sm text-gray-600">
            Bạn sắp bác bỏ báo cáo này. Bình luận sẽ vẫn hiển thị bình thường.
          </p>

          <div className="rounded-lg bg-purple-50 p-3 border border-purple-200">
            <p className="text-sm font-medium text-purple-900 mb-1">Hành động:</p>
            <p className="text-sm text-purple-800">Báo cáo sẽ được đánh dấu là "Bác bỏ" và bình luận vẫn công khai</p>
          </div>
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
            onClick={onDismiss}
            disabled={isLoading}
            className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>}
            Xác nhận bác bỏ
          </button>
        </div>
      </div>
    </div>
  );
}

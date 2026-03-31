'use client';

import type { AdminStoreListItem } from '@/lib/api/admin-stores';
import type { RecipientMode } from '@/lib/api/admin-announcements';
import AnnouncementRecipientSelect from './AnnouncementRecipientSelect';

interface AnnouncementFormSectionProps {
  editingId: string | null;
  title: string;
  body: string;
  mode: RecipientMode;
  storeIds: string[];
  stores: AdminStoreListItem[];
  storesLoading: boolean;
  submitting: boolean;
  onTitleChange: (title: string) => void;
  onBodyChange: (body: string) => void;
  onModeChange: (mode: RecipientMode) => void;
  onStoreIdsChange: (ids: string[]) => void;
  onSaveDraft: () => void;
  onSend: () => void;
  onCancelEdit: () => void;
  canSubmit: boolean;
}

const CHAR_LIMITS = {
  title: 500,
  body: 5000,
};

export default function AnnouncementFormSection({
  editingId,
  title,
  body,
  mode,
  storeIds,
  stores,
  storesLoading,
  submitting,
  onTitleChange,
  onBodyChange,
  onModeChange,
  onStoreIdsChange,
  onSaveDraft,
  onSend,
  onCancelEdit,
  canSubmit,
}: AnnouncementFormSectionProps) {
  return (
    <div className="space-y-5">
      {/* Edit Mode Banner */}
      {editingId && (
        <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-blue-900">Chỉnh sửa nháp</p>
            <p className="text-xs text-blue-700 mt-1">ID: {editingId.slice(0, 12)}...</p>
          </div>
          <button
            onClick={onCancelEdit}
            className="text-sm font-medium text-blue-700 hover:text-blue-900 underline"
          >
            Hủy
          </button>
        </div>
      )}

      {/* Title Field */}
      <div>
        <label className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">📌 Tiêu đề thông báo</span>
          <span className="text-xs text-gray-500">
            {title.length} / {CHAR_LIMITS.title}
          </span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value.slice(0, CHAR_LIMITS.title))}
          placeholder="Ví dụ: Thông báo bảo trì hệ thống vào 22:00"
          maxLength={CHAR_LIMITS.title}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">Tiêu đề ngắn gọn, dễ hiểu giúp chủ gian hàng nhanh chóng biết nội dung.</p>
      </div>

      {/* Body Field */}
      <div>
        <label className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">💬 Nội dung thông báo</span>
          <span className="text-xs text-gray-500">
            {body.length} / {CHAR_LIMITS.body}
          </span>
        </label>
        <textarea
          value={body}
          onChange={(e) => onBodyChange(e.target.value.slice(0, CHAR_LIMITS.body))}
          placeholder="Nhập nội dung chi tiết thông báo. Chúng tôi sẽ gửi qua email và in-app notification."
          maxLength={CHAR_LIMITS.body}
          rows={6}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
        />
        <p className="mt-1 text-xs text-gray-500">Hỗ trợ text thuần. Thông báo sẽ được gửi qua email và in-app.</p>
      </div>

      {/* Recipient Selection */}
      <div>
        <label className="mb-3 block text-sm font-semibold text-gray-700">👥 Đối tượng nhận thông báo</label>
        <AnnouncementRecipientSelect
          mode={mode}
          stores={stores}
          storeIds={storeIds}
          onModeChange={onModeChange}
          onStoreIdsChange={onStoreIdsChange}
          loading={storesLoading}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2 border-t border-gray-200">
        <button
          onClick={onSaveDraft}
          disabled={submitting || !canSubmit}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? '⏳ Lưu...' : '💾 Lưu Nháp'}
        </button>
        <button
          onClick={onSend}
          disabled={submitting || !canSubmit}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
        >
          {submitting ? '⏳ Gửi...' : '✉️ Gửi Ngay'}
        </button>
      </div>

      {!canSubmit && (title.trim() || body.trim() || mode !== 'single_store' || storeIds.length > 0) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
          ⚠️ Vui lòng điền đầy đủ tiêu đề, nội dung và chọn ít nhất 1 gian hàng để gửi.
        </div>
      )}
    </div>
  );
}

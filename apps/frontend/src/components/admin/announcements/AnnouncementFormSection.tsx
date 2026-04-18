'use client';

import type { RecipientMode } from '@/lib/api/admin-announcements';
import type { AdminStoreListItem } from '@/lib/api/admin-stores';
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
  const showWarning =
    !canSubmit && (title.trim() || body.trim() || mode !== 'single_store' || storeIds.length > 0);

  return (
    <div className="space-y-6">
      {editingId ? (
        <div className="flex items-center justify-between gap-4 rounded-[24px] border border-cyan-200 bg-cyan-50 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-cyan-900">Đang chỉnh sửa bản nháp</p>
            <p className="mt-1 text-xs uppercase tracking-[0.18em] text-cyan-700">
              {editingId.slice(0, 12)}
            </p>
          </div>
          <button
            onClick={onCancelEdit}
            className="rounded-full border border-cyan-200 bg-white px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100"
          >
            Hủy
          </button>
        </div>
      ) : null}

      <div>
        <label className="mb-2 flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-slate-700">Tiêu đề thông báo</span>
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            {title.length}/{CHAR_LIMITS.title}
          </span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(event) => onTitleChange(event.target.value.slice(0, CHAR_LIMITS.title))}
          placeholder="Ví dụ: Bảo trì hệ thống vào 22:00"
          maxLength={CHAR_LIMITS.title}
          className="w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white"
        />
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Dùng tiêu đề ngắn, rõ và đi thẳng vào việc để chủ gian hàng nắm nội dung nhanh.
        </p>
      </div>

      <div>
        <label className="mb-2 flex items-center justify-between gap-3">
          <span className="text-sm font-semibold text-slate-700">Nội dung thông báo</span>
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            {body.length}/{CHAR_LIMITS.body}
          </span>
        </label>
        <textarea
          value={body}
          onChange={(event) => onBodyChange(event.target.value.slice(0, CHAR_LIMITS.body))}
          placeholder="Nhập nội dung chi tiết sẽ được gửi qua email và in-app notification."
          maxLength={CHAR_LIMITS.body}
          rows={7}
          className="w-full resize-none rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white"
        />
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Nội dung càng rõ ràng thì tỉ lệ chủ gian hàng đọc và phản hồi càng tốt.
        </p>
      </div>

      <div>
        <label className="mb-3 block text-sm font-semibold text-slate-700">
          Đối tượng nhận thông báo
        </label>
        <AnnouncementRecipientSelect
          mode={mode}
          stores={stores}
          storeIds={storeIds}
          onModeChange={onModeChange}
          onStoreIdsChange={onStoreIdsChange}
          loading={storesLoading}
        />
      </div>

      {showWarning ? (
        <div className="rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Cần điền đủ tiêu đề, nội dung và chọn ít nhất một gian hàng nếu không gửi cho toàn bộ hệ thống.
        </div>
      ) : null}

      <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row">
        <button
          onClick={onSaveDraft}
          disabled={submitting || !canSubmit}
          className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Đang lưu...' : 'Lưu nháp'}
        </button>
        <button
          onClick={onSend}
          disabled={submitting || !canSubmit}
          className="inline-flex flex-1 items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Đang gửi...' : 'Gửi ngay'}
        </button>
      </div>
    </div>
  );
}

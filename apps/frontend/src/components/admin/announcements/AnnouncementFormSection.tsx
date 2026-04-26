'use client';

import { Pencil } from 'lucide-react';
import type { RecipientMode } from '@/lib/api/admin-announcements';
import type { AdminStoreListItem } from '@/lib/api/admin-stores';
import AnnouncementRecipientSelect from './AnnouncementRecipientSelect';
import { Button } from '../../ui/button';

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

const CHAR_LIMITS = { title: 500, body: 5000 };

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
    <div className="space-y-5">
      {editingId ? (
        <div className="flex items-center justify-between gap-3 rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2.5">
          <div className="flex items-center gap-2 text-sm">
            <Pencil className="h-4 w-4 text-cyan-700" />
            <span className="font-medium text-cyan-900">Đang chỉnh sửa bản nháp</span>
            <span className="font-mono text-xs text-cyan-700">{editingId.slice(0, 8)}</span>
          </div>
          <Button size="sm" variant="outline" onClick={onCancelEdit}>
            Hủy
          </Button>
        </div>
      ) : null}

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700">Tiêu đề</label>
          <span className="text-[11px] text-slate-400">
            {title.length}/{CHAR_LIMITS.title}
          </span>
        </div>
        <input
          type="text"
          value={title}
          onChange={(event) => onTitleChange(event.target.value.slice(0, CHAR_LIMITS.title))}
          placeholder="Ví dụ: Bảo trì hệ thống vào 22:00"
          maxLength={CHAR_LIMITS.title}
          className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400"
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700">Nội dung</label>
          <span className="text-[11px] text-slate-400">
            {body.length}/{CHAR_LIMITS.body}
          </span>
        </div>
        <textarea
          value={body}
          onChange={(event) => onBodyChange(event.target.value.slice(0, CHAR_LIMITS.body))}
          placeholder="Nội dung gửi qua email và in-app notification."
          maxLength={CHAR_LIMITS.body}
          rows={7}
          className="w-full resize-none rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-900 outline-none transition-colors focus:border-slate-400"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-700">
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
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Cần điền đủ tiêu đề, nội dung và chọn ít nhất một gian hàng nếu không gửi cho toàn bộ hệ thống.
        </div>
      ) : null}

      <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row">
        <Button
          onClick={onSaveDraft}
          disabled={submitting || !canSubmit}
          variant="outline"
          className="flex-1"
        >
          {submitting ? 'Đang lưu...' : 'Lưu nháp'}
        </Button>
        <Button onClick={onSend} disabled={submitting || !canSubmit} className="flex-1">
          {submitting ? 'Đang gửi...' : 'Gửi ngay'}
        </Button>
      </div>
    </div>
  );
}

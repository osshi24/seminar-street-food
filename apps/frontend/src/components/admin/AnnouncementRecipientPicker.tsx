'use client';

import { useMemo } from 'react';
import type { AdminStoreListItem } from '../../lib/api/admin-stores';
import type { RecipientMode } from '../../lib/api/admin-announcements';

type Props = {
  mode: RecipientMode;
  stores: AdminStoreListItem[];
  storeIds: string[];
  onModeChange: (mode: RecipientMode) => void;
  onStoreIdsChange: (ids: string[]) => void;
};

export default function AnnouncementRecipientPicker({
  mode,
  stores,
  storeIds,
  onModeChange,
  onStoreIdsChange,
}: Props) {
  const options = useMemo(
    () =>
      stores.map((s) => ({
        value: s.id,
        label: `${s.name} — ${s.owner.fullName || '—'} (${s.owner.email || '—'})`,
      })),
    [stores],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="radio"
            name="recipientMode"
            checked={mode === 'single_store'}
            onChange={() => onModeChange('single_store')}
          />
          1 gian hàng
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="radio"
            name="recipientMode"
            checked={mode === 'multi_store'}
            onChange={() => onModeChange('multi_store')}
          />
          Nhiều gian hàng
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="radio"
            name="recipientMode"
            checked={mode === 'all_stores'}
            onChange={() => onModeChange('all_stores')}
          />
          Tất cả gian hàng
        </label>
      </div>

      {mode !== 'all_stores' && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Chọn gian hàng {mode === 'single_store' ? '(chọn 1)' : '(có thể chọn nhiều)'}
          </label>
          <select
            multiple={mode === 'multi_store'}
            value={storeIds}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
              onStoreIdsChange(mode === 'single_store' ? selected.slice(0, 1) : selected);
            }}
            className="h-40 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          >
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            {mode === 'multi_store'
              ? 'Giữ Ctrl/Command để chọn nhiều.'
              : 'Chỉ chọn một gian hàng.'}
          </p>
        </div>
      )}
    </div>
  );
}


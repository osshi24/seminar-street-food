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
        label: `${s.name} — ${s.owner.fullName || '—'}`,
        email: s.owner.email,
      })),
    [stores],
  );

  return (
    <div className="space-y-5">
      {/* Mode Selection */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { mode: 'single_store', label: '1️⃣ Một gian hàng', icon: '🏪' },
          { mode: 'multi_store', label: '2️⃣ Nhiều gian hàng', icon: '🏢' },
          { mode: 'all_stores', label: '3️⃣ Tất cả gian hàng', icon: '🌐' },
        ].map(({ mode: m, label, icon }) => (
          <button
            key={m}
            type="button"
            onClick={() => onModeChange(m as RecipientMode)}
            className={`p-3 rounded-xl border-2 transition-all font-semibold text-sm ${
              mode === m
                ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-md'
                : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'
            }`}
          >
            <div className="text-lg mb-1">{icon}</div>
            <div>{label}</div>
          </button>
        ))}
      </div>

      {/* Store Selection */}
      {mode !== 'all_stores' && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <label className="text-sm font-bold text-slate-900">
              {mode === 'single_store' ? '📍 Chọn 1 gian hàng' : '📍 Chọn gian hàng'}
            </label>
            {storeIds.length > 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-bold">
                {storeIds.length === 1 ? '✓ 1 được chọn' : `✓ ${storeIds.length} được chọn`}
              </span>
            )}
          </div>

          {options.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center">
              <p className="text-sm text-slate-600">Không có gian hàng nào</p>
            </div>
          ) : (
            <>
              {mode === 'single_store' ? (
                // Dropdown for single store
                <select
                  value={storeIds[0] || ''}
                  onChange={(e) => onStoreIdsChange(e.target.value ? [e.target.value] : [])}
                  className="w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-base text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all"
                >
                  <option value="">-- Chọn gian hàng --</option>
                  {options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label} ({o.email})
                    </option>
                  ))}
                </select>
              ) : (
                // Multi-select for multiple stores
                <div className="rounded-xl border-2 border-slate-300 bg-white overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                  <div className="grid grid-cols-1 max-h-64 overflow-y-auto">
                    {options.map((o, idx) => (
                      <label
                        key={o.value}
                        className={`flex items-start gap-3 px-4 py-3 hover:bg-blue-50 transition-colors cursor-pointer border-b border-slate-100 last:border-b-0 ${
                          storeIds.includes(o.value) ? 'bg-blue-50' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={storeIds.includes(o.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              onStoreIdsChange([...storeIds, o.value]);
                            } else {
                              onStoreIdsChange(storeIds.filter((id) => id !== o.value));
                            }
                          }}
                          className="mt-1 w-5 h-5 rounded border-2 border-slate-300 text-blue-600 focus:ring-blue-200 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-slate-900">{o.label}</div>
                          <div className="text-xs text-slate-600 truncate">{o.email}</div>
                        </div>
                        {storeIds.includes(o.value) && (
                          <div className="text-blue-600 font-bold text-lg">✓</div>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <p className="mt-2 text-xs text-slate-600">
                {mode === 'single_store'
                  ? '✓ Chọn một gian hàng để gửi thông báo'
                  : `✓ Nhấn vào để chọn/bỏ chọn (${storeIds.length}/${options.length})`}
              </p>
            </>
          )}
        </div>
      )}

      {mode === 'all_stores' && (
        <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4 text-green-900">
          <div className="font-bold text-sm mb-1">✓ Sẽ gửi tới tất cả gian hàng</div>
          <div className="text-xs">Thông báo sẽ được gửi tới {stores.length} gian hàng</div>
        </div>
      )}
    </div>
  );
}


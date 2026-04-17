/* eslint-disable react/no-unescaped-entities */
'use client';

import { useState, useMemo } from 'react';
import type { RecipientMode } from '@/lib/api/admin-announcements';
import type { AdminStoreListItem } from '@/lib/api/admin-stores';

interface AnnouncementRecipientSelectProps {
  mode: RecipientMode;
  stores: AdminStoreListItem[];
  storeIds: string[];
  onModeChange: (mode: RecipientMode) => void;
  onStoreIdsChange: (ids: string[]) => void;
  loading?: boolean;
}

const MODE_LABELS: Record<RecipientMode, { label: string; desc: string }> = {
  single_store: { label: '1 gian hàng', desc: 'Gửi riêng cho 1 chủ' },
  multi_store: { label: 'Nhiều gian hàng', desc: 'Gửi cho nhiều chủ cùng lúc' },
  all_stores: { label: 'Tất cả gian hàng', desc: 'Gửi cho tất cả chủ hàng' },
};

export default function AnnouncementRecipientSelect({
  mode,
  stores,
  storeIds,
  onModeChange,
  onStoreIdsChange,
  loading = false,
}: AnnouncementRecipientSelectProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const selectedStores = stores.filter((s) => storeIds.includes(s.id));
  const recipientCount = mode === 'all_stores' ? stores.length : selectedStores.length;

  // Filter stores based on search query
  const filteredStores = useMemo(() => {
    if (!searchQuery.trim()) return stores;
    const q = searchQuery.toLowerCase();
    return stores.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.owner.fullName.toLowerCase().includes(q) ||
        s.owner.email.toLowerCase().includes(q)
    );
  }, [stores, searchQuery]);

  const handleToggleStore = (storeId: string) => {
    if (mode === 'single_store') {
      onStoreIdsChange([storeId]);
    } else {
      const newIds = storeIds.includes(storeId)
        ? storeIds.filter((id) => id !== storeId)
        : [...storeIds, storeId];
      onStoreIdsChange(newIds);
    }
  };

  const handleSelectAll = () => {
    onStoreIdsChange(stores.map((s) => s.id));
  };

  const handleDeselectAll = () => {
    onStoreIdsChange([]);
  };

  const handleInvert = () => {
    const newIds = stores
      .map((s) => s.id)
      .filter((id) => !storeIds.includes(id));
    onStoreIdsChange(newIds);
  };

  return (
    <div className="space-y-4">
      {/* Mode Selection Tabs */}
      <div className="grid grid-cols-3 gap-2 rounded-lg border border-gray-200 bg-gray-50 p-1">
        {(Object.keys(MODE_LABELS) as RecipientMode[]).map((m) => (
          <button
            key={m}
            onClick={() => {
              onModeChange(m);
              if (m === 'single_store' && storeIds.length > 1) {
                onStoreIdsChange(storeIds.slice(0, 1));
              }
              setSearchQuery('');
            }}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              mode === m
                ? 'bg-white text-blue-600 shadow-sm border border-blue-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="font-medium">{MODE_LABELS[m].label}</div>
            <div className="text-xs text-gray-500">{MODE_LABELS[m].desc}</div>
          </button>
        ))}
      </div>

      {/* Store Selection */}
      {mode !== 'all_stores' && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <label className="text-sm font-semibold text-gray-700">
              🏪 {mode === 'single_store' ? 'Chọn gian hàng' : 'Chọn gian hàng'}
            </label>
            <span className="text-xs font-medium text-gray-500">
              {storeIds.length} / {stores.length}
            </span>
          </div>

          {loading ? (
            <div className="space-y-2">
              <div className="h-10 rounded-lg bg-gray-200 animate-pulse"></div>
              <div className="h-32 rounded-lg bg-gray-200 animate-pulse"></div>
            </div>
          ) : (
            <>
              {/* Search Box */}
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="🔍 Tìm kiếm gian hàng, chủ, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Quick Actions (Multi-select mode only) */}
              {mode === 'multi_store' && stores.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    ✓ Chọn tất cả
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    ✕ Bỏ chọn
                  </button>
                  <button
                    type="button"
                    onClick={handleInvert}
                    className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    ⟲ Đảo ngược
                  </button>
                </div>
              )}

              {/* Selected Chips (Multi-select mode) */}
              {mode === 'multi_store' && storeIds.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {selectedStores.map((store) => (
                    <div
                      key={store.id}
                      className="flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800"
                    >
                      {store.name}
                      <button
                        type="button"
                        onClick={() => handleToggleStore(store.id)}
                        className="ml-1 rounded-full hover:bg-blue-200 p-0.5 transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Checkbox List */}
              <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-3 max-h-64 overflow-y-auto">
                {filteredStores.length === 0 ? (
                  <div className="py-4 text-center text-sm text-gray-500">
                    {searchQuery ? '❌ Không tìm thấy gian hàng nào' : '📭 Danh sách trống'}
                  </div>
                ) : (
                  filteredStores.map((store) => (
                    <label
                      key={store.id}
                      className={`flex items-start gap-3 rounded-lg p-2.5 cursor-pointer transition-colors ${
                        storeIds.includes(store.id)
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <input
                        type={mode === 'single_store' ? 'radio' : 'checkbox'}
                        name={mode === 'single_store' ? 'store-selection' : undefined}
                        checked={storeIds.includes(store.id)}
                        onChange={() => handleToggleStore(store.id)}
                        className="mt-0.5 rounded cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-sm">{store.name}</div>
                        <div className="text-xs text-gray-600 mt-0.5">
                          👤 {store.owner.fullName}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          ✉️ {store.owner.email}
                        </div>
                      </div>
                      {storeIds.includes(store.id) && (
                        <div className="text-blue-600 text-lg">✓</div>
                      )}
                    </label>
                  ))
                )}
              </div>

              {/* Helper Text */}
              <p className="mt-2 text-xs text-gray-500">
                {mode === 'multi_store'
                  ? `💡 Chọn từ 0-${stores.length} gian hàng. Hiện chọn: ${storeIds.length}`
                  : '💡 Chọn một gian hàng để gửi.'}
              </p>
            </>
          )}
        </div>
      )}

      {/* Recipient Preview */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
        <div className="flex items-start gap-3">
          <span className="text-lg">📨</span>
          <div className="flex-1">
            <div className="text-sm font-semibold text-blue-900">
              Sẽ gửi cho <span className="text-lg text-blue-600">{recipientCount}</span> người
            </div>
            {mode !== 'all_stores' && storeIds.length > 0 && (
              <div className="mt-1 text-xs text-blue-700">
                {selectedStores.length <= 3
                  ? selectedStores.map((s) => s.name).join(', ')
                  : `${selectedStores.slice(0, 2).map((s) => s.name).join(', ')} và ${selectedStores.length - 2} cái khác`}
              </div>
            )}
            {mode === 'all_stores' && (
              <div className="mt-1 text-xs text-blue-700">Gửi tới tất cả chủ gian hàng đang hoạt động</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

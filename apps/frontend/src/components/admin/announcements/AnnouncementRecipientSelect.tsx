'use client';

import { useState, useMemo } from 'react';
import { Search, Send, X, Check, Store as StoreIcon } from 'lucide-react';
import type { RecipientMode } from '@/lib/api/admin-announcements';
import type { AdminStoreListItem } from '@/lib/api/admin-stores';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { cn } from '../../../lib/cn';

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
  multi_store: { label: 'Nhiều gian hàng', desc: 'Gửi cho nhiều chủ' },
  all_stores: { label: 'Tất cả', desc: 'Gửi cho toàn bộ' },
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

  const filteredStores = useMemo(() => {
    if (!searchQuery.trim()) return stores;
    const q = searchQuery.toLowerCase();
    return stores.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.owner.fullName.toLowerCase().includes(q) ||
        s.owner.email.toLowerCase().includes(q),
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

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-1 rounded-md border border-slate-200 bg-slate-50 p-1">
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
            className={cn(
              'rounded px-2 py-1.5 text-xs transition-colors',
              mode === m
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900',
            )}
          >
            <div className="font-medium">{MODE_LABELS[m].label}</div>
            <div className="text-[10px] text-slate-500">{MODE_LABELS[m].desc}</div>
          </button>
        ))}
      </div>

      {mode !== 'all_stores' && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">
              Đã chọn {storeIds.length}/{stores.length}
            </span>
          </div>

          {loading ? (
            <div className="space-y-2">
              <div className="h-9 animate-pulse rounded-md bg-slate-100" />
              <div className="h-32 animate-pulse rounded-md bg-slate-100" />
            </div>
          ) : (
            <>
              <div className="relative mb-2">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm gian hàng, chủ, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full rounded-md border border-slate-200 bg-white pl-8 pr-3 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400"
                />
              </div>

              {mode === 'multi_store' && stores.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onStoreIdsChange(stores.map((s) => s.id))}
                  >
                    Chọn tất cả
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onStoreIdsChange([])}>
                    Bỏ chọn
                  </Button>
                </div>
              )}

              {mode === 'multi_store' && storeIds.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1">
                  {selectedStores.map((store) => (
                    <button
                      key={store.id}
                      type="button"
                      onClick={() => handleToggleStore(store.id)}
                      className="inline-flex items-center gap-1 rounded-md border border-cyan-200 bg-cyan-50 px-2 py-1 text-xs font-medium text-cyan-800 transition-colors hover:bg-cyan-100"
                    >
                      {store.name}
                      <X className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              )}

              <div className="max-h-64 space-y-1 overflow-y-auto rounded-md border border-slate-200 bg-white p-2">
                {filteredStores.length === 0 ? (
                  <div className="py-4 text-center text-xs text-slate-500">
                    {searchQuery ? 'Không tìm thấy gian hàng' : 'Danh sách trống'}
                  </div>
                ) : (
                  filteredStores.map((store) => {
                    const checked = storeIds.includes(store.id);
                    return (
                      <label
                        key={store.id}
                        className={cn(
                          'flex cursor-pointer items-start gap-2 rounded-md p-2 transition-colors',
                          checked
                            ? 'bg-cyan-50'
                            : 'hover:bg-slate-50',
                        )}
                      >
                        <input
                          type={mode === 'single_store' ? 'radio' : 'checkbox'}
                          name={mode === 'single_store' ? 'store-selection' : undefined}
                          checked={checked}
                          onChange={() => handleToggleStore(store.id)}
                          className="mt-0.5 cursor-pointer"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-slate-900">{store.name}</div>
                          <div className="mt-0.5 text-xs text-slate-600">{store.owner.fullName}</div>
                          <div className="truncate text-xs text-slate-500">{store.owner.email}</div>
                        </div>
                        {checked ? <Check className="h-4 w-4 text-cyan-600" /> : null}
                      </label>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex items-start gap-2 rounded-md border border-cyan-200 bg-cyan-50 p-3">
        <Send className="mt-0.5 h-4 w-4 text-cyan-700" />
        <div className="flex-1">
          <div className="text-sm font-medium text-cyan-900">
            Sẽ gửi cho <Badge variant="info">{recipientCount}</Badge> người nhận
          </div>
          {mode !== 'all_stores' && storeIds.length > 0 && (
            <div className="mt-0.5 text-xs text-cyan-800">
              {selectedStores.length <= 3
                ? selectedStores.map((s) => s.name).join(', ')
                : `${selectedStores
                    .slice(0, 2)
                    .map((s) => s.name)
                    .join(', ')} và ${selectedStores.length - 2} khác`}
            </div>
          )}
          {mode === 'all_stores' && (
            <div className="mt-0.5 text-xs text-cyan-800">
              Gửi tới tất cả chủ gian hàng đang hoạt động
            </div>
          )}
        </div>
        {mode === 'all_stores' ? <StoreIcon className="hidden h-4 w-4 text-cyan-700" /> : null}
      </div>
    </div>
  );
}

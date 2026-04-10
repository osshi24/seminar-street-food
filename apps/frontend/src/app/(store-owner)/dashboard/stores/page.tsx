'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useActiveStore } from '../../../../contexts/ActiveStoreContext';
import { createStore, deleteStore, renameStore } from '../../../../lib/api/stores';

interface StoreWithStats {
  id: string;
  name: string;
  description?: string | null;
  phone?: string | null;
  address?: string | null;
  openingHours?: string | null;
  status: string;
  avgRating: number;
  reviewCount: number;
  menuItemCount: number;
  imageCount: number;
  hasCommentary: boolean;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  active: { label: 'Hoạt động', color: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
  inactive: { label: 'Chờ duyệt', color: 'bg-yellow-50 text-yellow-700 border-yellow-200', dot: 'bg-yellow-500' },
};

function StatBadge({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-500" title={label}>
      {icon}
      <span className="font-medium text-gray-700">{value}</span>
    </div>
  );
}

export default function StoresManagementPage() {
  const { stores: rawStores, activeStoreId, setActiveStoreId, refreshStores, loading } = useActiveStore();
  const stores = rawStores as unknown as StoreWithStats[];

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await createStore({ name: newName.trim(), description: newDesc.trim() || undefined });
      const newStore = res.data ?? res;
      await refreshStores();
      setActiveStoreId(newStore.id);
      setNewName('');
      setNewDesc('');
      setShowCreate(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { code?: string; message?: string } } };
      setError(e.response?.data?.code === 'STORE_LIMIT_EXCEEDED'
        ? 'Bạn đã đạt giới hạn tối đa 3 gian hàng.'
        : e.response?.data?.message ?? 'Tạo gian hàng thất bại');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(storeId: string, storeName: string) {
    if (!confirm(`Xóa gian hàng "${storeName}"?\nHành động này không thể hoàn tác.`)) return;
    setError(null);
    try {
      await deleteStore(storeId);
      await refreshStores();
      if (activeStoreId === storeId) {
        const remaining = stores.filter((s) => s.id !== storeId);
        if (remaining.length > 0) setActiveStoreId(remaining[0].id);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message ?? 'Xóa gian hàng thất bại');
    }
  }

  async function handleRename(storeId: string) {
    if (!renameValue.trim()) return;
    try {
      await renameStore(storeId, renameValue.trim());
      await refreshStores();
      setRenamingId(null);
    } catch {
      setError('Đổi tên thất bại');
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          {[1, 2].map((i) => <div key={i} className="h-40 bg-gray-100 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý gian hàng</h1>
          <p className="text-sm text-gray-500 mt-1">{stores.length}/3 gian hàng</p>
        </div>
        {stores.length < 3 && !showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Thêm gian hàng
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)} className="text-red-500 hover:underline text-xs">Đóng</button>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-gray-800">Tạo gian hàng mới</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên gian hàng *</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={255}
                autoFocus
                placeholder="Nhập tên gian hàng"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                maxLength={1000}
                placeholder="Mô tả ngắn (tùy chọn)"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={creating || !newName.trim()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {creating ? 'Đang tạo...' : 'Tạo gian hàng'}
            </button>
            <button type="button" onClick={() => { setShowCreate(false); setNewName(''); setNewDesc(''); }} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
              Hủy
            </button>
          </div>
        </form>
      )}

      {/* Store cards */}
      <div className="space-y-4">
        {stores.map((store) => {
          const cfg = STATUS_CONFIG[store.status] ?? { label: store.status, color: 'bg-gray-50 text-gray-600 border-gray-200', dot: 'bg-gray-400' };
          const isActive = store.id === activeStoreId;
          const isRenaming = renamingId === store.id;

          return (
            <div
              key={store.id}
              className={`rounded-xl border bg-white shadow-sm overflow-hidden transition-all ${
                isActive ? 'border-blue-300 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Card header */}
              <div className="px-5 pt-4 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {isRenaming ? (
                      <div className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          maxLength={255}
                          autoFocus
                          onKeyDown={(e) => { if (e.key === 'Enter') handleRename(store.id); if (e.key === 'Escape') setRenamingId(null); }}
                          className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                        />
                        <button onClick={() => handleRename(store.id)} className="text-sm text-blue-600 hover:underline font-medium">Lưu</button>
                        <button onClick={() => setRenamingId(null)} className="text-sm text-gray-400 hover:underline">Hủy</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-lg font-bold text-gray-900 truncate">{store.name}</h3>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.color}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                        {isActive && (
                          <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                            Đang chọn
                          </span>
                        )}
                      </div>
                    )}

                    {store.description && !isRenaming && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{store.description}</p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!isActive && (
                      <button
                        onClick={() => setActiveStoreId(store.id)}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 hover:bg-blue-50 transition-colors"
                      >
                        Chọn
                      </button>
                    )}
                    <button
                      onClick={() => { setRenamingId(store.id); setRenameValue(store.name); }}
                      className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                      title="Đổi tên"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    {stores.length > 1 && store.status !== 'active' && (
                      <button
                        onClick={() => handleDelete(store.id, store.name)}
                        className="rounded-lg p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Xóa"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats row */}
              <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-3 flex items-center gap-5 flex-wrap">
                {/* Rating */}
                <StatBadge
                  icon={<svg className="h-3.5 w-3.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>}
                  value={store.reviewCount > 0 ? `${Number(store.avgRating).toFixed(1)} (${store.reviewCount})` : 'Chưa có'}
                  label="Đánh giá"
                />

                {/* Menu items */}
                <StatBadge
                  icon={<svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                  value={`${store.menuItemCount ?? 0} món`}
                  label="Số món ăn"
                />

                {/* Images */}
                <StatBadge
                  icon={<svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                  value={`${store.imageCount ?? 0} ảnh`}
                  label="Số ảnh"
                />

                {/* Commentary */}
                <StatBadge
                  icon={<svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0 0l-3-3m3 3l3-3" /></svg>}
                  value={store.hasCommentary ? 'Có' : 'Chưa'}
                  label="Thuyết minh"
                />

                {/* Contact info indicators */}
                {store.phone && (
                  <StatBadge
                    icon={<svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
                    value={store.phone}
                    label="Số điện thoại"
                  />
                )}
                {store.openingHours && (
                  <StatBadge
                    icon={<svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    value={store.openingHours}
                    label="Giờ mở cửa"
                  />
                )}

                {/* Spacer + detail link */}
                <div className="flex-1" />
                <Link
                  href={`/dashboard/stores/${store.id}`}
                  className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
                >
                  Chi tiết
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {stores.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-2">Chưa có gian hàng nào</p>
          <p className="text-sm">Bấm "Thêm gian hàng" để bắt đầu</p>
        </div>
      )}
    </div>
  );
}

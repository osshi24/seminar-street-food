'use client';

import { useState, useRef, useEffect } from 'react';
import { useActiveStore } from '../../contexts/ActiveStoreContext';
import { createStore } from '../../lib/api/stores';

export default function StoreSelector() {
  const { stores, activeStore, setActiveStoreId, refreshStores } = useActiveStore();
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await createStore({ name: newName.trim() });
      const newStore = res.data ?? res;
      await refreshStores();
      setActiveStoreId(newStore.id);
      setNewName('');
      setShowCreate(false);
      setOpen(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { code?: string } } };
      if (e.response?.data?.code === 'STORE_LIMIT_EXCEEDED') {
        alert('Bạn đã đạt giới hạn tối đa 3 gian hàng.');
      }
    } finally {
      setCreating(false);
    }
  }

  if (!activeStore) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-blue-50 hover:bg-blue-800 transition-colors"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
          {activeStore.name[0]?.toUpperCase()}
        </span>
        <span className="flex-1 truncate">{activeStore.name}</span>
        <svg
          className={`h-4 w-4 text-blue-300 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-50 mt-1 rounded-lg border border-blue-600 bg-blue-800 py-1 shadow-lg">
          {stores.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setActiveStoreId(s.id);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-blue-700 ${
                s.id === activeStore.id ? 'bg-blue-700 font-semibold text-white' : 'text-blue-100'
              }`}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                {s.name[0]?.toUpperCase()}
              </span>
              <span className="flex-1 truncate">{s.name}</span>
              {s.status === 'inactive' && (
                <span className="rounded bg-yellow-500/20 px-1.5 py-0.5 text-[10px] text-yellow-300">Chờ duyệt</span>
              )}
              {s.id === activeStore.id && (
                <svg className="h-4 w-4 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}

          {stores.length < 3 && !showCreate && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex w-full items-center gap-2 border-t border-blue-700 px-3 py-2 text-sm text-blue-200 hover:bg-blue-700 hover:text-white transition-colors"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Thêm gian hàng
            </button>
          )}

          {showCreate && (
            <form onSubmit={handleCreate} className="border-t border-blue-700 px-3 py-2 space-y-2">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Tên gian hàng mới"
                autoFocus
                maxLength={255}
                className="w-full rounded border border-blue-600 bg-blue-900 px-2 py-1.5 text-sm text-white placeholder-blue-400 focus:border-blue-400 focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={creating || !newName.trim()}
                  className="flex-1 rounded bg-blue-500 px-2 py-1 text-xs font-medium text-white hover:bg-blue-400 disabled:opacity-50"
                >
                  {creating ? 'Đang tạo...' : 'Tạo'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setNewName(''); }}
                  className="rounded px-2 py-1 text-xs text-blue-300 hover:text-white"
                >
                  Hủy
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

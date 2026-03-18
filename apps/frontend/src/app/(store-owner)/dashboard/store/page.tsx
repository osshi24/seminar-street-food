'use client';

import { useEffect, useState } from 'react';
import { getMyStore, revokeDraft } from '../../../../lib/api/stores';
import StoreEditForm from '../../../../components/stores/StoreEditForm';

interface StoreData {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  hasPendingDraft: boolean;
  draft?: { status: string; rejectionReason?: string | null } | null;
}

export default function StorePage() {
  const [store, setStore] = useState<StoreData | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await getMyStore();
      setStore(res.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleRevoke() {
    await revokeDraft();
    load();
  }

  if (loading) return <p className="p-6">Đang tải...</p>;
  if (!store) return <p className="p-6 text-red-600">Không tìm thấy gian hàng</p>;

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 space-y-6">
      <h1 className="text-2xl font-bold">Gian hàng của tôi</h1>

      {store.hasPendingDraft && (
        <div className="rounded-md bg-yellow-50 border border-yellow-200 p-4">
          <p className="text-sm text-yellow-800 font-medium">Bản nháp đang chờ Admin phê duyệt</p>
          <button
            onClick={handleRevoke}
            className="mt-2 text-xs text-red-600 hover:underline"
          >
            Thu hồi bản nháp
          </button>
        </div>
      )}

      {store.draft?.status === 'rejected' && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800 font-medium">Bản nháp bị từ chối</p>
          {store.draft.rejectionReason && (
            <p className="mt-1 text-sm text-red-700">Lý do: {store.draft.rejectionReason}</p>
          )}
          <button
            onClick={() => setEditing(true)}
            className="mt-2 text-xs text-blue-600 hover:underline"
          >
            Chỉnh sửa lại
          </button>
        </div>
      )}

      {!editing ? (
        <div className="rounded-lg bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{store.name}</h2>
            {!store.hasPendingDraft && (
              <button
                onClick={() => setEditing(true)}
                className="text-sm text-blue-600 hover:underline"
              >
                Chỉnh sửa
              </button>
            )}
          </div>
          {store.description && (
            <p className="text-sm text-gray-600">{store.description}</p>
          )}
        </div>
      ) : (
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <StoreEditForm
            initialName={store.name}
            initialDescription={store.description}
            onSuccess={() => { setEditing(false); load(); }}
          />
        </div>
      )}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  getMyStore,
  revokeDraft,
  updateStoreInfo,
  type StoreImageItem,
  type UpdateStoreInfoDto,
} from '../../../../lib/api/stores';
import StoreEditForm from '../../../../components/stores/StoreEditForm';
import ImageUploader from '../../../../components/stores/ImageUploader';

type TabKey = 'info' | 'images';

interface StoreData {
  id: string;
  name: string;
  description?: string | null;
  phone?: string | null;
  address?: string | null;
  openingHours?: string | null;
  socialLinks?: { facebook?: string; instagram?: string; tiktok?: string } | null;
  status: string;
  hasPendingDraft: boolean;
  draft?: { status: string; rejectionReason?: string | null } | null;
  images: StoreImageItem[];
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'info', label: 'Thông tin' },
  { key: 'images', label: 'Hình ảnh' },
];

export default function StorePage() {
  const [store, setStore] = useState<StoreData | null>(null);
  const [tab, setTab] = useState<TabKey>('info');
  const [editingDraft, setEditingDraft] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Info form state
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyStore();
      const s = res.data as StoreData;
      setStore(s);
      setPhone(s.phone ?? '');
      setAddress(s.address ?? '');
      setOpeningHours(s.openingHours ?? '');
      setFacebook(s.socialLinks?.facebook ?? '');
      setInstagram(s.socialLinks?.instagram ?? '');
      setTiktok(s.socialLinks?.tiktok ?? '');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleRevoke() {
    await revokeDraft();
    load();
  }

  async function handleSaveInfo(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const dto: UpdateStoreInfoDto = {
        phone: phone || undefined,
        address: address || undefined,
        openingHours: openingHours || undefined,
        socialLinks: (facebook || instagram || tiktok)
          ? { facebook: facebook || undefined, instagram: instagram || undefined, tiktok: tiktok || undefined }
          : undefined,
      };
      await updateStoreInfo(dto);
      await load();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-100 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!store) return <p className="p-6 text-red-600">Không tìm thấy gian hàng</p>;

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Gian hàng của tôi</h1>

      {/* Draft banners */}
      {store.hasPendingDraft && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4 flex items-start gap-3">
          <svg className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="text-sm text-yellow-800 font-medium">Bản nháp đang chờ Admin phê duyệt</p>
            <button onClick={handleRevoke} className="mt-1 text-xs text-red-600 hover:underline">Thu hồi bản nháp</button>
          </div>
        </div>
      )}
      {store.draft?.status === 'rejected' && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800 font-medium">Bản nháp bị từ chối</p>
          {store.draft.rejectionReason && <p className="mt-1 text-sm text-red-700">Lý do: {store.draft.rejectionReason}</p>}
          <button onClick={() => setEditingDraft(true)} className="mt-2 text-xs text-blue-600 hover:underline">Chỉnh sửa lại</button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
              {t.key === 'images' && store.images.length > 0 && (
                <span className="ml-1.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">
                  {store.images.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab: Info */}
      {tab === 'info' && (
        <div className="space-y-6">
          {/* Name & Description (draft workflow) */}
          <div className="rounded-lg bg-white border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800">Tên & Mô tả</h2>
              {!store.hasPendingDraft && !editingDraft && (
                <button onClick={() => setEditingDraft(true)} className="text-sm text-blue-600 hover:underline">Chỉnh sửa</button>
              )}
            </div>
            {editingDraft ? (
              <StoreEditForm
                initialName={store.name}
                initialDescription={store.description}
                onSuccess={() => { setEditingDraft(false); load(); }}
              />
            ) : (
              <div className="space-y-2">
                <p className="text-lg font-semibold text-gray-900">{store.name}</p>
                <p className="text-sm text-gray-600">{store.description || <span className="italic text-gray-400">Chưa có mô tả</span>}</p>
              </div>
            )}
          </div>

          {/* Additional info (direct update) */}
          <form onSubmit={handleSaveInfo} className="rounded-lg bg-white border p-5 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-gray-800">Thông tin liên hệ</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0123 456 789"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giờ mở cửa</label>
                <input
                  type="text"
                  value={openingHours}
                  onChange={(e) => setOpeningHours(e.target.value)}
                  placeholder="6:00 - 22:00"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Số nhà, đường, phường..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <h2 className="text-base font-semibold text-gray-800 pt-2">Mạng xã hội</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                <input
                  type="url"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="https://facebook.com/..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                <input
                  type="url"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="https://instagram.com/..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TikTok</label>
                <input
                  type="url"
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  placeholder="https://tiktok.com/@..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {saving ? 'Đang lưu...' : 'Lưu thông tin'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab: Images */}
      {tab === 'images' && (
        <div className="rounded-lg bg-white border p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Hình ảnh gian hàng</h2>
          <ImageUploader images={store.images} onImagesChange={load} />
        </div>
      )}
    </div>
  );
}

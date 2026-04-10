'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getMyStore,
  updateStoreInfo,
  revokeDraft,
  type StoreImageItem,
  type UpdateStoreInfoDto,
} from '../../../../../lib/api/stores';
import { useActiveStore } from '../../../../../contexts/ActiveStoreContext';
import StoreEditForm from '../../../../../components/stores/StoreEditForm';
import ImageUploader from '../../../../../components/stores/ImageUploader';

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
  avgRating: number;
  reviewCount: number;
  hasPendingDraft: boolean;
  draft?: { status: string; rejectionReason?: string | null } | null;
  images: StoreImageItem[];
  menuItems: Array<{ id: string; name: string }>;
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'info', label: 'Thông tin' },
  { key: 'images', label: 'Hình ảnh' },
];

export default function StoreDetailPage() {
  const params = useParams();
  const router = useRouter();
  const storeId = params.id as string;
  const { setActiveStoreId } = useActiveStore();

  const [store, setStore] = useState<StoreData | null>(null);
  const [tab, setTab] = useState<TabKey>('info');
  const [editingDraft, setEditingDraft] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');

  const load = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const res = await getMyStore(storeId);
      const s = res.data as StoreData;
      setStore(s);
      setPhone(s.phone ?? '');
      setAddress(s.address ?? '');
      setOpeningHours(s.openingHours ?? '');
      setFacebook(s.socialLinks?.facebook ?? '');
      setInstagram(s.socialLinks?.instagram ?? '');
      setTiktok(s.socialLinks?.tiktok ?? '');
    } catch {
      setStore(null);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  async function handleRevoke() {
    await revokeDraft(storeId);
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
      await updateStoreInfo(storeId, dto);
      await load();
    } finally {
      setSaving(false);
    }
  }

  function handleSelectStore() {
    setActiveStoreId(storeId);
    router.push('/dashboard/store');
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 bg-gray-200 rounded" />
          <div className="h-8 w-64 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-100 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-8 text-center">
        <p className="text-red-600 mb-4">Không tìm thấy gian hàng</p>
        <Link href="/dashboard/stores" className="text-blue-600 hover:underline text-sm">Quay lại</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 space-y-6">
      {/* Breadcrumb + header */}
      <div>
        <Link href="/dashboard/stores" className="text-sm text-blue-600 hover:underline flex items-center gap-1 mb-3">
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Quản lý gian hàng
        </Link>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{store.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${
                store.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'
              }`}>
                {store.status === 'active' ? 'Hoạt động' : 'Chờ duyệt'}
              </span>
              {store.reviewCount > 0 && (
                <span className="text-sm text-gray-500">
                  {Number(store.avgRating).toFixed(1)} ({store.reviewCount} đánh giá)
                </span>
              )}
            </div>
          </div>
          <button
            onClick={handleSelectStore}
            className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
          >
            Chọn & quản lý
          </button>
        </div>
      </div>

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

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
              {t.key === 'images' && store.images.length > 0 && (
                <span className="ml-1.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600">{store.images.length}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab: Info */}
      {tab === 'info' && (
        <div className="space-y-6">
          {/* Name & Description (draft workflow) */}
          <div className="rounded-xl bg-white border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800">Tên & Mô tả</h2>
              {!store.hasPendingDraft && !editingDraft && (
                <button onClick={() => setEditingDraft(true)} className="text-sm text-blue-600 hover:underline">Chỉnh sửa</button>
              )}
            </div>
            {editingDraft ? (
              <StoreEditForm
                storeId={store.id}
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

          {/* Contact & Social info */}
          <form onSubmit={handleSaveInfo} className="rounded-xl bg-white border p-5 shadow-sm space-y-4">
            <h2 className="text-base font-semibold text-gray-800">Thông tin liên hệ</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0123 456 789"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Giờ mở cửa</label>
                <input type="text" value={openingHours} onChange={(e) => setOpeningHours(e.target.value)} placeholder="6:00 - 22:00"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Số nhà, đường, phường..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            </div>

            <h2 className="text-base font-semibold text-gray-800 pt-2">Mạng xã hội</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                <input type="url" value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://facebook.com/..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                <input type="url" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TikTok</label>
                <input type="url" value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="https://tiktok.com/@..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
              </div>
            </div>

            <div className="pt-2">
              <button type="submit" disabled={saving}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors">
                {saving ? 'Đang lưu...' : 'Lưu thông tin'}
              </button>
            </div>
          </form>

          {/* Quick stats */}
          <div className="rounded-xl bg-white border p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-800 mb-3">Thống kê</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{store.menuItems?.length ?? 0}</p>
                <p className="text-xs text-gray-500 mt-1">Món ăn</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{store.images?.length ?? 0}</p>
                <p className="text-xs text-gray-500 mt-1">Hình ảnh</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{store.reviewCount > 0 ? Number(store.avgRating).toFixed(1) : '—'}</p>
                <p className="text-xs text-gray-500 mt-1">Đánh giá ({store.reviewCount})</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">{store.status === 'active' ? 'ON' : 'OFF'}</p>
                <p className="text-xs text-gray-500 mt-1">Trạng thái</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Images */}
      {tab === 'images' && (
        <div className="rounded-xl bg-white border p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Hình ảnh gian hàng</h2>
          <ImageUploader storeId={store.id} images={store.images} onImagesChange={load} />
        </div>
      )}
    </div>
  );
}

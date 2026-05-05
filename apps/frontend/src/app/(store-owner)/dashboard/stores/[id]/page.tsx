'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  getStoreById,
  updateStoreInfoById,
  saveDraftById,
  submitDraftById,
  revokeDraftById,
  getDraftById,
  type StoreImageItem,
  type UpdateStoreInfoDto,
  type StoreDraft,
} from '../../../../../lib/api/stores';
import StoreDetailEditForm from '../../../../../components/stores/StoreDetailEditForm';
import ImageUploader from '../../../../../components/stores/ImageUploader';
import StoreQrSection from '../../../../../components/stores/StoreQrSection';

type TabKey = 'info' | 'images' | 'qr';

interface StoreData {
  id: string;
  name: string;
  description?: string | null;
  phone?: string | null;
  address?: string | null;
  openingHours?: string | null;
  socialLinks?: { facebook?: string; instagram?: string; tiktok?: string } | null;
  status: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  hasPendingDraft: boolean;
  images: StoreImageItem[];
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'info', label: 'Thông tin' },
  { key: 'images', label: 'Hình ảnh' },
  { key: 'qr', label: 'QR Code' },
];

export default function StoreDetailPage() {
  const params = useParams();
  const storeId = params.id as string;

  const [store, setStore] = useState<StoreData | null>(null);
  const [draft, setDraft] = useState<StoreDraft | null>(null);
  const [tab, setTab] = useState<TabKey>('info');
  const [editingDraft, setEditingDraft] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [facebook, setFacebook] = useState('');
  const [instagram, setInstagram] = useState('');
  const [tiktok, setTiktok] = useState('');

  const loadDraft = useCallback(async (s: StoreData) => {
    if (!s.hasPendingDraft) {
      setDraft(null);
      return;
    }
    try {
      const d = await getDraftById(s.id);
      setDraft(d);
    } catch {
      setDraft(null);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getStoreById(storeId);
      const s = res.data as StoreData;
      setStore(s);
      setPhone(s.phone ?? '');
      setAddress(s.address ?? '');
      setOpeningHours(s.openingHours ?? '');
      setFacebook(s.socialLinks?.facebook ?? '');
      setInstagram(s.socialLinks?.instagram ?? '');
      setTiktok(s.socialLinks?.tiktok ?? '');
      await loadDraft(s);
    } finally {
      setLoading(false);
    }
  }, [storeId, loadDraft]);

  useEffect(() => {
    load();
  }, [load]);

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
      await updateStoreInfoById(storeId, dto);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveDraft(data: { name: string; description?: string }) {
    await saveDraftById(storeId, data);
    await submitDraftById(storeId);
    setEditingDraft(false);
    await load();
  }

  async function handleRevokeDraft() {
    if (!confirm('Bạn có chắc muốn rút lại bản nháp này?')) return;
    setRevoking(true);
    try {
      await revokeDraftById(storeId);
      await load();
    } finally {
      setRevoking(false);
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

  // Single banner — ưu tiên: draft pending > draft rejected > store pending > store rejected > (không cần banner khi approved)
  const banner = (() => {
    if (store.hasPendingDraft && draft) {
      return {
        bg: 'bg-yellow-50 border-yellow-200',
        text: 'Có bản nháp tên/mô tả đang chờ admin phê duyệt.',
        showRevoke: true,
      };
    }
    if (draft?.status === 'rejected') {
      return {
        bg: 'bg-red-50 border-red-200',
        text: `Bản nháp bị từ chối${draft.rejectionReason ? `: ${draft.rejectionReason}` : '.'}`,
        showRevoke: false,
      };
    }
    if (store.approvalStatus === 'pending') {
      return {
        bg: 'bg-yellow-50 border-yellow-200',
        text: 'Gian hàng đang chờ admin phê duyệt lần đầu.',
        showRevoke: false,
      };
    }
    if (store.approvalStatus === 'rejected') {
      return {
        bg: 'bg-red-50 border-red-200',
        text: 'Gian hàng đã bị từ chối.',
        showRevoke: false,
      };
    }
    return null;
  })();

  const canEditNameDesc = store.approvalStatus === 'approved' && !store.hasPendingDraft;

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{store.name}</h1>

      {banner && (
        <div className={`rounded-lg border p-4 flex items-start justify-between gap-4 ${banner.bg}`}>
          <p className="text-sm font-medium text-gray-800">{banner.text}</p>
          {banner.showRevoke && (
            <button
              onClick={handleRevokeDraft}
              disabled={revoking}
              className="shrink-0 text-sm text-red-600 hover:underline disabled:opacity-50"
            >
              {revoking ? 'Đang rút...' : 'Rút bản nháp'}
            </button>
          )}
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

      {tab === 'info' && (
        <div className="space-y-6">
          {/* Tên & Thuyết minh */}
          <div className="rounded-lg bg-white border p-5 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-semibold text-gray-800">Tên & Thuyết minh</h2>
              {canEditNameDesc && !editingDraft && (
                <button onClick={() => setEditingDraft(true)} className="text-sm text-blue-600 hover:underline">
                  Chỉnh sửa
                </button>
              )}
            </div>

            <p className="mb-4 text-xs text-gray-400">Nội dung thuyết minh sẽ được đọc tự động khi khách quét QR gian hàng.</p>

            {editingDraft ? (
              <StoreDetailEditForm
                storeId={storeId}
                initialName={store.name}
                initialDescription={store.description}
                onSaveDraft={handleSaveDraft}
                onCancel={() => setEditingDraft(false)}
              />
            ) : (
              <div className="space-y-2">
                <p className="text-lg font-semibold text-gray-900">{store.name}</p>
                <p className="text-sm text-gray-600">
                  {store.description || <span className="italic text-gray-400">Chưa có nội dung thuyết minh</span>}
                </p>
                {store.approvalStatus !== 'approved' && (
                  <p className="text-xs text-gray-400 mt-2">
                    Có thể chỉnh sửa tên và thuyết minh sau khi gian hàng được admin phê duyệt lần đầu.
                  </p>
                )}
                {store.approvalStatus === 'approved' && store.hasPendingDraft && (
                  <p className="text-xs text-yellow-600 mt-2">
                    Đang có bản nháp chờ duyệt — không thể chỉnh sửa cho đến khi bản nháp được xử lý.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Thông tin liên hệ */}
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

      {tab === 'images' && (
        <div className="rounded-lg bg-white border p-5 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Hình ảnh gian hàng</h2>
          <ImageUploader storeId={storeId} images={store.images} onImagesChange={load} />
        </div>
      )}

      {tab === 'qr' && (
        <StoreQrSection storeId={storeId} storeName={store.name} storeStatus={store.status} />
      )}
    </div>
  );
}

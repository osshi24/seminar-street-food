'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  EyeOff,
  Info,
  MoreVertical,
  Pencil,
  QrCode,
  Trash2,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import {
  getStoreById,
  updateStoreInfoById,
  saveDraftById,
  submitDraftById,
  revokeDraftById,
  getDraftById,
  requestStoreDeletion,
  revokeStoreDeletionRequest,
  toggleStoreStatus,
  type StoreImageItem,
  type UpdateStoreInfoDto,
  type StoreDraft,
} from '../../../../../lib/api/stores';
import StoreDetailEditForm from '../../../../../components/stores/StoreDetailEditForm';
import ImageUploader from '../../../../../components/stores/ImageUploader';
import StoreQrSection from '../../../../../components/stores/StoreQrSection';
import StoreMenuTab from '../../../../../components/stores/StoreMenuTab';
import StoreOwnerPageHeader from '../../../../../components/dashboard/common/StoreOwnerPageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Button } from '../../../../../components/ui/button';
import { Badge } from '../../../../../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../../../components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../../../components/ui/dialog';
import { cn } from '../../../../../lib/cn';

type TabKey = 'overview' | 'menu' | 'qr';

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
  deletionRequestedAt?: string | null;
  images: StoreImageItem[];
}

const TABS: { key: TabKey; label: string; icon: typeof Info }[] = [
  { key: 'overview', label: 'Thông tin', icon: Info },
  { key: 'menu', label: 'Thực đơn', icon: UtensilsCrossed },
  { key: 'qr', label: 'QR Code', icon: QrCode },
];

const APPROVAL_VARIANT = {
  pending: 'warning',
  approved: 'info',
  rejected: 'danger',
} as const;

const APPROVAL_LABEL = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Bị từ chối',
} as const;

export default function StoreDetailPage() {
  const params = useParams();
  const storeId = params.id as string;

  const [store, setStore] = useState<StoreData | null>(null);
  const [draft, setDraft] = useState<StoreDraft | null>(null);
  const [tab, setTab] = useState<TabKey>('overview');
  const [editingDraft, setEditingDraft] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [deletionLoading, setDeletionLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    confirmLabel: string;
    danger?: boolean;
  } | null>(null);

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
        socialLinks:
          facebook || instagram || tiktok
            ? {
                facebook: facebook || undefined,
                instagram: instagram || undefined,
                tiktok: tiktok || undefined,
              }
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

  function handleRevokeDraft() {
    setConfirmDialog({
      open: true,
      title: 'Rút lại bản nháp',
      description:
        'Bạn có chắc muốn rút lại bản nháp này? Các thay đổi chưa được phê duyệt sẽ bị huỷ.',
      confirmLabel: 'Rút bản nháp',
      danger: true,
      onConfirm: async () => {
        setConfirmDialog(null);
        setRevoking(true);
        try {
          await revokeDraftById(storeId);
          await load();
        } finally {
          setRevoking(false);
        }
      },
    });
  }

  function handleRequestDeletion() {
    if (!store) return;
    setConfirmDialog({
      open: true,
      title: 'Yêu cầu xoá gian hàng',
      description: `Gửi yêu cầu xoá gian hàng "${store.name}" đến Admin? Gian hàng sẽ bị ẩn khỏi bản đồ sau khi Admin phê duyệt.`,
      confirmLabel: 'Gửi yêu cầu',
      danger: true,
      onConfirm: async () => {
        setConfirmDialog(null);
        setDeletionLoading(true);
        try {
          await requestStoreDeletion(storeId);
          await load();
        } finally {
          setDeletionLoading(false);
        }
      },
    });
  }

  async function handleRevokeDeletion() {
    if (!store) return;
    setDeletionLoading(true);
    try {
      await revokeStoreDeletionRequest(storeId);
      await load();
    } finally {
      setDeletionLoading(false);
    }
  }

  function handleToggleStatus() {
    if (!store) return;
    const turningOff = store.status === 'active';
    setConfirmDialog({
      open: true,
      title: turningOff ? 'Tạm ẩn gian hàng' : 'Bật lại gian hàng',
      description: turningOff
        ? `Khi tạm ẩn, gian hàng "${store.name}" sẽ không hiển thị trên bản đồ và khách quét QR sẽ không xem được. Bạn có thể bật lại bất cứ lúc nào.`
        : `Bật lại gian hàng "${store.name}" để khách hàng có thể tìm thấy trên bản đồ và quét QR.`,
      confirmLabel: turningOff ? 'Tạm ẩn' : 'Bật hoạt động',
      danger: turningOff,
      onConfirm: async () => {
        setConfirmDialog(null);
        setStatusLoading(true);
        try {
          await toggleStoreStatus(storeId, !turningOff);
          await load();
        } finally {
          setStatusLoading(false);
        }
      },
    });
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-20 animate-pulse rounded-xl bg-white" />
        <div className="h-12 animate-pulse rounded-xl bg-white" />
        <div className="h-96 animate-pulse rounded-xl bg-white" />
      </div>
    );
  }

  if (!store) {
    return (
      <Card className="border-rose-200 bg-rose-50">
        <CardContent className="p-5 text-sm text-rose-700">
          Không tìm thấy gian hàng.
        </CardContent>
      </Card>
    );
  }

  const banner = (() => {
    if (store.hasPendingDraft && draft) {
      return {
        tone: 'amber' as const,
        text: 'Có bản nháp tên/thuyết minh đang chờ Admin phê duyệt.',
        showRevoke: true,
      };
    }
    if (draft?.status === 'rejected') {
      return {
        tone: 'rose' as const,
        text: `Bản nháp bị từ chối${draft.rejectionReason ? `: ${draft.rejectionReason}` : '.'}`,
        showRevoke: false,
      };
    }
    if (store.approvalStatus === 'pending') {
      return {
        tone: 'amber' as const,
        text: 'Gian hàng đang chờ Admin phê duyệt lần đầu.',
        showRevoke: false,
      };
    }
    if (store.approvalStatus === 'rejected') {
      return {
        tone: 'rose' as const,
        text: 'Gian hàng đã bị từ chối.',
        showRevoke: false,
      };
    }
    return null;
  })();

  const canEditNameDesc = store.approvalStatus === 'approved' && !store.hasPendingDraft;
  const isActive = store.status === 'active';
  const hasDeletionRequest = !!store.deletionRequestedAt;

  return (
    <div className="space-y-5">
      <StoreOwnerPageHeader
        badge="Chi tiết gian hàng"
        title={store.name}
        description={
          store.description || (
            <span className="italic text-slate-400">Chưa có nội dung thuyết minh</span>
          )
        }
        action={
          <div className="flex items-center gap-2">
            <Badge variant={APPROVAL_VARIANT[store.approvalStatus]}>
              {APPROVAL_LABEL[store.approvalStatus]}
            </Badge>
            {store.approvalStatus === 'approved' && (
              <Badge variant={isActive ? 'success' : 'muted'}>
                {isActive ? 'Hoạt động' : 'Tạm ẩn'}
              </Badge>
            )}
            {hasDeletionRequest && (
              <Badge variant="warning" className="gap-1">
                <Clock className="h-3 w-3" />
                Chờ xoá
              </Badge>
            )}
            {store.approvalStatus === 'approved' && (
              <Link
                href={`/stores/${store.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden h-9 items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition-colors hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 sm:inline-flex"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Xem công khai
              </Link>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Tuỳ chọn"
                  className="grid h-9 w-9 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Tác vụ gian hàng</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {store.approvalStatus === 'approved' && (
                  <DropdownMenuItem asChild className="sm:hidden">
                    <Link
                      href={`/stores/${store.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink />
                      Xem trang công khai
                    </Link>
                  </DropdownMenuItem>
                )}
                {store.approvalStatus === 'approved' && (
                  <DropdownMenuItem
                    onSelect={handleToggleStatus}
                    disabled={statusLoading}
                  >
                    {isActive ? <EyeOff /> : <Eye />}
                    {isActive ? 'Tạm ẩn gian hàng' : 'Bật hoạt động'}
                  </DropdownMenuItem>
                )}
                {hasDeletionRequest ? (
                  <DropdownMenuItem
                    onSelect={handleRevokeDeletion}
                    disabled={deletionLoading}
                  >
                    <X />
                    Huỷ yêu cầu xoá
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onSelect={handleRequestDeletion}
                    disabled={deletionLoading}
                    className="text-rose-600 focus:bg-rose-50 focus:text-rose-700"
                  >
                    <Trash2 />
                    Yêu cầu xoá gian hàng
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      {banner && (
        <Card
          className={cn(
            banner.tone === 'amber' && 'border-amber-200 bg-amber-50',
            banner.tone === 'rose' && 'border-rose-200 bg-rose-50',
          )}
        >
          <CardContent className="flex items-start justify-between gap-3 p-4">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'grid h-8 w-8 shrink-0 place-items-center rounded-full',
                  banner.tone === 'amber' && 'bg-amber-100 text-amber-700',
                  banner.tone === 'rose' && 'bg-rose-100 text-rose-700',
                )}
              >
                <AlertTriangle className="h-4 w-4" />
              </div>
              <p
                className={cn(
                  'text-sm font-medium',
                  banner.tone === 'amber' && 'text-amber-800',
                  banner.tone === 'rose' && 'text-rose-800',
                )}
              >
                {banner.text}
              </p>
            </div>
            {banner.showRevoke && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRevokeDraft}
                disabled={revoking}
                className="shrink-0"
              >
                {revoking ? 'Đang rút...' : 'Rút bản nháp'}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {store.approvalStatus === 'approved' && !isActive && !hasDeletionRequest && (
        <Card className="border-slate-200 bg-slate-50">
          <CardContent className="flex items-start justify-between gap-3 p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-200 text-slate-700">
                <EyeOff className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Gian hàng đang tạm ẩn
                </p>
                <p className="mt-0.5 text-xs text-slate-600">
                  Khách không thấy gian hàng trên bản đồ và không xem được khi quét QR.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleToggleStatus}
              disabled={statusLoading}
              className="shrink-0 bg-orange-500 text-white hover:bg-orange-600"
            >
              <Eye />
              {statusLoading ? 'Đang xử lý...' : 'Bật lại'}
            </Button>
          </CardContent>
        </Card>
      )}

      {hasDeletionRequest && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-start justify-between gap-3 p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  Yêu cầu xoá đang chờ Admin xử lý
                </p>
                <p className="mt-0.5 text-xs text-amber-700">
                  Gửi lúc {new Date(store.deletionRequestedAt!).toLocaleString('vi-VN')}.
                  Gian hàng sẽ bị ẩn sau khi Admin phê duyệt.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRevokeDeletion}
              disabled={deletionLoading}
              className="shrink-0"
            >
              {deletionLoading ? 'Đang xử lý...' : 'Huỷ yêu cầu'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
        <nav className="flex gap-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </nav>
      </div>

      {tab === 'overview' && (
        <div className="space-y-4">
          {/* Tên & thuyết minh */}
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-slate-100">
              <div>
                <CardTitle className="text-base">Tên &amp; Thuyết minh</CardTitle>
                <CardDescription>
                  Nội dung sẽ được đọc tự động khi khách quét QR.
                </CardDescription>
              </div>
              {canEditNameDesc && !editingDraft && (
                <Button variant="outline" size="sm" onClick={() => setEditingDraft(true)}>
                  <Pencil />
                  Chỉnh sửa
                </Button>
              )}
            </CardHeader>
            <CardContent className="pt-5">
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
                  <p className="text-lg font-semibold tracking-tight text-slate-900">
                    {store.name}
                  </p>
                  <p className="text-sm leading-6 text-slate-600">
                    {store.description || (
                      <span className="italic text-slate-400">
                        Chưa có nội dung thuyết minh
                      </span>
                    )}
                  </p>
                  {store.approvalStatus !== 'approved' && (
                    <p className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-500 ring-1 ring-slate-200">
                      Có thể chỉnh sửa tên và thuyết minh sau khi gian hàng được Admin phê duyệt lần đầu.
                    </p>
                  )}
                  {store.approvalStatus === 'approved' && store.hasPendingDraft && (
                    <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 ring-1 ring-amber-200">
                      Đang có bản nháp chờ duyệt — không thể chỉnh sửa cho đến khi bản nháp được xử lý.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Hình ảnh */}
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-slate-100">
              <div>
                <CardTitle className="text-base">Hình ảnh gian hàng</CardTitle>
                <CardDescription>
                  Tải ảnh đẹp giúp gian hàng nổi bật trên bản đồ.
                </CardDescription>
              </div>
              {store.images.length > 0 && (
                <Badge variant="muted">{store.images.length} ảnh</Badge>
              )}
            </CardHeader>
            <CardContent className="pt-5">
              <ImageUploader
                storeId={storeId}
                images={store.images}
                onImagesChange={load}
              />
            </CardContent>
          </Card>

          {/* Liên hệ */}
          <Card>
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="text-base">Thông tin liên hệ</CardTitle>
              <CardDescription>
                Số điện thoại, địa chỉ, giờ mở cửa và mạng xã hội.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5">
              <form onSubmit={handleSaveInfo} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FieldInput
                    label="Số điện thoại"
                    type="tel"
                    value={phone}
                    onChange={setPhone}
                    placeholder="0123 456 789"
                  />
                  <FieldInput
                    label="Giờ mở cửa"
                    value={openingHours}
                    onChange={setOpeningHours}
                    placeholder="6:00 - 22:00"
                  />
                </div>

                <FieldInput
                  label="Địa chỉ"
                  value={address}
                  onChange={setAddress}
                  placeholder="Số nhà, đường, phường..."
                />

                <div className="border-t border-slate-100 pt-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Mạng xã hội
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <FieldInput
                      label="Facebook"
                      type="url"
                      value={facebook}
                      onChange={setFacebook}
                      placeholder="https://facebook.com/..."
                    />
                    <FieldInput
                      label="Instagram"
                      type="url"
                      value={instagram}
                      onChange={setInstagram}
                      placeholder="https://instagram.com/..."
                    />
                    <FieldInput
                      label="TikTok"
                      type="url"
                      value={tiktok}
                      onChange={setTiktok}
                      placeholder="https://tiktok.com/@..."
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    className="bg-orange-500 hover:bg-orange-600"
                    disabled={saving}
                  >
                    <CheckCircle2 />
                    {saving ? 'Đang lưu...' : 'Lưu thông tin'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'menu' && (
        <Card>
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-base">Quản lý thực đơn</CardTitle>
            <CardDescription>Thêm, chỉnh sửa món, giá tiền và mô tả.</CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <StoreMenuTab storeId={storeId} />
          </CardContent>
        </Card>
      )}

      {tab === 'qr' && (
        <StoreQrSection
          storeId={storeId}
          storeName={store.name}
          storeStatus={store.status}
        />
      )}

      <Dialog
        open={confirmDialog?.open ?? false}
        onOpenChange={(open) => {
          if (!open) setConfirmDialog(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmDialog?.title}</DialogTitle>
            <DialogDescription>{confirmDialog?.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialog(null)}>
              Huỷ
            </Button>
            <Button
              variant={confirmDialog?.danger ? 'destructive' : 'default'}
              onClick={() => confirmDialog?.onConfirm()}
            >
              {confirmDialog?.confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface FieldInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}

function FieldInput({ label, value, onChange, placeholder, type = 'text' }: FieldInputProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
      />
    </div>
  );
}

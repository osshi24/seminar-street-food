'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Store as StoreIcon,
  AlertTriangle,
  User,
  Wrench,
} from 'lucide-react';
import DeleteStoreConfirmDialog from '../../../../../components/admin/DeleteStoreConfirmDialog';
import AdminPageHeader from '../../../../../components/admin/common/AdminPageHeader';
import AdminInfoCard from '../../../../../components/admin/common/AdminInfoCard';
import StoreStatusBadge from '../../../../../components/admin/stores/StoreStatusBadge';
import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import { Card, CardContent } from '../../../../../components/ui/card';
import {
  activateStore,
  deactivateStore,
  getAdminStore,
  approveDeletion,
  rejectDeletion,
  type AdminStoreDetail,
} from '../../../../../lib/api/admin-stores';

export default function AdminStoreDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [data, setData] = useState<AdminStoreDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminStore(id);
      setData(res.data);
    } catch (requestError: unknown) {
      setError(
        (requestError as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Không thể tải chi tiết gian hàng.',
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggleStatus = async () => {
    if (!data) return;
    setActionLoading(true);
    try {
      if (data.status === 'active') {
        await deactivateStore(data.id);
      } else {
        await activateStore(data.id);
      }
      await load();
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-24 animate-pulse rounded-xl bg-white" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="h-80 animate-pulse rounded-xl bg-white lg:col-span-2" />
          <div className="h-80 animate-pulse rounded-xl bg-white" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-rose-200 bg-rose-50">
        <CardContent className="p-5">
          <p className="font-semibold text-rose-700">Không thể tải chi tiết gian hàng</p>
          <p className="mt-2 text-sm text-rose-600">{error}</p>
          <Link
            href="/admin/stores"
            className="mt-4 inline-flex text-sm font-medium text-rose-700 hover:underline"
          >
            Quay lại danh sách
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-5">
          <p className="font-semibold text-slate-900">Không tìm thấy gian hàng này.</p>
          <Link
            href="/admin/stores"
            className="mt-4 inline-flex text-sm font-medium text-cyan-700 hover:underline"
          >
            Quay lại danh sách
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Link
        href="/admin/stores"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại danh sách
      </Link>

      <AdminPageHeader
        badge="Chi tiết gian hàng"
        title={data.name}
        description="Xem nhanh thông tin vận hành và rủi ro phát sinh trước khi tạm ẩn hoặc xóa."
        meta={`Mã: ${data.id}`}
        action={<StoreStatusBadge status={data.status} />}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <AdminInfoCard title="Thông tin gian hàng" icon={StoreIcon}>
            <dl className="space-y-4">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Mô tả</dt>
                <dd className="mt-1.5 whitespace-pre-wrap rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                  {data.description ?? '—'}
                </dd>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Điện thoại
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900">{data.phone ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Giờ mở cửa
                  </dt>
                  <dd className="mt-1 text-sm text-slate-900">{data.openingHours ?? '—'}</dd>
                </div>
              </div>

              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Địa chỉ</dt>
                <dd className="mt-1 text-sm leading-6 text-slate-700">{data.address ?? '—'}</dd>
              </div>

              <div className="grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Tạo lúc
                  </dt>
                  <dd className="mt-1 text-sm text-slate-700">
                    {new Date(data.createdAt).toLocaleString('vi-VN')}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Cập nhật
                  </dt>
                  <dd className="mt-1 text-sm text-slate-700">
                    {new Date(data.updatedAt).toLocaleString('vi-VN')}
                  </dd>
                </div>
              </div>
            </dl>
          </AdminInfoCard>

          <AdminInfoCard title="Phân tích ảnh hưởng khi xóa" icon={AlertTriangle}>
            <p className="text-sm text-slate-500">
              Nếu xóa gian hàng, các dữ liệu liên quan dưới đây sẽ bị ảnh hưởng.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                {
                  count: data.deleteImpact.reviewCount,
                  label: 'Đánh giá',
                  color: 'border-amber-200 bg-amber-50 text-amber-700',
                },
                {
                  count: data.deleteImpact.reportCount,
                  label: 'Báo cáo',
                  color: 'border-rose-200 bg-rose-50 text-rose-700',
                },
                {
                  count: data.deleteImpact.locationPinCount,
                  label: 'Ghim bản đồ',
                  color: 'border-cyan-200 bg-cyan-50 text-cyan-700',
                },
                {
                  count: data.deleteImpact.pendingDraft ? 1 : 0,
                  label: 'Bản nháp chờ duyệt',
                  color: 'border-violet-200 bg-violet-50 text-violet-700',
                },
              ].map(({ count, label, color }) => (
                <div key={label} className={`rounded-lg border p-3 ${color}`}>
                  <div className="text-2xl font-semibold">{count}</div>
                  <div className="mt-0.5 text-xs font-medium">{label}</div>
                </div>
              ))}
            </div>
          </AdminInfoCard>
        </div>

        <div className="space-y-4">
          <AdminInfoCard title="Chủ gian hàng" icon={User}>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Tên</dt>
                <dd className="mt-1 text-sm font-medium text-slate-900">
                  {data.owner.fullName ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</dt>
                <dd className="mt-1 break-all text-sm text-cyan-700">{data.owner.email ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Điện thoại
                </dt>
                <dd className="mt-1 text-sm text-slate-700">{data.owner.phone ?? '—'}</dd>
              </div>
              <div className="border-t border-slate-100 pt-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Trạng thái
                </dt>
                <dd className="mt-1">
                  <Badge variant={data.owner.status === 'active' ? 'success' : 'muted'}>
                    {data.owner.status}
                  </Badge>
                </dd>
              </div>
            </dl>
          </AdminInfoCard>

          <AdminInfoCard title="Tác vụ" icon={Wrench}>
            <div className="space-y-2">
              {data.deletionRequestedAt && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 mb-1">
                  <p className="text-xs font-semibold text-amber-800">Yêu cầu xóa từ chủ gian hàng</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    {new Date(data.deletionRequestedAt).toLocaleString('vi-VN')}
                  </p>
                  <div className="mt-2 flex gap-1.5">
                    <Button
                      onClick={async () => {
                        setActionLoading(true);
                        try { await approveDeletion(data.id); await load(); } finally { setActionLoading(false); }
                      }}
                      disabled={actionLoading}
                      size="sm"
                      className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs"
                    >
                      Phê duyệt (ẩn)
                    </Button>
                    <Button
                      onClick={async () => {
                        setActionLoading(true);
                        try { await rejectDeletion(data.id); await load(); } finally { setActionLoading(false); }
                      }}
                      disabled={actionLoading}
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs"
                    >
                      Từ chối
                    </Button>
                  </div>
                </div>
              )}
              <Button
                onClick={toggleStatus}
                disabled={actionLoading}
                variant={data.status === 'active' ? 'default' : 'primary'}
                className="w-full"
              >
                {actionLoading
                  ? 'Đang xử lý...'
                  : data.status === 'active'
                    ? 'Vô hiệu hóa gian hàng'
                    : 'Kích hoạt gian hàng'}
              </Button>
              <Button
                onClick={() => setDeleteOpen(true)}
                variant="outline"
                className="w-full border-rose-200 text-rose-700 hover:bg-rose-50"
              >
                Xóa gian hàng
              </Button>
            </div>
          </AdminInfoCard>
        </div>
      </div>

      {deleteOpen ? (
        <DeleteStoreConfirmDialog
          storeId={data.id}
          storeName={data.name}
          onClose={() => setDeleteOpen(false)}
          onDeleted={() => {
            setDeleteOpen(false);
            window.location.href = '/admin/stores';
          }}
        />
      ) : null}
    </div>
  );
}

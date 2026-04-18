'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import DeleteStoreConfirmDialog from '../../../../../components/admin/DeleteStoreConfirmDialog';
import AdminPageHeader from '../../../../../components/admin/common/AdminPageHeader';
import InfoCard from '../../../../../components/admin/stores/InfoCard';
import StoreStatusBadge from '../../../../../components/admin/stores/StoreStatusBadge';
import {
  activateStore,
  deactivateStore,
  getAdminStore,
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
    if (!id) {
      return;
    }

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
    if (!data) {
      return;
    }

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
      <div className="space-y-6">
        <div className="h-40 animate-pulse rounded-[32px] bg-white/70" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-80 animate-pulse rounded-[32px] bg-white/70 lg:col-span-2" />
          <div className="h-80 animate-pulse rounded-[32px] bg-white/70" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-rose-700">
        <p className="font-semibold">Không thể tải chi tiết gian hàng</p>
        <p className="mt-2">{error}</p>
        <Link href="/admin/stores" className="mt-4 inline-flex text-sm font-semibold text-rose-700 underline">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white p-6 text-slate-600">
        <p className="font-semibold text-slate-900">Không tìm thấy gian hàng này.</p>
        <Link href="/admin/stores" className="mt-4 inline-flex text-sm font-semibold text-cyan-700 underline">
          Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/stores"
          className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 transition hover:text-cyan-800"
        >
          <span aria-hidden>←</span>
          Quay lại danh sách gian hàng
        </Link>
      </div>

      <AdminPageHeader
        badge="Store detail"
        title={data.name}
        description="Xem nhanh thông tin vận hành, dữ liệu liên quan và các rủi ro phát sinh trước khi tạm ẩn hoặc xóa gian hàng."
        meta={`Mã gian hàng: ${data.id}`}
        action={
          <div className="flex items-center gap-3">
            <StoreStatusBadge status={data.status} size="md" />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <InfoCard title="Thông tin gian hàng" icon="🏪">
            <dl className="space-y-5">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Mô tả
                </dt>
                <dd className="mt-2 whitespace-pre-wrap rounded-[24px] bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  {data.description ?? '—'}
                </dd>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Điện thoại
                  </dt>
                  <dd className="mt-2 text-sm text-slate-900">{data.phone ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Giờ mở cửa
                  </dt>
                  <dd className="mt-2 text-sm text-slate-900">{data.openingHours ?? '—'}</dd>
                </div>
              </div>

              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Địa chỉ
                </dt>
                <dd className="mt-2 text-sm leading-6 text-slate-700">{data.address ?? '—'}</dd>
              </div>

              <div className="grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Tạo lúc
                  </dt>
                  <dd className="mt-2 text-sm text-slate-700">
                    {new Date(data.createdAt).toLocaleString('vi-VN')}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Cập nhật
                  </dt>
                  <dd className="mt-2 text-sm text-slate-700">
                    {new Date(data.updatedAt).toLocaleString('vi-VN')}
                  </dd>
                </div>
              </div>
            </dl>
          </InfoCard>

          <InfoCard title="Phân tích ảnh hưởng khi xóa" icon="⚠️">
            <p className="text-sm leading-6 text-slate-500">
              Nếu xóa gian hàng này, các dữ liệu liên quan bên dưới sẽ bị ảnh hưởng trực tiếp.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4">
                <div className="text-3xl font-semibold text-amber-700">{data.deleteImpact.reviewCount}</div>
                <div className="mt-2 text-sm font-medium text-amber-700">Đánh giá</div>
              </div>
              <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-4">
                <div className="text-3xl font-semibold text-rose-700">{data.deleteImpact.reportCount}</div>
                <div className="mt-2 text-sm font-medium text-rose-700">Báo cáo</div>
              </div>
              <div className="rounded-[24px] border border-cyan-200 bg-cyan-50 p-4">
                <div className="text-3xl font-semibold text-cyan-700">{data.deleteImpact.locationPinCount}</div>
                <div className="mt-2 text-sm font-medium text-cyan-700">Ghim bản đồ</div>
              </div>
              <div className="rounded-[24px] border border-violet-200 bg-violet-50 p-4">
                <div className="text-3xl font-semibold text-violet-700">
                  {data.deleteImpact.pendingDraft ? '1' : '0'}
                </div>
                <div className="mt-2 text-sm font-medium text-violet-700">Bản nháp chờ duyệt</div>
              </div>
            </div>
          </InfoCard>
        </div>

        <div className="space-y-6">
          <InfoCard title="Chủ gian hàng" icon="👤">
            <dl className="space-y-4">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Tên
                </dt>
                <dd className="mt-2 text-sm font-medium text-slate-900">
                  {data.owner.fullName ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Email
                </dt>
                <dd className="mt-2 break-all text-sm text-cyan-700 underline">
                  {data.owner.email ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Điện thoại
                </dt>
                <dd className="mt-2 text-sm text-slate-700">{data.owner.phone ?? '—'}</dd>
              </div>
              <div className="border-t border-slate-200 pt-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Trạng thái tài khoản
                </dt>
                <dd className="mt-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      data.owner.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                        : 'bg-slate-100 text-slate-700 ring-1 ring-slate-200'
                    }`}
                  >
                    {data.owner.status}
                  </span>
                </dd>
              </div>
            </dl>
          </InfoCard>

          <InfoCard title="Tác vụ" icon="🛠️">
            <div className="space-y-3">
              <button
                onClick={toggleStatus}
                disabled={actionLoading}
                className={`w-full rounded-full px-4 py-3 text-sm font-semibold text-white transition ${
                  data.status === 'active'
                    ? 'bg-slate-950 hover:bg-slate-800'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                } disabled:opacity-50`}
              >
                {actionLoading
                  ? 'Đang xử lý...'
                  : data.status === 'active'
                    ? 'Vô hiệu hóa gian hàng'
                    : 'Kích hoạt gian hàng'}
              </button>
              <button
                onClick={() => setDeleteOpen(true)}
                className="w-full rounded-full border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                Xóa gian hàng
              </button>
            </div>
          </InfoCard>
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

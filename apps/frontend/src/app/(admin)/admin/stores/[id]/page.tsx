'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import DeleteStoreConfirmDialog from '../../../../../components/admin/DeleteStoreConfirmDialog';
import {
  activateStore,
  deactivateStore,
  getAdminStore,
  type AdminStoreDetail,
} from '../../../../../lib/api/admin-stores';
import StoreStatusBadge from '../../../../../components/admin/stores/StoreStatusBadge';
import InfoCard from '../../../../../components/admin/stores/InfoCard';

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
    } catch (e: unknown) {
      setError((e as any)?.response?.data?.message ?? 'Không thể tải chi tiết gian hàng.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleStatus = async () => {
    if (!data) return;
    setActionLoading(true);
    try {
      if (data.status === 'active') await deactivateStore(data.id);
      else await activateStore(data.id);
      await load();
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="mb-4 text-4xl">⏳</div>
          <p className="text-gray-600">Đang tải chi tiết gian hàng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="mb-4 text-4xl">⚠️</div>
          <p className="text-red-600">{error}</p>
          <Link href="/admin/stores" className="mt-4 inline-block text-blue-600 hover:underline">
            ← Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="mb-4 text-4xl">🔍</div>
          <p className="text-gray-600">Không tìm thấy gian hàng này.</p>
          <Link href="/admin/stores" className="mt-4 inline-block text-blue-600 hover:underline">
            ← Quay lại danh sách
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-6 shadow-sm">
        <div className="mx-auto max-w-7xl">
          <Link href="/admin/stores" className="mb-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
            ← Quay lại danh sách
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{data.name}</h1>
              <p className="mt-1 text-sm text-gray-600">ID: {data.id}</p>
            </div>
            <div className="flex items-center gap-2">
              <StoreStatusBadge status={data.status} size="md" />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Store Information */}
            <InfoCard title="📋 Thông Tin Gian Hàng" icon="🏪">
              <dl className="space-y-4">
                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-600">Mô tả</dt>
                  <dd className="mt-1 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm text-gray-900">
                    {data.description ?? '—'}
                  </dd>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-xs font-semibold uppercase text-gray-600">📞 Điện thoại</dt>
                    <dd className="mt-1 text-sm text-gray-900">{data.phone ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase text-gray-600">🕐 Giờ mở cửa</dt>
                    <dd className="mt-1 text-sm text-gray-900">{data.openingHours ?? '—'}</dd>
                  </div>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-600">📍 Địa chỉ</dt>
                  <dd className="mt-1 text-sm text-gray-900">{data.address ?? '—'}</dd>
                </div>
                <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                  <div>
                    <dt className="text-xs font-semibold uppercase text-gray-600">Tạo lúc</dt>
                    <dd className="mt-1 text-sm text-gray-600">
                      {new Date(data.createdAt).toLocaleString('vi-VN')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase text-gray-600">Cập nhật</dt>
                    <dd className="mt-1 text-sm text-gray-600">
                      {new Date(data.updatedAt).toLocaleString('vi-VN')}
                    </dd>
                  </div>
                </div>
              </dl>
            </InfoCard>

            {/* Impact Analysis */}
            <InfoCard title="📊 Phân Tích Ảnh Hưởng Xóa" icon="⚠️">
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Nếu xóa gian hàng này, các dữ liệu sau sẽ bị ảnh hưởng:
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                    <div className="text-2xl font-bold text-orange-700">{data.deleteImpact.reviewCount}</div>
                    <div className="text-xs font-medium text-orange-700">Đánh giá</div>
                  </div>
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <div className="text-2xl font-bold text-red-700">{data.deleteImpact.reportCount}</div>
                    <div className="text-xs font-medium text-red-700">Báo cáo</div>
                  </div>
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <div className="text-2xl font-bold text-blue-700">{data.deleteImpact.locationPinCount}</div>
                    <div className="text-xs font-medium text-blue-700">Ghim bản đồ</div>
                  </div>
                  <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
                    <div className="text-2xl font-bold text-purple-700">
                      {data.deleteImpact.pendingDraft ? '1' : '0'}
                    </div>
                    <div className="text-xs font-medium text-purple-700">Draft chờ</div>
                  </div>
                </div>
              </div>
            </InfoCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Owner Information */}
            <InfoCard title="👤 Chủ Gian Hàng" icon="👨‍💼">
              <dl className="space-y-3">
                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-600">Tên</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900">{data.owner.fullName ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-600">Email</dt>
                  <dd className="mt-1 break-all text-sm text-blue-600 underline">{data.owner.email ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-600">Điện thoại</dt>
                  <dd className="mt-1 text-sm text-gray-900">{data.owner.phone ?? '—'}</dd>
                </div>
                <div className="border-t border-gray-100 pt-3">
                  <dt className="text-xs font-semibold uppercase text-gray-600">Trạng thái</dt>
                  <dd className="mt-1">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        data.owner.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {data.owner.status}
                    </span>
                  </dd>
                </div>
              </dl>
            </InfoCard>

            {/* Actions */}
            <InfoCard title="⚙️ Hành Động" icon="🔧">
              <div className="space-y-2">
                <button
                  onClick={toggleStatus}
                  disabled={actionLoading}
                  className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors ${
                    data.status === 'active'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {actionLoading ? '⏳ Đang xử lý...' : data.status === 'active' ? '🔴 Vô hiệu hóa' : '🟢 Kích hoạt'}
                </button>
                <button
                  onClick={() => setDeleteOpen(true)}
                  className="w-full rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
                >
                  🗑️ Xóa gian hàng
                </button>
              </div>
            </InfoCard>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      {deleteOpen && (
        <DeleteStoreConfirmDialog
          storeId={data.id}
          storeName={data.name}
          onClose={() => setDeleteOpen(false)}
          onDeleted={() => {
            setDeleteOpen(false);
            window.location.href = '/admin/stores';
          }}
        />
      )}
    </div>
  );
}


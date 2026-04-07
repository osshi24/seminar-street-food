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

export default function AdminStoreDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [data, setData] = useState<AdminStoreDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

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
    if (data.status === 'active') await deactivateStore(data.id);
    else await activateStore(data.id);
    await load();
  };

  if (loading) return <p className="py-12 text-center text-gray-500">Đang tải...</p>;
  if (error) return <p className="py-12 text-center text-red-600">{error}</p>;
  if (!data) return <p className="py-12 text-center text-gray-500">Không có dữ liệu.</p>;

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <Link href="/admin/stores" className="text-sm text-blue-600 hover:underline">
            ← Quay lại danh sách
          </Link>
          <h1 className="mt-2 text-xl font-bold text-gray-900">{data.name}</h1>
          <p className="mt-1 text-sm text-gray-500">ID: {data.id}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleStatus}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {data.status === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt'}
          </button>
          <button
            onClick={() => setDeleteOpen(true)}
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            Xóa
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="rounded-xl border bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-800">Thông tin gian hàng</h2>
          <dl className="mt-3 grid grid-cols-1 gap-3 text-sm">
            <div>
              <dt className="text-gray-500">Trạng thái</dt>
              <dd className="font-medium text-gray-900">{data.status}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Mô tả</dt>
              <dd className="text-gray-900 whitespace-pre-wrap">{data.description ?? '—'}</dd>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <dt className="text-gray-500">SĐT</dt>
                <dd className="text-gray-900">{data.phone ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Giờ mở cửa</dt>
                <dd className="text-gray-900">{data.openingHours ?? '—'}</dd>
              </div>
            </div>
            <div>
              <dt className="text-gray-500">Địa chỉ</dt>
              <dd className="text-gray-900">{data.address ?? '—'}</dd>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <dt className="text-gray-500">Tạo lúc</dt>
                <dd className="text-gray-900">{new Date(data.createdAt).toLocaleString('vi-VN')}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Cập nhật</dt>
                <dd className="text-gray-900">{new Date(data.updatedAt).toLocaleString('vi-VN')}</dd>
              </div>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-800">Chủ gian hàng</h2>
          <dl className="mt-3 grid grid-cols-1 gap-3 text-sm">
            <div>
              <dt className="text-gray-500">Tên</dt>
              <dd className="text-gray-900">{data.owner.fullName ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Email</dt>
              <dd className="text-gray-900">{data.owner.email ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">SĐT</dt>
              <dd className="text-gray-900">{data.owner.phone ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Trạng thái</dt>
              <dd className="text-gray-900">{data.owner.status ?? '—'}</dd>
            </div>
          </dl>

          <h3 className="mt-6 text-sm font-semibold text-gray-800">Delete impact</h3>
          <div className="mt-3 rounded-lg border bg-gray-50 p-3 text-sm text-gray-700">
            <div className="grid grid-cols-2 gap-2">
              <div>Đánh giá: {data.deleteImpact.reviewCount}</div>
              <div>Báo cáo: {data.deleteImpact.reportCount}</div>
              <div>Ghim bản đồ: {data.deleteImpact.locationPinCount}</div>
              <div>Draft pending: {data.deleteImpact.pendingDraft ? 'Có' : 'Không'}</div>
            </div>
          </div>
        </div>
      </div>

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


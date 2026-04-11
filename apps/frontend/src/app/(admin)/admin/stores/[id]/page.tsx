'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import DeleteStoreConfirmDialog from '../../../../../components/admin/DeleteStoreConfirmDialog';
import {
  activateStore,
  deactivateStore,
  getAdminStore,
  type AdminStoreDetail,
} from '../../../../../lib/api/admin-stores';

export default function AdminStoreDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [data, setData] = useState<AdminStoreDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [statusLoading, setStatusLoading] = useState(false);

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
    setStatusLoading(true);
    try {
      if (data.status === 'active') await deactivateStore(data.id);
      else await activateStore(data.id);
      await load();
    } finally {
      setStatusLoading(false);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600 mb-3"></div>
        <p className="text-slate-600 text-sm">Đang tải...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="text-center max-w-sm mx-auto">
        <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-3">
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0v2m0-6v-2m0 0V7a2 2 0 012-2h.5a.5.5 0 01.5.5v.5a.5.5 0 01-.5.5H14a1 1 0 00-1 1v3m0-3V7a2 2 0 00-2-2h-.5a.5.5 0 00-.5.5v.5a.5.5 0 00.5.5H10a1 1 0 011 1v3m0 0h3m0 0h3" />
          </svg>
        </div>
        <p className="text-red-800 font-semibold text-sm mb-1">Lỗi</p>
        <p className="text-red-600 text-xs">{error}</p>
      </div>
    </div>
  );

  if (!data) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <p className="text-slate-500">Không có dữ liệu</p>
    </div>
  );

  const hasImages = data.images && data.images.length > 0;
  const currentImage = hasImages ? data.images[currentImageIndex]?.url : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <Link 
          href="/admin/stores"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Quay lại
        </Link>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Col - Image & Main Info */}
          <div className="lg:col-span-2 space-y-5">
            {/* Image Gallery Card */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {currentImage ? (
                <div className="relative w-full bg-slate-900">
                  <div className="relative w-full aspect-video">
                    <Image
                      src={currentImage}
                      alt={data.name}
                      fill
                      className="object-cover"
                      sizes="100%"
                      priority
                    />
                  </div>

                  {/* Nav Buttons */}
                  {data.images && data.images.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentImageIndex((i) => (i - 1 + data.images!.length) % data.images!.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full z-10"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setCurrentImageIndex((i) => (i + 1) % data.images!.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full z-10"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>

                      {/* Dots */}
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                        {data.images.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentImageIndex(idx)}
                            className={`rounded-full transition-all ${
                              idx === currentImageIndex ? 'bg-white w-2 h-2' : 'bg-white/50 w-1.5 h-1.5'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="w-full aspect-video bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                  <svg className="w-16 h-16 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}

              {/* Thumbnails */}
              {hasImages && data.images.length > 1 && (
                <div className="flex gap-2 p-3 bg-slate-100 overflow-x-auto">
                  {data.images.map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={() => setCurrentImageIndex(idx)}
                      className={`flex-shrink-0 h-12 w-12 rounded overflow-hidden border-2 transition-colors ${
                        idx === currentImageIndex ? 'border-blue-500' : 'border-slate-300'
                      }`}
                    >
                      <Image
                        src={img.url}
                        alt={`Ảnh ${idx + 1}`}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Store Info */}
            <div className="bg-white rounded-lg shadow-sm p-5">
              <div className="flex justify-between items-start gap-4 mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">{data.name}</h1>
                  <p className="text-xs text-slate-500 mt-1">{data.id}</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full text-white ${
                  data.status === 'active' ? 'bg-green-500' : 'bg-slate-400'
                }`}>
                  {data.status === 'active' ? 'Hoạt động' : 'Tắt'}
                </span>
              </div>

              {/* Quick Stats */}
              {true && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center p-3 bg-slate-50 rounded">
                    <p className="text-xs text-slate-600 mb-1">Điện thoại</p>
                    <p className="text-sm font-bold text-slate-900">{data.phone || '—'}</p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded">
                    <p className="text-xs text-slate-600 mb-1">Giờ mở</p>
                    <p className="text-sm font-bold text-slate-900">{data.openingHours || '—'}</p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded">
                    <p className="text-xs text-slate-600 mb-1">Ảnh</p>
                    <p className="text-sm font-bold text-slate-900">{data.images?.length || 0}</p>
                  </div>
                </div>
              )}

              {/* Description */}
              {data.description && (
                <div className="mb-4">
                  <p className="text-xs font-bold text-slate-600 mb-2 uppercase">Mô tả</p>
                  <p className="text-sm text-slate-700 line-clamp-3 bg-slate-50 p-3 rounded leading-relaxed">
                    {data.description}
                  </p>
                </div>
              )}

              {/* Address */}
              {data.address && (
                <div className="pt-4 border-t border-slate-200">
                  <p className="text-xs font-bold text-slate-600 mb-2 uppercase flex items-center gap-2">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    Địa chỉ
                  </p>
                  <p className="text-sm text-slate-700">{data.address}</p>
                </div>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <p className="text-xs text-slate-600 mb-1 font-bold">Tạo</p>
                <p className="text-sm text-slate-900">{new Date(data.createdAt).toLocaleString('vi-VN')}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4">
                <p className="text-xs text-slate-600 mb-1 font-bold">Cập nhật</p>
                <p className="text-sm text-slate-900">{new Date(data.updatedAt).toLocaleString('vi-VN')}</p>
              </div>
            </div>
          </div>

          {/* Right Col - Owner & Actions */}
          <div className="space-y-5">
            {/* Owner */}
            <div className="bg-white rounded-lg shadow-sm p-5">
              <h2 className="font-bold text-slate-900 mb-4 text-sm flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Chủ gian hàng
              </h2>
              
              <div className="space-y-2 text-xs">
                <div>
                  <p className="text-slate-600 font-bold mb-0.5">Tên</p>
                  <p className="text-slate-900">{data.owner.fullName}</p>
                </div>
                <div>
                  <p className="text-slate-600 font-bold mb-0.5">Email</p>
                  <p className="text-slate-900 break-all">{data.owner.email}</p>
                </div>
                <div>
                  <p className="text-slate-600 font-bold mb-0.5">Điện thoại</p>
                  <p className="text-slate-900">{data.owner.phone || '—'}</p>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-slate-600 font-bold mb-0.5">Trạng thái</p>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold text-white ${
                    data.owner.status === 'active' ? 'bg-green-600' :
                    data.owner.status === 'pending' ? 'bg-amber-600' : 'bg-red-600'
                  }`}>
                    {data.owner.status === 'active' ? 'Hoạt động' :
                     data.owner.status === 'pending' ? 'Chờ duyệt' : 'Từ chối'}
                  </span>
                </div>
              </div>
            </div>

            {/* Delete Impact */}
            <div className="bg-white rounded-lg shadow-sm p-5">
              <h3 className="font-bold text-slate-900 mb-3 text-sm flex items-center gap-2">
                <svg className="w-4 h-4 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0v2m0-6v-2m0 0V7a2 2 0 012-2h.5a.5.5 0 01.5.5v.5a.5.5 0 01-.5.5H14a1 1 0 00-1 1v3m0-3V7a2 2 0 00-2-2h-.5a.5.5 0 00-.5.5v.5a.5.5 0 00.5.5H10a1 1 0 011 1v3m0 0h3m0 0h3" />
                </svg>
                Tác động xóa
              </h3>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Đánh giá:</span>
                  <span className="font-bold text-slate-900">{data.deleteImpact.reviewCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Báo cáo:</span>
                  <span className="font-bold text-slate-900">{data.deleteImpact.reportCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Ghim:</span>
                  <span className="font-bold text-slate-900">{data.deleteImpact.locationPinCount}</span>
                </div>
                <div className="flex justify-between pt-1.5 border-t border-slate-200">
                  <span className="text-slate-600">Draft:</span>
                  <span className={data.deleteImpact.pendingDraft ? 'font-bold text-red-600' : 'font-bold text-green-600'}>
                    {data.deleteImpact.pendingDraft ? 'Có' : 'Không'}
                  </span>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="space-y-2">
              <button
                onClick={toggleStatus}
                disabled={statusLoading}
                className={`w-full py-2.5 rounded font-bold text-sm text-white transition-all disabled:opacity-50 ${
                  data.status === 'active' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {statusLoading ? 'Xử lý...' : (data.status === 'active' ? '⊘ Vô hiệu' : '✓ Kích hoạt')}
              </button>
              <button
                onClick={() => setDeleteOpen(true)}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded font-bold text-sm transition-all"
              >
                🗑️ Xóa
              </button>
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
            router.push('/admin/stores');
          }}
        />
      )}
    </div>
  );
}


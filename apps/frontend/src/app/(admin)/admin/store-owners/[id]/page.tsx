'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Check, X, Ban, RefreshCw } from 'lucide-react';
import {
  getStoreOwner,
  approveStoreOwner,
  rejectStoreOwner,
  deactivateStoreOwner,
  reactivateStoreOwner,
} from '../../../../../lib/api/store-owners';
import StoreOwnerDetailHeader from '../../../../../components/admin/store-owners/StoreOwnerDetailHeader';
import StoreOwnerInfoSection from '../../../../../components/admin/store-owners/StoreOwnerInfoSection';
import StoreOwnerTimeline from '../../../../../components/admin/store-owners/StoreOwnerTimeline';
import ApprovalModal from '../../../../../components/admin/store-owners/ApprovalModal';
import RejectionModal from '../../../../../components/admin/store-owners/RejectionModal';
import DeactivateModal from '../../../../../components/admin/store-owners/DeactivateModal';
import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import { Card, CardContent } from '../../../../../components/ui/card';
import type { BadgeProps } from '../../../../../components/ui/badge';
import type { StoreOwner } from '../../../../../types/store-owner';
import type { TimelineEvent } from '../../../../../components/admin/store-owners/StoreOwnerTimeline';

const STATUS_VARIANT: Record<string, NonNullable<BadgeProps['variant']>> = {
  pending: 'warning',
  active: 'success',
  inactive: 'muted',
  rejected: 'danger',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Chờ duyệt',
  active: 'Đang hoạt động',
  inactive: 'Vô hiệu hóa',
  rejected: 'Đã từ chối',
};

export default function StoreOwnerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [storeOwner, setStoreOwner] = useState<StoreOwner | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const [modals, setModals] = useState({
    approval: false,
    rejection: false,
    deactivate: false,
  });
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    loadStoreOwner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadStoreOwner() {
    setLoading(true);
    try {
      const result = await getStoreOwner(id);
      setStoreOwner(result.data);
    } finally {
      setLoading(false);
    }
  }

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleApprove() {
    setActionLoading(true);
    try {
      const result = await approveStoreOwner(id);
      setStoreOwner(result.data as StoreOwner);
      setModals({ ...modals, approval: false });
      showToast('Đã phê duyệt tài khoản thành công', 'success');
    } catch {
      showToast('Lỗi khi phê duyệt tài khoản', 'error');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReject() {
    setActionLoading(true);
    try {
      const result = await rejectStoreOwner(id, rejectReason.trim());
      setStoreOwner(result.data as StoreOwner);
      setModals({ ...modals, rejection: false });
      setRejectReason('');
      showToast('Đã từ chối tài khoản', 'success');
    } catch {
      showToast('Lỗi khi từ chối tài khoản', 'error');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeactivate() {
    setActionLoading(true);
    try {
      const result = await deactivateStoreOwner(id, true);
      setStoreOwner(result.data as StoreOwner);
      setModals({ ...modals, deactivate: false });
      showToast('Đã vô hiệu hóa tài khoản', 'success');
    } catch {
      showToast('Lỗi khi vô hiệu hóa tài khoản', 'error');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReactivate() {
    setActionLoading(true);
    try {
      const result = await reactivateStoreOwner(id);
      setStoreOwner(result.data as StoreOwner);
      showToast('Đã kích hoạt lại tài khoản', 'success');
    } catch {
      showToast('Lỗi khi kích hoạt lại tài khoản', 'error');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-cyan-600" />
      </div>
    );
  }

  if (!storeOwner) {
    return (
      <Card className="border-rose-200 bg-rose-50">
        <CardContent className="p-5 text-sm font-medium text-rose-700">
          Không tìm thấy tài khoản
        </CardContent>
      </Card>
    );
  }

  const timelineEvents: TimelineEvent[] = [
    {
      icon: '📝',
      label: 'Đã đăng ký',
      description: 'Yêu cầu tạo tài khoản được gửi',
      timestamp: storeOwner.createdAt,
      color: 'blue',
    },
    ...(storeOwner.status === 'active' || storeOwner.status === 'rejected'
      ? [
          {
            icon: storeOwner.status === 'active' ? '✓' : '✗',
            label: storeOwner.status === 'active' ? 'Đã phê duyệt' : 'Đã từ chối',
            description:
              storeOwner.status === 'active'
                ? 'Tài khoản được kích hoạt'
                : 'Yêu cầu bị từ chối',
            timestamp: storeOwner.updatedAt,
            color: (storeOwner.status === 'active' ? 'green' : 'red') as 'green' | 'red',
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-5">
      {toast && (
        <div
          className={`fixed right-4 top-4 z-50 rounded-md px-4 py-2.5 text-sm font-medium text-white shadow-lg ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          {toast.message}
        </div>
      )}

      <StoreOwnerDetailHeader
        owner={storeOwner}
        onBack={() => router.push('/admin/store-owners')}
      />

      <div className="flex flex-wrap gap-2">
        {storeOwner.status === 'pending' && (
          <>
            <Button
              onClick={() => setModals({ ...modals, approval: true })}
              disabled={actionLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Check />
              Phê duyệt
            </Button>
            <Button
              onClick={() => setModals({ ...modals, rejection: true })}
              disabled={actionLoading}
              variant="destructive"
            >
              <X />
              Từ chối
            </Button>
          </>
        )}
        {storeOwner.status === 'active' && (
          <Button
            onClick={() => setModals({ ...modals, deactivate: true })}
            disabled={actionLoading}
            className="bg-amber-600 hover:bg-amber-700"
          >
            <Ban />
            Vô hiệu hóa
          </Button>
        )}
        {storeOwner.status === 'inactive' && (
          <Button onClick={handleReactivate} disabled={actionLoading} variant="primary">
            <RefreshCw />
            Kích hoạt lại
          </Button>
        )}
      </div>

      <StoreOwnerInfoSection title="Thông tin cá nhân">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Họ và tên</dt>
            <dd className="mt-1 text-sm text-slate-900">{storeOwner.fullName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</dt>
            <dd className="mt-1 text-sm text-slate-900">{storeOwner.email}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Điện thoại</dt>
            <dd className="mt-1 text-sm text-slate-900">{storeOwner.phone || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Trạng thái</dt>
            <dd className="mt-1">
              <Badge variant={STATUS_VARIANT[storeOwner.status]}>
                {STATUS_LABEL[storeOwner.status]}
              </Badge>
            </dd>
          </div>
        </dl>
      </StoreOwnerInfoSection>

      {storeOwner.stores && storeOwner.stores.length > 0 && (
        <StoreOwnerInfoSection title={`Gian hàng (${storeOwner.stores.length}/3)`}>
          <div className="space-y-3">
            {storeOwner.stores.map((store) => (
              <div key={store.id} className="rounded-lg border border-slate-200 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-900">{store.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    store.approvalStatus === 'approved' ? 'bg-green-100 text-green-800' :
                    store.approvalStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {store.approvalStatus === 'approved' ? 'Đã duyệt' : store.approvalStatus === 'pending' ? 'Chờ duyệt' : 'Từ chối'}
                  </span>
                </div>
                {store.address && <p className="mt-1 text-xs text-slate-500">{store.address}</p>}
                <a
                  href={`/admin/stores/${store.id}`}
                  className="mt-2 inline-flex text-xs font-medium text-cyan-700 hover:underline"
                >
                  Xem chi tiết →
                </a>
              </div>
            ))}
          </div>
        </StoreOwnerInfoSection>
      )}

      <StoreOwnerInfoSection title="Thông tin đăng ký">
        <div className="space-y-4">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Ngày đăng ký</dt>
            <dd className="mt-1 text-sm text-slate-900">
              {new Date(storeOwner.createdAt).toLocaleDateString('vi-VN')} lúc{' '}
              {new Date(storeOwner.createdAt).toLocaleTimeString('vi-VN')}
            </dd>
          </div>
          {storeOwner.registrationReason && (
            <div className="rounded-md border border-cyan-200 bg-cyan-50 p-3">
              <dt className="text-xs font-medium uppercase tracking-wide text-cyan-700">
                Lý do đăng ký
              </dt>
              <dd className="mt-1 text-sm text-cyan-900">{storeOwner.registrationReason}</dd>
            </div>
          )}
        </div>
      </StoreOwnerInfoSection>

      <StoreOwnerTimeline events={timelineEvents} />

      <ApprovalModal
        isOpen={modals.approval}
        isLoading={actionLoading}
        storeOwnerName={storeOwner.fullName}
        onApprove={handleApprove}
        onCancel={() => setModals({ ...modals, approval: false })}
      />

      <RejectionModal
        isOpen={modals.rejection}
        isLoading={actionLoading}
        storeOwnerName={storeOwner.fullName}
        onReject={handleReject}
        onCancel={() => {
          setModals({ ...modals, rejection: false });
          setRejectReason('');
        }}
      />

      <DeactivateModal
        isOpen={modals.deactivate}
        isLoading={actionLoading}
        storeOwnerName={storeOwner.fullName}
        storeName={storeOwner.stores?.[0]?.name}
        onConfirm={handleDeactivate}
        onCancel={() => setModals({ ...modals, deactivate: false })}
      />
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Store } from 'lucide-react';
import { getMyStores, type StoreListItem } from '../../../../lib/api/stores';
import StoreOwnerStoreCard from '../../../../components/stores/StoreOwnerStoreCard';
import StoreCreateModal from '../../../../components/stores/StoreCreateModal';
import StoreOwnerPageHeader from '../../../../components/dashboard/common/StoreOwnerPageHeader';
import StoreOwnerEmptyState from '../../../../components/dashboard/common/StoreOwnerEmptyState';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent } from '../../../../components/ui/card';

const MAX_STORES = 3;

export default function StoresPage() {
  const [stores, setStores] = useState<StoreListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyStores();
      const storesList = Array.isArray(res) ? res : res.data || [];
      setStores(storesList);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleStoreCreated = () => {
    setShowCreateModal(false);
    load();
  };

  const maxStoresReached = stores.length >= MAX_STORES;

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-20 animate-pulse rounded-xl bg-white" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-xl bg-white" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <StoreOwnerPageHeader
        badge="Gian hàng"
        title="Gian hàng của tôi"
        description="Quản lý thông tin, hình ảnh và menu cho từng gian hàng (tối đa 3 gian hàng / tài khoản)."
        meta={
          stores.length > 0 ? (
            <span>
              Đang quản lý <span className="font-semibold text-slate-700">{stores.length}</span> /{' '}
              {MAX_STORES} gian hàng
            </span>
          ) : null
        }
        action={
          !maxStoresReached ? (
            <Button
              variant="primary"
              className="bg-orange-500 hover:bg-orange-600"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus />
              Thêm gian hàng
            </Button>
          ) : null
        }
      />

      {stores.length === 0 ? (
        <StoreOwnerEmptyState
          icon={Store}
          title="Chưa có gian hàng nào"
          description="Bắt đầu hành trình kinh doanh của bạn bằng cách tạo gian hàng đầu tiên ngay bây giờ."
          action={
            <Button
              variant="primary"
              className="bg-orange-500 hover:bg-orange-600"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus />
              Tạo gian hàng đầu tiên
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stores.map((store) => (
            <StoreOwnerStoreCard key={store.id} store={store} />
          ))}
        </div>
      )}

      {maxStoresReached && stores.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-start gap-3 p-4">
            <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-700">
              <Store className="h-4 w-4" />
            </div>
            <div className="text-sm text-amber-800">
              <p className="font-semibold">Đã đạt giới hạn {MAX_STORES} gian hàng</p>
              <p className="mt-0.5 text-amber-700">
                Vui lòng xoá một gian hàng nếu bạn muốn tạo gian hàng mới.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <StoreCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleStoreCreated}
      />
    </div>
  );
}

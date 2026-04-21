'use client';

import { AdminStoreStatus } from '@/lib/api/admin-stores';
import { Badge } from '../../ui/badge';

interface StoreStatusBadgeProps {
  status: AdminStoreStatus;
  size?: 'sm' | 'md';
}

export default function StoreStatusBadge({ status }: StoreStatusBadgeProps) {
  if (status === 'active') {
    return <Badge variant="success">Đang hoạt động</Badge>;
  }
  return <Badge variant="muted">Vô hiệu hóa</Badge>;
}

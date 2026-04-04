import { Suspense } from 'react';
import StoreOwnersClient from './StoreOwnersClient';

export default function StoreOwnersListPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-gray-500">Đang tải...</div>}>
      <StoreOwnersClient />
    </Suspense>
  );
}

import { Suspense } from 'react';
import StoresClient from './StoresClient';

export default function AdminStoresPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-gray-500">Đang tải...</div>}>
      <StoresClient />
    </Suspense>
  );
}


import { Suspense } from 'react';
import LocationPinsClient from './LocationPinsClient';

export default function AdminLocationPinsPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-gray-500">Đang tải...</div>}>
      <LocationPinsClient />
    </Suspense>
  );
}

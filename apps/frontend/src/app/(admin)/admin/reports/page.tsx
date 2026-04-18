import { Suspense } from 'react';
import ReportsClient from './ReportsClient';

export default function AdminReportsPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-gray-500">Đang tải...</div>}>
      <ReportsClient />
    </Suspense>
  );
}

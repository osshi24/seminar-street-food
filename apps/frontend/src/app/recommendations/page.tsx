import { Suspense } from 'react';
import RecommendationsClient from './RecommendationsClient';

export default function RecommendationsPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-gray-500">Đang tải...</div>}>
      <RecommendationsClient />
    </Suspense>
  );
}

'use client';

import type { Pagination as PaginationData, RecommendationItem } from '../../lib/api/recommendations';
import RecommendationCard from './RecommendationCard';
import EmptyState from './EmptyState';
import Pagination from './Pagination';

interface Props {
  items: RecommendationItem[];
  pagination: PaginationData;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export default function RecommendationList({ items, pagination, onPageChange, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <RecommendationCard key={item.menuItemId} item={item} />
      ))}
      <Pagination pagination={pagination} onPageChange={onPageChange} />
    </div>
  );
}

import Link from 'next/link';
import type { RecommendationItem } from '../../lib/api/recommendations';

interface Props {
  item: RecommendationItem;
}

function formatVND(price: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

export default function RecommendationCard({ item }: Props) {
  return (
    <Link
      href={`/stores/${item.storeId}`}
      className="block rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md hover:border-orange-200 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-gray-800">{item.menuItemName}</h3>
          <p className="mt-0.5 truncate text-sm text-gray-500">{item.storeName}</p>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="font-semibold text-orange-600">{formatVND(item.price)}</p>
          <span className="mt-1 inline-block rounded-full bg-orange-50 px-2 py-0.5 text-xs text-orange-600">
            {item.matchCount} khớp
          </span>
        </div>
      </div>
    </Link>
  );
}

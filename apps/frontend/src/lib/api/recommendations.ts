import { getApiUrl } from './config';
const API_URL = getApiUrl();

export interface RecommendationItem {
  menuItemId: string;
  menuItemName: string;
  price: number;
  storeId: string;
  storeName: string;
  matchCount: number;
}

export interface Pagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface RecommendationsResponse {
  items: RecommendationItem[];
  pagination: Pagination;
}

export async function fetchRecommendations(
  tagIds: number[],
  page: number,
): Promise<RecommendationsResponse> {
  const params = new URLSearchParams({
    tags: tagIds.join(','),
    page: String(page),
  });
  const res = await fetch(`${API_URL}/recommendations?${params.toString()}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Không thể tải gợi ý món ăn.');
  return res.json() as Promise<RecommendationsResponse>;
}

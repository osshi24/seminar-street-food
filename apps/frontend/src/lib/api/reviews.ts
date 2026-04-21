import type { ReviewListResponse } from '../../types/review';

const API = '/api/backend';

export async function listReviews(
  storeId: string,
  page = 1,
  limit = 20,
  filters?: { stars?: number; sort?: 'asc' | 'desc' },
): Promise<ReviewListResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (filters?.stars) params.set('stars', String(filters.stars));
  if (filters?.sort) params.set('sort', filters.sort);
  const res = await fetch(`${API}/stores/${storeId}/reviews?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch reviews');
  const json = await res.json() as { data: ReviewListResponse };
  return json.data;
}

export async function submitReview(
  storeId: string,
  dto: { stars: number; content?: string },
  token: string,
): Promise<void> {
  const res = await fetch(`${API}/stores/${storeId}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error('Failed to submit review'), { status: res.status, body });
  }
}

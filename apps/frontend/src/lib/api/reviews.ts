import type { ReviewListResponse } from '../../types/review';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export async function listReviews(
  storeId: string,
  page = 1,
  limit = 20,
): Promise<ReviewListResponse> {
  const res = await fetch(`${API}/stores/${storeId}/reviews?page=${page}&limit=${limit}`);
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

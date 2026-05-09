import { getApiUrl } from './config';
import apiClient from './client';

export interface AnalyticsSummary {
  qrScans: { total: number; today: number; thisWeek: number };
  storeVisits: { total: number; today: number; thisWeek: number };
  reviews: { total: number; avgRating: number };
  daily: { date: string; qrScans: number; storeVisits: number }[];
}

export function trackStoreVisit(storeId: string): void {
  fetch(`${getApiUrl()}/public/analytics/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ storeId, eventType: 'store_visit' }),
    keepalive: true,
  }).catch(() => {});
}

export async function getStoreAnalytics(storeId: string): Promise<AnalyticsSummary> {
  const res = await apiClient.get<{ data: AnalyticsSummary }>(
    `/store-owner/stores/${storeId}/analytics`,
  );
  return res.data.data;
}

import type { ReportReason } from '../../types/report';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export async function fetchReportReasons(): Promise<ReportReason[]> {
  const res = await fetch(`${API}/report-reasons`);
  if (!res.ok) throw new Error('Failed to fetch report reasons');
  return res.json();
}

export async function submitReport(
  storeId: string,
  reviewId: string,
  dto: { reasonId: number },
  token: string,
): Promise<void> {
  const res = await fetch(`${API}/stores/${storeId}/reviews/${reviewId}/report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error('Failed to submit report'), { status: res.status, body });
  }
}

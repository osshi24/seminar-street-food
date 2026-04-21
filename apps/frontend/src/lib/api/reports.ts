import type { ReportReason } from '../../types/report';
import apiClient from './client';

import { getApiUrl } from './config';
const API = getApiUrl();

export async function fetchReportReasons(): Promise<ReportReason[]> {
  const res = await fetch(`${API}/report-reasons`);
  if (!res.ok) throw new Error('Failed to fetch report reasons');
  const json = await res.json();
  // Backend có thể trả { data: [...] } hoặc thẳng array
  return Array.isArray(json) ? json : (json.data ?? []);
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

// Admin functions
export interface AdminReport {
  id: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
  resolvedAt?: string;
  reason?: { id: number; labelVi: string } | null;
  reporter?: { id: string; fullName: string } | null;
  review?: {
    id: string;
    stars: number;
    content: string | null;
    isHidden: boolean;
    customer?: { displayName: string } | null;
    store?: { id: string; name: string } | null;
  } | null;
}

export interface AdminReportsListResponse {
  data: AdminReport[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function listAdminReports(params?: {
  status?: string;
  storeId?: string;
  page?: number;
  limit?: number;
}): Promise<AdminReportsListResponse> {
  const response = await apiClient.get('/admin/reports', { params });
  return response.data;
}

export async function resolveReport(
  id: string,
  action: 'hide' | 'delete',
): Promise<{ message: string }> {
  const response = await apiClient.patch(`/admin/reports/${id}/resolve`, { action });
  return response.data;
}

export async function dismissReport(id: string): Promise<{ message: string }> {
  const response = await apiClient.patch(`/admin/reports/${id}/dismiss`);
  return response.data;
}

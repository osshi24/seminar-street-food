// Browser-only (uses document.cookie); always use proxy path
const API_URL = '/api/backend';

export interface CreateQrResponse {
  id: number;
  storeId: string;
  token: string;
  isActive: boolean;
  createdAt: string;
  qrImageUrl: string;
  scanUrl: string;
}

function getToken(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.split(';').find((c) => c.trim().startsWith('access_token='));
  return match ? decodeURIComponent(match.trim().slice('access_token='.length)) : '';
}

export async function createQr(storeId: string): Promise<CreateQrResponse> {
  const res = await fetch(`${API_URL}/store-owner/stores/${storeId}/qr`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? 'Không thể tạo QR code.');
  }
  return res.json() as Promise<CreateQrResponse>;
}

export async function getActiveQr(storeId: string): Promise<CreateQrResponse | null> {
  const res = await fetch(`${API_URL}/store-owner/stores/${storeId}/qr`, {
    headers: { Authorization: `Bearer ${getToken()}` },
    credentials: 'include',
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? 'Không thể tải QR code.');
  }

  return res.json() as Promise<CreateQrResponse>;
}

export async function downloadQrPng(storeId: string): Promise<Blob> {
  const res = await fetch(`${API_URL}/store-owner/stores/${storeId}/qr/png`, {
    headers: { Authorization: `Bearer ${getToken()}` },
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Không thể tải QR PNG.');
  return res.blob();
}

export async function downloadQrPdf(storeId: string): Promise<Blob> {
  const res = await fetch(`${API_URL}/store-owner/stores/${storeId}/qr/pdf`, {
    headers: { Authorization: `Bearer ${getToken()}` },
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Không thể tải QR PDF.');
  return res.blob();
}

export type QrResolveResult =
  | { type: 'store'; storeId: string }
  | { type: 'boundary'; boundary: { id: string; name: string; coordinates: { lat: number; lng: number }[] } }
  | { type: 'unavailable' };

export async function resolveQrToken(token: string): Promise<QrResolveResult> {
  const res = await fetch(`${API_URL}/qr/${token}/resolve`);
  if (!res.ok) return { type: 'unavailable' };
  const data = await res.json();
  return (data?.data ?? data) as QrResolveResult;
}

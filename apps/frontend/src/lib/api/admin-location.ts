import apiClient from './client';

export interface AdminLocationPin {
  id: string;
  storeId: string;
  store?: { id: string; name: string };
  latitude: number;
  longitude: number;
  status: 'pending' | 'approved' | 'rejected' | 'superseded';
  rejectionReason: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  hasDuplicateWarning?: boolean;
}

export interface NearbyPin {
  storeId: string;
  storeName: string;
  distanceMeters: number;
  latitude: number;
  longitude: number;
}

export interface Boundary {
  id: string;
  name: string;
  polygonCoordinates: { lat: number; lng: number }[];
  isActive: boolean;
}

export async function listPins(params?: { status?: string; page?: number; limit?: number }) {
  const res = await apiClient.get<{ data: { data: AdminLocationPin[]; total: number; page: number; limit: number } }>(
    '/admin/location-pins',
    { params },
  );
  return res.data.data;
}

export async function getPinDetail(id: string) {
  const res = await apiClient.get<{
    data: { pin: AdminLocationPin; currentApproved: AdminLocationPin | null; duplicateWarnings: NearbyPin[] };
  }>(`/admin/location-pins/${id}`);
  return res.data.data;
}

export async function approvePin(id: string, body: { lat?: number; lng?: number }) {
  await apiClient.patch(`/admin/location-pins/${id}/approve`, body);
}

export async function rejectPin(id: string, body: { reason: string }) {
  await apiClient.patch(`/admin/location-pins/${id}/reject`, body);
}

export async function deletePin(id: string) {
  await apiClient.delete(`/admin/location-pins/${id}`);
}

export async function listBoundaries(): Promise<Boundary[]> {
  const res = await apiClient.get<{ data: Boundary[] }>('/admin/boundaries');
  return res.data.data ?? [];
}

export async function getBoundaryById(id: string): Promise<Boundary> {
  const res = await apiClient.get<{ data: Boundary }>(`/admin/boundaries/${id}`);
  return res.data.data;
}

export async function createBoundary(body: { name?: string; coordinates: { lat: number; lng: number }[]; isActive?: boolean }) {
  const res = await apiClient.post<{ data: Boundary }>('/admin/boundaries', body);
  return res.data.data;
}

export async function updateBoundaryById(
  id: string,
  body: { name?: string; coordinates?: { lat: number; lng: number }[]; isActive?: boolean },
) {
  const res = await apiClient.put<{ data: Boundary }>(`/admin/boundaries/${id}`, body);
  return res.data.data;
}

export async function deleteBoundaryById(id: string): Promise<void> {
  await apiClient.delete(`/admin/boundaries/${id}`);
}

import apiClient from './client';

export interface LocationPin {
  id: string;
  storeId: string;
  latitude: number;
  longitude: number;
  status: 'pending' | 'approved' | 'rejected' | 'superseded';
  submittedAt: string;
  reviewedAt: string | null;
}

export async function getMyLocation(storeId: string): Promise<{ approved: LocationPin | null; pending: LocationPin | null }> {
  const res = await apiClient.get<{ data: { approved: LocationPin | null; pending: LocationPin | null } }>(
    `/store-owner/stores/${storeId}/location`,
  );
  return res.data.data;
}

export async function submitLocation(storeId: string, lat: number, lng: number): Promise<LocationPin> {
  const res = await apiClient.post<{ data: LocationPin }>(`/store-owner/stores/${storeId}/location`, { lat, lng });
  return res.data.data;
}

export async function revokePending(storeId: string): Promise<void> {
  await apiClient.delete(`/store-owner/stores/${storeId}/location/pending`);
}

export interface ActiveBoundary {
  id: string;
  name: string;
  polygonCoordinates: { lat: number; lng: number }[];
}

export async function listActiveBoundaries(): Promise<ActiveBoundary[]> {
  const res = await apiClient.get<{ data: ActiveBoundary[] }>('/store-owner/location/boundaries');
  return res.data.data ?? [];
}

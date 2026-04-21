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

export interface StoreLocationSummary {
  storeId: string;
  storeName: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  approved: LocationPin | null;
  pending: LocationPin | null;
}

export async function getAllStoresLocation(): Promise<StoreLocationSummary[]> {
  const res = await apiClient.get<{ data: StoreLocationSummary[] }>('/store-owner/location/all');
  return res.data.data;
}

export async function getMyLocation(storeId: string): Promise<{ approved: LocationPin | null; pending: LocationPin | null }> {
  const res = await apiClient.get<{ data: { approved: LocationPin | null; pending: LocationPin | null } }>(
    '/store-owner/location',
    { params: { storeId } },
  );
  return res.data.data;
}

export async function submitLocation(storeId: string, lat: number, lng: number): Promise<LocationPin> {
  const res = await apiClient.post<{ data: LocationPin }>(
    '/store-owner/location',
    { lat, lng },
    { params: { storeId } },
  );
  return res.data.data;
}

export async function revokePending(storeId: string): Promise<void> {
  await apiClient.delete('/store-owner/location/pending', { params: { storeId } });
}

export async function getActiveBoundary(): Promise<{ polygonCoordinates: { lat: number; lng: number }[] } | null> {
  const res = await apiClient.get<{ data: { polygonCoordinates: { lat: number; lng: number }[] } | null }>(
    '/store-owner/location/boundary',
  );
  return res.data.data;
}

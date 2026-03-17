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

export async function getMyLocation(): Promise<{ approved: LocationPin | null; pending: LocationPin | null }> {
  const res = await apiClient.get<{ data: { approved: LocationPin | null; pending: LocationPin | null } }>(
    '/store-owner/location',
  );
  return res.data.data;
}

export async function submitLocation(lat: number, lng: number): Promise<LocationPin> {
  const res = await apiClient.post<{ data: LocationPin }>('/store-owner/location', { lat, lng });
  return res.data.data;
}

export async function revokePending(): Promise<void> {
  await apiClient.delete('/store-owner/location/pending');
}

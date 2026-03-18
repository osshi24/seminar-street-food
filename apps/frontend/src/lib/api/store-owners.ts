import apiClient from './client';
import type { StoreOwner, StoreOwnerStatus } from '../../types/store-owner';

interface ListStoreOwnersParams {
  status?: StoreOwnerStatus;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

interface ListStoreOwnersResponse {
  data: {
    data: StoreOwner[];
    total: number;
    page: number;
    limit: number;
  };
}

export async function listStoreOwners(params?: ListStoreOwnersParams): Promise<ListStoreOwnersResponse> {
  const response = await apiClient.get<ListStoreOwnersResponse>('/admin/store-owners', { params });
  return response.data;
}

export async function getStoreOwner(id: string): Promise<{ data: StoreOwner }> {
  const response = await apiClient.get<{ data: StoreOwner }>(`/admin/store-owners/${id}`);
  return response.data;
}

export async function approveStoreOwner(id: string): Promise<{ data: StoreOwner }> {
  const response = await apiClient.patch<{ data: StoreOwner }>(`/admin/store-owners/${id}/approve`);
  return response.data;
}

export async function rejectStoreOwner(id: string, reason: string): Promise<{ data: StoreOwner }> {
  const response = await apiClient.patch<{ data: StoreOwner }>(`/admin/store-owners/${id}/reject`, { reason });
  return response.data;
}

export async function deactivateStoreOwner(
  id: string,
  confirmed?: boolean,
): Promise<{ data: StoreOwner | { hasPendingContent: boolean } }> {
  const response = await apiClient.patch<{ data: StoreOwner | { hasPendingContent: boolean } }>(
    `/admin/store-owners/${id}/deactivate`,
    {},
    { params: confirmed ? { confirmed: 'true' } : undefined },
  );
  return response.data;
}

export async function reactivateStoreOwner(id: string): Promise<{ data: StoreOwner }> {
  const response = await apiClient.patch<{ data: StoreOwner }>(`/admin/store-owners/${id}/reactivate`);
  return response.data;
}

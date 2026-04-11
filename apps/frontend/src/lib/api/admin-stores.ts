import apiClient from './client';

export type AdminStoreStatus = 'active' | 'inactive';

export interface AdminStoreListItem {
  id: string;
  name: string;
  status: AdminStoreStatus;
  owner: {
    id: string;
    email: string;
    fullName: string;
  };
  createdAt: string;
  thumbnailUrl?: string | null;
}

export interface ListAdminStoresParams {
  page?: number;
  limit?: number;
  status?: AdminStoreStatus;
  search?: string;
  sortBy?: 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
  createdFrom?: string;
  createdTo?: string;
}

export async function listAdminStores(params?: ListAdminStoresParams): Promise<{
  data: {
    items: AdminStoreListItem[];
    total: number;
    page: number;
    limit: number;
  };
}> {
  const res = await apiClient.get('/admin/stores', { params });
  return res.data;
}

export async function activateStore(id: string): Promise<{ data: { id: string; status: AdminStoreStatus } }> {
  const res = await apiClient.patch(`/admin/stores/${id}/activate`);
  return res.data;
}

export async function deactivateStore(id: string): Promise<{ data: { id: string; status: AdminStoreStatus } }> {
  const res = await apiClient.patch(`/admin/stores/${id}/deactivate`);
  return res.data;
}

export interface DeleteImpact {
  storeId: string;
  reviewCount: number;
  reportCount: number;
  pendingDraft: boolean;
  locationPinCount: number;
  hasRelatedData: boolean;
}

export interface AdminStoreDetail {
  id: string;
  name: string;
  status: AdminStoreStatus;
  description: string | null;
  phone: string | null;
  address: string | null;
  openingHours: string | null;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    email: string;
    fullName: string;
    phone: string;
    status: string;
  };
  images?: Array<{ id: string; url: string; orderIndex: number }>;
  deleteImpact: DeleteImpact;
}

export async function getDeleteImpact(id: string): Promise<{ data: DeleteImpact }> {
  const res = await apiClient.get(`/admin/stores/${id}/delete-impact`);
  return res.data;
}

export async function getAdminStore(id: string): Promise<{ data: AdminStoreDetail }> {
  const res = await apiClient.get(`/admin/stores/${id}`);
  return res.data;
}

export async function deleteStore(id: string, confirmed?: boolean): Promise<void> {
  await apiClient.delete(`/admin/stores/${id}`, { data: { confirmed: Boolean(confirmed) } });
}


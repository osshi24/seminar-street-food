import apiClient from './client';

export interface UpdateStoreDto {
  name: string;
  description?: string;
  phone?: string;
  address?: string;
  openingHours?: string;
  socialLinks?: { facebook?: string; instagram?: string; tiktok?: string };
}

export interface StoreListItem {
  id: string;
  name: string;
  description?: string | null;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  status: 'active' | 'inactive';
  thumbnailUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMenuItemDto {
  name: string;
  description?: string;
  price: number;
}

export interface UpdateMenuItemDto {
  name?: string;
  description?: string;
  price?: number;
  tagIds?: number[];
}

export interface UpdateStoreInfoDto {
  phone?: string;
  address?: string;
  openingHours?: string;
  socialLinks?: { facebook?: string; instagram?: string; tiktok?: string };
}

export interface StoreImageItem {
  id: string;
  url: string;
  s3Key: string;
  orderIndex: number;
  isInDraft: boolean;
}

// --- Per-store menu items ---

export async function getMenuItemsByStoreId(storeId: string) {
  const res = await apiClient.get(`/store-owner/stores/${storeId}/menu-items`);
  return res.data;
}

export async function addMenuItemByStoreId(storeId: string, dto: CreateMenuItemDto) {
  const res = await apiClient.post(`/store-owner/stores/${storeId}/menu-items`, dto);
  return res.data;
}

export async function updateMenuItemByStoreId(storeId: string, id: string, dto: UpdateMenuItemDto) {
  const res = await apiClient.put(`/store-owner/stores/${storeId}/menu-items/${id}`, dto);
  return res.data;
}

export async function removeMenuItemByStoreId(storeId: string, id: string) {
  const res = await apiClient.delete(`/store-owner/stores/${storeId}/menu-items/${id}`);
  return res.data;
}

export async function generateMenuItemImageUploadUrlByStoreId(
  storeId: string,
  menuItemId: string,
  contentType: string,
) {
  const res = await apiClient.post<{ data: { presignedUrl: string; imageUrl: string } }>(
    `/store-owner/stores/${storeId}/menu-items/${menuItemId}/image`,
    { contentType },
  );
  return res.data.data ?? res.data;
}

export async function deleteMenuItemImageByStoreId(storeId: string, menuItemId: string) {
  const res = await apiClient.delete(`/store-owner/stores/${storeId}/menu-items/${menuItemId}/image`);
  return res.data;
}

// --- Multiple Stores API ---

export async function requestStoreDeletion(storeId: string) {
  const res = await apiClient.post(`/store-owner/stores/${storeId}/deletion-request`);
  return res.data;
}

export async function revokeStoreDeletionRequest(storeId: string) {
  const res = await apiClient.delete(`/store-owner/stores/${storeId}/deletion-request`);
  return res.data;
}

export async function getMyStores() {
  const res = await apiClient.get('/store-owner/stores');
  return res.data;
}

export async function createStore(dto: UpdateStoreDto) {
  const res = await apiClient.post('/store-owner/stores', dto);
  return res.data;
}

export async function getStoreById(storeId: string) {
  const res = await apiClient.get(`/store-owner/stores/${storeId}`);
  return res.data;
}

export async function updateStoreInfoById(storeId: string, dto: UpdateStoreInfoDto) {
  const res = await apiClient.patch(`/store-owner/stores/${storeId}/info`, dto);
  return res.data;
}

export async function toggleStoreStatus(storeId: string, active: boolean) {
  const res = await apiClient.patch(`/store-owner/stores/${storeId}/status`, { active });
  return res.data;
}

export interface StoreDraft {
  id: string;
  storeId: string;
  name: string;
  description?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string | null;
  submittedAt?: string | null;
  reviewedAt?: string | null;
}

export async function saveDraftById(storeId: string, dto: { name: string; description?: string }) {
  const res = await apiClient.put(`/store-owner/stores/${storeId}/draft`, dto);
  return res.data;
}

export async function submitDraftById(storeId: string) {
  const res = await apiClient.post(`/store-owner/stores/${storeId}/draft/submit`);
  return res.data;
}

export async function revokeDraftById(storeId: string) {
  const res = await apiClient.delete(`/store-owner/stores/${storeId}/draft`);
  return res.data;
}

export async function getDraftById(storeId: string) {
  const res = await apiClient.get<{ data: StoreDraft }>(`/store-owner/stores/${storeId}/draft`);
  return res.data.data ?? (res.data as unknown as StoreDraft);
}

export async function generateImageUploadUrlById(storeId: string, contentType: string) {
  const res = await apiClient.post<{ data: { presignedUrl: string; s3Key: string; imageId: string } }>(
    `/store-owner/stores/${storeId}/images`,
    { contentType },
  );
  return res.data.data ?? (res.data as unknown as { presignedUrl: string; s3Key: string; imageId: string });
}

export async function confirmImageUploadById(storeId: string, imageId: string) {
  const res = await apiClient.patch(`/store-owner/stores/${storeId}/images/${imageId}/confirm`);
  return res.data;
}

export async function deleteStoreImageById(storeId: string, imageId: string) {
  await apiClient.delete(`/store-owner/stores/${storeId}/images/${imageId}`);
}

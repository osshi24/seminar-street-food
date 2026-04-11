import apiClient from './client';

// ─── DTOs ──────────────────────────────────────────────────────

export interface CreateStoreDto {
  name: string;
  description?: string;
}

export interface UpdateStoreDto {
  name: string;
  description?: string;
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

// ─── Store list & create ───────────────────────────────────────

export async function getMyStores() {
  const res = await apiClient.get('/store-owner/stores');
  return res.data;
}

export async function createStore(dto: CreateStoreDto) {
  const res = await apiClient.post('/store-owner/stores', dto);
  return res.data;
}

export async function deleteStore(storeId: string) {
  const res = await apiClient.delete(`/store-owner/stores/${storeId}`);
  return res.data;
}

export async function renameStore(storeId: string, name: string) {
  const res = await apiClient.patch(`/store-owner/stores/${storeId}/rename`, { name });
  return res.data;
}

// ─── Store detail ──────────────────────────────────────────────

export async function getMyStore(storeId: string) {
  const res = await apiClient.get(`/store-owner/stores/${storeId}`);
  return res.data;
}

export async function updateStoreInfo(storeId: string, dto: UpdateStoreInfoDto) {
  const res = await apiClient.patch(`/store-owner/stores/${storeId}/info`, dto);
  return res.data;
}

// ─── Drafts ────────────────────────────────────────────────────

export async function saveDraft(storeId: string, dto: UpdateStoreDto) {
  const res = await apiClient.put(`/store-owner/stores/${storeId}`, dto);
  return res.data;
}

export async function submitDraft(storeId: string) {
  const res = await apiClient.post(`/store-owner/stores/${storeId}/submit`);
  return res.data;
}

export async function revokeDraft(storeId: string) {
  const res = await apiClient.delete(`/store-owner/stores/${storeId}/draft`);
  return res.data;
}

export async function getMyDraft(storeId: string) {
  const res = await apiClient.get(`/store-owner/stores/${storeId}/draft`);
  return res.data;
}

// ─── Menu items ────────────────────────────────────────────────

export async function getMenuItems(storeId: string) {
  const res = await apiClient.get(`/store-owner/stores/${storeId}/menu-items`);
  return res.data;
}

export async function addMenuItem(storeId: string, dto: CreateMenuItemDto) {
  const res = await apiClient.post(`/store-owner/stores/${storeId}/menu-items`, dto);
  return res.data;
}

export async function updateMenuItem(storeId: string, id: string, dto: UpdateMenuItemDto) {
  const res = await apiClient.put(`/store-owner/stores/${storeId}/menu-items/${id}`, dto);
  return res.data;
}

export async function removeMenuItem(storeId: string, id: string) {
  const res = await apiClient.delete(`/store-owner/stores/${storeId}/menu-items/${id}`);
  return res.data;
}

// ─── Images (MinIO upload) ─────────────────────────────────────

export async function generateImageUploadUrl(storeId: string, contentType: string) {
  const res = await apiClient.post<{ data: { presignedUrl: string; s3Key: string; imageId: string } }>(
    `/store-owner/stores/${storeId}/images`,
    { contentType },
  );
  return res.data.data ?? res.data;
}

export async function confirmImageUpload(storeId: string, imageId: string) {
  const res = await apiClient.patch(`/store-owner/stores/${storeId}/images/${imageId}/confirm`);
  return res.data;
}

export async function deleteStoreImage(storeId: string, imageId: string) {
  const res = await apiClient.delete(`/store-owner/stores/${storeId}/images/${imageId}`);
  return res.data;
}

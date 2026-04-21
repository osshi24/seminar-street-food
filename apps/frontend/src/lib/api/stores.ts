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

export async function getMyStore() {
  const res = await apiClient.get('/store-owner/store');
  return res.data;
}

export async function saveDraft(dto: UpdateStoreDto) {
  const res = await apiClient.put('/store-owner/store', dto);
  return res.data;
}

export async function submitDraft() {
  const res = await apiClient.post('/store-owner/store/submit');
  return res.data;
}

export async function revokeDraft() {
  const res = await apiClient.delete('/store-owner/store/draft');
  return res.data;
}

export async function getMyDraft() {
  const res = await apiClient.get('/store-owner/store/draft');
  return res.data;
}

export async function getMenuItems() {
  const res = await apiClient.get('/store-owner/store/menu-items');
  return res.data;
}

export async function addMenuItem(dto: CreateMenuItemDto) {
  const res = await apiClient.post('/store-owner/store/menu-items', dto);
  return res.data;
}

export async function updateMenuItem(id: string, dto: UpdateMenuItemDto) {
  const res = await apiClient.put(`/store-owner/store/menu-items/${id}`, dto);
  return res.data;
}

export async function removeMenuItem(id: string) {
  const res = await apiClient.delete(`/store-owner/store/menu-items/${id}`);
  return res.data;
}

// --- Menu item image (single) ---

export async function generateMenuItemImageUploadUrl(menuItemId: string, contentType: string) {
  const res = await apiClient.post<{ data: { presignedUrl: string; imageUrl: string } }>(
    `/store-owner/store/menu-items/${menuItemId}/image`,
    { contentType },
  );
  return res.data.data ?? res.data;
}

export async function deleteMenuItemImage(menuItemId: string) {
  const res = await apiClient.delete(`/store-owner/store/menu-items/${menuItemId}/image`);
  return res.data;
}

// --- Store info (phone, address, hours, social) ---

export interface UpdateStoreInfoDto {
  phone?: string;
  address?: string;
  openingHours?: string;
  socialLinks?: { facebook?: string; instagram?: string; tiktok?: string };
}

export async function updateStoreInfo(dto: UpdateStoreInfoDto) {
  const res = await apiClient.patch('/store-owner/store/info', dto);
  return res.data;
}

// --- Images (MinIO upload) ---

export interface StoreImageItem {
  id: string;
  url: string;
  s3Key: string;
  orderIndex: number;
  isInDraft: boolean;
}

export async function generateImageUploadUrl(contentType: string) {
  const res = await apiClient.post<{ data: { presignedUrl: string; s3Key: string; imageId: string } }>(
    '/store-owner/store/images',
    { contentType },
  );
  return res.data.data ?? res.data;
}

export async function confirmImageUpload(imageId: string) {
  const res = await apiClient.patch(`/store-owner/store/images/${imageId}/confirm`);
  return res.data;
}

export async function deleteStoreImage(imageId: string) {
  const res = await apiClient.delete(`/store-owner/store/images/${imageId}`);
  return res.data;
}

// --- Multiple Stores API ---

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

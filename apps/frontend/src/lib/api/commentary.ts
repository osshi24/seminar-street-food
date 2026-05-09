import apiClient from './client';
import { getApiUrl } from './config';

export interface CommentaryResponse {
  data: {
    translatedText: string | null;
    audioUrl: string | null;
    pipelineStatus: string;
    fallback?: boolean;
    message?: string;
  };
}

export async function getStoreCommentary(storeId: string, lang: string): Promise<CommentaryResponse> {
  const res = await apiClient.get<CommentaryResponse>(`/stores/${storeId}/commentary`, {
    params: { lang },
  });
  return res.data;
}

export interface StoreDetailData {
  id: string;
  name: string;
  description?: string | null;
  status: string;
  activeCommentaryId?: string | null;
  pipelineStatus?: string | null;
  menuItems: Array<{ id: string; name: string; description?: string | null; price: number; tags?: { id: number; nameVi: string }[] }>;
  images: Array<{ id: string; url: string; orderIndex: number }>;
}

export async function getStoreDetail(storeId: string, lang = 'vi'): Promise<{ data: StoreDetailData }> {
  const url = `${getApiUrl()}/stores/${storeId}?lang=${lang}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Store not found');
  return res.json() as Promise<{ data: StoreDetailData }>;
}

export async function listStores(params?: { q?: string; page?: number; limit?: number; lang?: string }) {
  const res = await apiClient.get('/stores', { params });
  return res.data;
}

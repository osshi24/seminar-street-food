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

export async function getStoreDetail(storeId: string, lang = 'vi') {
  const url = `${getApiUrl()}/stores/${storeId}?lang=${lang}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Store not found');
  return res.json() as Promise<{ data: Record<string, unknown> }>;
}

export async function listStores(params?: { q?: string; page?: number; limit?: number; lang?: string }) {
  const res = await apiClient.get('/stores', { params });
  return res.data;
}

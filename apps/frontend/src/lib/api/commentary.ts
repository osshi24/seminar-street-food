import apiClient from './client';

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

export async function getStoreDetail(storeId: string) {
  const res = await apiClient.get(`/stores/${storeId}`);
  return res.data;
}

export async function listStores(params?: { q?: string; page?: number; limit?: number }) {
  const res = await apiClient.get('/stores', { params });
  return res.data;
}

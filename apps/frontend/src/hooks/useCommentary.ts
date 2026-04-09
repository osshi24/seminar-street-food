'use client';

import { useQuery } from '@tanstack/react-query';
import { getStoreCommentary } from '../lib/api/commentary';

export function useCommentary(storeId: string, lang: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['commentary', storeId, lang],
    queryFn: () => getStoreCommentary(storeId, lang),
    staleTime: 30_000,
    enabled: !!storeId && !!lang,
  });

  const commentary = data?.data;

  return {
    translatedText: commentary?.translatedText ?? null,
    audioUrl: commentary?.audioUrl ?? null,
    pipelineStatus: commentary?.pipelineStatus ?? null,
    fallback: commentary?.fallback ?? false,
    message: commentary?.message ?? null,
    isLoading,
    error,
  };
}

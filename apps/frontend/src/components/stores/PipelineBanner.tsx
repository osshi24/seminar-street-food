'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';

interface PipelineBannerProps {
  storeId: string;
  pipelineStatus: string | null;
  lang: string;
}

export default function PipelineBanner({ storeId, pipelineStatus, lang }: PipelineBannerProps) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (pipelineStatus !== 'running' && pipelineStatus !== 'pending') return;

    // Connect to current origin; Next.js rewrites /socket.io/* to the backend
    const beUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';
    const socket = io(beUrl, { path: '/socket.io', transports: ['polling'] });
    socket.emit('joinStore', storeId);

    socket.on('commentary:updated', (payload: { pipelineStatus: string }) => {
      if (payload.pipelineStatus === 'completed' || payload.pipelineStatus === 'failed') {
        queryClient.invalidateQueries({ queryKey: ['commentary', storeId, lang] });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [storeId, pipelineStatus, lang, queryClient]);

  if (pipelineStatus !== 'running' && pipelineStatus !== 'pending') return null;

  return (
    <div className="rounded-md bg-blue-50 border border-blue-200 px-4 py-3 flex items-center gap-2">
      <div className="h-4 w-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      <p className="text-sm text-blue-700">Thuyết minh đang được tổng hợp...</p>
    </div>
  );
}

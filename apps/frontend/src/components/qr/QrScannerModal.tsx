'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { resolveQrToken, QrResolveResult } from '../../lib/api/qr';

interface Props {
  onResult: (result: QrResolveResult) => void;
  onClose: () => void;
}

export default function QrScannerModal({ onResult, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  useEffect(() => {
    let active = true;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (!active) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();
        scanLoop();
      } catch {
        setError('Không thể truy cập camera. Vui lòng cấp quyền camera.');
        setScanning(false);
      }
    }

    async function scanLoop() {
      const jsQR = (await import('jsqr')).default;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;
      const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
      if (!ctx) return;

      function tick() {
        if (!active || !video || video.readyState < 2) {
          rafRef.current = requestAnimationFrame(tick); return;
        }
        canvas!.width = video.videoWidth;
        canvas!.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas!.width, canvas!.height);
        const imageData = ctx.getImageData(0, 0, canvas!.width, canvas!.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code?.data) { handleQrData(code.data); return; }
        rafRef.current = requestAnimationFrame(tick);
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    async function handleQrData(raw: string) {
      setScanning(false);
      stopCamera();
      const match = raw.match(/\/qr\/([a-f0-9-]{36})/i);
      if (!match) { onResult({ type: 'unavailable' }); return; }
      try {
        const result = await resolveQrToken(match[1]);
        onResult(result);
      } catch {
        onResult({ type: 'unavailable' });
      }
    }

    start();
    return () => { active = false; stopCamera(); };
  }, [stopCamera, onResult]);

  return (
    <div className="fixed inset-0 z-[600] bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-black/80">
        <span className="text-white font-medium">Quét mã QR</span>
        <button onClick={handleClose} className="text-white p-1">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        <canvas ref={canvasRef} className="hidden" />

        {scanning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-56 h-56">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-orange-400 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-orange-400 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-orange-400 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-orange-400 rounded-br-lg" />
              <div className="absolute left-2 right-2 h-0.5 bg-orange-400/80 animate-scan-line" />
            </div>
            <p className="absolute bottom-20 text-white/80 text-sm">Đưa mã QR vào khung</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70">
            <div className="bg-white rounded-xl p-6 mx-6 text-center space-y-3">
              <p className="text-gray-700 text-sm">{error}</p>
              <button onClick={handleClose} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium">
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes scan-line {
          0% { top: 8px; } 50% { top: calc(100% - 8px); } 100% { top: 8px; }
        }
        .animate-scan-line { animation: scan-line 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

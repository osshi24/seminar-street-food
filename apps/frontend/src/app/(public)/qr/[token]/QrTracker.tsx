'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { analytics } from '../../../../lib/analytics';

interface Props {
  destination: string;
  success: boolean;
  qrType: string;
}

export default function QrTracker({ destination, success, qrType }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (success) {
      analytics.qrScanSuccess(qrType);
    } else {
      analytics.qrScanFail();
    }
    // Small delay so Umami's fetch is queued before navigation cancels it
    const t = setTimeout(() => router.replace(destination), 80);
    return () => clearTimeout(t);
  }, [destination, success, qrType, router]);

  return null;
}

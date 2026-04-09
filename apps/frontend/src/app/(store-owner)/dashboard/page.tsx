'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAccessToken } from '../../../lib/auth/session';

interface TokenPayload {
  sub: string;
  role: string;
  exp: number;
}

function parseToken(token: string): TokenPayload | null {
  try {
    return JSON.parse(atob(token.split('.')[1])) as TokenPayload;
  } catch {
    return null;
  }
}

export default function DashboardPage() {
  const router = useRouter();
  const [accountId, setAccountId] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.push('/store-owner/login');
      return;
    }
    const payload = parseToken(token);
    if (payload) {
      setAccountId(payload.sub);
    }
  }, [router]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h2 className="text-2xl font-bold text-gray-800">Chào mừng trở lại!</h2>
      <p className="mt-2 text-gray-600">
        Quản lý gian hàng của bạn từ đây. (ID: {accountId})
      </p>
    </div>
  );
}

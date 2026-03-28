'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { saveCustomerToken, getReturnUrl, clearReturnUrl } from '../../../../lib/auth/customer-session';

export default function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (token) {
      saveCustomerToken(token);
      const returnUrl = getReturnUrl() ?? '/';
      clearReturnUrl();
      router.replace(returnUrl);
      return;
    }

    if (error) {
      router.replace('/');
      return;
    }

    router.replace('/');
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-gray-500">Đang xử lý đăng nhập...</p>
    </div>
  );
}


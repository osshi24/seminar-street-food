import { Suspense } from 'react';
import AuthCallbackClient from './AuthCallbackClient';

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-gray-500">Đang xử lý đăng nhập...</div>}>
      <AuthCallbackClient />
    </Suspense>
  );
}

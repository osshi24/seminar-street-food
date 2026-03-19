'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { loginStoreOwner } from '../../lib/api/auth';
import { saveAccessToken } from '../../lib/auth/session';

const schema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
});

type FormData = z.infer<typeof schema>;

export default function LoginForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      const result = await loginStoreOwner(data);
      saveAccessToken(result.data.accessToken);
      router.push('/dashboard');
    } catch (err: unknown) {
      const error = err as {
        response?: {
          data?: {
            code?: string;
            message?: string;
            lockedUntil?: string;
          };
          status?: number;
        };
      };
      const code = error.response?.data?.code;
      const lockedUntil = error.response?.data?.lockedUntil;

      switch (code) {
        case 'ACCOUNT_PENDING':
          setServerError('Tài khoản đang chờ Admin phê duyệt.');
          break;
        case 'ACCOUNT_INACTIVE':
          setServerError('Tài khoản bị vô hiệu hóa. Vui lòng liên hệ Admin.');
          break;
        case 'ACCOUNT_REJECTED':
          setServerError('Tài khoản đăng ký đã bị từ chối. Vui lòng xem email để biết lý do.');
          break;
        case 'ACCOUNT_LOCKED':
          setServerError(
            `Tài khoản bị khóa tạm thời đến ${lockedUntil ? new Date(lockedUntil).toLocaleString('vi-VN') : '...'}`,
          );
          break;
        case 'INVALID_CREDENTIALS':
          setServerError('Email hoặc mật khẩu không đúng.');
          break;
        default:
          setServerError('Đã xảy ra lỗi. Vui lòng thử lại sau.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{serverError}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          {...register('email')}
          type="email"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          placeholder="email@example.com"
        />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
        <input
          {...register('password')}
          type="password"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
      </button>
    </form>
  );
}

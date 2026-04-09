'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { registerStoreOwner } from '../../lib/api/auth';
import type { RegisterStoreOwnerDto } from '../../types/store-owner';

const schema = z.object({
  fullName: z.string().min(1, 'Vui lòng nhập họ và tên').max(255),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().regex(/^[0-9+\-\s()]{7,20}$/, 'Số điện thoại không hợp lệ'),
  password: z
    .string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .regex(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Mật khẩu phải có chữ hoa, chữ thường và số'),
  storeName: z.string().min(1, 'Vui lòng nhập tên gian hàng').max(255),
  registrationReason: z.string().min(10, 'Lý do phải có ít nhất 10 ký tự').max(1000),
});

type FormData = z.infer<typeof schema>;

export default function RegisterForm() {
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      await registerStoreOwner(data as RegisterStoreOwnerDto);
      setSuccess(true);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { code?: string; message?: string } } };
      const code = error.response?.data?.code;
      if (code === 'EMAIL_ALREADY_EXISTS') {
        setServerError('Email này đã được đăng ký. Vui lòng dùng email khác.');
      } else {
        setServerError('Đã xảy ra lỗi. Vui lòng thử lại sau.');
      }
    }
  };

  if (success) {
    return (
      <div className="rounded-md bg-green-50 p-6 text-center">
        <p className="text-green-800 font-medium">
          Đăng ký thành công. Tài khoản đang chờ Admin phê duyệt.
        </p>
        <p className="text-green-700 mt-2 text-sm">
          Chúng tôi sẽ gửi email thông báo kết quả cho bạn.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{serverError}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Họ và tên</label>
        <input
          {...register('fullName')}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          placeholder="Nguyễn Văn A"
        />
        {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName.message}</p>}
      </div>

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
        <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
        <input
          {...register('phone')}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          placeholder="0901234567"
        />
        {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>}
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

      <div>
        <label className="block text-sm font-medium text-gray-700">Tên gian hàng</label>
        <input
          {...register('storeName')}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          placeholder="Quán Phở Bắc"
        />
        {errors.storeName && <p className="mt-1 text-xs text-red-600">{errors.storeName.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Lý do đăng ký</label>
        <textarea
          {...register('registrationReason')}
          rows={4}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          placeholder="Mô tả lý do bạn muốn tham gia Phố Ẩm Thực..."
        />
        {errors.registrationReason && (
          <p className="mt-1 text-xs text-red-600">{errors.registrationReason.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? 'Đang đăng ký...' : 'Đăng ký'}
      </button>
    </form>
  );
}

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên gian hàng').max(255),
  description: z.string().max(1000, 'Mô tả không được quá 1000 ký tự').optional(),
});

type FormData = z.infer<typeof schema>;

interface StoreDetailEditFormProps {
  storeId: string;
  initialName: string;
  initialDescription?: string | null;
  onSaveDraft: (data: { name: string; description?: string }) => Promise<void>;
  onCancel: () => void;
}

export default function StoreDetailEditForm({
  storeId: _storeId,
  initialName,
  initialDescription,
  onSaveDraft,
  onCancel,
}: StoreDetailEditFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: initialName, description: initialDescription ?? '' },
  });

  const description = watch('description') || '';

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      await onSaveDraft({ name: data.name, description: data.description || undefined });
    } catch {
      setServerError('Đã xảy ra lỗi. Vui lòng thử lại.');
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      {serverError && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">{serverError}</div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Tên gian hàng</label>
        <input
          {...register('name')}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Nội dung thuyết minh
          </label>
          <span className="text-xs text-gray-400">{description.length}/1000</span>
        </div>
        <p className="mb-1.5 text-xs text-gray-500">
          Đây là nội dung sẽ được đọc thành tiếng khi khách quét QR. Hãy viết như lời hướng dẫn viên — giới thiệu gian hàng, món ăn đặc trưng, câu chuyện thương hiệu...
        </p>
        <textarea
          {...register('description')}
          rows={6}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          placeholder="Ví dụ: Chào mừng bạn đến với quán Bánh Canh Dì Ba — hơn 20 năm giữ lửa hương vị truyền thống miền Tây..."
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
        )}
      </div>

      <p className="text-xs text-amber-600 bg-amber-50 rounded-md px-3 py-2">
        Sau khi gửi, admin sẽ xem xét và phê duyệt. Nội dung thuyết minh sẽ được tự động dịch sang nhiều ngôn ngữ sau khi duyệt.
      </p>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Đang gửi...' : 'Gửi để duyệt'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Hủy
        </button>
      </div>
    </form>
  );
}

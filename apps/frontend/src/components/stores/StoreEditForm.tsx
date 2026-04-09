'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { saveDraft, submitDraft } from '../../lib/api/stores';

const schema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên gian hàng').max(255),
  description: z.string().max(1000, 'Mô tả không được quá 1000 ký tự').optional(),
});

type FormData = z.infer<typeof schema>;

interface StoreEditFormProps {
  initialName: string;
  initialDescription?: string | null;
  onSuccess: () => void;
}

export default function StoreEditForm({ initialName, initialDescription, onSuccess }: StoreEditFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [mode, setMode] = useState<'draft' | 'submit' | null>(null);

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: initialName, description: initialDescription ?? '' },
  });

  const description = watch('description') || '';

  const onSubmit = async (data: FormData, submit = false) => {
    setServerError(null);
    try {
      await saveDraft({ name: data.name, description: data.description });
      if (submit) {
        await submitDraft();
      }
      onSuccess();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { code?: string } } };
      if (error.response?.data?.code === 'DRAFT_PENDING') {
        setServerError('Đã có bản nháp đang chờ duyệt. Vui lòng thu hồi trước.');
      } else {
        setServerError('Đã xảy ra lỗi. Vui lòng thử lại.');
      }
    }
  };

  return (
    <form className="space-y-4">
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
          <label className="block text-sm font-medium text-gray-700">Mô tả</label>
          <span className="text-xs text-gray-400">{description.length}/1000</span>
        </div>
        <textarea
          {...register('description')}
          rows={5}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          placeholder="Mô tả gian hàng của bạn..."
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleSubmit((data) => { setMode('draft'); onSubmit(data, false); })}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Lưu nháp
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={handleSubmit((data) => { setMode('submit'); onSubmit(data, true); })}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting && mode === 'submit' ? 'Đang gửi...' : 'Gửi duyệt'}
        </button>
      </div>
    </form>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import apiClient from '../../../../lib/api/client';

interface CustomerData {
  id?: string;
  email: string;
  displayName: string;
  avatarUrl?: string | null;
}

interface Props {
  initial?: CustomerData;
  onClose: () => void;
  onSaved: () => void;
}

export default function CustomerFormDialog({ initial, onClose, onSaved }: Props) {
  const [email, setEmail] = useState(initial?.email ?? '');
  const [displayName, setDisplayName] = useState(initial?.displayName ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !displayName.trim()) {
      setError('Vui lòng điền đầy đủ thông tin.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      let customerId = initial?.id;
      if (customerId) {
        await apiClient.put(`/admin/customers/${customerId}`, { email, displayName });
      } else {
        const res = await apiClient.post<{ data: { id: string } }>('/admin/customers', { email, displayName });
        customerId = res.data.data.id;
      }

      if (customerId && file) {
        const fd = new FormData();
        fd.append('file', file);
        await apiClient.post(`/admin/customers/${customerId}/avatar`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      onSaved();
    } catch (err: unknown) {
      const e2 = err as { response?: { data?: { message?: string } } };
      setError(e2.response?.data?.message ?? 'Đã xảy ra lỗi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-gray-800">
          {initial?.id ? 'Sửa khách hàng' : 'Thêm khách hàng'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={255}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="customer@email.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tên hiển thị</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={255}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Nguyễn Văn A"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Avatar</label>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-full border bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="avatar"
                  src={previewUrl ?? initial?.avatarUrl ?? '/images/default-avatar.png'}
                  className="h-full w-full object-cover"
                />
              </div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="text-sm"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">Hỗ trợ JPG/PNG/WebP, tối đa 5MB.</p>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


'use client';

import { useState } from 'react';
import { createStore } from '../../lib/api/stores';

interface StoreCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function StoreCreateModal({ isOpen, onClose, onSuccess }: StoreCreateModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Vui lòng nhập tên gian hàng');
      return;
    }

    setLoading(true);
    try {
      await createStore({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      setName('');
      setDescription('');
      onSuccess();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Lỗi khi tạo gian hàng';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Tạo gian hàng mới</h2>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên gian hàng <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên gian hàng..."
              maxLength={255}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500">{name.length}/255 ký tự</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập mô tả gian hàng..."
              maxLength={1000}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500">{description.length}/1000 ký tự</p>
          </div>

          <p className="text-xs text-gray-600 bg-blue-50 border border-blue-200 rounded p-3">
            💡 Sau khi tạo, bạn cần điền đầy đủ thông tin và chọn vị trí để gian hàng được admin phê duyệt.
          </p>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              {loading ? 'Đang tạo...' : 'Tạo gian hàng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

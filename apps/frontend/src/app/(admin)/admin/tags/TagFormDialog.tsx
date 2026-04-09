'use client';

import { useEffect, useState } from 'react';
import apiClient from '../../../../lib/api/client';

type GroupType = 'dish_type' | 'flavor' | 'allergen';

const GROUP_LABELS: Record<GroupType, string> = {
  dish_type: 'Loại món ăn',
  flavor: 'Khẩu vị',
  allergen: 'Dị ứng thực phẩm',
};

interface TagData {
  id?: number;
  nameVi: string;
  nameEn: string;
  groupType: GroupType;
}

interface Props {
  initial?: TagData;
  onClose: () => void;
  onSaved: () => void;
}

export default function TagFormDialog({ initial, onClose, onSaved }: Props) {
  const [nameVi, setNameVi] = useState(initial?.nameVi ?? '');
  const [nameEn, setNameEn] = useState(initial?.nameEn ?? '');
  const [groupType, setGroupType] = useState<GroupType>(initial?.groupType ?? 'dish_type');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameVi.trim() || !nameEn.trim()) {
      setError('Vui lòng điền đầy đủ thông tin.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (initial?.id) {
        await apiClient.put(`/admin/tags/${initial.id}`, { nameVi, nameEn, groupType });
      } else {
        await apiClient.post('/admin/tags', { nameVi, nameEn, groupType });
      }
      onSaved();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message ?? 'Đã xảy ra lỗi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-bold text-gray-800">
          {initial?.id ? 'Sửa nhãn' : 'Thêm nhãn mới'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tên (VI)</label>
            <input
              value={nameVi}
              onChange={(e) => setNameVi(e.target.value)}
              maxLength={100}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="VD: Cay"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tên (EN)</label>
            <input
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              maxLength={100}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              placeholder="VD: Spicy"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nhóm</label>
            <select
              value={groupType}
              onChange={(e) => setGroupType(e.target.value as GroupType)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              {(Object.entries(GROUP_LABELS) as [GroupType, string][]).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
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

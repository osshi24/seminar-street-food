'use client';

import { useCallback, useEffect, useState } from 'react';
import apiClient from '../../../../lib/api/client';
import TagFormDialog from './TagFormDialog';

type GroupType = 'dish_type' | 'flavor' | 'allergen';

const GROUP_LABELS: Record<GroupType, string> = {
  dish_type: 'Loại món ăn',
  flavor: 'Khẩu vị',
  allergen: 'Dị ứng thực phẩm',
};

interface TagRow {
  id: number;
  nameVi: string;
  nameEn: string;
  groupType: GroupType;
  usageCount: number;
}

export default function AdminTagsPage() {
  const [tags, setTags] = useState<TagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<{ open: boolean; tag?: TagRow }>({ open: false });
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ data: TagRow[] }>('/admin/tags');
      setTags(res.data.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (tag: TagRow) => {
    setDeleteError(null);
    if (!confirm(`Xóa nhãn "${tag.nameVi}"?`)) return;
    try {
      await apiClient.delete(`/admin/tags/${tag.id}`);
      await load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setDeleteError(e.response?.data?.message ?? 'Không thể xóa nhãn này.');
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Quản lý nhãn sở thích</h1>
        <button
          onClick={() => setDialog({ open: true })}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Thêm nhãn mới
        </button>
      </div>

      {deleteError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {deleteError}
        </div>
      )}

      {loading ? (
        <div className="animate-pulse space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-12 rounded bg-gray-100" />)}
        </div>
      ) : (
        <div className="rounded-lg border bg-white overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Tên VI</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Tên EN</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Nhóm</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Đang dùng</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tags.map((tag) => (
                <tr key={tag.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-500">{tag.id}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{tag.nameVi}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{tag.nameEn}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{GROUP_LABELS[tag.groupType]}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {tag.usageCount > 0 ? (
                      <span className="inline-block rounded-full bg-orange-50 px-2 py-0.5 text-xs text-orange-600">
                        {tag.usageCount} món
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setDialog({ open: true, tag })}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(tag)}
                        className="text-sm text-red-500 hover:underline"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tags.length === 0 && (
            <p className="py-10 text-center text-sm text-gray-400">Chưa có nhãn nào.</p>
          )}
        </div>
      )}

      {dialog.open && (
        <TagFormDialog
          initial={dialog.tag}
          onClose={() => setDialog({ open: false })}
          onSaved={() => { setDialog({ open: false }); load(); }}
        />
      )}
    </div>
  );
}

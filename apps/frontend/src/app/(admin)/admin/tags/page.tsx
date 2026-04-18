'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import AdminMetricGrid from '../../../../components/admin/common/AdminMetricGrid';
import AdminPageHeader from '../../../../components/admin/common/AdminPageHeader';
import apiClient from '../../../../lib/api/client';
import TagFormDialog from './TagFormDialog';

type GroupType = 'dish_type' | 'flavor' | 'allergen';

const GROUP_META: Record<
  GroupType,
  { label: string; tone: 'blue' | 'amber' | 'rose'; description: string }
> = {
  dish_type: {
    label: 'Loại món ăn',
    tone: 'blue',
    description: 'Nhóm nhãn phân loại món chính, món nước, món khô hoặc dòng món.',
  },
  flavor: {
    label: 'Khẩu vị',
    tone: 'amber',
    description: 'Nhóm nhãn mô tả hương vị như cay, ngọt, mặn hoặc thanh nhẹ.',
  },
  allergen: {
    label: 'Dị ứng thực phẩm',
    tone: 'rose',
    description: 'Nhóm nhãn phục vụ cảnh báo dị ứng và nhu cầu ăn kiêng.',
  },
};

interface TagRow {
  id: number;
  nameVi: string;
  nameEn: string;
  groupType: GroupType;
  usageCount: number;
  updatedAt: string;
}

export default function AdminTagsPage() {
  const [tags, setTags] = useState<TagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState<'all' | GroupType>('all');
  const [dialog, setDialog] = useState<{ open: boolean; tag?: TagRow }>({ open: false });
  const [actionError, setActionError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<{ data: TagRow[] }>('/admin/tags');
      setTags(res.data.data ?? []);
      setActionError(null);
    } catch {
      setActionError('Không thể tải danh sách nhãn sở thích.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredTags = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return tags.filter((tag) => {
      const matchGroup = groupFilter === 'all' || tag.groupType === groupFilter;
      const matchKeyword =
        keyword.length === 0 ||
        tag.nameVi.toLowerCase().includes(keyword) ||
        tag.nameEn.toLowerCase().includes(keyword);

      return matchGroup && matchKeyword;
    });
  }, [groupFilter, search, tags]);

  const stats = useMemo(() => {
    const counts = {
      dish_type: tags.filter((tag) => tag.groupType === 'dish_type').length,
      flavor: tags.filter((tag) => tag.groupType === 'flavor').length,
      allergen: tags.filter((tag) => tag.groupType === 'allergen').length,
    };

    return [
      {
        label: 'Tổng nhãn',
        value: tags.length,
        tone: 'slate' as const,
        icon: '🏷️',
        description: 'Tổng số nhãn có sẵn để quản lý gợi ý món ăn và metadata menu.',
      },
      {
        label: GROUP_META.dish_type.label,
        value: counts.dish_type,
        tone: GROUP_META.dish_type.tone,
        icon: '🍜',
        description: GROUP_META.dish_type.description,
      },
      {
        label: GROUP_META.flavor.label,
        value: counts.flavor,
        tone: GROUP_META.flavor.tone,
        icon: '🌶️',
        description: GROUP_META.flavor.description,
      },
      {
        label: GROUP_META.allergen.label,
        value: counts.allergen,
        tone: GROUP_META.allergen.tone,
        icon: '⚠️',
        description: GROUP_META.allergen.description,
      },
    ];
  }, [tags]);

  const handleDelete = async (tag: TagRow) => {
    setActionError(null);
    if (!window.confirm(`Xóa nhãn "${tag.nameVi}"?`)) return;

    setDeletingId(tag.id);
    try {
      await apiClient.delete(`/admin/tags/${tag.id}`);
      await load();
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: string } } }).response?.data?.message ??
        'Không thể xóa nhãn này.';
      setActionError(message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        badge="Catalog admin"
        title="Quản lý nhãn sở thích"
        description="Quản trị taxonomy đang được dùng cho phân loại món, sở thích khẩu vị và cảnh báo dị ứng. Mọi thay đổi ở đây sẽ ảnh hưởng trực tiếp đến luồng menu và gợi ý món ăn."
        meta={`${filteredTags.length}/${tags.length} nhãn đang hiển thị`}
        action={
          <button
            onClick={() => setDialog({ open: true })}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            <span aria-hidden>＋</span>
            Thêm nhãn mới
          </button>
        }
      />

      <AdminMetricGrid items={stats} />

      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">
              Bộ lọc
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              Tìm nhanh theo tên hoặc nhóm nhãn
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
            <label className="relative block min-w-[280px]">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                🔎
              </span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm theo tên tiếng Việt hoặc tiếng Anh..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setGroupFilter('all');
              }}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              Xóa lọc
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {(['all', 'dish_type', 'flavor', 'allergen'] as const).map((group) => {
            const active = groupFilter === group;
            const label = group === 'all' ? 'Tất cả' : GROUP_META[group].label;

            return (
              <button
                key={group}
                type="button"
                onClick={() => setGroupFilter(group)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? 'bg-slate-950 text-white'
                    : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {actionError ? (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {actionError}
          </div>
        ) : null}

        <div className="mt-6 overflow-hidden rounded-[28px] border border-slate-200">
          {loading ? (
            <div className="space-y-3 bg-slate-50 p-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-16 animate-pulse rounded-2xl bg-white" />
              ))}
            </div>
          ) : filteredTags.length === 0 ? (
            <div className="bg-slate-50 px-6 py-14 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-white text-2xl shadow-sm">
                🏷️
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">Không có nhãn phù hợp</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Hãy đổi từ khóa tìm kiếm hoặc tạo một nhãn mới để bổ sung taxonomy cho hệ thống.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto bg-white">
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    <th className="px-5 py-4">Nhãn</th>
                    <th className="px-5 py-4">Nhóm</th>
                    <th className="px-5 py-4">Đang dùng</th>
                    <th className="px-5 py-4">Cập nhật</th>
                    <th className="px-5 py-4 text-right">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTags.map((tag) => (
                    <tr key={tag.id} className="transition hover:bg-cyan-50/50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-4">
                          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
                            #{tag.id}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{tag.nameVi}</p>
                            <p className="mt-1 text-sm text-slate-500">{tag.nameEn}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                            tag.groupType === 'dish_type'
                              ? 'bg-blue-50 text-blue-700 ring-blue-200'
                              : tag.groupType === 'flavor'
                                ? 'bg-amber-50 text-amber-700 ring-amber-200'
                                : 'bg-rose-50 text-rose-700 ring-rose-200'
                          }`}
                        >
                          {GROUP_META[tag.groupType].label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {tag.usageCount > 0 ? (
                          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                            {tag.usageCount} món đang gắn
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">Chưa dùng</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-500">
                        {new Date(tag.updatedAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setDialog({ open: true, tag })}
                            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleDelete(tag)}
                            disabled={deletingId === tag.id}
                            className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
                          >
                            {deletingId === tag.id ? 'Đang xóa...' : 'Xóa'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {dialog.open ? (
        <TagFormDialog
          initial={dialog.tag}
          onClose={() => setDialog({ open: false })}
          onSaved={() => {
            setDialog({ open: false });
            void load();
          }}
        />
      ) : null}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search, Tags as TagsIcon, Utensils, Flame, AlertTriangle } from 'lucide-react';
import AdminMetricGrid from '../../../../components/admin/common/AdminMetricGrid';
import AdminPageHeader from '../../../../components/admin/common/AdminPageHeader';
import AdminEmptyState from '../../../../components/admin/common/AdminEmptyState';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import type { BadgeProps } from '../../../../components/ui/badge';
import { Card, CardContent } from '../../../../components/ui/card';
import { cn } from '../../../../lib/cn';
import apiClient from '../../../../lib/api/client';
import TagFormDialog from './TagFormDialog';

type GroupType = 'dish_type' | 'flavor' | 'allergen';

const GROUP_META: Record<
  GroupType,
  { label: string; tone: 'blue' | 'amber' | 'rose'; description: string; variant: NonNullable<BadgeProps['variant']> }
> = {
  dish_type: {
    label: 'Loại món ăn',
    tone: 'blue',
    description: 'Phân loại món chính, món nước, món khô.',
    variant: 'info',
  },
  flavor: {
    label: 'Khẩu vị',
    tone: 'amber',
    description: 'Hương vị: cay, ngọt, mặn, thanh nhẹ.',
    variant: 'warning',
  },
  allergen: {
    label: 'Dị ứng',
    tone: 'rose',
    description: 'Cảnh báo dị ứng và nhu cầu ăn kiêng.',
    variant: 'danger',
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
      { label: 'Tổng nhãn', value: tags.length, tone: 'slate' as const, icon: <TagsIcon />, description: 'Nhãn quản lý gợi ý món.' },
      { label: GROUP_META.dish_type.label, value: counts.dish_type, tone: GROUP_META.dish_type.tone, icon: <Utensils />, description: GROUP_META.dish_type.description },
      { label: GROUP_META.flavor.label, value: counts.flavor, tone: GROUP_META.flavor.tone, icon: <Flame />, description: GROUP_META.flavor.description },
      { label: GROUP_META.allergen.label, value: counts.allergen, tone: GROUP_META.allergen.tone, icon: <AlertTriangle />, description: GROUP_META.allergen.description },
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
    <div className="space-y-5">
      <AdminPageHeader
        badge="Nội dung"
        title="Quản lý nhãn sở thích"
        description="Taxonomy phục vụ phân loại món, khẩu vị và cảnh báo dị ứng."
        meta={`${filteredTags.length}/${tags.length} nhãn đang hiển thị`}
        action={
          <Button onClick={() => setDialog({ open: true })}>
            <Plus />
            Thêm nhãn
          </Button>
        }
      />

      <AdminMetricGrid items={stats} />

      <Card>
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-1.5">
              {(['all', 'dish_type', 'flavor', 'allergen'] as const).map((group) => {
                const active = groupFilter === group;
                const label = group === 'all' ? 'Tất cả' : GROUP_META[group].label;
                return (
                  <button
                    key={group}
                    type="button"
                    onClick={() => setGroupFilter(group)}
                    className={cn(
                      'inline-flex h-8 items-center rounded-md border px-3 text-xs font-medium transition-colors',
                      active
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm theo tên VI hoặc EN..."
                  className="h-9 w-full rounded-md border border-slate-200 bg-white pl-8 pr-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-slate-400"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setGroupFilter('all');
                }}
              >
                Xóa lọc
              </Button>
            </div>
          </div>

          {actionError ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {actionError}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-14 animate-pulse rounded-md bg-slate-50" />
          ))}
        </div>
      ) : filteredTags.length === 0 ? (
        <AdminEmptyState
          icon={TagsIcon}
          title="Không có nhãn phù hợp"
          description="Đổi từ khóa hoặc tạo nhãn mới."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="border-b border-slate-200 bg-slate-50/50">
                <tr>
                  {['Nhãn', 'Nhóm', 'Đang dùng', 'Cập nhật', 'Tác vụ'].map((h, i) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-xs font-medium uppercase tracking-wide text-slate-500 ${
                        i === 4 ? 'text-right' : 'text-left'
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredTags.map((tag) => (
                  <tr key={tag.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-slate-900 text-xs font-semibold text-white">
                          #{tag.id}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{tag.nameVi}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{tag.nameEn}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={GROUP_META[tag.groupType].variant}>
                        {GROUP_META[tag.groupType].label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {tag.usageCount > 0 ? (
                        <Badge variant="muted">{tag.usageCount} món</Badge>
                      ) : (
                        <span className="text-xs text-slate-400">Chưa dùng</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {new Date(tag.updatedAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDialog({ open: true, tag })}
                        >
                          Sửa
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(tag)}
                          disabled={deletingId === tag.id}
                        >
                          {deletingId === tag.id ? 'Đang xóa...' : 'Xóa'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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

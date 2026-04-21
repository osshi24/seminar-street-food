'use client';

import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { cn } from '../../../../lib/cn';
import apiClient from '../../../../lib/api/client';

type GroupType = 'dish_type' | 'flavor' | 'allergen';

const GROUP_OPTIONS: Array<{ value: GroupType; label: string; description: string }> = [
  { value: 'dish_type', label: 'Loại món ăn', description: 'Phân loại dòng món như cơm, bún, lẩu, bánh mì.' },
  { value: 'flavor', label: 'Khẩu vị', description: 'Đặc tính vị giác như cay, ngọt, béo, thanh.' },
  { value: 'allergen', label: 'Dị ứng thực phẩm', description: 'Cảnh báo nguyên liệu gây dị ứng hoặc cần tránh.' },
];

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!nameVi.trim() || !nameEn.trim()) {
      setError('Vui lòng nhập đủ tên tiếng Việt và tiếng Anh.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = { nameVi: nameVi.trim(), nameEn: nameEn.trim(), groupType };
      if (initial?.id) {
        await apiClient.put(`/admin/tags/${initial.id}`, payload);
      } else {
        await apiClient.post('/admin/tags', payload);
      }
      onSaved();
    } catch (unknownError: unknown) {
      const message =
        (unknownError as { response?: { data?: { message?: string } } }).response?.data?.message ??
        'Đã xảy ra lỗi khi lưu nhãn.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-cyan-700">
              Trình soạn nhãn
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">
              {initial?.id ? 'Cập nhật nhãn' : 'Tạo nhãn mới'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-5 px-5 py-5 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Tên tiếng Việt</span>
              <input
                value={nameVi}
                onChange={(event) => setNameVi(event.target.value)}
                maxLength={100}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400"
                placeholder="Ví dụ: Cay"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Tên tiếng Anh</span>
              <input
                value={nameEn}
                onChange={(event) => setNameEn(event.target.value)}
                maxLength={100}
                className="h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-slate-400"
                placeholder="Example: Spicy"
              />
            </label>

            <div>
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Nhóm nhãn</span>
              <div className="space-y-2">
                {GROUP_OPTIONS.map((option) => {
                  const active = option.value === groupType;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setGroupType(option.value)}
                      className={cn(
                        'w-full rounded-md border p-3 text-left transition-colors',
                        active
                          ? 'border-cyan-500 bg-cyan-50'
                          : 'border-slate-200 bg-white hover:bg-slate-50',
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{option.label}</p>
                          <p className="mt-0.5 text-xs leading-5 text-slate-500">
                            {option.description}
                          </p>
                        </div>
                        <span
                          className={cn(
                            'mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full border',
                            active
                              ? 'border-cyan-500 bg-cyan-500 text-white'
                              : 'border-slate-300 text-transparent',
                          )}
                        >
                          <Check className="h-3 w-3" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Xem trước
              </p>
              <div className="mt-3 rounded-md border border-slate-200 bg-white p-3">
                <Badge variant="default">
                  {GROUP_OPTIONS.find((option) => option.value === groupType)?.label}
                </Badge>
                <h3 className="mt-3 text-lg font-semibold text-slate-900">
                  {nameVi.trim() || 'Tên tiếng Việt'}
                </h3>
                <p className="mt-0.5 text-sm text-slate-500">{nameEn.trim() || 'English name'}</p>
              </div>
            </div>

            {error ? (
              <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </div>
            ) : null}
          </div>

          <div className="flex justify-end gap-2 lg:col-span-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Đang lưu...' : initial?.id ? 'Lưu' : 'Tạo nhãn'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

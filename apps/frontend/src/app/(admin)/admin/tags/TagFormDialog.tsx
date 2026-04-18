'use client';

import { useState } from 'react';
import apiClient from '../../../../lib/api/client';

type GroupType = 'dish_type' | 'flavor' | 'allergen';

const GROUP_OPTIONS: Array<{
  value: GroupType;
  label: string;
  description: string;
}> = [
  {
    value: 'dish_type',
    label: 'Loại món ăn',
    description: 'Dùng để phân loại dòng món như cơm, bún, lẩu, bánh mì.',
  },
  {
    value: 'flavor',
    label: 'Khẩu vị',
    description: 'Dùng cho đặc tính vị giác như cay, ngọt, béo hoặc thanh.',
  },
  {
    value: 'allergen',
    label: 'Dị ứng thực phẩm',
    description: 'Dùng để cảnh báo nguyên liệu có thể gây dị ứng hoặc cần tránh.',
  },
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
      const payload = {
        nameVi: nameVi.trim(),
        nameEn: nameEn.trim(),
        groupType,
      };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_40px_100px_-50px_rgba(15,23,42,0.75)]">
        <div className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.16),_transparent_35%),linear-gradient(180deg,_#ffffff_0%,_#f8fbff_100%)] px-6 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">
                Tag editor
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                {initial?.id ? 'Cập nhật nhãn hiện có' : 'Tạo nhãn mới cho hệ thống'}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Nhãn sẽ được dùng trực tiếp ở menu món ăn và các luồng gợi ý. Hãy đặt tên rõ ràng, ngắn gọn và nhất quán.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-11 w-11 place-items-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50"
            >
              ✕
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6 px-6 py-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Tên tiếng Việt</span>
              <input
                value={nameVi}
                onChange={(event) => setNameVi(event.target.value)}
                maxLength={100}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white"
                placeholder="Ví dụ: Cay"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Tên tiếng Anh</span>
              <input
                value={nameEn}
                onChange={(event) => setNameEn(event.target.value)}
                maxLength={100}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-300 focus:bg-white"
                placeholder="Example: Spicy"
              />
            </label>

            <div>
              <span className="mb-2 block text-sm font-semibold text-slate-700">Nhóm nhãn</span>
              <div className="space-y-3">
                {GROUP_OPTIONS.map((option) => {
                  const active = option.value === groupType;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setGroupType(option.value)}
                      className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                        active
                          ? 'border-cyan-300 bg-cyan-50'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-semibold text-slate-900">{option.label}</p>
                          <p className="mt-1 text-sm leading-6 text-slate-500">{option.description}</p>
                        </div>
                        <span
                          className={`mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] ${
                            active
                              ? 'border-cyan-500 bg-cyan-500 text-white'
                              : 'border-slate-300 text-transparent'
                          }`}
                        >
                          ●
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Xem trước
              </p>
              <div className="mt-4 rounded-[24px] bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <span className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                  {GROUP_OPTIONS.find((option) => option.value === groupType)?.label}
                </span>
                <h3 className="mt-4 text-2xl font-semibold text-slate-950">
                  {nameVi.trim() || 'Tên tiếng Việt'}
                </h3>
                <p className="mt-1 text-sm text-slate-500">{nameEn.trim() || 'English name'}</p>
              </div>
            </div>

            {error ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <div className="rounded-[28px] border border-slate-200 bg-white p-5">
              <p className="text-sm leading-6 text-slate-500">
                Chỉ thêm mới khi thật sự thiếu. Nếu một nhãn có thể tái sử dụng từ taxonomy hiện tại, ưu tiên sửa hoặc chuẩn hóa nhãn cũ để giữ dữ liệu đồng nhất.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 lg:col-span-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
            >
              {submitting ? 'Đang lưu...' : initial?.id ? 'Lưu cập nhật' : 'Tạo nhãn'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

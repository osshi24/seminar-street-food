'use client';

import { useEffect, useState } from 'react';
import {
  getMenuItems,
  addMenuItem,
  removeMenuItem,
  updateMenuItem,
  generateMenuItemImageUploadUrl,
} from '../../../../../lib/api/stores';
import { fetchTags } from '../../../../../lib/api/tags';
import type { TagGroup } from '../../../../../lib/api/tags';

interface MenuItemData {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  tags?: { id: number; nameVi: string }[];
}

const GROUP_LABELS = { dish_type: 'Loại món', flavor: 'Khẩu vị', allergen: 'Dị ứng' };

export default function MenuPage() {
  const [items, setItems] = useState<MenuItemData[]>([]);
  const [tagGroups, setTagGroups] = useState<TagGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', price: '' });
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [editingTagsFor, setEditingTagsFor] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  async function load() {
    setLoading(true);
    try {
      const res = await getMenuItems();
      setItems(res.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    fetchTags().then((d) => setTagGroups(d.groups)).catch(() => {});
  }, []);

  async function handleAdd() {
    if (!form.name || !form.price) return;
    setSubmitting(true);
    try {
      const createdRes = await addMenuItem({
        name: form.name,
        description: form.description || undefined,
        price: Number(form.price),
      });

      const createdItem = createdRes?.data ?? createdRes;
      if (imageFile && createdItem?.id) {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(imageFile.type)) {
          setImageError('Chỉ hỗ trợ JPG, PNG, WebP');
        } else if (imageFile.size > 5 * 1024 * 1024) {
          setImageError('Kích thước tối đa 5MB');
        } else {
          setImageError(null);
          const { presignedUrl } = await generateMenuItemImageUploadUrl(
            createdItem.id,
            imageFile.type,
          );

          const uploadRes = await fetch(presignedUrl, {
            method: 'PUT',
            body: imageFile,
            headers: { 'Content-Type': imageFile.type },
          });
          if (!uploadRes.ok) {
            throw new Error('Upload ảnh thất bại');
          }
        }
      }

      setForm({ name: '', description: '', price: '' });
      if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
      setImageFile(null);
      setImagePreviewUrl(null);
      setShowForm(false);
      load();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(id: string) {
    if (!confirm('Xóa món ăn này?')) return;
    await removeMenuItem(id);
    load();
  }

  function openTagEditor(item: MenuItemData) {
    setEditingTagsFor(item.id);
    setSelectedTagIds(item.tags?.map((t) => t.id) ?? []);
  }

  async function saveTags(itemId: string) {
    await updateMenuItem(itemId, { tagIds: selectedTagIds });
    setEditingTagsFor(null);
    load();
  }

  function toggleTag(id: number) {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Thực đơn</h1>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Thêm món
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-lg bg-white p-4 shadow-sm space-y-3 border">
          <h3 className="font-medium">Thêm món mới</h3>
          <input
            placeholder="Tên món *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Mô tả"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Giá (VND) *"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
          />
          <div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0] ?? null;
                setImageError(null);
                if (!file) {
                  if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
                  setImageFile(null);
                  setImagePreviewUrl(null);
                  return;
                }

                const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
                if (!validTypes.includes(file.type)) {
                  setImageError('Chỉ hỗ trợ JPG, PNG, WebP');
                  return;
                }
                if (file.size > 5 * 1024 * 1024) {
                  setImageError('Kích thước tối đa 5MB');
                  return;
                }

                if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
                setImageFile(file);
                setImagePreviewUrl(URL.createObjectURL(file));
              }}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
            {imageError && <p className="mt-1 text-xs text-red-600">{imageError}</p>}
            {imagePreviewUrl && (
              <div className="mt-2">
                <img
                  src={imagePreviewUrl}
                  alt="Preview"
                  className="h-28 w-28 rounded-md object-cover border"
                />
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={submitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Thêm
            </button>
            <button
              onClick={() => {
                if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
                setImageFile(null);
                setImagePreviewUrl(null);
                setImageError(null);
                setShowForm(false);
              }}
              className="rounded-md border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p>Đang tải...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500">Chưa có món ăn nào</p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-lg bg-white p-4 shadow-sm border">
              <div className="flex items-start justify-between gap-3">
                {item.imageUrl && (
                  <div className="flex-shrink-0">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-16 w-16 rounded-md object-cover border"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{item.name}</p>
                  {item.description && <p className="text-sm text-gray-500">{item.description}</p>}
                  <p className="text-sm font-semibold text-red-600">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                  </p>
                  {item.tags && item.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {item.tags.map((t) => (
                        <span key={t.id} className="rounded-full bg-orange-50 px-2 py-0.5 text-xs text-orange-600">
                          {t.nameVi}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => openTagEditor(item)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Gắn nhãn
                  </button>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Xóa
                  </button>
                </div>
              </div>

              {editingTagsFor === item.id && (
                <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
                  <p className="mb-2 text-xs font-semibold text-blue-700">Chọn nhãn cho món ăn:</p>
                  {tagGroups.map((group) => (
                    <div key={group.groupType} className="mb-2">
                      <p className="mb-1 text-xs text-gray-400">
                        {GROUP_LABELS[group.groupType] ?? group.label}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {group.tags.map((tag) => (
                          <button
                            key={tag.id}
                            onClick={() => toggleTag(tag.id)}
                            className={`rounded-full border px-2 py-0.5 text-xs transition-colors ${
                              selectedTagIds.includes(tag.id)
                                ? 'border-orange-400 bg-orange-100 text-orange-700'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-orange-300'
                            }`}
                          >
                            {tag.nameVi}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => saveTags(item.id)}
                      className="rounded-md bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
                    >
                      Lưu nhãn
                    </button>
                    <button
                      onClick={() => setEditingTagsFor(null)}
                      className="rounded-md border px-3 py-1 text-xs text-gray-600 hover:bg-gray-50"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

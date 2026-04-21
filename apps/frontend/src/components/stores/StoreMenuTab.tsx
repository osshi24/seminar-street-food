'use client';

import { useEffect, useRef, useState } from 'react';
import {
  getMenuItemsByStoreId,
  addMenuItemByStoreId,
  removeMenuItemByStoreId,
  updateMenuItemByStoreId,
  generateMenuItemImageUploadUrlByStoreId,
  deleteMenuItemImageByStoreId,
} from '../../lib/api/stores';
import { fetchTags } from '../../lib/api/tags';
import type { TagGroup } from '../../lib/api/tags';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';

interface MenuItemData {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  tags?: { id: number; nameVi: string }[];
}

type DialogMode = 'add' | 'edit' | null;

const GROUP_LABELS: Record<string, string> = {
  dish_type: 'Loại món',
  flavor: 'Khẩu vị',
  allergen: 'Dị ứng',
};

const initialForm = { name: '', description: '', price: '' };

interface Props {
  storeId: string;
}

export default function StoreMenuTab({ storeId }: Props) {
  const [items, setItems] = useState<MenuItemData[]>([]);
  const [tagGroups, setTagGroups] = useState<TagGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [editingItem, setEditingItem] = useState<MenuItemData | null>(null);
  const [form, setForm] = useState(initialForm);
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await getMenuItemsByStoreId(storeId);
      setItems(res.data || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    fetchTags().then((d) => setTagGroups(d.groups)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  function openAdd() {
    setForm(initialForm);
    setSelectedTagIds([]);
    setImageFile(null);
    setImagePreviewUrl(null);
    setImageError(null);
    setRemoveCurrentImage(false);
    setError(null);
    setEditingItem(null);
    setDialog('add');
  }

  function openEdit(item: MenuItemData) {
    setEditingItem(item);
    setForm({
      name: item.name,
      description: item.description ?? '',
      price: String(item.price),
    });
    setSelectedTagIds(item.tags?.map((t) => t.id) ?? []);
    setImageFile(null);
    setImagePreviewUrl(null);
    setImageError(null);
    setRemoveCurrentImage(false);
    setError(null);
    setDialog('edit');
  }

  function closeDialog() {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(null);
    setImagePreviewUrl(null);
    setDialog(null);
    setEditingItem(null);
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
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
    setRemoveCurrentImage(false);
  }

  function clearSelectedImage() {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function uploadImage(itemId: string, file: File) {
    const { presignedUrl } = await generateMenuItemImageUploadUrlByStoreId(storeId, itemId, file.type);
    const res = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    });
    if (!res.ok) throw new Error('Upload ảnh thất bại');
  }

  function toggleTag(id: number) {
    setSelectedTagIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id],
    );
  }

  async function handleAdd() {
    if (!form.name.trim() || !form.price) return;
    setSubmitting(true);
    setError(null);
    try {
      const createdRes = await addMenuItemByStoreId(storeId, {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price: Number(form.price),
      });
      const created = createdRes?.data ?? createdRes;

      if (imageFile && created?.id) {
        await uploadImage(created.id, imageFile);
      }

      if (selectedTagIds.length > 0 && created?.id) {
        await updateMenuItemByStoreId(storeId, created.id, { tagIds: selectedTagIds });
      }

      closeDialog();
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit() {
    if (!editingItem || !form.name.trim() || !form.price) return;
    setSubmitting(true);
    setError(null);
    try {
      await updateMenuItemByStoreId(storeId, editingItem.id, {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        price: Number(form.price),
        tagIds: selectedTagIds,
      });

      if (imageFile) {
        await uploadImage(editingItem.id, imageFile);
      } else if (removeCurrentImage && editingItem.imageUrl) {
        await deleteMenuItemImageByStoreId(storeId, editingItem.id);
      }

      closeDialog();
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  }

  function handleRemove(id: string) {
    setDeleteTargetId(id);
  }

  async function confirmDelete() {
    if (!deleteTargetId) return;
    const id = deleteTargetId;
    setDeleteTargetId(null);
    setDeletingId(id);
    try {
      await removeMenuItemByStoreId(storeId, id);
      load();
    } finally {
      setDeletingId(null);
    }
  }

  const isAdd = dialog === 'add';
  const isEdit = dialog === 'edit';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {!loading && `${items.length} món ăn`}
        </p>
        <button
          onClick={openAdd}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          + Thêm món
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl border bg-gray-50 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <div className="text-4xl mb-3">🍽️</div>
          <p className="text-gray-500 font-medium text-sm">Chưa có món ăn nào</p>
          <button
            onClick={openAdd}
            className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Thêm món đầu tiên
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-xl bg-white border shadow-sm flex items-start gap-4 p-4 hover:shadow-md transition-shadow"
            >
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="h-20 w-20 flex-shrink-0 rounded-lg object-cover border"
                />
              ) : (
                <div className="h-20 w-20 flex-shrink-0 rounded-lg bg-gray-100 border flex items-center justify-center text-2xl">
                  🍽️
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900">{item.name}</p>
                {item.description && (
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
                )}
                <p className="mt-1 text-sm font-bold text-red-600">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                </p>
                {item.tags && item.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.tags.map((t) => (
                      <span
                        key={t.id}
                        className="rounded-full bg-orange-50 border border-orange-200 px-2 py-0.5 text-xs text-orange-600 font-medium"
                      >
                        {t.nameVi}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <button
                  onClick={() => openEdit(item)}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Chỉnh sửa
                </button>
                <button
                  onClick={() => handleRemove(item.id)}
                  disabled={deletingId === item.id}
                  className="rounded-lg border border-red-100 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  {deletingId === item.id ? 'Đang xóa...' : 'Xóa'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTargetId} onOpenChange={(open) => { if (!open) setDeleteTargetId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa món ăn</DialogTitle>
            <DialogDescription>
              Bạn có chắc muốn xóa món ăn này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTargetId(null)}>Hủy</Button>
            <Button
              variant="destructive"
              onClick={() => void confirmDelete()}
            >
              Xóa món ăn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / Edit Dialog */}
      {(isAdd || isEdit) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeDialog(); }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-4 flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-900">
                {isAdd ? 'Thêm món mới' : 'Chỉnh sửa món'}
              </h2>
              <button
                onClick={closeDialog}
                className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tên món <span className="text-red-500">*</span>
                </label>
                <input
                  placeholder="Ví dụ: Bún bò Huế"
                  value={form.name}
                  maxLength={255}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mô tả</label>
                <textarea
                  placeholder="Mô tả ngắn về món ăn..."
                  value={form.description}
                  maxLength={500}
                  rows={3}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none resize-none"
                />
                <p className="text-right text-xs text-gray-400 mt-1">{form.description.length}/500</p>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Giá (VNĐ) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="Ví dụ: 35000"
                    min={0}
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-12 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">₫</span>
                </div>
                {form.price && Number(form.price) >= 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(form.price))}
                  </p>
                )}
              </div>

              {/* Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ảnh món ăn</label>

                {isEdit && editingItem?.imageUrl && !removeCurrentImage && !imagePreviewUrl && (
                  <div className="mb-3 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <img src={editingItem.imageUrl} alt="Ảnh hiện tại" className="h-16 w-16 rounded-lg object-cover border" />
                    <div>
                      <p className="text-xs font-medium text-gray-600">Ảnh hiện tại</p>
                      <button type="button" onClick={() => setRemoveCurrentImage(true)} className="mt-1 text-xs text-red-500 hover:underline">
                        Xóa ảnh này
                      </button>
                    </div>
                  </div>
                )}

                {isEdit && removeCurrentImage && !imagePreviewUrl && (
                  <div className="mb-3 flex items-center justify-between rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
                    <span className="text-xs text-red-600 font-medium">Ảnh sẽ bị xóa khi lưu</span>
                    <button type="button" onClick={() => setRemoveCurrentImage(false)} className="text-xs text-gray-600 hover:underline ml-3">
                      Hủy xóa
                    </button>
                  </div>
                )}

                {imagePreviewUrl && (
                  <div className="mb-3 flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <img src={imagePreviewUrl} alt="Ảnh mới" className="h-16 w-16 rounded-lg object-cover border" />
                    <div>
                      <p className="text-xs font-medium text-gray-600">Ảnh mới</p>
                      <button type="button" onClick={clearSelectedImage} className="mt-1 text-xs text-red-500 hover:underline">
                        Bỏ chọn
                      </button>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border file:border-gray-300 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-gray-700 hover:file:bg-gray-50 cursor-pointer"
                />
                <p className="mt-1 text-xs text-gray-400">JPG, PNG, WebP · Tối đa 5MB</p>
                {imageError && <p className="mt-1 text-xs text-red-600">{imageError}</p>}
              </div>

              {/* Tags */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-gray-700">Nhãn dán</label>
                  {selectedTagIds.length > 0 && (
                    <button type="button" onClick={() => setSelectedTagIds([])} className="text-xs text-gray-400 hover:text-gray-600">
                      Bỏ chọn tất cả
                    </button>
                  )}
                </div>
                {tagGroups.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">Đang tải danh sách nhãn...</p>
                ) : (
                  <div className="rounded-xl border border-gray-200 p-4 space-y-4">
                    {tagGroups.map((group) => (
                      <div key={group.groupType}>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                          {GROUP_LABELS[group.groupType] ?? group.label}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {group.tags.map((tag) => (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() => toggleTag(tag.id)}
                              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                selectedTagIds.includes(tag.id)
                                  ? 'border-orange-400 bg-orange-100 text-orange-700'
                                  : 'border-gray-200 bg-white text-gray-600 hover:border-orange-300 hover:text-orange-600'
                              }`}
                            >
                              {tag.nameVi}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {selectedTagIds.length > 0 && (
                  <p className="mt-1.5 text-xs text-blue-600 font-medium">Đã chọn {selectedTagIds.length} nhãn</p>
                )}
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 border-t px-6 py-4 flex-shrink-0">
              <button
                onClick={closeDialog}
                disabled={submitting}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={isAdd ? handleAdd : handleEdit}
                disabled={submitting || !form.name.trim() || !form.price}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Đang lưu...' : isAdd ? 'Thêm món' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

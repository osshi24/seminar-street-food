'use client';

import { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import {
  generateImageUploadUrl,
  confirmImageUpload,
  deleteStoreImage,
  type StoreImageItem,
} from '../../lib/api/stores';

interface ImageUploaderProps {
  images: StoreImageItem[];
  onImagesChange: () => void;
}

export default function ImageUploader({ images, onImagesChange }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Chỉ hỗ trợ JPG, PNG, WebP');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Kích thước tối đa 5MB');
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // 1. Get presigned URL from backend
      const { presignedUrl, imageId } = await generateImageUploadUrl(file.type);

      // 2. Upload directly to MinIO
      const uploadRes = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
      if (!uploadRes.ok) throw new Error('Upload failed');

      // 3. Confirm upload
      await confirmImageUpload(imageId);

      onImagesChange();
    } catch (err) {
      setError((err as Error).message || 'Upload thất bại');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }, [onImagesChange]);

  const handleDelete = useCallback(async (imageId: string) => {
    if (!confirm('Xóa ảnh này?')) return;
    setDeletingId(imageId);
    try {
      await deleteStoreImage(imageId);
      onImagesChange();
    } catch {
      setError('Xóa ảnh thất bại');
    } finally {
      setDeletingId(null);
    }
  }, [onImagesChange]);

  return (
    <div className="space-y-4">
      {/* Upload button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || images.length >= 10}
          className="flex items-center gap-2 rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-600 hover:bg-blue-100 disabled:opacity-50 transition-colors"
        >
          {uploading ? (
            <>
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Đang tải lên...
            </>
          ) : (
            <>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Thêm ảnh
            </>
          )}
        </button>
        <span className="text-xs text-gray-400">{images.length}/10 ảnh · JPG, PNG, WebP · Tối đa 5MB</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {/* Image grid */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img) => (
            <div key={img.id} className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200">
              <Image
                src={img.url}
                alt="Store image"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
              {img.isInDraft && (
                <span className="absolute top-1 left-1 rounded bg-yellow-400 px-1.5 py-0.5 text-[10px] font-bold text-yellow-900">
                  Chờ duyệt
                </span>
              )}
              <button
                type="button"
                onClick={() => handleDelete(img.id)}
                disabled={deletingId === img.id}
                className="absolute top-1 right-1 rounded-full bg-black/50 p-1 text-white opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all disabled:opacity-50"
              >
                {deletingId === img.id ? (
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
          Chưa có ảnh nào. Thêm ảnh để gian hàng hấp dẫn hơn!
        </div>
      )}
    </div>
  );
}

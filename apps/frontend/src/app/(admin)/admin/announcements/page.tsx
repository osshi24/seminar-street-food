/* eslint-disable react/no-unescaped-entities */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import AnnouncementRecipientPicker from '../../../../components/admin/AnnouncementRecipientPicker';
import { listAdminStores, type AdminStoreListItem } from '../../../../lib/api/admin-stores';
import {
  createAnnouncement,
  listAnnouncements,
  sendAnnouncement,
  updateAnnouncementDraft,
  type Announcement,
  type RecipientMode,
} from '../../../../lib/api/admin-announcements';

const MODE_LABELS: Record<RecipientMode, string> = {
  single_store: '1 gian hàng',
  multi_store: 'Nhiều gian hàng',
  all_stores: 'Tất cả gian hàng',
};

export default function AdminAnnouncementsPage() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [mode, setMode] = useState<RecipientMode>('single_store');
  const [storeIds, setStoreIds] = useState<string[]>([]);

  const [stores, setStores] = useState<AdminStoreListItem[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [history, setHistory] = useState<Announcement[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const loadStores = useCallback(async () => {
    setStoresLoading(true);
    try {
      const res = await listAdminStores({ page: 1, limit: 100 });
      setStores(res.data.items ?? []);
      if ((res.data.items ?? []).length > 0 && storeIds.length === 0) {
        setStoreIds([res.data.items[0].id]);
      }
    } finally {
      setStoresLoading(false);
    }
  }, [storeIds.length]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await listAnnouncements({ page: 1, limit: 20 });
      setHistory(res.data.items ?? []);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStores();
    loadHistory();
  }, [loadStores, loadHistory]);

  const canSubmit = useMemo(() => {
    if (!title.trim() || !body.trim()) return false;
    if (mode === 'all_stores') return true;
    return storeIds.length > 0;
  }, [title, body, mode, storeIds.length]);

  const handleSubmit = async (action: 'save_draft' | 'send') => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const payload: any = {
        title: title.trim(),
        body: body.trim(),
        recipientMode: mode,
        action,
      };
      if (mode !== 'all_stores') payload.storeIds = storeIds;
      let a: Announcement;
      if (editingId) {
        // Update draft first
        const updated = await updateAnnouncementDraft(editingId, {
          title: payload.title,
          body: payload.body,
          recipientMode: payload.recipientMode,
          storeIds: payload.storeIds,
        });
        a = updated.data;
        if (action === 'send') {
          const sent = await sendAnnouncement(editingId);
          a = sent.data;
        }
      } else {
        const res = await createAnnouncement(payload);
        a = res.data;
      }

      if (action === 'save_draft') setSuccess(editingId ? 'Đã cập nhật nháp.' : 'Đã lưu nháp.');
      else {
        setSuccess(
          `Đã gửi. Người nhận: ${a.recipientCount}.` +
            (a.failedEmailDetails?.length ? ` Email lỗi: ${a.failedEmailDetails.length}.` : ''),
        );
      }

      // reset form after success
      setEditingId(null);
      setTitle('');
      setBody('');
      setMode('single_store');
      await loadHistory();
    } catch (e: unknown) {
      setError((e as any)?.response?.data?.message ?? 'Thao tác thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (h: Announcement) => {
    setEditingId(h.id);
    setTitle(h.title ?? '');
    setBody(h.body ?? '');
    setMode(h.recipientMode);
    setStoreIds(h.storeIds ?? []);
    setError(null);
    setSuccess(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const quickSendDraft = async (h: Announcement) => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const sent = await sendAnnouncement(h.id);
      const a = sent.data;
      setSuccess(
        `Đã gửi. Người nhận: ${a.recipientCount}.` +
          (a.failedEmailDetails?.length ? ` Email lỗi: ${a.failedEmailDetails.length}.` : ''),
      );
      await loadHistory();
    } catch (e: unknown) {
      setError((e as any)?.response?.data?.message ?? 'Gửi nháp thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">Gửi thông báo</h1>
        <p className="mt-1 text-sm text-gray-500">Soạn và gửi thông báo tới chủ gian hàng.</p>
      </div>

      {(error || success) && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-800'
          }`}
        >
          {error ?? success}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Form */}
        <div className="rounded-xl border bg-white p-5">
          <div className="space-y-4">
            {editingId && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                Đang chỉnh sửa nháp. ID: <span className="font-mono">{editingId.slice(0, 8)}</span>
                <button
                  onClick={() => {
                    setEditingId(null);
                    setTitle('');
                    setBody('');
                    setMode('single_store');
                    setStoreIds([]);
                  }}
                  className="ml-3 text-blue-700 underline"
                  type="button"
                >
                  Hủy chỉnh sửa
                </button>
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tiêu đề</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Ví dụ: Thông báo bảo trì hệ thống"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Nội dung</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                placeholder="Nhập nội dung thông báo..."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Đối tượng nhận</label>
              {storesLoading ? (
                <p className="text-sm text-gray-500">Đang tải danh sách gian hàng...</p>
              ) : (
                <AnnouncementRecipientPicker
                  mode={mode}
                  stores={stores}
                  storeIds={storeIds}
                  onModeChange={(m) => {
                    setMode(m);
                    if (m === 'single_store' && storeIds.length > 1) setStoreIds(storeIds.slice(0, 1));
                  }}
                  onStoreIdsChange={setStoreIds}
                />
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                onClick={() => handleSubmit('save_draft')}
                disabled={submitting || !canSubmit}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {submitting ? 'Đang xử lý...' : 'Lưu nháp'}
              </button>
              <button
                onClick={() => handleSubmit('send')}
                disabled={submitting || !canSubmit}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Đang gửi...' : 'Gửi'}
              </button>
              <span className="text-xs text-gray-500">
                Mode: <span className="font-medium">{MODE_LABELS[mode]}</span>
              </span>
            </div>
          </div>
        </div>

        {/* History */}
        <div className="rounded-xl border bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800">Lịch sử</h2>
            <button
              onClick={loadHistory}
              className="text-xs font-medium text-blue-600 hover:underline disabled:opacity-50"
              disabled={historyLoading}
            >
              Tải lại
            </button>
          </div>

          {historyLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">Chưa có thông báo nào.</p>
          ) : (
            <div className="space-y-3">
              {history.map((h) => (
                <div key={h.id} className="rounded-lg border px-3 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{h.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-gray-600">{h.body}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        h.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {h.status === 'sent' ? 'Đã gửi' : 'Nháp'}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-gray-500">
                    <span>Recipients: {h.recipientCount ?? 0}</span>
                    <span>•</span>
                    <span>{new Date(h.createdAt).toLocaleString('vi-VN')}</span>
                    {h.failedEmailDetails?.length ? (
                      <>
                        <span>•</span>
                        <span className="text-red-600">Email lỗi: {h.failedEmailDetails.length}</span>
                      </>
                    ) : null}
                  </div>
                  {h.status === 'draft' && (
                    <div className="mt-2 flex gap-3">
                      <button
                        onClick={() => startEdit(h)}
                        className="text-xs font-medium text-blue-600 hover:underline disabled:opacity-50"
                        disabled={submitting}
                        type="button"
                      >
                        Sửa nháp
                      </button>
                      <button
                        onClick={() => quickSendDraft(h)}
                        className="text-xs font-medium text-green-700 hover:underline disabled:opacity-50"
                        disabled={submitting}
                        type="button"
                      >
                        Gửi nháp
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


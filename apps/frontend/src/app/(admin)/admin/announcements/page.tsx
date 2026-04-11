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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">📨 Gửi thông báo</h1>
          <p className="mt-2 text-lg text-slate-600">Soạn và gửi thông báo tới các chủ gian hàng một cách hiệu quả</p>
        </div>

        {/* Alert */}
        {(error || success) && (
          <div
            className={`mb-6 rounded-xl border-2 px-5 py-4 text-base font-medium animate-in fade-in slide-in-from-top-2 ${
              error
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-green-200 bg-green-50 text-green-700'
            }`}
          >
            {error ? '❌ ' : '✓ '}
            {error ?? success}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          {/* Main Form */}
          <div className="space-y-6">
            {/* Card: Compose */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm hover:shadow-md transition-shadow">
              {editingId && (
                <div className="mb-6 rounded-xl border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 px-5 py-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-blue-900">✎ Đang chỉnh sửa nháp</p>
                    <p className="text-xs text-blue-700">ID: <span className="font-mono bg-blue-100 px-2 py-1 rounded">{editingId.slice(0, 12)}</span></p>
                  </div>
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setTitle('');
                      setBody('');
                      setMode('single_store');
                      setStoreIds([]);
                    }}
                    className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                    type="button"
                  >
                    Hủy
                  </button>
                </div>
              )}

              {/* Title Field */}
              <div className="mb-6">
                <label className="mb-2.5 block text-sm font-bold text-slate-900">Tiêu đề</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-base text-slate-900 placeholder-slate-400 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none"
                  placeholder="Ví dụ: Thông báo bảo trì hệ thống..."
                />
                <div className="mt-1.5 flex justify-between">
                  <p className="text-xs text-slate-500">Tối đa 100 ký tự</p>
                  <p className={`text-xs font-medium ${title.length > 90 ? 'text-amber-600' : 'text-slate-500'}`}>
                    {title.length}/100
                  </p>
                </div>
              </div>

              {/* Content Field */}
              <div className="mb-6">
                <label className="mb-2.5 block text-sm font-bold text-slate-900">Nội dung</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={8}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-base text-slate-900 placeholder-slate-400 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none resize-none"
                  placeholder="Nhập nội dung thông báo chi tiết ở đây..."
                />
                <div className="mt-1.5 flex justify-between">
                  <p className="text-xs text-slate-500">Không giới hạn ký tự</p>
                  <p className="text-xs text-slate-500 font-medium">{body.length} ký tự</p>
                </div>
              </div>

              {/* Recipient Section */}
              <div className="mb-8 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 p-6 border border-slate-200">
                <label className="mb-4 block text-sm font-bold text-slate-900">👥 Đối tượng nhận</label>
                {storesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="space-y-3 text-center">
                      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
                      <p className="text-sm text-slate-600">Đang tải danh sách gian hàng...</p>
                    </div>
                  </div>
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

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => handleSubmit('save_draft')}
                  disabled={submitting || !canSubmit}
                  className="px-5 py-3 rounded-xl border-2 border-slate-300 bg-white text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '⏳ Đang xử lý...' : '📝 Lưu nháp'}
                </button>
                <button
                  onClick={() => handleSubmit('send')}
                  disabled={submitting || !canSubmit}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '⏳ Đang gửi...' : '✈️ Gửi ngay'}
                </button>
                <div className="ml-auto flex items-center gap-3">
                  <div className="h-8 w-px bg-slate-300"></div>
                  <div className="text-sm">
                    <p className="text-xs text-slate-600">Chế độ</p>
                    <p className="font-bold text-slate-900">{MODE_LABELS[mode]}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar: History */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow h-fit lg:sticky lg:top-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                📋 Lịch sử
              </h2>
              <button
                onClick={loadHistory}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
                disabled={historyLoading}
              >
                🔄 Tải lại
              </button>
            </div>

            {historyLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-lg bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : history.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-3xl mb-2">📭</p>
                <p className="text-sm text-slate-500">Chưa có thông báo nào</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className={`rounded-xl p-4 border-2 transition-all hover:shadow-md ${
                      h.status === 'sent'
                        ? 'border-green-200 bg-green-50'
                        : 'border-amber-200 bg-amber-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-sm text-slate-900 line-clamp-2">{h.title}</h3>
                      <span
                        className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                          h.status === 'sent'
                            ? 'bg-green-200 text-green-900'
                            : 'bg-amber-200 text-amber-900'
                        }`}
                      >
                        {h.status === 'sent' ? '✓ Đã gửi' : '◐ Nháp'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 line-clamp-2 mb-3">{h.body}</p>
                    <div className="space-y-1 mb-3 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span>📬 Người nhận:</span>
                        <span className="font-bold">{h.recipientCount ?? 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>📅 Ngày:</span>
                        <span className="font-mono text-xs">{new Date(h.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                      {h.failedEmailDetails?.length ? (
                        <div className="flex justify-between text-red-600">
                          <span>❌ Email lỗi:</span>
                          <span className="font-bold">{h.failedEmailDetails.length}</span>
                        </div>
                      ) : null}
                    </div>
                    {h.status === 'draft' && (
                      <div className="border-t border-amber-200 pt-3 flex gap-2">
                        <button
                          onClick={() => startEdit(h)}
                          className="flex-1 px-2 py-2 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold hover:bg-blue-200 transition-colors disabled:opacity-50"
                          disabled={submitting}
                          type="button"
                        >
                          ✎ Sửa
                        </button>
                        <button
                          onClick={() => quickSendDraft(h)}
                          className="flex-1 px-2 py-2 rounded-lg bg-green-100 text-green-700 text-xs font-bold hover:bg-green-200 transition-colors disabled:opacity-50"
                          disabled={submitting}
                          type="button"
                        >
                          ✈️ Gửi
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
    </div>
  );
}


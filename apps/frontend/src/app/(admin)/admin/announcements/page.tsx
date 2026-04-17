/* eslint-disable react/no-unescaped-entities */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import AnnouncementFormSection from '../../../../components/admin/announcements/AnnouncementFormSection';
import AnnouncementHistoryList from '../../../../components/admin/announcements/AnnouncementHistoryList';
import { listAdminStores, type AdminStoreListItem } from '../../../../lib/api/admin-stores';
import {
  createAnnouncement,
  listAnnouncements,
  sendAnnouncement,
  updateAnnouncementDraft,
  type Announcement,
  type RecipientMode,
  type AnnouncementStatus,
} from '../../../../lib/api/admin-announcements';

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
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyStatus, setHistoryStatus] = useState<AnnouncementStatus | undefined>();
  const historyLimit = 10;

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
      const res = await listAnnouncements({ page: historyPage, limit: historyLimit });
      setHistory(res.data.items ?? []);
      setHistoryTotal(res.data.total ?? 0);
    } finally {
      setHistoryLoading(false);
    }
  }, [historyPage]);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const canSubmit = useMemo(() => {
    if (!title.trim() || !body.trim()) return false;
    if (mode === 'all_stores') return true;
    return storeIds.length > 0;
  }, [title, body, mode, storeIds.length]);

  const historyTotalPages = Math.ceil(historyTotal / historyLimit);
  const draftCount = history.filter((h) => h.status === 'draft').length;
  const sentCount = history.filter((h) => h.status === 'sent').length;

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

      setSuccess(
        action === 'save_draft'
          ? editingId
            ? 'Đã cập nhật nháp.'
            : 'Đã lưu nháp.'
          : `✓ Gửi thành công! ${a.recipientCount} người đã nhận.` +
            (a.failedEmailDetails?.length ? ` (${a.failedEmailDetails.length} email bị lỗi)` : '')
      );

      setEditingId(null);
      setTitle('');
      setBody('');
      setMode('single_store');
      setHistoryPage(1);
      await loadHistory();
    } catch (e: unknown) {
      setError((e as any)?.response?.data?.message ?? 'Thao tác thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (a: Announcement) => {
    setEditingId(a.id);
    setTitle(a.title ?? '');
    setBody(a.body ?? '');
    setMode(a.recipientMode);
    setStoreIds(a.storeIds ?? []);
    setError(null);
    setSuccess(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setBody('');
    setMode('single_store');
    setStoreIds([]);
  };

  const handleQuickSend = async (a: Announcement) => {
    setSubmitting(true);
    setError(null);
    try {
      const sent = await sendAnnouncement(a.id);
      setSuccess(
        `✓ Gửi thành công! ${sent.data.recipientCount} người đã nhận.` +
        (sent.data.failedEmailDetails?.length ? ` (${sent.data.failedEmailDetails.length} email bị lỗi)` : '')
      );
      setHistoryPage(1);
      await loadHistory();
    } catch (e: unknown) {
      setError((e as any)?.response?.data?.message ?? 'Gửi nháp thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-8 shadow-sm">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-3xl font-bold text-gray-900">📢 Gửi Thông Báo</h1>
          <p className="mt-2 text-sm text-gray-600">Soạn và gửi thông báo tới chủ gian hàng. Thông báo sẽ được gửi qua email và in-app notification.</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Alert Messages */}
        {(error || success) && (
          <div
            className={`mb-6 rounded-lg border-l-4 px-4 py-3 text-sm animate-in ${
              error
                ? 'border-red-500 bg-red-50 text-red-800'
                : 'border-green-500 bg-green-50 text-green-800'
            }`}
          >
            <div className="font-medium">{error ? '⚠️ Lỗi' : '✓ Thành công'}</div>
            <div className="mt-1">{error ?? success}</div>
          </div>
        )}

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-600">Tổng thông báo</div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{historyTotal}</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-700">💾 Nháp</div>
            <div className="mt-2 text-3xl font-bold text-amber-700">{draftCount}</div>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-700">✓ Đã gửi</div>
            <div className="mt-2 text-3xl font-bold text-emerald-700">{sentCount}</div>
          </div>
        </div>

        {/* Main Content - 2 Column Layout */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left: Form Section - 2/3 width */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
              <h2 className="mb-6 text-xl font-bold text-gray-900">📝 Soạn Thông Báo</h2>
              <AnnouncementFormSection
                editingId={editingId}
                title={title}
                body={body}
                mode={mode}
                storeIds={storeIds}
                stores={stores}
                storesLoading={storesLoading}
                submitting={submitting}
                onTitleChange={setTitle}
                onBodyChange={setBody}
                onModeChange={setMode}
                onStoreIdsChange={setStoreIds}
                onSaveDraft={() => handleSubmit('save_draft')}
                onSend={() => handleSubmit('send')}
                onCancelEdit={handleCancelEdit}
                canSubmit={canSubmit}
              />
            </div>
          </div>

          {/* Right: History Section - 1/3 width */}
          <div className="lg:col-span-1">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm h-fit sticky top-8">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">📋 Lịch Sử</h2>
                <button
                  onClick={() => loadHistory()}
                  disabled={historyLoading}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-50"
                  title="Tải lại lịch sử"
                >
                  🔄
                </button>
              </div>

              {/* Quick Stats in Sidebar */}
              <div className="mb-4 space-y-2">
                <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2">
                  <span className="text-xs font-medium text-amber-700">💾 Nháp</span>
                  <span className="text-lg font-bold text-amber-700">{draftCount}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2">
                  <span className="text-xs font-medium text-green-700">✓ Gửi</span>
                  <span className="text-lg font-bold text-green-700">{sentCount}</span>
                </div>
              </div>

              {/* History List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {historyLoading ? (
                  <div className="space-y-2">
                    <div className="h-20 rounded-lg bg-gray-100 animate-pulse"></div>
                    <div className="h-20 rounded-lg bg-gray-100 animate-pulse"></div>
                    <div className="h-20 rounded-lg bg-gray-100 animate-pulse"></div>
                  </div>
                ) : history.length === 0 ? (
                  <div className="py-6 text-center text-sm text-gray-500">
                    <div className="text-2xl mb-2">📭</div>
                    Chưa có thông báo
                  </div>
                ) : (
                  history.slice(0, 5).map((h) => {
                    const recipientStores = h.storeIds
                      ? stores.filter((s) => h.storeIds.includes(s.id))
                      : [];

                    return (
                      <div
                        key={h.id}
                        className={`rounded-lg border p-3 text-xs cursor-pointer transition-all hover:shadow-md ${
                          h.status === 'sent'
                            ? 'border-green-200 bg-green-50 hover:bg-green-100'
                            : 'border-amber-200 bg-amber-50 hover:bg-amber-100'
                        }`}
                      >
                        <div className="font-medium text-gray-900 line-clamp-2">{h.title}</div>

                        {/* Recipient Info */}
                        <div className="mt-2 space-y-1 text-gray-600">
                          <div className="flex items-center gap-1">
                            <span>👥</span>
                            <span className="font-medium">{h.recipientCount} người</span>
                          </div>

                          {/* Store Names */}
                          <div className="flex items-start gap-1">
                            <span>🏪</span>
                            <div className="flex-1">
                              {h.recipientMode === 'all_stores' ? (
                                <span className="text-gray-500">Tất cả gian hàng</span>
                              ) : recipientStores.length > 0 ? (
                                <div className="space-y-0.5">
                                  {recipientStores.slice(0, 2).map((s) => (
                                    <div key={s.id} className="text-gray-500 truncate">
                                      {s.name}
                                    </div>
                                  ))}
                                  {recipientStores.length > 2 && (
                                    <div className="text-gray-400 text-[10px]">
                                      +{recipientStores.length - 2} gian khác
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status & Actions */}
                        <div className="mt-2 flex items-center justify-between">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              h.status === 'sent'
                                ? 'bg-green-200 text-green-800'
                                : 'bg-amber-200 text-amber-800'
                            }`}
                          >
                            {h.status === 'sent' ? '✓ Gửi' : '💾 Nháp'}
                          </span>
                          {h.status === 'draft' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleStartEdit(h)}
                                disabled={submitting}
                                className="text-xs font-medium text-blue-600 hover:underline disabled:opacity-50"
                                type="button"
                              >
                                Sửa
                              </button>
                              <button
                                onClick={() => handleQuickSend(h)}
                                disabled={submitting}
                                className="text-xs font-medium text-green-600 hover:underline disabled:opacity-50"
                                type="button"
                              >
                                Gửi
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {history.length > 5 && (
                <button
                  type="button"
                  className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Xem tất cả ({historyTotal})
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


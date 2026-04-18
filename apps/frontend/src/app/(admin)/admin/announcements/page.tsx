'use client';

/* eslint-disable react/no-unescaped-entities */

import { useCallback, useEffect, useMemo, useState } from 'react';
import AnnouncementFormSection from '../../../../components/admin/announcements/AnnouncementFormSection';
import AdminMetricGrid from '../../../../components/admin/common/AdminMetricGrid';
import AdminPageHeader from '../../../../components/admin/common/AdminPageHeader';
import { listAdminStores, type AdminStoreListItem } from '../../../../lib/api/admin-stores';
import {
  createAnnouncement,
  listAnnouncements,
  sendAnnouncement,
  updateAnnouncementDraft,
  type Announcement,
  type RecipientMode,
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
  const historyLimit = 10;

  const loadStores = useCallback(async () => {
    setStoresLoading(true);
    try {
      const res = await listAdminStores({ page: 1, limit: 100 });
      const nextStores = res.data.items ?? [];
      setStores(nextStores);
      if (nextStores.length > 0 && storeIds.length === 0) {
        setStoreIds([nextStores[0].id]);
      }
    } finally {
      setStoresLoading(false);
    }
  }, [storeIds.length]);

  const loadHistory = useCallback(async (page = historyPage) => {
    setHistoryLoading(true);
    try {
      const res = await listAnnouncements({ page, limit: historyLimit });
      setHistory(res.data.items ?? []);
      setHistoryTotal(res.data.total ?? 0);
    } finally {
      setHistoryLoading(false);
    }
  }, [historyLimit, historyPage]);

  useEffect(() => {
    void loadStores();
  }, [loadStores]);

  useEffect(() => {
    void loadHistory(historyPage);
  }, [historyPage, loadHistory]);

  const canSubmit = useMemo(() => {
    if (!title.trim() || !body.trim()) {
      return false;
    }
    if (mode === 'all_stores') {
      return true;
    }
    return storeIds.length > 0;
  }, [body, mode, storeIds.length, title]);

  const historyTotalPages = Math.max(1, Math.ceil(historyTotal / historyLimit));
  const draftCount = history.filter((item) => item.status === 'draft').length;
  const sentCount = history.filter((item) => item.status === 'sent').length;

  const stats = [
    {
      label: 'Tổng thông báo',
      value: historyTotal,
      tone: 'blue' as const,
      icon: '📣',
      description: 'Tổng số thông báo đã được soạn trong hệ thống admin.',
    },
    {
      label: 'Nháp trên trang',
      value: draftCount,
      tone: 'amber' as const,
      icon: '📝',
      description: 'Các thông báo đang ở trạng thái nháp trong danh sách hiện tại.',
    },
    {
      label: 'Đã gửi trên trang',
      value: sentCount,
      tone: 'emerald' as const,
      icon: '✉️',
      description: 'Số thông báo đã gửi thành công trong trang lịch sử đang xem.',
    },
  ];

  const refreshFirstPage = async () => {
    if (historyPage !== 1) {
      setHistoryPage(1);
      return;
    }

    await loadHistory(1);
  };

  const handleSubmit = async (action: 'save_draft' | 'send') => {
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        title: title.trim(),
        body: body.trim(),
        recipientMode: mode,
        storeIds: mode !== 'all_stores' ? storeIds : undefined,
        action,
      };

      let announcement: Announcement;

      if (editingId) {
        const updated = await updateAnnouncementDraft(editingId, {
          title: payload.title,
          body: payload.body,
          recipientMode: payload.recipientMode,
          storeIds: payload.storeIds,
        });

        announcement = updated.data;

        if (action === 'send') {
          const sent = await sendAnnouncement(editingId);
          announcement = sent.data;
        }
      } else {
        const res = await createAnnouncement(payload);
        announcement = res.data;
      }

      setSuccess(
        action === 'save_draft'
          ? editingId
            ? 'Đã cập nhật bản nháp.'
            : 'Đã lưu bản nháp mới.'
          : `Đã gửi thành công cho ${announcement.recipientCount} người nhận.`,
      );

      setEditingId(null);
      setTitle('');
      setBody('');
      setMode('single_store');
      setStoreIds(stores[0] ? [stores[0].id] : []);
      await refreshFirstPage();
    } catch (submissionError: unknown) {
      setError(
        (submissionError as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Thao tác thất bại. Vui lòng thử lại.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setTitle(announcement.title ?? '');
    setBody(announcement.body ?? '');
    setMode(announcement.recipientMode);
    setStoreIds(announcement.storeIds ?? []);
    setError(null);
    setSuccess(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setBody('');
    setMode('single_store');
    setStoreIds(stores[0] ? [stores[0].id] : []);
  };

  const handleQuickSend = async (announcement: Announcement) => {
    setSubmitting(true);
    setError(null);

    try {
      const sent = await sendAnnouncement(announcement.id);
      setSuccess(`Đã gửi thành công cho ${sent.data.recipientCount} người nhận.`);
      await refreshFirstPage();
    } catch (sendError: unknown) {
      setError(
        (sendError as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Không thể gửi bản nháp này.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        badge="Outreach"
        title="Gửi thông báo"
        description="Soạn, lưu nháp và phát hành thông báo đến các chủ gian hàng. Mọi nội dung đều được gom về cùng một luồng để admin theo dõi lịch sử gửi dễ hơn."
        meta={
          historyTotal > 0
            ? `Trang ${historyPage}/${historyTotalPages} · tổng ${historyTotal} thông báo`
            : 'Chưa có thông báo nào được tạo'
        }
      />

      <AdminMetricGrid items={stats} />

      {error || success ? (
        <div
          className={`rounded-[28px] border px-5 py-4 text-sm shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)] ${
            error
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          <p className="font-semibold">{error ? 'Có lỗi xảy ra' : 'Thao tác thành công'}</p>
          <p className="mt-1">{error ?? success}</p>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)] sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">
                Soạn nội dung
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                {editingId ? 'Chỉnh sửa bản nháp' : 'Tạo thông báo mới'}
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-500">
              Thông báo sẽ được gửi qua email và in-app notification theo nhóm người nhận bạn chọn.
            </p>
          </div>

          <div className="mt-6">
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
        </section>

        <aside className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">
                Lịch sử
              </p>
              <h3 className="mt-2 text-xl font-semibold text-slate-950">Thông báo gần đây</h3>
            </div>
            <button
              onClick={() => void loadHistory(historyPage)}
              disabled={historyLoading}
              className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Tải lại
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {historyLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-28 animate-pulse rounded-[24px] bg-slate-100" />
              ))
            ) : history.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-slate-200 px-6 py-12 text-center">
                <p className="text-lg font-semibold text-slate-900">Chưa có thông báo nào</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Soạn nội dung đầu tiên ở cột bên trái để bắt đầu lịch sử gửi.
                </p>
              </div>
            ) : (
              history.map((item) => {
                const isDraft = item.status === 'draft';

                return (
                  <div
                    key={item.id}
                    className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{item.title}</p>
                        <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">
                          {item.body}
                        </p>
                      </div>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          isDraft
                            ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                            : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                        }`}
                      >
                        {isDraft ? 'Nháp' : 'Đã gửi'}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                      <span>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                      <span>{item.recipientCount} người nhận</span>
                      {item.failedEmailDetails?.length ? (
                        <span className="text-rose-500">
                          {item.failedEmailDetails.length} email lỗi
                        </span>
                      ) : null}
                    </div>

                    {isDraft ? (
                      <div className="mt-4 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(item)}
                          disabled={submitting}
                          className="rounded-full border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white disabled:opacity-50"
                        >
                          Chỉnh sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleQuickSend(item)}
                          disabled={submitting}
                          className="rounded-full bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
                        >
                          Gửi ngay
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>

          {!historyLoading && historyTotalPages > 1 ? (
            <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-200 pt-5">
              <button
                onClick={() => setHistoryPage((page) => Math.max(1, page - 1))}
                disabled={historyPage === 1}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Trang trước
              </button>
              <span className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                Trang {historyPage}/{historyTotalPages}
              </span>
              <button
                onClick={() => setHistoryPage((page) => Math.min(historyTotalPages, page + 1))}
                disabled={historyPage >= historyTotalPages}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Trang sau
              </button>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

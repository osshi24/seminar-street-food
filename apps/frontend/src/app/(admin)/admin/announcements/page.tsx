'use client';

/* eslint-disable react/no-unescaped-entities */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Megaphone, FileEdit, MailCheck, RefreshCw } from 'lucide-react';
import AnnouncementFormSection from '../../../../components/admin/announcements/AnnouncementFormSection';
import AdminMetricGrid from '../../../../components/admin/common/AdminMetricGrid';
import AdminPageHeader from '../../../../components/admin/common/AdminPageHeader';
import AdminEmptyState from '../../../../components/admin/common/AdminEmptyState';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
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

  const loadHistory = useCallback(
    async (page = historyPage) => {
      setHistoryLoading(true);
      try {
        const res = await listAnnouncements({ page, limit: historyLimit });
        setHistory(res.data.items ?? []);
        setHistoryTotal(res.data.total ?? 0);
      } finally {
        setHistoryLoading(false);
      }
    },
    [historyLimit, historyPage],
  );

  useEffect(() => {
    void loadStores();
  }, [loadStores]);

  useEffect(() => {
    void loadHistory(historyPage);
  }, [historyPage, loadHistory]);

  const canSubmit = useMemo(() => {
    if (!title.trim() || !body.trim()) return false;
    if (mode === 'all_stores') return true;
    return storeIds.length > 0;
  }, [body, mode, storeIds.length, title]);

  const historyTotalPages = Math.max(1, Math.ceil(historyTotal / historyLimit));
  const draftCount = history.filter((item) => item.status === 'draft').length;
  const sentCount = history.filter((item) => item.status === 'sent').length;

  const stats = [
    { label: 'Tổng thông báo', value: historyTotal, tone: 'blue' as const, icon: <Megaphone />, description: 'Đã soạn trong hệ thống.' },
    { label: 'Nháp trên trang', value: draftCount, tone: 'amber' as const, icon: <FileEdit />, description: 'Đang ở trạng thái nháp.' },
    { label: 'Đã gửi trên trang', value: sentCount, tone: 'emerald' as const, icon: <MailCheck />, description: 'Đã gửi thành công.' },
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
    <div className="space-y-5">
      <AdminPageHeader
        badge="Truyền thông"
        title="Gửi thông báo"
        description="Soạn, lưu nháp và phát hành thông báo đến chủ gian hàng."
        meta={
          historyTotal > 0
            ? `Trang ${historyPage}/${historyTotalPages} · tổng ${historyTotal} thông báo`
            : 'Chưa có thông báo nào'
        }
      />

      <AdminMetricGrid items={stats} />

      {error || success ? (
        <div
          className={`rounded-md border px-4 py-2.5 text-sm ${
            error
              ? 'border-rose-200 bg-rose-50 text-rose-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          <p className="font-medium">{error ? 'Có lỗi xảy ra' : 'Thao tác thành công'}</p>
          <p className="mt-0.5 text-xs">{error ?? success}</p>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <Card>
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="text-base">
              {editingId ? 'Chỉnh sửa bản nháp' : 'Tạo thông báo mới'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0 border-b border-slate-100">
            <CardTitle className="text-base">Lịch sử gần đây</CardTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => void loadHistory(historyPage)}
              disabled={historyLoading}
            >
              <RefreshCw />
              Tải lại
            </Button>
          </CardHeader>
          <CardContent className="pt-5">
            <div className="space-y-2">
              {historyLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-20 animate-pulse rounded-md bg-slate-100" />
                ))
              ) : history.length === 0 ? (
                <AdminEmptyState
                  icon={Megaphone}
                  title="Chưa có thông báo"
                  description="Soạn nội dung đầu tiên ở cột bên trái để bắt đầu."
                />
              ) : (
                history.map((item) => {
                  const isDraft = item.status === 'draft';
                  return (
                    <div key={item.id} className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {item.title}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                            {item.body}
                          </p>
                        </div>
                        <Badge variant={isDraft ? 'warning' : 'success'}>
                          {isDraft ? 'Nháp' : 'Đã gửi'}
                        </Badge>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wider text-slate-400">
                        <span>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</span>
                        <span>·</span>
                        <span>{item.recipientCount} người nhận</span>
                        {item.failedEmailDetails?.length ? (
                          <>
                            <span>·</span>
                            <span className="text-rose-500">
                              {item.failedEmailDetails.length} email lỗi
                            </span>
                          </>
                        ) : null}
                      </div>

                      {isDraft ? (
                        <div className="mt-3 flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStartEdit(item)}
                            disabled={submitting}
                          >
                            Chỉnh sửa
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => void handleQuickSend(item)}
                            disabled={submitting}
                          >
                            Gửi ngay
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>

            {!historyLoading && historyTotalPages > 1 ? (
              <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setHistoryPage((page) => Math.max(1, page - 1))}
                  disabled={historyPage === 1}
                >
                  Trước
                </Button>
                <span className="text-xs text-slate-500">
                  Trang {historyPage}/{historyTotalPages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setHistoryPage((page) => Math.min(historyTotalPages, page + 1))}
                  disabled={historyPage >= historyTotalPages}
                >
                  Tiếp
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

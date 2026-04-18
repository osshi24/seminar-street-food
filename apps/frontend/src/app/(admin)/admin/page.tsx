'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import AdminMetricGrid from '../../../components/admin/common/AdminMetricGrid';
import AdminPageHeader from '../../../components/admin/common/AdminPageHeader';
import { getAdminOverview, type AdminOverviewResponse } from '../../../lib/api/admin-overview';

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminOverviewPage() {
  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminOverview()
      .then((data) => {
        setOverview(data);
        setError(null);
      })
      .catch(() => setError('Không thể tải dữ liệu tổng quan admin.'))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    if (!overview) return [];

    return [
      {
        label: 'Gian hàng',
        value: overview.metrics.stores.total,
        tone: 'blue' as const,
        icon: '🏪',
        description: `${overview.metrics.stores.active} đang hoạt động, ${overview.metrics.stores.inactive} tạm ẩn.`,
      },
      {
        label: 'Chủ gian hàng',
        value: overview.metrics.storeOwners.total,
        tone: 'cyan' as const,
        icon: '👥',
        description: `${overview.metrics.storeOwners.pending} hồ sơ mới đang chờ duyệt.`,
      },
      {
        label: 'Báo cáo chờ xử lý',
        value: overview.metrics.reports.pending,
        tone: 'amber' as const,
        icon: '🚨',
        description: `${overview.metrics.reports.total} báo cáo, ${overview.metrics.reports.resolved} đã giải quyết.`,
      },
      {
        label: 'Bình luận',
        value: overview.metrics.reviews.total,
        tone: 'violet' as const,
        icon: '💬',
        description: `${overview.metrics.reviews.hidden} bình luận đang bị ẩn.`,
      },
      {
        label: 'Bản nháp',
        value: overview.metrics.drafts.pending,
        tone: 'rose' as const,
        icon: '📝',
        description: 'Số bản nháp gian hàng đang chờ admin duyệt nội dung.',
      },
      {
        label: 'Ghim vị trí',
        value: overview.metrics.locationPins.pending,
        tone: 'emerald' as const,
        icon: '📍',
        description: `${overview.metrics.locationPins.approved} ghim đã được sử dụng chính thức.`,
      },
      {
        label: 'Nhãn sở thích',
        value: overview.metrics.tags.total,
        tone: 'slate' as const,
        icon: '🏷️',
        description: 'Tổng số nhãn phục vụ phân loại món ăn, khẩu vị và dị ứng.',
      },
      {
        label: 'Thông báo',
        value: overview.metrics.announcements.draft,
        tone: 'blue' as const,
        icon: '📣',
        description: `${overview.metrics.announcements.sent} thông báo đã được gửi đến hệ thống.`,
      },
    ];
  }, [overview]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-44 animate-pulse rounded-[32px] bg-white/70" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-[28px] bg-white/70" />
          ))}
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-6 text-rose-700">
        {error ?? 'Không có dữ liệu tổng quan.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        badge="Admin dashboard"
        title="Điều phối toàn bộ hệ thống"
        description="Tổng quan nhanh các hàng chờ quan trọng của admin: duyệt hồ sơ, kiểm duyệt nội dung, xử lý báo cáo và theo dõi các vùng đang cần ưu tiên."
        meta={`Cập nhật gần nhất: ${new Intl.DateTimeFormat('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).format(new Date())}`}
        action={
          <Link
            href="/admin/reports"
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Ưu tiên xử lý báo cáo
            <span aria-hidden>→</span>
          </Link>
        }
      />

      <AdminMetricGrid items={stats} />

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-6">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)]">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">
                  Hàng chờ
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">
                  Nhóm tác vụ cần xử lý trước
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-slate-500">
                Những con số này giúp admin biết nên vào màn nào trước để hệ thống không bị tồn đọng kiểm duyệt.
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {[
                {
                  href: '/admin/store-owners',
                  title: 'Hồ sơ chủ gian hàng',
                  value: overview.metrics.storeOwners.pending,
                  hint: 'Tài khoản mới đang chờ phê duyệt.',
                  tone: 'amber',
                },
                {
                  href: '/admin/store-drafts',
                  title: 'Bản nháp nội dung',
                  value: overview.metrics.drafts.pending,
                  hint: 'Bản nháp gian hàng cần review trước khi publish.',
                  tone: 'rose',
                },
                {
                  href: '/admin/location-pins',
                  title: 'Ghim vị trí',
                  value: overview.metrics.locationPins.pending,
                  hint: 'Các đề xuất vị trí mới đang chờ xác nhận.',
                  tone: 'emerald',
                },
                {
                  href: '/admin/reviews',
                  title: 'Bình luận cần theo dõi',
                  value: overview.metrics.reviews.hidden,
                  hint: 'Bình luận đã bị ẩn và cần theo dõi tiếp diễn biến.',
                  tone: 'violet',
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group rounded-[24px] border p-5 transition hover:-translate-y-0.5 hover:shadow-lg ${
                    item.tone === 'amber'
                      ? 'border-amber-200 bg-amber-50'
                      : item.tone === 'rose'
                        ? 'border-rose-200 bg-rose-50'
                        : item.tone === 'emerald'
                          ? 'border-emerald-200 bg-emerald-50'
                          : 'border-violet-200 bg-violet-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <p className="mt-2 text-4xl font-semibold text-slate-950">{item.value}</p>
                    </div>
                    <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600">
                      Xem ngay
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-600">{item.hint}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">
                    Bản nháp mới
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-950">
                    Gian hàng chờ duyệt
                  </h3>
                </div>
                <Link href="/admin/store-drafts" className="text-sm font-semibold text-cyan-700 hover:text-cyan-800">
                  Xem tất cả
                </Link>
              </div>
              <div className="mt-5 space-y-3">
                {overview.recentDrafts.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">
                    Hiện chưa có bản nháp nào chờ duyệt.
                  </p>
                ) : (
                  overview.recentDrafts.map((draft) => (
                    <Link
                      key={draft.id}
                      href={`/admin/store-drafts/${draft.id}`}
                      className="block rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 transition hover:border-cyan-200 hover:bg-cyan-50"
                    >
                      <p className="font-semibold text-slate-900">
                        {draft.proposedName || draft.store?.name || 'Bản nháp chưa đặt tên'}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {draft.store?.name ? `Gian hàng hiện tại: ${draft.store.name}` : 'Chưa có gian hàng gốc'}
                      </p>
                      <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                        {formatDate(draft.submittedAt)}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">
                    Tốp báo cáo
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-slate-950">
                    Bình luận cần can thiệp
                  </h3>
                </div>
                <Link href="/admin/reports" className="text-sm font-semibold text-cyan-700 hover:text-cyan-800">
                  Mở màn báo cáo
                </Link>
              </div>
              <div className="mt-5 space-y-3">
                {overview.recentReports.length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">
                    Không có báo cáo mới cần xử lý.
                  </p>
                ) : (
                  overview.recentReports.map((report) => (
                    <div
                      key={report.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-900">
                          {report.review?.storeName ?? 'Bình luận chưa gắn gian hàng'}
                        </p>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                          {report.reason?.labelVi ?? 'Báo cáo mới'}
                        </span>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">
                        {report.review?.content || 'Bình luận không có nội dung văn bản.'}
                      </p>
                      <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                        {formatDate(report.createdAt)}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">
              Lối tắt
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-950">Truy cập nhanh các màn admin</h3>
            <div className="mt-5 space-y-3">
              {[
                ['/admin/stores', 'Quản lý gian hàng', 'Xem trạng thái và mở chi tiết từng gian hàng.'],
                ['/admin/tags', 'Quản lý nhãn sở thích', 'Chỉnh taxonomy dùng trong menu và gợi ý món ăn.'],
                ['/admin/reviews', 'Quản lý bình luận', 'Ẩn, bỏ ẩn hoặc xóa các bình luận cần kiểm duyệt.'],
                ['/admin/announcements', 'Gửi thông báo', 'Soạn thông báo nội bộ đến các chủ gian hàng.'],
              ].map(([href, title, text]) => (
                <Link
                  key={href}
                  href={href}
                  className="block rounded-2xl border border-slate-200 px-4 py-4 transition hover:border-cyan-200 hover:bg-cyan-50"
                >
                  <p className="font-semibold text-slate-900">{title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{text}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">
              Bình luận mới
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-950">
              Dòng hoạt động gần nhất
            </h3>
            <div className="mt-5 space-y-3">
              {overview.recentReviews.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  Chưa có bình luận nào mới.
                </p>
              ) : (
                overview.recentReviews.map((review) => (
                  <div
                    key={review.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-slate-900">
                        {review.customer?.displayName ?? 'Khách vãng lai'}
                      </p>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                          review.isHidden
                            ? 'bg-slate-900 text-white ring-slate-900'
                            : 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                        }`}
                      >
                        {review.isHidden ? 'Đang ẩn' : 'Hiển thị'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {review.store?.name ?? 'Không rõ gian hàng'} · {review.stars}/5 sao
                    </p>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                      {review.content || 'Bình luận chỉ có điểm sao, chưa có nội dung chữ.'}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                      <span>{formatDate(review.createdAt)}</span>
                      <span>{review.reportCount} báo cáo</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

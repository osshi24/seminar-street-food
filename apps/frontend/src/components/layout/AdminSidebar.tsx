'use client';

import NavLink from '../ui/NavLink';

function Icon({
  children,
  filled = false,
}: {
  children: React.ReactNode;
  filled?: boolean;
}) {
  return (
    <span
      className={`grid h-10 w-10 place-items-center rounded-2xl border transition-colors ${
        filled
          ? 'border-white/20 bg-white/10 text-white'
          : 'border-slate-800 bg-slate-950/40 text-slate-300'
      }`}
    >
      {children}
    </span>
  );
}

const NAV_ITEMS = [
  {
    label: 'Tổng quan',
    href: '/admin',
    exact: true,
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M4 13h6V5H4v8zm10 6h6V5h-6v14zM4 19h6v-2H4v2zm0-6h6v-2H4v2zm10 6h6v-2h-6v2z"
        />
      </svg>
    ),
  },
  {
    label: 'Gian hàng',
    href: '/admin/stores',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M3 10.5l9-6 9 6M5 9.5V20h14V9.5M9 20v-6h6v6"
        />
      </svg>
    ),
  },
  {
    label: 'Chủ gian hàng',
    href: '/admin/store-owners',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M16 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2m18 0v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M12 7a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>
    ),
  },
  {
    label: 'Bản nháp',
    href: '/admin/store-drafts',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M7 3h7l5 5v13H7a2 2 0 01-2-2V5a2 2 0 012-2zm7 0v5h5"
        />
      </svg>
    ),
  },
  {
    label: 'Ghim vị trí',
    href: '/admin/location-pins',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M12 21s-6-5.33-6-10a6 6 0 1112 0c0 4.67-6 10-6 10zm0-8a2 2 0 100-4 2 2 0 000 4z"
        />
      </svg>
    ),
  },
  {
    label: 'Ranh giới',
    href: '/admin/boundaries',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M4 7l5-2 6 2 5-2v12l-5 2-6-2-5 2V7zm5-2v12m6-10v12"
        />
      </svg>
    ),
  },
  {
    label: 'Báo cáo',
    href: '/admin/reports',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M8 7V3m8 4V3m-9 8h10m-2 10H9a3 3 0 01-3-3V7h12a3 3 0 013 3v8a3 3 0 01-3 3z"
        />
      </svg>
    ),
  },
  {
    label: 'Nhãn sở thích',
    href: '/admin/tags',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M7 7h.01M7 3h5c.53 0 1.04.21 1.41.59l6 6a2 2 0 010 2.82l-5.59 5.59a2 2 0 01-2.82 0l-6-6A2 2 0 013 10V7a4 4 0 014-4z"
        />
      </svg>
    ),
  },
  {
    label: 'Bình luận',
    href: '/admin/reviews',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M8 10h8M8 14h5m7 6l-3.8-2H6a3 3 0 01-3-3V7a3 3 0 013-3h12a3 3 0 013 3v10a3 3 0 01-1 2.24z"
        />
      </svg>
    ),
  },
  {
    label: 'Thông báo',
    href: '/admin/announcements',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5m6 0a3 3 0 11-6 0h6z"
        />
      </svg>
    ),
  },
];

export default function AdminSidebar() {
  return (
    <aside className="hidden h-screen w-[310px] shrink-0 border-r border-slate-800 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_30%),linear-gradient(180deg,_#0f172a_0%,_#020617_100%)] text-white lg:flex lg:flex-col">
      <div className="border-b border-white/10 px-6 pb-6 pt-7">
        <div className="flex items-start gap-4">
          <Icon filled>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M12 3l7 4v5c0 5-3 8-7 9-4-1-7-4-7-9V7l7-4z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M9.5 12.5l1.5 1.5 3.5-4"
              />
            </svg>
          </Icon>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">
              Seminar Street Food
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
              Admin Console
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Điều phối nội dung, kiểm duyệt vận hành và theo dõi toàn bộ hệ thống từ một nơi.
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-5">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            exact={item.exact}
            className="group flex items-center gap-3 rounded-[22px] border border-transparent px-3 py-3 text-sm font-medium text-slate-300 transition-all hover:border-white/10 hover:bg-white/5 hover:text-white"
            activeClassName="border-white/10 bg-white/10 text-white shadow-[0_18px_36px_-24px_rgba(56,189,248,0.75)]"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-200 transition-colors group-hover:border-white/20 group-hover:text-white">
              {item.icon}
            </span>
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 px-6 py-5">
        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Admin note
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Các màn quản lý đã được gom về cùng một shell để ưu tiên tốc độ rà soát, kiểm duyệt và xử lý tác vụ.
          </p>
        </div>
      </div>
    </aside>
  );
}

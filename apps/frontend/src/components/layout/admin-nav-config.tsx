import {
  LayoutDashboard,
  Store,
  Users,
  FileEdit,
  MapPin,
  Map,
  Flag,
  MessageSquare,
  Tags,
  Megaphone,
  Activity,
  type LucideIcon,
} from 'lucide-react';

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
}

export interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    label: 'Tổng quan',
    items: [
      { label: 'Bảng điều khiển', href: '/admin', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'Vận hành',
    items: [
      { label: 'Gian hàng', href: '/admin/stores', icon: Store },
      { label: 'Chủ gian hàng', href: '/admin/store-owners', icon: Users },
      { label: 'Bản nháp', href: '/admin/store-drafts', icon: FileEdit },
      { label: 'Ghim vị trí', href: '/admin/location-pins', icon: MapPin },
      { label: 'Ranh giới', href: '/admin/boundaries', icon: Map },
    ],
  },
  {
    label: 'Kiểm duyệt',
    items: [
      { label: 'Báo cáo', href: '/admin/reports', icon: Flag },
      { label: 'Bình luận', href: '/admin/reviews', icon: MessageSquare },
    ],
  },
  {
    label: 'Nội dung',
    items: [
      { label: 'Nhãn sở thích', href: '/admin/tags', icon: Tags },
      { label: 'Thông báo', href: '/admin/announcements', icon: Megaphone },
    ],
  },
  {
    label: 'Hệ thống',
    items: [
      { label: 'Giám sát', href: '/admin/monitoring', icon: Activity },
    ],
  },
];

export const ADMIN_NAV_FLAT: AdminNavItem[] = ADMIN_NAV_GROUPS.flatMap((g) => g.items);

export function findActiveNavItem(pathname: string): AdminNavItem | undefined {
  const sorted = [...ADMIN_NAV_FLAT].sort((a, b) => b.href.length - a.href.length);
  return sorted.find((item) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + '/'),
  );
}

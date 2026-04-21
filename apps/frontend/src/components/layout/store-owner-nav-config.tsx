import {
  LayoutDashboard,
  Store,
  MapPin,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react';

export interface StoreOwnerNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description?: string;
  exact?: boolean;
}

export interface StoreOwnerNavGroup {
  label: string;
  items: StoreOwnerNavItem[];
}

export const STORE_OWNER_NAV_GROUPS: StoreOwnerNavGroup[] = [
  {
    label: 'Tổng quan',
    items: [
      {
        label: 'Bảng điều khiển',
        href: '/dashboard',
        icon: LayoutDashboard,
        description: 'Tóm tắt nhanh hoạt động gian hàng',
        exact: true,
      },
    ],
  },
  {
    label: 'Quản lý gian hàng',
    items: [
      {
        label: 'Gian hàng của tôi',
        href: '/dashboard/stores',
        icon: Store,
        description: 'Thông tin, hình ảnh, menu món ăn',
      },
      {
        label: 'Vị trí trên bản đồ',
        href: '/dashboard/location',
        icon: MapPin,
        description: 'Ghim toạ độ gian hàng',
      },
    ],
  },
  {
    label: 'Tương tác khách hàng',
    items: [
      {
        label: 'Bình luận & đánh giá',
        href: '/dashboard/reviews',
        icon: MessageSquare,
        description: 'Phản hồi và báo cáo bình luận',
      },
    ],
  },
];

export const STORE_OWNER_NAV_FLAT: StoreOwnerNavItem[] =
  STORE_OWNER_NAV_GROUPS.flatMap((g) => g.items);

export function findActiveStoreOwnerNavItem(
  pathname: string,
): StoreOwnerNavItem | undefined {
  const sorted = [...STORE_OWNER_NAV_FLAT].sort(
    (a, b) => b.href.length - a.href.length,
  );
  return sorted.find((item) =>
    item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(item.href + '/'),
  );
}

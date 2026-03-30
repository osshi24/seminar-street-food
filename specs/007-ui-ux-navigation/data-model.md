# Data Model: UI/UX Navigation

**Spec**: 007-ui-ux-navigation | **Date**: 2026-04-08

## Không có DB schema mới

Spec này thuần frontend — không tạo bảng mới, không migration.

---

## Cấu trúc Layout (UI Architecture)

### AdminLayout

```text
AdminLayout (layout.tsx)
├── AdminSidebar (cố định bên trái, w-64)
│   ├── Logo + tên hệ thống
│   └── NavItem[] (icon + label + href + active state)
│       ├── Store Owners      → /admin/store-owners
│       ├── Store Drafts      → /admin/store-drafts
│       ├── Location Pins     → /admin/location-pins
│       ├── Boundaries        → /admin/boundaries
│       ├── Báo cáo           → /admin/reports
│       └── Bình luận         → /admin/reviews
└── Vùng nội dung (flex-1)
    ├── AdminHeader (top bar)
    │   ├── NotificationBell (đã có)
    │   └── Nút Đăng xuất
    └── {children} (trang con render vào đây)
```

### DashboardLayout

```text
DashboardLayout (layout.tsx)
├── DashboardSidebar (cố định bên trái, w-64)
│   ├── Logo + tên gian hàng (fetch từ API)
│   └── NavItem[]
│       ├── Tổng quan         → /dashboard
│       ├── Thông tin gian hàng → /dashboard/store
│       ├── Menu món ăn       → /dashboard/store/menu
│       ├── Vị trí            → /dashboard/location
│       └── Bình luận         → /dashboard/reviews
└── Vùng nội dung (flex-1)
    ├── DashboardHeader
    │   ├── NotificationBell (đã có)
    │   └── Nút Đăng xuất
    └── {children}
```

### PublicLayout

```text
PublicLayout (layout.tsx)
├── PublicHeader (sticky top)
│   ├── Logo → /
│   ├── Nav links: Gian hàng → /stores, Bản đồ → /map
│   └── CustomerAuthSection (Client Component)
│       ├── Chưa login: nút "Đăng nhập Google"
│       └── Đã login: Avatar + displayName + dropdown Đăng xuất
└── {children}
```

---

## Nav Items Definition

### Admin Nav Items

```typescript
const ADMIN_NAV = [
  { label: 'Store Owners',   href: '/admin/store-owners',  icon: 'users' },
  { label: 'Store Drafts',   href: '/admin/store-drafts',  icon: 'file-text' },
  { label: 'Location Pins',  href: '/admin/location-pins', icon: 'map-pin' },
  { label: 'Ranh giới',      href: '/admin/boundaries',    icon: 'map' },
  { label: 'Báo cáo',        href: '/admin/reports',       icon: 'flag' },
  { label: 'Bình luận',      href: '/admin/reviews',       icon: 'message-square' },
];
```

### Dashboard Nav Items

```typescript
const DASHBOARD_NAV = [
  { label: 'Tổng quan',          href: '/dashboard',            icon: 'layout' },
  { label: 'Thông tin gian hàng', href: '/dashboard/store',     icon: 'store' },
  { label: 'Menu món ăn',        href: '/dashboard/store/menu', icon: 'utensils' },
  { label: 'Vị trí',             href: '/dashboard/location',   icon: 'map-pin' },
  { label: 'Bình luận',          href: '/dashboard/reviews',    icon: 'star' },
];
```

---

## Auth Guard Logic (Frontend-only)

```text
AdminLayout:
  useEffect → getAdminToken() → null? → router.push('/admin/login')

DashboardLayout:
  useEffect → getAccessToken() → null? → router.push('/store-owner/login')
  Nếu có token: fetch store name để hiển thị trong sidebar

PublicHeader:
  getCustomerToken() từ sessionStorage → hiển thị avatar hoặc nút login
  Không redirect — public pages không require auth
```

# Quickstart: Public UX Improvement & Dashboard Separation

**Branch**: `008-public-ux-improvement` | **Date**: 2026-04-08

---

## Overview

Spec này là **frontend-only** — không thêm database migration hay backend API mới. Tất cả data đến từ các API hiện có (spec 001–007). Phần lớn công việc là modify existing components và tạo một component mới (`StoreBottomSheet`).

---

## Scenario 1: Khách dạo phố tìm gian hàng trên bản đồ

**Flow**: Mở `/map` → click ghim → xem bottom-sheet → bấm "Chỉ đường"

```
User opens /map
  → MapPage (Server Component) fetches /api/public/pins
  → MapView renders Leaflet map with markers
  → User clicks a marker
  → MapView fires onPinSelect(pin) callback
  → StoreBottomSheet slides up from bottom showing:
       - Store thumbnail (from pin.thumbnailUrl)
       - Store name + short description
       - Price range (min-max from menuItems)
       - "Nghe thuyết minh" button (if pin.hasCommentary)
       - "Chỉ đường" button → opens Google Maps URL
       - "Xem chi tiết" link → navigates to /stores/:storeId
  → User taps "Chỉ đường"
  → window.open('https://www.google.com/maps/dir/?api=1&destination=lat,lng', '_blank')
```

**Files involved**:
- `apps/frontend/src/app/(public)/map/page.tsx` — full-screen layout (remove max-w-6xl padding)
- `apps/frontend/src/app/(public)/map/components/MapView.tsx` — add `onPinSelect` callback, remove `bindPopup`
- `apps/frontend/src/app/(public)/map/components/StoreBottomSheet.tsx` — NEW component

**Data shape needed for bottom-sheet** (từ `/api/public/pins` hiện tại):
```ts
interface PublicPin {
  id: string;
  storeId: string;
  storeName: string;
  latitude: number;
  longitude: number;
  // Fields to ADD to existing API response (backend already has this data):
  thumbnailUrl?: string;
  priceRange?: { min: number; max: number };
  hasCommentary: boolean;
  shortDescription?: string;
}
```

> **Note**: `/api/public/pins` hiện trả về `storeName`, `latitude`, `longitude`. Cần extend backend response thêm `thumbnailUrl`, `priceRange`, `hasCommentary`, `shortDescription`. Đây là thay đổi backend DUY NHẤT của spec này — extend existing endpoint, không thêm mới.

---

## Scenario 2: Khách lọc gian hàng theo sở thích

**Flow**: Mở `/stores` → chọn tags → danh sách lọc → click card → trang chi tiết

```
User opens /stores
  → StoresPage renders TagSelector (from spec 006) + grid/list toggle
  → User selects tags [1, 3]
  → URL becomes /stores?tags=1,3&view=grid
  → Client fetches /api/recommendations?tags=1,3&page=1
  → Group results by storeId (deduplicate)
  → Render StoreCard for each unique store
  → User clicks "Xem chi tiết"
  → Navigate to /stores/:storeId
```

**Files involved**:
- `apps/frontend/src/app/(public)/stores/page.tsx` — convert to Client Component (needs tag state), add TagSelector, grid/list toggle
- `apps/frontend/src/components/stores/StoreCard.tsx` — add tags display (top 3 tags), fix store count

---

## Scenario 3: Khách xem chi tiết gian hàng với thuyết minh nổi bật

**Flow**: Mở `/stores/:id` → thấy commentary button ngay dưới ảnh → bấm nghe

```
User opens /stores/:storeId
  → StoreDetailPage (Server Component) fetches store data
  → StoreDetailView renders:
       [Image Carousel]
       [CommentaryPlayer]  ← MOVED UP (was after description)
       [Store Name + Description]
       [Menu Items]
       [Reviews]
  → User taps "Nghe thuyết minh về gian hàng này"
  → CommentaryPlayer fetches audio URL and plays
```

**Files involved**:
- `apps/frontend/src/components/stores/StoreDetailView.tsx` — move CommentaryPlayer above description

---

## Scenario 4: Admin phân biệt giao diện với Store Owner

**Visual diff**:

```
BEFORE (both look the same):
  ┌─────────────────────┐
  │ 🍜 Phố Ẩm Thực Admin │  ← bg-white, orange text
  │─────────────────────│
  │ Store Owners        │  ← English labels
  │ Store Drafts        │
  └─────────────────────┘

AFTER Admin:
  ┌─────────────────────┐
  │ ⚙️ Admin Panel       │  ← bg-slate-900, white text, red badge
  │─────────────────────│
  │ Chủ gian hàng       │  ← Vietnamese labels
  │ Bản nháp chờ duyệt  │
  └─────────────────────┘

AFTER Store Owner:
  ┌─────────────────────┐
  │ 🍜 Dashboard Gian Hàng│  ← bg-blue-700, white text
  │─────────────────────│
  │ Tổng quan           │
  │ Thông tin gian hàng │
  └─────────────────────┘
```

**Files involved**:
- `apps/frontend/src/components/layout/AdminSidebar.tsx` — dark theme + VI labels
- `apps/frontend/src/components/layout/AdminHeader.tsx` — "Admin Panel" branding
- `apps/frontend/src/components/layout/DashboardSidebar.tsx` — blue theme
- `apps/frontend/src/components/layout/DashboardHeader.tsx` — "Dashboard Gian Hàng" branding

---

## Backend Change (minimal)

Chỉ 1 thay đổi backend: extend `GET /api/public/pins` response để trả thêm:
- `thumbnailUrl: string | null`
- `priceRange: { min: number; max: number } | null`
- `hasCommentary: boolean`
- `shortDescription: string | null`

Endpoint này nằm ở `apps/backend/src/` — cần tìm controller xử lý `/api/public/pins` (likely trong `map` hoặc `location-pins` module).

---

## Dependencies

| Dependency | Status |
| ---------- | ------ |
| `CommentaryPlayer` component | ✅ Spec 002 |
| `TagSelector` component | ✅ Spec 006 |
| `useProximityDetection` hook | ✅ Spec 005 |
| `fetchRecommendations()` API fn | ✅ Spec 006 |
| `listStores()` API fn | ✅ Spec 002 |
| `/api/public/pins` endpoint | ✅ Spec 003 (extend response) |
| Leaflet map setup | ✅ Spec 003 |

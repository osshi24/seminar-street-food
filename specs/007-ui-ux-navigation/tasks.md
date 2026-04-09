# Tasks: UI/UX Navigation

**Spec**: 007-ui-ux-navigation | **Date**: 2026-04-08
**Branch**: `007-ui-ux-navigation`
**Total tasks**: 22
**Note**: Thuần frontend — không có API endpoint mới nên Constitution VI (mandatory API tests) không áp dụng.

---

## Phase 1 — Shared UI Primitives

**Purpose**: Component dùng chung cho tất cả layout

- [X] T001 [P] Tạo `frontend/src/components/ui/NavLink.tsx`: wrapper quanh Next.js `<Link>` — dùng `usePathname()` để so sánh `href` với path hiện tại, apply class `active` (bg-orange-50 text-orange-600 font-medium) khi match; hỗ trợ prefix match (e.g. `/admin/store-owners` active khi ở `/admin/store-owners/[id]`)
- [X] T002 [P] Tạo `frontend/src/components/layout/AdminSidebar.tsx`: sidebar admin với logo "Phố Ẩm Thực - Admin", danh sách 6 NavLink (Store Owners, Store Drafts, Location Pins, Ranh giới, Báo cáo, Bình luận) theo data-model.md; responsive: ẩn text khi `collapsed`, hiện icon

---

## Phase 2 — Admin Layout (US1)

**Purpose**: Wrap toàn bộ `/admin/*` bằng layout có sidebar

**⚠️ CRITICAL**: Phải xong trước khi Admin có thể dùng hệ thống

- [X] T003 Tạo `frontend/src/components/layout/AdminHeader.tsx`: top bar chứa `NotificationBell` (role="admin") + tên admin (parse từ JWT) + nút Đăng xuất; gọi `clearAdminToken()` và `router.push('/admin/login')` khi logout
- [X] T004 Tạo `frontend/src/app/(admin)/layout.tsx`: Client Component; check `getAdminToken()` trong useEffect — nếu null redirect `/admin/login`; render `<div className="flex h-screen"><AdminSidebar /><div className="flex-1 flex flex-col overflow-hidden"><AdminHeader /><main className="flex-1 overflow-y-auto p-6">{children}</main></div></div>`

**Checkpoint**: Admin đăng nhập → thấy sidebar + header trên mọi trang /admin/*

---

## Phase 3 — Dashboard Layout (US2)

**Purpose**: Wrap toàn bộ `/dashboard/*` bằng layout có sidebar

- [X] T005 Tạo `frontend/src/components/layout/DashboardSidebar.tsx`: sidebar store owner với logo, tên gian hàng (prop `storeName: string`), danh sách 5 NavLink (Tổng quan, Thông tin gian hàng, Menu món ăn, Vị trí, Bình luận) theo data-model.md
- [X] T006 Tạo `frontend/src/components/layout/DashboardHeader.tsx`: top bar chứa `NotificationBell` (role="store-owner") + nút Đăng xuất; gọi `logoutStoreOwner()` + `clearAccessToken()` + redirect `/store-owner/login`
- [X] T007 Tạo `frontend/src/app/(store-owner)/layout.tsx`: Client Component; check `getAccessToken()` — nếu null redirect `/store-owner/login`; fetch tên gian hàng từ `GET /api/store-owners/me/store` (hoặc parse từ token nếu có); render layout 2 cột: `<DashboardSidebar storeName={...} /><div><DashboardHeader /><main>{children}</main></div>`

**Checkpoint**: Store Owner đăng nhập → thấy sidebar + header trên mọi trang /dashboard/*

---

## Phase 4 — Public Layout (US3)

**Purpose**: Header toàn cục cho khu vực public + trang chủ có nội dung

- [X] T008 [P] Tạo `frontend/src/components/layout/PublicHeader.tsx`: sticky header với logo "Phố Ẩm Thực" (→ `/`), nav links "Gian hàng" (→ `/stores`) và "Bản đồ" (→ `/map`), và `CustomerAuthSection`
- [X] T009 [P] Tạo `frontend/src/components/layout/CustomerAuthSection.tsx`: Client Component — đọc `getCustomerToken()` từ sessionStorage; nếu null: nút "Đăng nhập" gọi `redirectToGoogleOAuth(window.location.pathname)`; nếu có token: fetch `/api/auth/me` hiển thị avatar + displayName + dropdown "Đăng xuất" (gọi `clearCustomerToken()`)
- [X] T010 Tạo `frontend/src/app/(public)/layout.tsx`: Server Component; render `<><PublicHeader /><div>{children}</div></>`
- [X] T011 Sửa `frontend/src/app/page.tsx`: thêm hero section với heading "Phố Ẩm Thực", mô tả ngắn, 2 CTA button: "Khám phá gian hàng" (→ `/stores`) và "Xem bản đồ" (→ `/map`); thêm section giới thiệu ngắn về phố ẩm thực

**Checkpoint**: Customer vào trang chủ → thấy header + hero + CTA rõ ràng

---

## Phase 5 — Store Owner Reviews Page (US4)

**Purpose**: Trang bình luận cho Store Owner trong dashboard

- [X] T012 Kiểm tra API `GET /api/store-owners/me/store` có trả `storeId` không; nếu chưa có, dùng endpoint đã có trong spec 001/002 để lấy store của owner đang đăng nhập
- [X] T013 Tạo `frontend/src/lib/api/store-owners.ts` (hoặc cập nhật nếu đã có): thêm hàm `getMyStore(token): Promise<{ id: string; name: string }>` gọi endpoint lấy thông tin gian hàng của owner
- [X] T014 Tạo `frontend/src/app/(store-owner)/dashboard/reviews/page.tsx`: Client Component; lấy `token = getAccessToken()` và `storeId` từ API; render `<ReviewList storeId={storeId} isStoreOwner={true} storeOwnerToken={token} />`

**Checkpoint**: Store Owner vào /dashboard/reviews → thấy danh sách đánh giá + nút Báo cáo

---

## Phase 6 — Cleanup & Integration

**Purpose**: Dọn dẹp các header riêng lẻ trong từng page, đảm bảo không bị duplicate

- [X] T015 Sửa `frontend/src/app/(admin)/admin/store-owners/page.tsx`: xóa `<header>` riêng trong page (vì đã có AdminLayout); giữ nguyên nội dung `<main>`
- [X] T016 [P] Sửa `frontend/src/app/(admin)/admin/store-drafts/page.tsx`: xóa header riêng
- [X] T017 [P] Sửa `frontend/src/app/(admin)/admin/location-pins/page.tsx`: xóa header riêng
- [X] T018 [P] Sửa `frontend/src/app/(admin)/admin/boundaries/page.tsx`: xóa header riêng
- [X] T019 [P] Sửa `frontend/src/app/(admin)/admin/reports/page.tsx`: xóa header riêng nếu có
- [X] T020 [P] Sửa `frontend/src/app/(admin)/admin/reviews/page.tsx`: xóa header riêng nếu có
- [X] T021 Sửa `frontend/src/app/(store-owner)/dashboard/page.tsx`: xóa `<header>` + logout button riêng (đã có trong DashboardLayout); giữ nội dung chào mừng
- [X] T022 [P] Sửa `frontend/src/app/(store-owner)/dashboard/store/page.tsx`, `dashboard/store/menu/page.tsx`, `dashboard/location/page.tsx`: xóa header/nav riêng nếu có

**Checkpoint**: Không có trang nào có 2 header (layout header + page header)

---

## Dependencies & Execution Order

- **Phase 1** (T001-T002): Độc lập, bắt đầu ngay
- **Phase 2** (T003-T004): Cần T001, T002
- **Phase 3** (T005-T007): Cần T001; song song với Phase 2
- **Phase 4** (T008-T011): Cần T001; song song với Phase 2 và 3
- **Phase 5** (T012-T014): Cần Phase 3 xong
- **Phase 6** (T015-T022): Cần Phase 2, 3, 4 xong; các task [P] trong phase này chạy song song

## Parallel Opportunities

- T001, T002 song song
- T003, T005, T008, T009 song song (khác file)
- T015 → T022 tất cả song song (khác file)

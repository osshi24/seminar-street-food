# Feature Specification: UI/UX Navigation — Layout & Điều hướng liền mạch

**Feature Branch**: `007-ui-ux-navigation`
**Created**: 2026-04-08
**Status**: Draft
**Depends on**: spec 001, 002, 003, 004 (tất cả tính năng đã implement)

---

## Bối cảnh

Các spec 001–004 đã xây dựng đầy đủ tính năng backend và frontend, nhưng giao diện
đang ở dạng rời rạc: mỗi trang có header riêng, không có navigation chung, người dùng
phải biết URL để truy cập. Spec này tập trung hoàn toàn vào **layout wrapper và
navigation** — không thêm tính năng mới, không thay đổi backend.

---

## User Scenarios & Testing

### User Story 1 — Admin điều hướng toàn bộ hệ thống qua sidebar (Priority: P1)

Admin đăng nhập vào `/admin` và thấy ngay sidebar cố định bên trái với đầy đủ
menu: Store Owners, Store Drafts, Location Pins, Boundaries, Báo cáo, Bình luận.
Mọi trang admin dùng chung layout này — không cần nhớ URL.

**Why this priority**: Admin không thể vận hành hệ thống nếu phải gõ URL thủ công.
Đây là blocker cơ bản nhất.

**Independent Test**: Đăng nhập admin → thấy sidebar → click từng menu item → đến đúng
trang → không bị mất trạng thái đăng nhập.

**Acceptance Scenarios**:

1. **Given** Admin đã đăng nhập, **When** vào bất kỳ trang `/admin/*`, **Then** sidebar
   hiển thị với tất cả menu items và item hiện tại được highlight.
2. **Given** Admin đang ở trang Store Owners, **When** click "Báo cáo" trong sidebar,
   **Then** chuyển sang `/admin/reports` mà không reload toàn trang.
3. **Given** Admin chưa đăng nhập, **When** truy cập `/admin/*`, **Then** redirect về
   `/admin/login`.
4. **Given** Admin đã đăng nhập, **When** click "Đăng xuất" trong header, **Then** xóa
   token và redirect về `/admin/login`.

---

### User Story 2 — Store Owner điều hướng dashboard qua sidebar (Priority: P1)

Store Owner đăng nhập và thấy sidebar với menu: Tổng quan, Thông tin gian hàng,
Menu món ăn, Vị trí, Bình luận khách hàng. Có thể di chuyển giữa các trang
quản lý mà không bị mất session.

**Why this priority**: Ngang tầm P1 với Admin — Store Owner là người dùng chính
của dashboard.

**Independent Test**: Đăng nhập Store Owner → thấy sidebar → click "Vị trí" →
đến trang quản lý vị trí → click "Bình luận" → thấy danh sách đánh giá gian hàng.

**Acceptance Scenarios**:

1. **Given** Store Owner đã đăng nhập, **When** vào bất kỳ trang `/dashboard/*`, **Then**
   sidebar hiển thị với tên gian hàng và menu đầy đủ.
2. **Given** Store Owner ở trang Thông tin gian hàng, **When** click "Bình luận",
   **Then** chuyển sang trang xem bình luận của gian hàng mình.
3. **Given** Store Owner chưa đăng nhập, **When** truy cập `/dashboard/*`, **Then**
   redirect về `/store-owner/login`.
4. **Given** Store Owner ở trang dashboard, **When** nhấn chuông thông báo, **Then**
   dropdown thông báo mở ra (tích hợp NotificationBell đã có).

---

### User Story 3 — Customer điều hướng khu vực public qua header (Priority: P2)

Customer truy cập trang web và thấy header toàn cục với: logo, link "Gian hàng",
link "Bản đồ", trạng thái đăng nhập Google (avatar nếu đã login, nút login nếu chưa).
Trang chủ `/` hiển thị nội dung giới thiệu và CTA rõ ràng.

**Why this priority**: Public-facing UX quan trọng nhưng ít blocker hơn Admin/Owner
vì Customer vẫn có thể dùng các trang riêng lẻ.

**Independent Test**: Vào trang chủ → thấy header → click "Gian hàng" → vào danh sách
→ click một gian hàng → xem chi tiết → click "Bản đồ" → vào bản đồ.

**Acceptance Scenarios**:

1. **Given** Customer truy cập bất kỳ trang public, **Then** header hiển thị với logo,
   Gian hàng, Bản đồ.
2. **Given** Customer chưa đăng nhập Google, **When** xem header, **Then** thấy nút
   "Đăng nhập" (click redirect sang Google OAuth).
3. **Given** Customer đã đăng nhập Google, **When** xem header, **Then** thấy avatar và
   tên; click avatar mở dropdown với "Đăng xuất".
4. **Given** Customer vào trang chủ `/`, **Then** thấy hero section, nút "Khám phá gian
   hàng" link đến `/stores`, nút "Xem bản đồ" link đến `/map`.

---

### User Story 4 — Trang Dashboard Store Owner có trang Bình luận (Priority: P2)

Store Owner có thể xem danh sách đánh giá gian hàng mình ngay trong dashboard
(tại `/dashboard/reviews`) với khả năng báo cáo từng bình luận vi phạm.

**Why this priority**: Phụ thuộc US2 (sidebar), và hoàn thiện flow báo cáo từ
phía Store Owner — hiện tại tính năng backend đã có nhưng chưa có trang UI.

**Independent Test**: Store Owner đăng nhập → vào "Bình luận" → thấy danh sách
→ click "Báo cáo" → ReportModal mở → gửi báo cáo thành công.

**Acceptance Scenarios**:

1. **Given** Store Owner vào `/dashboard/reviews`, **Then** thấy danh sách đánh giá
   của gian hàng mình (dùng ReviewList với isStoreOwner=true).
2. **Given** Có bình luận trong danh sách, **When** click "Báo cáo", **Then** ReportModal
   mở với danh sách lý do.
3. **Given** Gian hàng chưa có đánh giá nào, **Then** hiển thị "Chưa có đánh giá nào."

---

### Edge Cases

- Store Owner có token hết hạn khi đang ở dashboard → redirect login, giữ `returnUrl`
- Admin sidebar collapse trên màn hình nhỏ (mobile-friendly)
- Customer đăng xuất Google → xóa sessionStorage token, cập nhật header ngay lập tức
- Trang 404 khi Admin/Owner truy cập route không tồn tại

---

## Requirements

### Functional Requirements

- **FR-001**: Tất cả trang `/admin/*` MUST dùng chung một AdminLayout có sidebar cố định
- **FR-002**: Sidebar admin MUST có link đến: Store Owners, Store Drafts, Location Pins,
  Boundaries, Báo cáo, Bình luận; item active MUST được highlight
- **FR-003**: Tất cả trang `/dashboard/*` MUST dùng chung một DashboardLayout có sidebar
- **FR-004**: Sidebar dashboard MUST có link: Tổng quan, Gian hàng, Menu, Vị trí, Bình luận
- **FR-005**: Tất cả trang public (`/`, `/stores`, `/stores/[id]`, `/map`) MUST có PublicHeader
- **FR-006**: PublicHeader MUST hiển thị trạng thái đăng nhập Google của Customer
- **FR-007**: Trang chủ `/` MUST có nội dung giới thiệu với CTA đến `/stores` và `/map`
- **FR-008**: Trang `/dashboard/reviews` MUST tồn tại và hiển thị ReviewList của gian hàng
  Store Owner với khả năng báo cáo
- **FR-009**: Guard redirect MUST hoạt động ở cả Admin (redirect `/admin/login`) và
  Store Owner (redirect `/store-owner/login`) khi chưa xác thực
- **FR-010**: Layout MUST responsive — hoạt động trên màn hình >= 768px; sidebar có thể
  collapse trên mobile

### Key Entities (UI only — không có DB mới)

- **AdminLayout**: Layout wrapper cho toàn bộ `/admin/*` với sidebar + header
- **DashboardLayout**: Layout wrapper cho toàn bộ `/dashboard/*` với sidebar + header
- **PublicHeader**: Header component dùng chung cho tất cả trang public
- **AdminSidebar**: Danh sách nav items admin với active state
- **DashboardSidebar**: Danh sách nav items store owner với tên gian hàng

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Admin có thể truy cập mọi trang quản lý từ sidebar mà không cần gõ URL
- **SC-002**: Store Owner có thể di chuyển giữa tất cả tính năng dashboard chỉ qua sidebar
- **SC-003**: Customer có thể từ trang chủ đến xem gian hàng trong tối đa 2 click
- **SC-004**: Không có trang nào trong hệ thống thiếu navigation (không có dead-end)
- **SC-005**: Tất cả guard redirect hoạt động đúng — không có trang protected nào accessible
  khi chưa đăng nhập

---

## Assumptions

- Không thay đổi bất kỳ API backend nào
- Không redesign UI của các trang con — chỉ wrap layout bên ngoài
- Dùng lại toàn bộ component đã có (NotificationBell, ReviewList, ReportModal, v.v.)
- Sidebar admin không cần collapsible trên desktop (chỉ mobile)
- Không implement dark mode
- Font, màu sắc giữ nguyên Tailwind CSS hiện tại (orange accent)

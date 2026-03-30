# Requirements Checklist: UI/UX Navigation

**Spec**: 007-ui-ux-navigation | **Date**: 2026-04-08

## Functional Requirements

- [X] FR-001: Tất cả trang `/admin/*` dùng chung AdminLayout có sidebar — covered bởi T004 (layout.tsx)
- [X] FR-002: Sidebar admin có đủ 6 menu items với active state — covered bởi T002
- [X] FR-003: Tất cả trang `/dashboard/*` dùng chung DashboardLayout — covered bởi T007
- [X] FR-004: Sidebar dashboard có đủ 5 menu items — covered bởi T005
- [X] FR-005: Tất cả trang public có PublicHeader — covered bởi T010
- [X] FR-006: PublicHeader hiển thị trạng thái đăng nhập Google — covered bởi T008, T009
- [X] FR-007: Trang chủ có hero + CTA — covered bởi T011
- [X] FR-008: Trang `/dashboard/reviews` tồn tại — covered bởi T014
- [X] FR-009: Guard redirect hoạt động ở Admin và Store Owner — covered bởi T004, T007
- [X] FR-010: Layout responsive >= 768px — covered bởi Tailwind responsive classes trong T002-T010

## User Stories

- [X] US1 (Admin sidebar): Tasks T001-T004, T015-T020
- [X] US2 (Dashboard sidebar): Tasks T005-T007, T021-T022
- [X] US3 (Public header): Tasks T008-T011
- [X] US4 (Store Owner reviews page): Tasks T012-T014

## Constitution Check

- [X] Không thêm API endpoint — Constitution VI không áp dụng
- [X] Guard redirect đúng role — Constitution II (RBAC) maintained
- [X] Không có content mới cần approval — Constitution I không áp dụng

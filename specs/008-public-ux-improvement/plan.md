# Implementation Plan: Public UX Improvement & Dashboard Separation

**Branch**: `008-public-ux-improvement` | **Date**: 2026-04-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/008-public-ux-improvement/spec.md`

---

## Summary

Cải thiện UX cho người dùng đi bộ trong phố ẩm thực, tập trung vào 3 luồng chính: (1) bản đồ tương tác Google Maps-style với bottom-sheet panel khi chọn gian hàng, (2) trang danh sách và chi tiết gian hàng tối ưu mobile, (3) phân tách hoàn toàn visual identity của Admin Panel vs Store Owner Dashboard. Đây là spec frontend-heavy — không thêm backend API mới, chỉ tái sử dụng và kết hợp data từ các API hiện có.

---

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: Next.js 14 App Router, React, Tailwind CSS, Leaflet.js (map)  
**Storage**: N/A (spec này không thêm DB entity mới)  
**Testing**: Jest + Testing Library (frontend unit), không yêu cầu backend API tests vì không có endpoint mới  
**Target Platform**: Web (mobile-first, responsive desktop)  
**Project Type**: Web application (frontend only changes)  
**Performance Goals**: Trang bản đồ interactive dưới 3 giây trên 4G mobile; layout shift 0 khi mở/đóng bottom-sheet  
**Constraints**: Bottom-sheet panel không che khuất bản đồ quá 60% chiều cao màn hình; không dùng thêm thư viện map mới  
**Scale/Scope**: ~5 trang public cải thiện, 2 layout admin/dashboard thay đổi visual

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Check | Status |
| --------- | ----- | ------ |
| I. Approval-First Content | Spec không thay đổi luồng duyệt nội dung; trang chi tiết vẫn hiển thị nội dung đã duyệt | ✅ PASS |
| II. RBAC | FR-016 yêu cầu redirect khi sai role. Đã có auth middleware. Spec bổ sung visual phân tách rõ ràng | ✅ PASS |
| III. AI Commentary | Nút "Nghe thuyết minh" dùng lại `CommentaryPlayer` hiện tại. Không thay đổi pipeline | ✅ PASS |
| IV. GPS | Animation ghim khi gần gian hàng dùng lại `useProximityDetection` từ spec 005. Không thay đổi logic GPS | ✅ PASS |
| V. Data Integrity | Không thêm entity mới; không thay đổi trạng thái dữ liệu | ✅ PASS |
| VI. Mandatory API Testing | Spec này KHÔNG thêm backend API endpoint mới → không cần test file backend mới | ✅ PASS (N/A) |

**Constitution Check: ALL PASS** — Tiến hành Phase 0.

---

## Project Structure

### Documentation (this feature)

```text
specs/008-public-ux-improvement/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (N/A — no new entities)
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A — no new API endpoints)
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (affected files)

```text
apps/frontend/src/
├── app/
│   ├── page.tsx                                    # MODIFY: hiển thị store count thực
│   ├── (public)/
│   │   ├── layout.tsx                              # VERIFY: no changes needed
│   │   ├── map/
│   │   │   ├── page.tsx                            # MODIFY: full-screen map layout
│   │   │   └── components/
│   │   │       ├── MapView.tsx                     # MODIFY: bottom-sheet panel, pin animation
│   │   │       └── StoreBottomSheet.tsx            # NEW: store info panel trượt lên từ dưới
│   │   ├── stores/
│   │   │   └── page.tsx                            # MODIFY: tag filter + grid/list toggle
│   │   └── stores/[id]/
│   │       └── page.tsx                            # MODIFY: commentary button above fold
│   └── (admin)/
│       └── layout.tsx                              # MODIFY: dark theme AdminSidebar
│
├── components/
│   ├── layout/
│   │   ├── AdminSidebar.tsx                        # MODIFY: slate/dark color scheme + VI labels
│   │   ├── AdminHeader.tsx                         # MODIFY: "Admin Panel" branding
│   │   ├── DashboardSidebar.tsx                    # MODIFY: blue theme, "Dashboard" branding
│   │   └── DashboardHeader.tsx                     # MODIFY: "Dashboard Gian Hàng" branding
│   └── stores/
│       ├── StoreCard.tsx                           # MODIFY: thêm tags display, store count
│       └── StoreDetailView.tsx                     # MODIFY: commentary button above fold
```

---

## Complexity Tracking

> Không có constitution violations. Không cần bảng này.

---

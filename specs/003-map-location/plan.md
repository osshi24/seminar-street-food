# Implementation Plan: Bản đồ & Vị trí gian hàng

**Branch**: `003-map-location` | **Date**: 2026-04-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-map-location/spec.md`

## Summary

Feature này xây dựng hệ thống ghim vị trí gian hàng trên bản đồ tích hợp cho phố ẩm thực,
bao gồm hai luồng chính:

1. **Location pin approval flow** (Approval-First): Store Owner thiết lập tọa độ bằng cách
   kéo thả trên bản đồ hoặc nhập tọa độ thủ công → vị trí lưu ở trạng thái `pending`; Admin
   nhận thông báo. Admin xem xét, có thể điều chỉnh tọa độ, rồi phê duyệt hoặc từ chối kèm
   lý do bắt buộc. Khi Admin phê duyệt bản `pending` mới, bản `approved` cũ tự động chuyển
   sang `superseded` — đảm bảo tại mọi thời điểm mỗi gian hàng chỉ có tối đa một ghim
   `approved` và một ghim `pending`. Hệ thống cảnh báo Admin khi tọa độ mới trùng gần với
   ghim của gian hàng khác.

2. **Map display approach** (Public, non-real-time): Customer xem bản đồ hiển thị tất cả ghim
   `approved` của gian hàng `active` mà không cần đăng nhập; dữ liệu tải khi mở hoặc reload
   trang. Chọn ghim hiển thị thông tin tóm tắt gian hàng (tên, ảnh đại diện). Chỉ đường
   render inline trên bản đồ từ vị trí GPS hoặc điểm nhập thủ công (OSRM routing engine);
   không mở app ngoài. Customer chia sẻ vị trí GPS qua link dẫn đến trang web hệ thống hiển
   thị tọa độ đó trên bản đồ tích hợp.

Approach kỹ thuật: Leaflet.js + OpenStreetMap tiles cho map display (miễn phí, không cần API
key); OSRM public API hoặc Leaflet Routing Machine cho routing inline; PostGIS extension trong
PostgreSQL cho geospatial storage, point-in-polygon check, và duplicate detection.

## Technical Context

**Language/Version**: TypeScript 5.x (backend NestJS 10+, frontend Next.js 14+ App Router), Node.js 20 LTS
**Primary Dependencies**:

- Backend: NestJS, TypeORM, Passport JWT, class-validator, `pg` với PostGIS extension
- Frontend: Next.js 14 App Router, Leaflet.js, Leaflet Routing Machine, TanStack Query, Tailwind CSS

**Storage**: PostgreSQL 15 với PostGIS extension (geospatial data: GEOMETRY/POINT cho tọa độ, POLYGON cho boundary)
**Testing**: Jest + Supertest (backend unit/integration), Playwright (E2E frontend)
**Target Platform**: Linux server (Docker Compose), web browser (Chrome/Firefox/Safari/Edge)
**Project Type**: Monorepo web application (NestJS API + Next.js frontend)
**Performance Goals**: GET /api/map/pins p95 ≤ 300ms; bản đồ hiển thị tất cả ghim trong ≤ 3 giây khi Customer mở trang
**Constraints**: Bản đồ không real-time — dữ liệu tải khi reload; chỉ đường inline (không mở app ngoài); mỗi gian hàng ≤1 `approved` và ≤1 `pending` tại một thời điểm
**Scale/Scope**: ~100 gian hàng, ~500 Customer concurrent

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Nguyên tắc | Trạng thái | Ghi chú |
| ---------- | ---------- | ------- |
| **Principle I — Approval-First** | PASS | Ghim vị trí lưu ở `pending` sau khi Store Owner gửi; không hiển thị công khai cho đến khi Admin phê duyệt. FR-002 và FR-004 đảm bảo luồng này. Admin có thể điều chỉnh tọa độ trước khi duyệt (FR-003). |
| **Principle IV — GPS/Location Fallback** | PASS — CẦN THỰC HIỆN | Khi Customer từ chối GPS: (a) chỉ đường — hiển thị form nhập điểm xuất phát thủ công (FR-011a); (b) chia sẻ vị trí — hiển thị thông báo "Cần bật GPS" và không tạo link (FR-011b). Cả hai fallback đã được spec rõ trong FR-011. |
| **Principle V — Single-Active-State** | PASS — CẦN THỰC HIỆN | Mỗi gian hàng chỉ có ≤1 ghim `approved` và ≤1 ghim `pending` tại một thời điểm. Khi Admin phê duyệt bản `pending`, bản `approved` cũ tự động chuyển sang `superseded`. Enforced bằng unique partial index + application logic. |
| **RBAC** | PASS — CẦN THỰC HIỆN | Store Owner chỉ quản lý vị trí của chính mình. Admin quản lý tất cả ghim và boundary. Customer xem bản đồ không cần đăng nhập (public endpoint). Endpoint phân quyền rõ theo prefix `/api/store-owner/`, `/api/admin/`, `/api/map/`. |

## Project Structure

### Documentation (this feature)

```text
specs/003-map-location/
├── plan.md              # File này — implementation plan
├── spec.md              # Feature specification (source of truth)
├── research.md          # Quyết định design: map provider, routing, geospatial storage
├── data-model.md        # PostgreSQL schema với PostGIS, state machine, indexes
├── contracts/
│   └── api.md           # REST API contract đầy đủ
└── checklists/
    └── requirements.md  # Checklist kiểm tra requirements
```

### Source Code (repository root)

Monorepo — cùng cấu trúc `apps/backend` + `apps/frontend` từ spec 002:

```text
apps/
├── backend/                          # NestJS API
│   └── src/
│       ├── location/                 # Module: quản lý vị trí ghim
│       │   ├── location.module.ts
│       │   ├── location.controller.ts        # Store Owner endpoints
│       │   ├── location.service.ts
│       │   ├── dto/
│       │   │   ├── submit-location.dto.ts    # { lat, lng }
│       │   │   └── reject-location.dto.ts   # { reason }
│       │   └── entities/
│       │       └── location-pin.entity.ts
│       ├── admin/                    # Module: Admin quản lý ghim + boundary
│       │   ├── admin-location.controller.ts
│       │   ├── admin-location.service.ts
│       │   ├── dto/
│       │   │   ├── approve-location.dto.ts   # { lat?, lng? } optional adjustment
│       │   │   └── update-boundary.dto.ts    # { coordinates: [{lat, lng}] }
│       │   └── entities/
│       │       └── food-street-boundary.entity.ts
│       ├── map/                      # Module: public map endpoints (Customer)
│       │   ├── map.module.ts
│       │   ├── map.controller.ts
│       │   └── map.service.ts
│       └── notifications/            # Module dùng chung (từ spec 001)
│           └── notifications.service.ts
│
└── frontend/                         # Next.js 14 App Router
    └── src/
        ├── app/
        │   ├── (public)/
        │   │   └── map/
        │   │       ├── page.tsx              # Trang bản đồ công khai (Customer)
        │   │       └── components/
        │   │           ├── MapView.tsx       # Leaflet map container
        │   │           ├── PinMarker.tsx     # Ghim gian hàng trên bản đồ
        │   │           ├── StorePopup.tsx    # Popup thông tin tóm tắt khi chọn ghim
        │   │           ├── RoutingPanel.tsx  # Chỉ đường inline (OSRM)
        │   │           └── ShareLocationBtn.tsx  # Nút chia sẻ vị trí GPS
        │   ├── (store-owner)/
        │   │   └── dashboard/
        │   │       └── location/
        │   │           ├── page.tsx          # Trang quản lý vị trí gian hàng
        │   │           └── components/
        │   │               ├── LocationMapPicker.tsx  # Kéo thả ghim
        │   │               └── CoordinateForm.tsx     # Nhập tọa độ thủ công
        │   └── (admin)/
        │       └── admin/
        │           ├── location-pins/
        │           │   ├── page.tsx          # Danh sách ghim chờ duyệt
        │           │   └── [id]/page.tsx     # Chi tiết + phê duyệt/từ chối
        │           └── boundaries/
        │               └── page.tsx          # Cấu hình ranh giới phố ẩm thực
        ├── components/
        │   └── map/
        │       └── BoundaryPolygon.tsx       # Hiển thị ranh giới trên bản đồ
        └── lib/
            ├── api/
            │   ├── location.ts               # API calls Store Owner
            │   ├── admin-location.ts          # API calls Admin
            │   └── map.ts                    # API calls public map
            └── map/
                ├── leaflet-config.ts          # Leaflet init + tile config
                └── routing.ts                 # OSRM routing helper
```

**Structure Decision**: Monorepo `apps/backend` + `apps/frontend` — kế thừa cấu trúc đã thiết
lập từ spec 001 và spec 002. Backend tổ chức theo feature module NestJS (`location/`, `admin/`,
`map/`). Frontend theo Next.js 14 App Router với route groups phân tách public / store-owner /
admin. Map components tách riêng trong `app/(public)/map/components/` vì phụ thuộc Leaflet.js
(client-only), tránh SSR conflict.

## Complexity Tracking

> Không có vi phạm constitution — bảng này để trống theo convention.

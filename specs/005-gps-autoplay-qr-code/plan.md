# Implementation Plan: GPS Auto-Play & QR Code

**Branch**: `005-gps-autoplay-qr-code` | **Date**: 2026-04-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-gps-autoplay-qr-code/spec.md`

## Summary

Feature này xây dựng hai tính năng độc lập nhưng liên quan đến vị trí gian hàng:

1. **GPS proximity auto-play** (hoàn toàn client-side): Sau khi Customer cấp quyền GPS,
   frontend liên tục theo dõi tọa độ bằng `watchPosition`. Khi Customer tiến vào vùng bán
   kính 4m quanh gian hàng có ghim `approved` (spec 003) và thuyết minh `approved` (spec
   002), frontend tính khoảng cách bằng Haversine formula, xác định gian hàng gần nhất,
   rồi tự động phát audio thuyết minh qua HTML5 Audio API. Mỗi gian hàng chỉ auto-play
   một lần/session (in-memory Map). Khi browser chặn autoplay, hiển thị banner "Nhấn để
   nghe thuyết minh". Không cần server endpoint riêng — tận dụng API đã có từ spec 002
   (commentary) và spec 003 (map pins).

2. **QR code generation** (server-side): Store Owner tạo QR code cho gian hàng `active`;
   QR liên kết đến token UUID lưu trong bảng `qr_codes`. Khi tạo QR mới, QR cũ bị
   invalidate ngay (chỉ 1 QR active/gian hàng, enforced bằng partial unique index). Khi
   Customer quét QR, server kiểm tra trạng thái gian hàng tại thời điểm quét: nếu
   `active` → redirect đến trang chi tiết gian hàng; nếu `inactive` → redirect đến trang
   thông báo lỗi. Store Owner tải xuống QR ở định dạng PNG (base64) hoặc PDF (pdfkit).

## Technical Context

**Language/Version**: TypeScript 5.x (backend NestJS 10+, frontend Next.js 14+ App Router), Node.js 20 LTS
**Primary Dependencies**:

- Backend: NestJS, TypeORM, Passport JWT, `qrcode` npm package (QR generation), `pdfkit`
  (PDF export), class-validator
- Frontend: Next.js 14 App Router, Browser Geolocation API (`watchPosition`), HTML5 Audio
  API, TanStack Query, Tailwind CSS

**Storage**: PostgreSQL 15 — bảng `qr_codes` (token UUID, store FK, is_active flag); không
cần lưu trạng thái GPS — pure client-side state
**Testing**: Jest + Supertest (backend unit/integration), Playwright (E2E frontend)
**Target Platform**: Linux server (Docker Compose), web browser (Chrome/Firefox/Safari/Edge
với Geolocation API support)
**Project Type**: Monorepo web application (NestJS API + Next.js frontend)
**Performance Goals**: Thời gian từ vào vùng 4m đến khi audio phát ≤ 1 giây (SC-001);
QR generation p95 ≤ 500ms
**Constraints**: GPS accuracy phụ thuộc thiết bị; 4m threshold cố định (không cấu hình
linh hoạt ở MVP); chỉ 1 QR active/gian hàng tại một thời điểm
**Scale/Scope**: ~100 gian hàng, ~500 Customer concurrent

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Nguyên tắc | Trạng thái | Ghi chú |
| ---------- | ---------- | ------- |
| **Principle IV — GPS/Location Fallback** | PASS — CẦN THỰC HIỆN | FR-001: Yêu cầu quyền GPS trước khi kích hoạt; nếu từ chối → auto-play bị vô hiệu hóa hoàn toàn, hiển thị thông báo. FR-006: Khi mất quyền GPS giữa chừng → vô hiệu hóa + thông báo bật lại. Radius 4m là yêu cầu kinh doanh cố định (SC-001). |
| **Principle V — QR inactive → error page** | PASS — CẦN THỰC HIỆN | FR-010: Khi gian hàng `inactive`, GET /api/qr/:token redirect đến trang lỗi, không dẫn đến nội dung gian hàng. FR-011: Chặn tạo QR khi gian hàng `inactive`. Chỉ 1 QR active/gian hàng — enforced bằng partial unique index. |
| **Principle I — Approval-First** | KHÔNG ÁP DỤNG TRỰC TIẾP | Feature này không tạo nội dung chờ duyệt. QR code là công cụ kỹ thuật của Store Owner, không phải nội dung cần Admin duyệt. Điều kiện để auto-play là pin + thuyết minh ĐÃ được Admin duyệt (từ spec 002 và 003) — feature này không bypass approval flow. |

Không có vi phạm constitution. Complexity Tracking không cần điền.

## Project Structure

### Documentation (this feature)

```text
specs/005-gps-autoplay-qr-code/
├── plan.md              # File này — implementation plan
├── spec.md              # Feature specification (source of truth)
├── research.md          # Quyết định design: GPS tracking, distance calc, audio, QR
├── data-model.md        # PostgreSQL schema qr_codes, state machine, GPS client flow
├── contracts/
│   └── api.md           # REST API contract đầy đủ
└── checklists/
    └── requirements.md  # Checklist kiểm tra requirements
```

### Source Code (repository root)

Monorepo — kế thừa cấu trúc `apps/backend` + `apps/frontend` từ spec 001–003:

```text
apps/
├── backend/                          # NestJS API
│   └── src/
│       ├── qr/                       # Module: QR code management
│       │   ├── qr.module.ts
│       │   ├── qr.controller.ts          # Store Owner QR endpoints
│       │   ├── qr.service.ts             # QR generation + invalidation logic
│       │   ├── qr-public.controller.ts   # Public /api/qr/:token endpoint
│       │   ├── dto/
│       │   │   └── create-qr.dto.ts
│       │   └── entities/
│       │       └── qr-code.entity.ts     # qr_codes table entity
│       └── store-owner/              # Module dùng chung (từ spec 002)
│           └── store-owner.module.ts
│
└── frontend/                         # Next.js 14 App Router
    └── src/
        ├── app/
        │   ├── (public)/
        │   │   └── qr/
        │   │       └── [token]/
        │   │           └── page.tsx      # Server component: redirect /api/qr/:token
        │   ├── store-unavailable/
        │   │   └── page.tsx              # Trang thông báo gian hàng không khả dụng
        │   └── (store-owner)/
        │       └── dashboard/
        │           └── qr/
        │               └── page.tsx      # Trang quản lý QR code (tạo + tải xuống)
        ├── components/
        │   ├── gps/
        │   │   ├── ProximityProvider.tsx     # Context: GPS tracking + session state
        │   │   ├── AutoPlayController.tsx    # Logic: Haversine + audio trigger
        │   │   ├── AudioPlayer.tsx           # HTML5 Audio player + controls
        │   │   └── AutoPlayBanner.tsx        # Banner "Nhấn để nghe thuyết minh"
        │   └── qr/
        │       ├── QRCodeDisplay.tsx          # Hiển thị QR code image
        │       └── QRDownloadButtons.tsx      # Nút tải PNG / PDF
        └── lib/
            ├── gps/
            │   ├── haversine.ts              # Haversine distance calculation
            │   └── proximity.ts              # watchPosition wrapper + types
            └── api/
                └── qr.ts                     # API calls cho QR endpoints
```

**Structure Decision**: Monorepo `apps/backend` + `apps/frontend` — kế thừa cấu trúc đã thiết
lập từ spec 001–003. Backend có module `qr/` riêng biệt để tách biệt QR logic khỏi store
management. Frontend tổ chức GPS logic trong `components/gps/` (client-only components) và
`lib/gps/` (pure utility functions). Không tạo module server mới cho GPS vì logic hoàn toàn
client-side.

## Complexity Tracking

> Không có vi phạm constitution — bảng này để trống theo convention.

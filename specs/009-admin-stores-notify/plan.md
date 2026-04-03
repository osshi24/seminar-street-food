# Implementation Plan: Admin — Quản lý gian hàng & Gửi thông báo

**Branch**: `009-admin-stores-notify` | **Date**: 2026-04-10 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/009-admin-stores-notify/spec.md`

## Summary

Bổ sung hai khối năng lực Admin còn thiếu so với `requirement/UC-admin.md`: **UC-A02** — màn hình và API để Admin xem danh sách gian hàng, kích hoạt/vô hiệu hóa, xóa có cảnh báo khi còn dữ liệu liên quan; **UC-A07** — soạn và gửi thông báo tới một/nhiều/tất cả gian hàng, đồng thời tạo thông báo nội bộ (`notifications`) và gửi email qua hàng đợi async, có lưu nháp và lịch sử (`admin_announcements`).

Approach: NestJS module mở rộng dưới `apps/backend/src/admin/` (hoặc submodule `admin-stores`, `admin-announcements`), migration TypeORM cho `admin_announcements`; Next.js thêm route `(admin)/admin/stores` và `(admin)/admin/announcements` (hoặc tên menu tiếng Việt tương ứng), cập nhật `AdminSidebar` + API client.

## Technical Context

**Language/Version**: TypeScript 5.x — NestJS 10+ (backend), Next.js 14 App Router (frontend)  
**Primary Dependencies**: TypeORM, class-validator, Passport JWT (`AdminJwtGuard`), BullMQ/Nodemailer (email), pattern hiện có của `NotificationsService` / `MailModule`  
**Storage**: PostgreSQL 15 — bảng mới `admin_announcements`; dùng lại `stores`, `notifications`, `store_owner_accounts`  
**Testing**: Jest + Supertest — **bắt buộc** test API mới (Constitution Principle VI)  
**Target Platform**: Web admin (Chrome/Edge), backend Docker/local  
**Project Type**: Monorepo `apps/backend` + `apps/frontend`  
**Performance Goals**: List stores p95 ≤ 300ms với limit 20; broadcast không block HTTP quá 30s — ưu tiên async job cho email + batch insert notification  
**Constraints**: Dedupe Store Owner khi multi-store; partial email failure không rollback in-app notifications đã tạo  
**Scale/Scope**: Hàng trăm gian hàng MVP; broadcast “all” phải an toàn với worker

## Constitution Check

| Nguyên tắc | Trạng thái | Ghi chú |
|------------|------------|---------|
| **I — Approval-First** | PASS | Thay đổi `store.status` không bypass duyệt nội dung; xóa store phải tôn trọng draft pending (cảnh báo / chặn theo `research.md`). |
| **II — RBAC** | PASS — CẦN THỰC HIỆN | Mọi endpoint chỉ `AdminJwtGuard`; không expose cho Store Owner/Customer. |
| **III — AI Commentary** | N/A | |
| **IV — GPS** | N/A | |
| **V — Data Integrity** | PASS — CẦN THỰC HIỆN | Xóa store có kiểm tra related counts; transaction hoặc thứ tự xóa rõ ràng. |
| **VI — Mandatory API Testing** | PASS — CẦN THỰC HIỆN | Mỗi route mới có ít nhất một spec integration. |

## Project Structure

### Documentation (this feature)

```text
specs/009-admin-stores-notify/
├── plan.md
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
apps/backend/src/
├── admin/
│   ├── admin-stores.controller.ts      # GIỮ NGUYÊN — chỉ store-drafts (UC-A03)
│   ├── admin-stores.service.ts         # GIỮ NGUYÊN — draft logic
│   ├── admin-catalog-stores.controller.ts   # MỚI — @Controller('admin/stores') UC-A02
│   ├── admin-catalog-stores.service.ts      # MỚI — list/activate/deactivate/delete
│   ├── admin-announcements.controller.ts
│   ├── admin-announcements.service.ts
│   ├── dto/                            # query + body DTOs
│   └── entities/
│       └── admin-announcement.entity.ts
├── database/migrations/
│   └── <timestamp>-CreateAdminAnnouncements.ts
└── ... (đăng ký module trong admin.module.ts)

apps/frontend/src/
├── app/(admin)/admin/
│   ├── stores/
│   │   ├── page.tsx                  # Danh sách + actions
│   │   └── [id]/page.tsx             # Tuỳ chọn: chi tiết + xóa
│   └── announcements/
│       ├── page.tsx                  # Form gửi + lịch sử (tabs hoặc 2 view)
│       └── components/...
├── components/layout/
│   └── AdminSidebar.tsx              # Thêm nav: Gian hàng, Gửi thông báo
└── lib/api/
    ├── admin-stores.ts
    └── admin-announcements.ts
```

**Structure Decision**: Mở rộng module `admin` hiện có; không tạo app mới. Frontend đặt route dưới `(admin)/admin/*` để middleware bảo vệ nhất quán.

## Complexity Tracking

Không có vi phạm constitution cần miễn trừ; độ phức tạp chính là orchestration xóa store và broadcast an toàn — đã ghi trong `research.md`.

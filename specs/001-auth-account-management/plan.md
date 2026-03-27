# Implementation Plan: Xác thực & Quản lý tài khoản

**Branch**: `001-auth-account-management` | **Date**: 2026-04-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-auth-account-management/spec.md`

## Summary

Feature này xây dựng toàn bộ luồng xác thực và quản lý vòng đời tài khoản cho hệ thống Phố Ẩm Thực. Store Owner tự đăng ký, tài khoản được tạo ở trạng thái `pending` kèm một `Store` entity ở trạng thái `inactive`, Admin xét duyệt và phê duyệt hoặc từ chối kèm lý do. Sau khi được duyệt, Store Owner đăng nhập bằng email/password để truy cập hệ thống. Admin quản lý vòng đời tài khoản (vô hiệu hóa, kích hoạt lại) và nhận thông báo qua cả email và in-app.

Approach kỹ thuật: JWT stateless với access token (8h) + refresh token (24h idle expiry), bcrypt password hashing (cost factor 12), BullMQ + Redis cho email queue bất đồng bộ với retry 3 lần, brute force protection theo exponential backoff lưu trong PostgreSQL, Admin account khởi tạo qua NestJS seed script.

## Technical Context

**Language/Version**: TypeScript 5.x (backend NestJS 10, frontend Next.js 14 App Router)
**Primary Dependencies**: NestJS, Passport.js (JWT strategy), bcrypt, nodemailer, BullMQ, TypeORM, class-validator
**Storage**: PostgreSQL 15 (primary), Redis 7 (BullMQ queue + brute force lockout cache)
**Testing**: Jest (unit + integration), Supertest (e2e API), Testing Library (frontend)
**Target Platform**: Linux server (Docker container), web browser (Chrome/Firefox/Safari/Edge)
**Project Type**: Web application — REST API backend (NestJS) + React frontend (Next.js)
**Performance Goals**: API response p95 < 300ms cho auth endpoints; email queue xử lý < 30 giây sau sự kiện trigger
**Constraints**: Access token 8h; idle timeout 24h; email retry tối đa 3 lần; brute force lockout 1→5→30 phút sau mỗi 5 lần sai
**Scale/Scope**: MVP — vài chục Admin, hàng nghìn Store Owner; không yêu cầu horizontal scaling ở giai đoạn này

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Nguyên tắc | Trạng thái | Ghi chú |
| ---------- | ---------- | ------- |
| **Approval-First** (nội dung phải được duyệt trước khi công khai) | PASS | Tài khoản Store Owner tạo ở trạng thái `pending`, Store tạo ở `inactive`. Không có dữ liệu nào công khai trước khi Admin phê duyệt. FR-002, FR-002b tuân thủ. |
| **RBAC** (phân quyền rõ ràng theo vai trò) | PASS — CẦN THỰC HIỆN | Ba vai trò: `Admin`, `StoreOwner`, `Guest`. Admin endpoints bảo vệ bằng `AdminJwtGuard`. Store Owner endpoints bảo vệ bằng `StoreOwnerJwtGuard`. Không có endpoint nào cho phép leo thang quyền. Tài khoản ở trạng thái `pending`, `inactive`, hoặc `rejected` bị chặn đăng nhập (FR-008); `rejected` là trạng thái cuối, không có Admin path nào un-reject. |
| **AI** (tính năng AI phải có fallback) | N/A | Spec này không sử dụng AI. |
| **GPS** (tính năng GPS/location phải có fallback) | N/A | Spec này không sử dụng GPS. |
| **Data Integrity** (tính toàn vẹn dữ liệu) | PASS — CẦN THỰC HIỆN | `StoreOwnerAccount` và `Store` được tạo trong cùng một database transaction (FR-002b). Email unique constraint ở database level (FR-012). Status transitions được kiểm soát qua service layer, không cho phép direct database update từ ngoài. |

## Project Structure

### Documentation (this feature)

```text
specs/001-auth-account-management/
├── plan.md              # File này — implementation plan
├── research.md          # Quyết định design và lý do chọn
├── data-model.md        # Database schema, entity definitions, state machine
├── contracts/
│   └── api.md           # REST API contracts đầy đủ
└── checklists/
    └── requirements.md  # Checklist kiểm tra requirements
```

### Source Code (repository root)

```text
backend/                          # NestJS application
├── src/
│   ├── auth/                     # Module xác thực
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts    # POST /auth/store-owner/*, POST /auth/admin/*
│   │   ├── auth.service.ts       # Đăng ký, đăng nhập, refresh token
│   │   ├── strategies/
│   │   │   ├── jwt-store-owner.strategy.ts
│   │   │   └── jwt-admin.strategy.ts
│   │   ├── guards/
│   │   │   ├── store-owner-jwt.guard.ts
│   │   │   └── admin-jwt.guard.ts
│   │   └── dto/
│   │       ├── register-store-owner.dto.ts
│   │       ├── login.dto.ts
│   │       └── refresh-token.dto.ts
│   ├── store-owners/             # Module quản lý Store Owner (Admin)
│   │   ├── store-owners.module.ts
│   │   ├── store-owners.controller.ts  # GET/PATCH /admin/store-owners/*
│   │   ├── store-owners.service.ts
│   │   └── dto/
│   │       ├── reject-store-owner.dto.ts
│   │       └── list-store-owners-query.dto.ts
│   ├── notifications/            # Module thông báo in-app
│   │   ├── notifications.module.ts
│   │   ├── notifications.controller.ts
│   │   ├── notifications.service.ts
│   │   └── notifications.gateway.ts   # WebSocket (tùy chọn cho real-time)
│   ├── mail/                     # Module gửi email
│   │   ├── mail.module.ts
│   │   ├── mail.service.ts       # nodemailer wrapper
│   │   ├── mail.processor.ts     # BullMQ job processor
│   │   └── templates/            # Email templates (handlebars/mjml)
│   │       ├── registration-confirmation.hbs
│   │       ├── account-approved.hbs
│   │       ├── account-rejected.hbs
│   │       └── account-deactivated.hbs
│   ├── entities/                 # TypeORM entities
│   │   ├── store-owner-account.entity.ts
│   │   ├── store.entity.ts
│   │   ├── admin-account.entity.ts
│   │   └── notification.entity.ts
│   ├── database/
│   │   └── seeds/
│   │       └── admin.seed.ts     # Script khởi tạo Admin accounts
│   └── common/
│       ├── filters/
│       │   └── http-exception.filter.ts
│       └── interceptors/
│           └── transform.interceptor.ts
└── test/
    ├── auth.e2e-spec.ts
    └── store-owners.e2e-spec.ts

frontend/                         # Next.js 14 App Router application
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── store-owner/
│   │   │   │   ├── register/
│   │   │   │   │   └── page.tsx       # Trang đăng ký Store Owner
│   │   │   │   └── login/
│   │   │   │       └── page.tsx       # Trang đăng nhập Store Owner
│   │   │   └── admin/
│   │   │       └── login/
│   │   │           └── page.tsx       # Trang đăng nhập Admin (riêng)
│   │   ├── (store-owner)/
│   │   │   └── dashboard/
│   │   │       └── page.tsx           # Trang quản lý sau đăng nhập
│   │   └── (admin)/
│   │       └── store-owners/
│   │           ├── page.tsx           # Danh sách Store Owner
│   │           └── [id]/
│   │               └── page.tsx       # Chi tiết Store Owner
│   ├── components/
│   │   ├── auth/
│   │   │   ├── RegisterForm.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   └── DeactivateWarningModal.tsx
│   │   └── notifications/
│   │       ├── NotificationBell.tsx
│   │       └── NotificationList.tsx
│   ├── lib/
│   │   ├── api/
│   │   │   ├── auth.ts            # API calls cho auth
│   │   │   ├── store-owners.ts    # API calls cho admin store owner management
│   │   │   └── notifications.ts   # API calls cho notifications
│   │   └── auth/
│   │       ├── session.ts         # JWT token management, refresh logic
│   │       └── middleware.ts      # Next.js middleware cho route protection
│   └── types/
│       ├── store-owner.ts
│       ├── admin.ts
│       └── notification.ts
└── tests/
    ├── components/
    └── e2e/

docker-compose.yml                # PostgreSQL + Redis cho local dev
```

**Structure Decision**: Web application (Option 2) với monorepo approach — `backend/` chứa NestJS API server, `frontend/` chứa Next.js app. Hai project riêng biệt trong cùng repository để dễ quản lý trong giai đoạn seminar. Không dùng NX hay Turborepo để tránh phức tạp không cần thiết.

## Complexity Tracking

> Không có violation nào cần justification. Tất cả Constitution Check đều PASS.

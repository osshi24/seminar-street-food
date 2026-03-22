# Implementation Plan: Đánh giá & Kiểm duyệt bình luận

**Branch**: `004-review-comment-moderation` | **Date**: 2026-04-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-review-comment-moderation/spec.md`

## Summary

Feature này xây dựng toàn bộ luồng đánh giá gian hàng và kiểm duyệt bình luận cho hệ
thống Phố Ẩm Thực. Customer xác thực qua Google OAuth (Passport.js GoogleStrategy trong
NestJS), sau đó gửi đánh giá gồm số sao 1-5 và nội dung tùy chọn tối đa 500 ký tự.
Đánh giá hiển thị ngay (không cần duyệt), mỗi Google account chỉ được đánh giá một gian
hàng một lần (unique constraint ở database level). Store Owner có thể báo cáo bình luận
vi phạm với lý do từ danh sách định sẵn; Admin nhận thông báo và xử lý báo cáo (ẩn, xóa,
hoặc bác bỏ), hoặc chủ động quản lý bình luận mà không cần báo cáo.

Approach kỹ thuật: Google OAuth flow qua `@nestjs/passport` + `passport-google-oauth20`,
backend issue JWT nội bộ (short-lived, read-only scope) sau xác thực Google thành công.
Điểm trung bình lưu cached trong `stores` table (cập nhật ngay khi có review mới). Lý do
báo cáo lưu trong lookup table (`report_reasons`) để Admin có thể thêm sau. Soft delete
bằng field `is_hidden` trong `reviews` table — không xóa khỏi DB khi ẩn.

## Technical Context

**Language/Version**: TypeScript 5.x (backend NestJS 10, frontend Next.js 14 App Router)
**Primary Dependencies**: NestJS, `@nestjs/passport`, `passport-google-oauth20`, TypeORM,
  class-validator, BullMQ (email queue), nodemailer
**Storage**: PostgreSQL 15 (primary), Redis 7 (BullMQ queue cho email thông báo)
**Testing**: Jest (unit + integration), Supertest (e2e API), Testing Library (frontend)
**Target Platform**: Linux server (Docker container), web browser (Chrome/Firefox/Safari/Edge)
**Project Type**: Web application — REST API backend (NestJS) + React frontend (Next.js)
**Performance Goals**: API response p95 < 300ms; cập nhật avg_rating ngay sau review mới
**Constraints**: Nội dung bình luận tối đa 500 ký tự; JWT Customer short-lived (1h);
  unique 1 review/store/account; unique 1 report/review/store_owner
**Scale/Scope**: MVP — hàng nghìn Customer, vài trăm gian hàng; không yêu cầu horizontal
  scaling ở giai đoạn này

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Nguyên tắc | Trạng thái | Ghi chú |
| ---------- | ---------- | ------- |
| **Approval-First** (nội dung phải được duyệt trước khi công khai) | PASS — N/A cho Customer reviews | Principle I chỉ áp dụng cho nội dung do Store Owner gửi (thông tin gian hàng, ghim vị trí, thuyết minh). Đánh giá của Customer không phải Store Owner content — KHÔNG thuộc phạm vi Principle I. Đánh giá hiển thị ngay theo yêu cầu nghiệp vụ (FR-004, BR-06.1) là hành vi đúng, không phải ngoại lệ. Admin vẫn có quyền ẩn/xóa sau đó (FR-008). |
| **RBAC** (phân quyền rõ ràng theo vai trò) | PASS — CẦN THỰC HIỆN | Ba role liên quan: `Customer` (chỉ write review, không sửa/xóa), `StoreOwner` (chỉ báo cáo review tại gian hàng của mình, không xóa/sửa review), `Admin` (toàn quyền kiểm duyệt). FR-007 cấm Store Owner xóa/sửa review. Mỗi role dùng guard riêng. |
| **AI** (tính năng AI phải có fallback) | N/A | Spec này không sử dụng AI. |
| **GPS** (tính năng GPS/location phải có fallback) | N/A | Spec này không sử dụng GPS. |
| **Data Integrity** (tính toàn vẹn dữ liệu) | PASS — CẦN THỰC HIỆN | `unique(store_id, customer_id)` trong `reviews` table (FR-003). `unique(review_id, reporter_id)` trong `comment_reports` (FR-012). `avg_rating` và `review_count` trong `stores` cập nhật trong cùng transaction khi insert review. Soft delete thay vì hard delete khi ẩn bình luận. |

## Project Structure

### Documentation (this feature)

```text
specs/004-review-comment-moderation/
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
backend/                                    # NestJS application
├── src/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts             # GET /auth/google, /auth/google/callback, POST /auth/logout
│   │   ├── auth.service.ts                # Issue JWT sau Google OAuth thành công
│   │   ├── strategies/
│   │   │   ├── google.strategy.ts         # PassportJS GoogleStrategy
│   │   │   ├── jwt-customer.strategy.ts   # JWT guard cho Customer endpoints
│   │   │   ├── jwt-store-owner.strategy.ts
│   │   │   └── jwt-admin.strategy.ts
│   │   └── guards/
│   │       ├── google-auth.guard.ts
│   │       ├── customer-jwt.guard.ts
│   │       ├── store-owner-jwt.guard.ts
│   │       └── admin-jwt.guard.ts
│   ├── reviews/
│   │   ├── reviews.module.ts
│   │   ├── reviews.controller.ts          # GET/POST /stores/:storeId/reviews
│   │   ├── reviews.service.ts             # Submit review, update avg_rating
│   │   └── dto/
│   │       ├── create-review.dto.ts
│   │       └── list-reviews-query.dto.ts
│   ├── reports/
│   │   ├── reports.module.ts
│   │   ├── reports.controller.ts          # POST /stores/:storeId/reviews/:reviewId/report
│   │   ├── reports.service.ts             # Create report, check duplicate
│   │   └── dto/
│   │       └── create-report.dto.ts
│   ├── admin/
│   │   ├── admin-reviews.controller.ts    # GET, PATCH hide/unhide, DELETE /admin/reviews
│   │   ├── admin-reports.controller.ts    # GET, PATCH resolve/dismiss /admin/reports
│   │   └── dto/
│   │       ├── list-admin-reviews-query.dto.ts
│   │       └── list-admin-reports-query.dto.ts
│   ├── report-reasons/
│   │   ├── report-reasons.module.ts
│   │   └── report-reasons.controller.ts  # GET /report-reasons
│   ├── notifications/
│   │   ├── notifications.module.ts
│   │   ├── notifications.service.ts       # Tạo in-app notification khi có report mới
│   │   └── notifications.gateway.ts
│   ├── mail/
│   │   ├── mail.module.ts
│   │   ├── mail.processor.ts              # BullMQ job processor
│   │   └── templates/
│   │       └── new-comment-report.hbs
│   └── entities/
│       ├── customer-google-account.entity.ts
│       ├── review.entity.ts
│       ├── comment-report.entity.ts
│       └── report-reason.entity.ts
└── test/
    ├── reviews.e2e-spec.ts
    └── reports.e2e-spec.ts

frontend/                                   # Next.js 14 App Router application
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   └── stores/
│   │   │       └── [storeId]/
│   │   │           └── page.tsx           # Trang gian hàng — hiển thị reviews
│   │   ├── (auth)/
│   │   │   └── auth/
│   │   │       └── callback/
│   │   │           └── page.tsx           # Nhận JWT sau Google OAuth callback
│   │   ├── (store-owner)/
│   │   │   └── stores/
│   │   │       └── [storeId]/
│   │   │           └── reviews/
│   │   │               └── page.tsx       # Store Owner xem và báo cáo bình luận
│   │   └── (admin)/
│   │       ├── reviews/
│   │       │   └── page.tsx               # Admin quản lý tất cả bình luận
│   │       └── reports/
│   │           └── page.tsx               # Admin xử lý báo cáo
│   ├── components/
│   │   ├── reviews/
│   │   │   ├── ReviewList.tsx             # Danh sách đánh giá (public)
│   │   │   ├── ReviewCard.tsx             # Một đánh giá: avatar + tên + sao + nội dung
│   │   │   ├── ReviewForm.tsx             # Form viết đánh giá (require Google auth)
│   │   │   ├── StarRating.tsx             # Component chọn/hiển thị số sao
│   │   │   └── CharacterCounter.tsx       # Bộ đếm ký tự còn lại
│   │   ├── reports/
│   │   │   ├── ReportModal.tsx            # Modal báo cáo bình luận (Store Owner)
│   │   │   └── ReportReasonSelect.tsx     # Dropdown chọn lý do báo cáo
│   │   └── admin/
│   │       ├── AdminReviewTable.tsx       # Bảng quản lý bình luận
│   │       ├── AdminReportTable.tsx       # Bảng xử lý báo cáo
│   │       └── ReviewFilterBar.tsx        # Bộ lọc: gian hàng, trạng thái, từ khóa
│   ├── lib/
│   │   ├── api/
│   │   │   ├── reviews.ts                 # API calls cho reviews
│   │   │   ├── reports.ts                 # API calls cho reports
│   │   │   └── auth-google.ts             # Redirect to Google OAuth
│   │   └── auth/
│   │       └── customer-session.ts        # Lưu/đọc JWT Customer (memory/cookie)
│   └── types/
│       ├── review.ts
│       ├── report.ts
│       └── customer.ts
└── tests/
    ├── components/
    └── e2e/

docker-compose.yml                          # PostgreSQL + Redis cho local dev
```

**Structure Decision**: Web application (monorepo) — `backend/` chứa NestJS API server,
`frontend/` chứa Next.js app. Cùng cấu trúc với spec 001. Feature này thêm các module
`reviews/`, `reports/`, `report-reasons/` vào backend và các trang + components tương
ứng vào frontend.

## Complexity Tracking

> Không có violation nào cần justification. Ngoại lệ Approval-First cho review hiển thị
> ngay được định nghĩa rõ ràng trong spec (FR-004) và không vi phạm nguyên tắc — Admin
> vẫn có quyền ẩn/xóa sau khi publish.

# Tasks: Đánh giá & Kiểm duyệt bình luận

**Spec**: 004-review-comment-moderation | **Date**: 2026-04-05
**Branch**: `004-review-comment-moderation`
**Total tasks**: 62

---

## Phase 1 — Setup (Google OAuth & Environment)

- [X] T001 Cài đặt dependencies: `@nestjs/passport`, `passport`, `passport-google-oauth20`, `@types/passport-google-oauth20` vào `backend/package.json`
- [X] T002 Thêm biến môi trường `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `CUSTOMER_JWT_SECRET`, `CUSTOMER_JWT_EXPIRES_IN` vào `backend/.env.example`
- [X] T003 [P] Thêm biến môi trường `NEXT_PUBLIC_GOOGLE_OAUTH_URL`, `NEXT_PUBLIC_API_BASE_URL` vào `frontend/.env.example`
- [X] T004 [P] Cấu hình Google OAuth credentials trong Google Cloud Console (Client ID + Client Secret); ghi chú redirect URI `http://localhost:3000/api/auth/google/callback` vào `specs/004-review-comment-moderation/research.md`
- [X] T005 Cập nhật `backend/src/app.module.ts` bật `PassportModule` globally và import `ConfigModule` nếu chưa có

---

## Phase 2 — Foundation (Database & Module Skeleton)

- [X] T006 Tạo migration `backend/src/database/migrations/1743870000000-004-001-CreateCustomerGoogleAccounts.ts`
- [X] T007 [P] Tạo migration `backend/src/database/migrations/1743870001000-004-002-CreateReviews.ts`
- [X] T008 [P] Tạo migration `backend/src/database/migrations/1743870002000-004-003-CreateReportReasons.ts`
- [X] T009 [P] Tạo migration `backend/src/database/migrations/1743870003000-004-004-CreateCommentReports.ts`
- [X] T010 Tạo migration `backend/src/database/migrations/1743870004000-004-005-AlterStoresAddRating.ts`
- [X] T011 [P] Tạo TypeORM entity `backend/src/entities/customer-google-account.entity.ts`
- [X] T012 [P] Tạo TypeORM entity `backend/src/entities/review.entity.ts`
- [X] T013 [P] Tạo TypeORM entity `backend/src/entities/comment-report.entity.ts`
- [X] T014 [P] Tạo TypeORM entity `backend/src/entities/report-reason.entity.ts`
- [X] T015 Tạo module skeleton `backend/src/reviews/reviews.module.ts`
- [X] T016 [P] Tạo module skeleton `backend/src/reports/reports.module.ts`
- [X] T017 [P] Tạo module skeleton `backend/src/report-reasons/report-reasons.module.ts`
- [X] T018 [P] Tạo module `backend/src/notifications/notifications.module.ts` (đã tồn tại — verified)
- [X] T019 [P] Tạo template `backend/src/mail/templates/new-comment-report.hbs`

---

## Phase 3 — US1: Customer đăng nhập Google OAuth và viết đánh giá

### Backend — Auth

- [X] T020 [US1] Tạo `backend/src/auth/strategies/google.strategy.ts`
- [X] T021 [US1] Tạo `backend/src/auth/strategies/jwt-customer.strategy.ts`
- [X] T022 [US1] Tạo `backend/src/auth/guards/google-auth.guard.ts`
- [X] T023 [US1] Tạo `backend/src/auth/guards/customer-jwt.guard.ts`
- [X] T024 [US1] Thêm `authService.issueCustomerJwt()` vào `backend/src/auth/auth.service.ts`
- [X] T025 [US1] Cập nhật `backend/src/auth/auth.controller.ts` thêm Google OAuth routes
- [X] T026 [US1] Cập nhật `backend/src/auth/auth.module.ts` thêm GoogleStrategy, JwtCustomerStrategy

### Backend — Reviews

- [X] T027 [US1] Tạo `backend/src/reviews/dto/create-review.dto.ts`
- [X] T028 [US1] Tạo `backend/src/reviews/dto/list-reviews-query.dto.ts`
- [X] T029 [US1] Implement `backend/src/reviews/reviews.service.ts`
- [X] T030 [US1] Implement `backend/src/reviews/reviews.controller.ts`

### Frontend — Auth callback & session

- [X] T031 [US1] Tạo `frontend/src/lib/auth/customer-session.ts`
- [X] T032 [US1] Tạo `frontend/src/app/(auth)/auth/callback/page.tsx`
- [X] T033 [US1] Tạo `frontend/src/lib/api/auth-google.ts`
- [X] T034 [US1] Tạo type `frontend/src/types/customer.ts`
- [X] T035 [US1] Tạo type `frontend/src/types/review.ts`

### Frontend — Review components

- [X] T036 [US1] Tạo `frontend/src/components/reviews/StarRating.tsx`
- [X] T037 [US1] [P] Tạo `frontend/src/components/reviews/CharacterCounter.tsx`
- [X] T038 [US1] Tạo `frontend/src/components/reviews/ReviewForm.tsx`
- [X] T039 [US1] [P] Tạo `frontend/src/components/reviews/ReviewCard.tsx`
- [X] T040 [US1] Tạo `frontend/src/components/reviews/ReviewList.tsx`
- [X] T041 [US1] Tạo `frontend/src/lib/api/reviews.ts`

### Frontend — Store page integration

- [X] T042 [US1] Cập nhật `frontend/src/app/(public)/stores/[id]/page.tsx`: nhúng ReviewList và ReviewForm

---

## Phase 4 — US2: Store Owner báo cáo bình luận vi phạm

### Backend — Reports

- [X] T043 [US2] Tạo `backend/src/reports/dto/create-report.dto.ts`
- [X] T044 [US2] Implement `backend/src/reports/reports.service.ts`
- [X] T045 [US2] Implement `backend/src/reports/reports.controller.ts`
- [X] T046 [US2] NotificationsService.create() được dùng trong reports.service.ts
- [X] T047 [US2] Template `backend/src/mail/templates/new-comment-report.hbs` tạo

### Frontend — Report components

- [X] T048 [US2] Tạo type `frontend/src/types/report.ts`
- [X] T049 [US2] Tạo `frontend/src/lib/api/reports.ts`
- [X] T050 [US2] Tạo `frontend/src/components/reports/ReportReasonSelect.tsx`
- [X] T051 [US2] Tạo `frontend/src/components/reports/ReportModal.tsx`
- [X] T052 [US2] Cập nhật `frontend/src/components/reviews/ReviewCard.tsx`: nút Báo cáo + ReportModal
- [X] T053 [US2] Store Owner review page: ReviewCard với isStoreOwner=true (tích hợp qua props)

---

## Phase 5 — US3: Admin xử lý báo cáo bình luận

### Backend — Admin Reports

- [X] T054 [US3] Tạo `backend/src/admin/dto/list-admin-reports-query.dto.ts`
- [X] T055 [US3] Implement `backend/src/admin/admin-reports.controller.ts`

### Frontend — Admin Reports page

- [X] T056 [US3] Tạo `frontend/src/components/admin/AdminReportTable.tsx`
- [X] T057 [US3] Tạo `frontend/src/app/(admin)/admin/reports/page.tsx`

---

## Phase 6 — US4: Admin quản lý toàn bộ bình luận

### Backend — Admin Reviews

- [X] T058 [US4] Tạo `backend/src/admin/dto/list-admin-reviews-query.dto.ts`
- [X] T059 [US4] Implement `backend/src/admin/admin-reviews.controller.ts`

### Frontend — Admin Reviews page

- [X] T060 [US4] Tạo `frontend/src/components/admin/ReviewFilterBar.tsx`
- [X] T061 [US4] Tạo `frontend/src/components/admin/AdminReviewTable.tsx`
- [X] T062 [US4] Tạo `frontend/src/app/(admin)/admin/reviews/page.tsx`

---

## Phase N — Polish

- [X] T063 [P] Rate limiting cho review submission: `@Throttle({ default: { limit: 3, ttl: 60000 } })` trên POST /stores/:storeId/reviews
- [X] T064 [P] CharacterCounter: màu warning/danger theo ngưỡng ký tự
- [X] T065 [P] ReviewListSkeleton: `frontend/src/components/reviews/ReviewListSkeleton.tsx`
- [X] T066 [P] CORS đã có `credentials: true` và `FRONTEND_URL` trong `backend/src/main.ts`

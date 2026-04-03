# Quickstart: Kiểm thử 009-admin-stores-notify

**Date**: 2026-04-10

## Điều kiện

- Docker Postgres + Redis chạy; `npm run db:migrate` đã áp dụng migration mới của feature này.
- Seed admin (`npm run db:seed:admin`) và ít nhất một Store Owner + Store (có thể `npm run seed:all --workspace=apps/backend`).

## UC-A02 — Quản lý gian hàng

1. Đăng nhập Admin: `POST /api/auth/admin/login` → lấy `accessToken`.
2. `GET /api/admin/stores?page=1&limit=20` — có `Authorization: Bearer ...` → 200, có `items`.
3. Chọn một store inactive → `PATCH /api/admin/stores/{id}/activate` → 200, `status: active`.
4. `PATCH /api/admin/stores/{id}/deactivate` → public store detail trả 404/unavailable như hiện tại.
5. `GET /api/admin/stores/{id}/delete-impact` — ghi nhận `reviewCount` / flags.
6. `DELETE /api/admin/stores/{id}` không `confirmed` khi có related data → 409; với `confirmed: true` → xóa thành công (hoặc 204).

## UC-A07 — Gửi thông báo

1. `POST /api/admin/announcements` với `action: save_draft` → 201, `status: draft`.
2. `POST /api/admin/announcements/{id}/send` hoặc POST trực tiếp với `action: send` — kiểm tra:
   - Bảng `notifications` có bản ghi mới cho `recipient_type = store_owner`, `event_type = ADMIN_ANNOUNCEMENT`.
   - Mail queue (Bull Board / log worker) có job tương ứng.
3. Đăng nhập Store Owner tương ứng — UI bell hoặc `GET /api/notifications` có mục mới.

## Automated

- Chạy `npm test` trong `apps/backend` sau khi thêm `*.spec.ts` cho các controller mới.

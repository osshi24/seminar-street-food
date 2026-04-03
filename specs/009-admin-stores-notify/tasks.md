# Tasks: Admin — Quản lý gian hàng & Gửi thông báo

**Spec**: 009-admin-stores-notify | **Date**: 2026-04-10  
**Plan**: [plan.md](./plan.md) | **Data Model**: [data-model.md](./data-model.md) | **API**: [contracts/api.md](./contracts/api.md)

---

## Tổng quan

| Phase | Tên | User Stories | Tasks |
| ----- | --- | ------------ | ----- |
| 1 | Database | — | T001–T003 |
| 2 | Backend — Stores (UC-A02) | US1 | T004–T012 |
| 3 | Backend — Announcements (UC-A07) | US2 | T013–T022 |
| 4 | Frontend — Stores | US1 | T023–T028 |
| 5 | Frontend — Announcements | US2 | T029–T035 |
| N | Polish & QA | — | T036–T040 |

---

## Phase 1 — Database

**Goal**: Schema `admin_announcements` và enum cần thiết; migration chạy được trên PostgreSQL hiện tại.

**Independent Test**: `npm run db:migrate --workspace=apps/backend` thành công; bảng `admin_announcements` tồn tại với index cơ bản.

---

- [ ] T001 Tạo TypeORM migration tại `apps/backend/src/database/migrations/<timestamp>-CreateAdminAnnouncements.ts`: tạo enum `admin_announcement_recipient_mode` (`single_store`, `multi_store`, `all_stores`), enum `admin_announcement_status` (`draft`, `sent`), bảng `admin_announcements` đầy đủ cột theo [data-model.md](./data-model.md) §2; FK `admin_id` → `admin_accounts`; indexes theo §2
- [ ] T002 [P] Tạo entity `apps/backend/src/admin/entities/admin-announcement.entity.ts` map bảng mới, enum TypeScript tương ứng
- [ ] T003 Đăng ký entity trong `TypeOrmModule.forFeature` của `AdminModule` (hoặc module con) tại `apps/backend/src/admin/admin.module.ts`

---

## Phase 2 — Backend — Admin Stores (US1 / UC-A02)

**Goal**: API đầy đủ theo [contracts/api.md](./contracts/api.md) §Stores.

**Independent Test**: Supertest: list → activate → deactivate → delete-preview → delete với/without confirmed; 401 khi không có token.

---

- [ ] T004 Tạo `apps/backend/src/admin/dto/list-admin-stores-query.dto.ts` — `page`, `limit`, `status?`, `search?` với class-validator
- [ ] T005 Tạo `apps/backend/src/admin/dto/delete-store-body.dto.ts` — `confirmed: boolean` (nếu dùng body cho DELETE)
- [ ] T006 Tạo `apps/backend/src/admin/admin-catalog-stores.service.ts` — **không** sửa `admin-stores.service.ts` (đang dùng cho store-drafts UC-A03); implement `findAll(query)` — join `stores` + `store_owner_accounts`, filter, search ILIKE, pagination; trả DTO theo contract
- [ ] T007 Implement `admin-catalog-stores.service.ts` `activate(storeId)` / `deactivate(storeId)` — cập nhật `StoreStatus`, throw `NotFoundException` nếu không có store
- [ ] T008 Implement `admin-catalog-stores.service.ts` `getDeleteImpact(storeId)` — đếm reviews, reports (nếu có), pending draft, pins, v.v.; trả object theo contract §GET delete-impact
- [ ] T009 Implement `admin-catalog-stores.service.ts` `remove(storeId, confirmed)` — nếu có related data và `!confirmed` throw `ConflictException` với code `STORE_DELETE_REQUIRES_CONFIRMATION`; nếu confirmed thì xóa theo thứ tự an toàn với FK hiện có
- [ ] T010 Tạo `apps/backend/src/admin/admin-catalog-stores.controller.ts` — `@Controller('admin/stores')` — routes `GET`, `PATCH :id/activate`, `PATCH :id/deactivate`, `GET :id/delete-impact`, `DELETE :id`; tất cả `AdminJwtGuard` (tránh trùng file `admin-stores.controller.ts` đang map `admin/store-drafts`)
- [ ] T011 Đăng ký `AdminCatalogStoresController` + `AdminCatalogStoresService` trong `apps/backend/src/admin/admin.module.ts`
- [ ] T012 [P] Tạo `apps/backend/test/admin-catalog-stores.e2e-spec.ts` (hoặc `*.spec.ts` cạnh controller) — tối thiểu: 401 unauthorized, một happy path list, một 409 delete requires confirmation (Constitution VI)

---

## Phase 3 — Backend — Admin Announcements (US2 / UC-A07)

**Goal**: CRUD nháp + send; insert `notifications` + enqueue email; dedupe owner.

**Independent Test**: Supertest: create draft → send → assert notification rows; send với `all_stores` không 500 với seed nhỏ.

---

- [ ] T013 Tạo `apps/backend/src/admin/dto/create-admin-announcement.dto.ts` — `title`, `body`, `recipientMode`, `storeIds?`, `action` (`save_draft` | `send`) với validation theo mode
- [ ] T014 Tạo `apps/backend/src/admin/dto/update-admin-announcement.dto.ts` — partial fields cho nháp
- [ ] T015 Implement `apps/backend/src/admin/admin-announcements.service.ts` `create(dto, adminId)` — persist announcement; nếu `send` thì gọi internal `sendAnnouncement`
- [ ] T016 Implement `sendAnnouncement(id, adminId)` — load announcement draft; resolve store → owner ids (dedupe); bulk `NotificationsService` (hoặc loop) với `event_type = ADMIN_ANNOUNCEMENT`; gọi `MailService`/queue cho từng email; cập nhật `status`, `sent_at`, `recipient_count`, `failed_email_details` (gom lỗi từ worker hoặc try/catch per job)
- [ ] T017 Implement `updateDraft(id, dto, adminId)` — chỉ khi `status === draft`
- [ ] T018 Implement `listHistory(query, adminId optional filter)` — pagination cho GET history
- [ ] T019 Tạo `apps/backend/src/admin/admin-announcements.controller.ts` — `POST /admin/announcements`, `PATCH /admin/announcements/:id`, `POST /admin/announcements/:id/send`, `GET /admin/announcements`; `AdminJwtGuard`
- [ ] T020 Đăng ký controller/service trong `admin.module.ts`; inject `NotificationsModule`, `MailModule` nếu cần
- [ ] T021 [P] Đảm bảo constant `ADMIN_ANNOUNCEMENT` (hoặc tương đương) được dùng thống nhất khi tạo `Notification`
- [ ] T022 [P] Tạo integration test `apps/backend/test/admin-announcements.e2e-spec.ts` — draft + send một store; 400 khi body empty

---

## Phase 4 — Frontend — Admin Stores (US1)

**Goal**: Trang danh sách gian hàng + hành động activate/deactivate/delete với modal xác nhận.

**Independent Test**: Manual: Admin login → `/admin/stores` → thao tác và quan sát toast + reload list.

---

- [ ] T023 Tạo `apps/frontend/src/lib/api/admin-stores.ts` — `listAdminStores`, `activateStore`, `deactivateStore`, `getDeleteImpact`, `deleteStore` khớp contract
- [ ] T024 Tạo `apps/frontend/src/app/(admin)/admin/stores/page.tsx` — bảng: tên, chủ, trạng thái, actions; pagination; search debounce
- [ ] T025 [P] Tạo component xác nhận xóa `apps/frontend/src/components/admin/DeleteStoreConfirmDialog.tsx` — gọi `getDeleteImpact` trước; hiển thị cảnh báo; submit `deleteStore` với `confirmed: true`
- [ ] T026 Cập nhật `apps/frontend/src/components/layout/AdminSidebar.tsx` — thêm NavLink **Gian hàng** (route `/admin/stores`), nhãn tiếng Việt nhất quán spec 008
- [ ] T027 Cập nhật `apps/frontend/src/middleware.ts` (nếu cần) — không đổi rule; đảm bảo `/admin/stores` nằm trong vùng admin đã bảo vệ
- [ ] T028 [P] Xử lý lỗi 409 từ API — toast hiển thị message từ `message` field

---

## Phase 5 — Frontend — Admin Announcements (US2)

**Goal**: Form soạn + chọn recipient + lịch sử gửi.

**Independent Test**: Gửi thử tới một store; kiểm tra Store Owner thấy notification.

---

- [ ] T029 Tạo `apps/frontend/src/lib/api/admin-announcements.ts` — create, update, send, list theo contract
- [ ] T030 Tạo `apps/frontend/src/app/(admin)/admin/announcements/page.tsx` — form title/body; radio hoặc select mode; multi-select store (fetch từ `listAdminStores`); nút Lưu nháp / Gửi; section lịch sử hoặc tab
- [ ] T031 [P] Tạo `apps/frontend/src/components/admin/AnnouncementRecipientPicker.tsx` — chọn 1 / nhiều / tất cả; disable store picker khi `all_stores`
- [ ] T032 [P] Preview modal đơn giản (title + body) trước khi gửi (tuỳ chọn UX — có thể gộp vào confirm dialog)
- [ ] T033 Cập nhật `AdminSidebar.tsx` — thêm **Gửi thông báo** → `/admin/announcements`
- [ ] T034 Hiển thị kết quả gửi: `recipientCount`, `failedEmailDetails` nếu API trả (banner hoặc toast)
- [ ] T035 [P] Empty state khi chưa có lịch sử

---

## Phase N — Polish

- [ ] T036 [P] Đồng bộ nhãn sidebar với `specs/007-ui-ux-navigation` / `008` (nếu cần thêm icon)
- [ ] T037 [P] Rate limit hoặc guard: không spam `POST .../send` (tuỳ chính sách team — gợi ý `@Throttle` trên controller)
- [ ] T038 [P] Logging: không log nội dung email đầy đủ trong production log (PII); chỉ log ids
- [ ] T039 Cập nhật `SETUP.md` hoặc `CLAUDE.md` **chỉ khi** team yêu cầu ghi chú feature mới (task tuỳ chọn — mặc định bỏ qua nếu không cần)
- [ ] T040 Chạy `npm test && npm run lint` từ root repo trước khi merge

---

## Dependencies & Execution Order

```
Phase 1 (T001–T003)
    → Phase 2 (T004–T012) và Phase 3 (T013–T022) có thể song song sau T003
    → Phase 4 phụ thuộc Phase 2
    → Phase 5 phụ thuộc Phase 3 (và T023 list stores cho picker nếu dùng chung API)
    → Phase N cuối cùng
```

## Implementation Strategy (MVP)

1. Hoàn thành Phase 1 + Phase 2 + Phase 4 → demo UC-A02 end-to-end.  
2. Thêm Phase 3 + Phase 5 → demo UC-A07.  
3. Phase N hardening.

## Ghi chú

- `[P]` = có thể song song trong cùng phase nếu khác file và không conflict.  
- Mọi task backend API MUST có test tối thiểu theo **Constitution Principle VI** ([contracts/api.md](./contracts/api.md) cuối file).

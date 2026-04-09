# Tasks: Quản lý gian hàng & Thuyết minh AI

**Feature**: `002-store-management-ai-commentary`
**Date**: 2026-04-05
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)
**Total tasks**: 94

---

## Phase 1 — Setup & Infrastructure

> Mục tiêu: Cấu hình toàn bộ hạ tầng trước khi viết business logic. Các task này độc lập nhau và có thể chạy song song.

- [X] T001 [P] Thêm biến môi trường MinIO/S3 vào `apps/backend/.env.example`: `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET_MEDIA`, `MINIO_USE_SSL`
- [X] T002 [P] Thêm biến môi trường Google Cloud vào `apps/backend/.env.example`: `GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_APPLICATION_CREDENTIALS`, `SUPPORTED_LANGUAGES` (JSON array BCP-47)
- [X] T003 [P] Thêm biến môi trường BullMQ/Redis vào `apps/backend/.env.example`: `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `BULL_BOARD_USERNAME`, `BULL_BOARD_PASSWORD`
- [X] T004 [P] Cài đặt backend dependencies: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, `@google-cloud/translate`, `@google-cloud/text-to-speech`, `bullmq`, `@bull-board/api`, `@bull-board/nestjs`, `socket.io`, `@nestjs/websockets`, `@nestjs/platform-socket.io` — cập nhật `apps/backend/package.json`
- [X] T005 [P] Cài đặt frontend dependencies: `socket.io-client`, `i18next`, `react-i18next`, `i18next-browser-languagedetector` — cập nhật `apps/frontend/package.json`
- [X] T006 [P] Tạo `apps/backend/src/storage/storage.module.ts`: export `StorageService`, import `ConfigModule`
- [X] T007 [P] Tạo `apps/backend/src/storage/storage.service.ts`: wrapper S3 client (MinIO endpoint), methods `generatePresignedPutUrl(key, contentType, expiresIn)`, `deleteObject(key)`, `getPublicUrl(key)`
- [X] T008 [P] Tạo `apps/backend/src/config/bullmq.config.ts`: factory `BullModule.forRootAsync` đọc `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` từ `ConfigService`
- [X] T009 [P] Tạo `apps/backend/src/config/google-cloud.config.ts`: export hàm `getSupportedLanguages()` đọc env `SUPPORTED_LANGUAGES`, default `['en','fr','zh','ja','ko','th']`
- [X] T010 Đăng ký `BullModule.forRootAsync` và `Bull Board` middleware trong `apps/backend/src/app.module.ts` (sau T008)
- [X] T011 Đăng ký `StorageModule` global trong `apps/backend/src/app.module.ts` (sau T006, T007)
- [X] T012 [P] Tạo `apps/frontend/src/lib/i18n/config.ts`: khởi tạo i18next với `LanguageDetector`, `initReactI18next`, order detect `['querystring','localStorage','navigator']`, fallback `vi`
- [X] T013 [P] Tạo `apps/frontend/src/lib/i18n/locales/vi.json` và `apps/frontend/src/lib/i18n/locales/en.json`: các chuỗi UI cơ bản (placeholder — sẽ bổ sung theo từng phase)

---

## Phase 2 — Database Foundation

> Mục tiêu: Tạo đủ schema và entity skeleton trước khi implement business logic. Migration phải chạy theo thứ tự do FK dependency.

- [X] T014 Tạo TypeORM migration `apps/backend/src/migrations/002-001-create-store-enums.ts`: `CREATE TYPE store_status AS ENUM ('active', 'inactive')`, `CREATE TYPE draft_status AS ENUM ('pending','approved','rejected')`, `CREATE TYPE commentary_pipeline_status AS ENUM ('pending','running','completed','failed')`
- [X] T015 Tạo TypeORM migration `apps/backend/src/migrations/002-002-alter-stores-add-commentary.ts`: thêm cột `description VARCHAR(1000)`, `active_commentary_id UUID REFERENCES commentaries(id) ON DELETE SET NULL DEFERRABLE INITIALLY DEFERRED`, `CREATE INDEX idx_stores_status`, `CREATE INDEX idx_stores_owner_id` vào bảng `stores` (extend từ spec 001)
- [X] T016 Tạo TypeORM migration `apps/backend/src/migrations/002-003-create-store-content-drafts.ts`: tạo bảng `store_content_drafts` với tất cả cột theo data-model.md, partial unique index `idx_store_drafts_one_pending`, index `idx_store_drafts_store_id`, `idx_store_drafts_status`
- [X] T017 Tạo TypeORM migration `apps/backend/src/migrations/002-004-create-menu-items.ts`: tạo bảng `menu_items`, GIN index `idx_menu_items_name_fts ON menu_items USING gin(to_tsvector('simple', name))`, index `idx_menu_items_store_id`
- [X] T018 Tạo TypeORM migration `apps/backend/src/migrations/002-005-create-store-images.ts`: tạo bảng `store_images`, index `idx_store_images_store_id`, partial index `idx_store_images_active WHERE is_in_draft = false`
- [X] T019 Tạo TypeORM migration `apps/backend/src/migrations/002-006-create-commentaries.ts`: tạo bảng `commentaries`, partial index `idx_commentaries_pipeline_status WHERE pipeline_status IN ('pending','running')`
- [X] T020 Tạo TypeORM migration `apps/backend/src/migrations/002-007-create-commentary-translations.ts`: tạo bảng `commentary_translations`, unique index `idx_commentary_translations_unique ON (commentary_id, language_code)`, index `idx_commentary_translations_commentary_id`
- [X] T021 [P] Tạo `apps/backend/src/stores/entities/store.entity.ts`: TypeORM Entity map bảng `stores` với tất cả cột, relations `@OneToMany` đến `StoreContentDraft`, `MenuItem`, `StoreImage`, `Commentary`; relation `@ManyToOne` đến `Commentary` (active_commentary_id)
- [X] T022 [P] Tạo `apps/backend/src/stores/entities/store-content-draft.entity.ts`: TypeORM Entity map bảng `store_content_drafts`, relation `@ManyToOne` đến `Store`
- [X] T023 [P] Tạo `apps/backend/src/stores/entities/menu-item.entity.ts`: TypeORM Entity map bảng `menu_items`, relation `@ManyToOne` đến `Store`
- [X] T024 [P] Tạo `apps/backend/src/stores/entities/store-image.entity.ts`: TypeORM Entity map bảng `store_images`, relation `@ManyToOne` đến `Store`
- [X] T025 [P] Tạo `apps/backend/src/commentary/entities/commentary.entity.ts`: TypeORM Entity map bảng `commentaries`, relations `@ManyToOne` đến `Store`, `@OneToMany` đến `CommentaryTranslation`
- [X] T026 [P] Tạo `apps/backend/src/commentary/entities/commentary-translation.entity.ts`: TypeORM Entity map bảng `commentary_translations`, relation `@ManyToOne` đến `Commentary`
- [X] T027 [P] Tạo `apps/backend/src/stores/stores.module.ts`: skeleton module, import `TypeOrmModule.forFeature([Store, StoreContentDraft, MenuItem, StoreImage])`, export `StoresService`
- [X] T028 [P] Tạo `apps/backend/src/commentary/commentary.module.ts`: skeleton module, import `TypeOrmModule.forFeature([Commentary, CommentaryTranslation])`, import `BullModule.registerQueue({ name: 'commentary-pipeline' })`, export `CommentaryService`
- [X] T029 [P] Tạo `packages/types/src/store.types.ts`: shared types `StoreStatus`, `DraftStatus`, `StoreDto`, `StoreContentDraftDto`, `MenuItemDto`, `StoreImageDto`
- [X] T030 [P] Tạo `packages/types/src/commentary.types.ts`: shared types `CommentaryPipelineStatus`, `CommentaryDto`, `CommentaryTranslationDto`, `CommentaryResponseDto`

---

## Phase 3 — US1 + US2: Store Owner Edit & Admin Review Flow

> US1 (Store Owner chỉnh sửa và gửi duyệt) và US2 (Admin duyệt/từ chối) là hai nửa của cùng một flow. Implement backend trước, sau đó frontend.

### Backend — Store Owner (US1)

- [X] T031 [US1] Tạo `apps/backend/src/stores/dto/update-store.dto.ts`: class `UpdateStoreDto` với `@IsString() @MaxLength(255) name`, `@IsOptional() @IsString() @MaxLength(1000) description`; sử dụng `class-validator`
- [X] T032 [US1] Tạo `apps/backend/src/stores/dto/submit-draft.dto.ts`: class `MenuItemDto` (name, description, price), class `SubmitDraftDto` không có fields — endpoint POST /submit không nhận body
- [X] T033 [US1] Implement `apps/backend/src/stores/stores.service.ts` method `getMyStore(ownerId)`: query `stores` JOIN `menu_items` (is_in_draft=false) JOIN `store_images` (is_in_draft=false), trả về `hasPendingDraft` và `activeCommentaryStatus`
- [X] T034 [US1] Implement `apps/backend/src/stores/stores.service.ts` method `saveDraft(ownerId, dto)`: kiểm tra partial unique index (throw 409 nếu pending tồn tại), tạo record `store_content_drafts` với `status='pending'`, trả về draftId
- [X] T035 [US1] Implement `apps/backend/src/stores/stores.service.ts` method `submitDraft(ownerId)`: kiểm tra draft pending tồn tại (throw 404 nếu không có), gửi notification đến Admin (gọi `NotificationsService`), trả về draft info
- [X] T036 [US1] Implement `apps/backend/src/stores/stores.service.ts` method `revokeDraft(ownerId)`: lấy draft `pending` của store, xóa record `store_content_drafts`, revert `menu_items.is_in_draft=false` về false, throw 404 nếu không có pending
- [X] T037 [US1] Implement `apps/backend/src/stores/stores.service.ts` method `getMyDraft(ownerId)`: trả về draft mới nhất có status `pending` hoặc `rejected`, throw 404 nếu không có
- [X] T038 [US1] Tạo `apps/backend/src/stores/stores.controller.ts`: routes `GET /store-owner/store`, `PUT /store-owner/store`, `POST /store-owner/store/submit`, `DELETE /store-owner/store/draft`, `GET /store-owner/store/draft` — guard JWT + role `store_owner`
- [X] T039 [US1] Implement `apps/backend/src/stores/stores.service.ts` method `addMenuItem(ownerId, dto)`: kiểm tra store không có draft `status='pending'` (throw 409 `DRAFT_PENDING` nếu có — FR-003 blocks tất cả edits khi đang pending); nếu không có draft pending, tạo `menu_items` với `is_in_draft=true`
- [X] T040 [US1] Implement `apps/backend/src/stores/stores.service.ts` method `updateMenuItem(ownerId, itemId, dto)`: update cột của `menu_items`, set `is_in_draft=true`, kiểm tra ownership (throw 403)
- [X] T041 [US1] Implement `apps/backend/src/stores/stores.service.ts` method `removeMenuItem(ownerId, itemId)`: nếu `is_in_draft=true` → xóa record hẳn; nếu `is_in_draft=false` → set `is_in_draft=true` để đánh dấu xóa khi duyệt
- [X] T042 [US1] Thêm routes menu items vào `apps/backend/src/stores/stores.controller.ts`: `GET /store-owner/store/menu-items`, `POST /store-owner/store/menu-items`, `PUT /store-owner/store/menu-items/:id`, `DELETE /store-owner/store/menu-items/:id`

### Backend — Admin Review (US2)

- [X] T043 [US2] Tạo `apps/backend/src/admin/dto/reject-draft.dto.ts`: class `RejectDraftDto` với `@IsString() @MinLength(10) @MaxLength(2000) reason`
- [X] T044 [US2] Tạo `apps/backend/src/admin/admin-stores.service.ts` method `listPendingDrafts(page, limit)`: query `store_content_drafts` WHERE status='pending' JOIN `stores` JOIN `users` (owner), trả về paginated list
- [X] T045 [US2] Tạo `apps/backend/src/admin/admin-stores.service.ts` method `getDraftDetail(draftId)`: query draft + `stores` (current state) + `menu_items` + `store_images`, build `current` vs `proposed` diff với field `action: 'added'|'modified'|'removed'`
- [X] T046 [US2] Tạo `apps/backend/src/admin/admin-stores.service.ts` method `approveDraft(adminId, draftId)`:
  - **Trong transaction**: update draft `status='approved'`, update `stores.name/description`, commit `menu_items/store_images` draft changes (set `is_in_draft=false` cho items giữ lại, xóa items đánh dấu xóa), tạo `Commentary` record với `source_text = stores.description`, update `stores.active_commentary_id`
  - **Sau khi transaction COMMIT** (ngoài transaction): enqueue BullMQ job `commentary-pipeline` với `commentaryId`; gửi in-app notification và email đến Store Owner — nếu enqueue thất bại, log error nhưng không throw (transaction đã committed thành công)
- [X] T047 [US2] Tạo `apps/backend/src/admin/admin-stores.service.ts` method `rejectDraft(adminId, draftId, reason)`: update draft status='rejected' + rejection_reason, gửi notification Store Owner kèm reason
- [X] T048 [US2] Tạo `apps/backend/src/admin/admin-stores.controller.ts`: routes `GET /admin/store-drafts`, `GET /admin/store-drafts/:id`, `PATCH /admin/store-drafts/:id/approve`, `PATCH /admin/store-drafts/:id/reject` — guard JWT + role `admin`

### Frontend — Store Owner Edit (US1)

- [X] T049 [US1] Tạo `apps/frontend/src/app/(store-owner)/dashboard/store/page.tsx`: server component, fetch `GET /api/store-owner/store`, hiển thị thông tin hiện hành, badge trạng thái draft (`pending`/`rejected`), nút "Chỉnh sửa" (disabled khi pending)
- [X] T050 [US1] Tạo `apps/frontend/src/components/stores/StoreEditForm.tsx`: form với fields `name` (max 255), `description` (max 1000, có bộ đếm ký tự còn lại), nút "Lưu nháp" và "Gửi duyệt"; validate client-side trước khi call API
- [X] T051 [US1] Tạo `apps/frontend/src/lib/api/stores.ts`: functions `getMyStore()`, `saveDraft(dto)`, `submitDraft()`, `revokeDraft()`, `getMyDraft()`, `getMenuItems()`, `addMenuItem(dto)`, `updateMenuItem(id, dto)`, `removeMenuItem(id)` — wrapper `fetch` với JWT header
- [X] T052 [US1] Tạo `apps/frontend/src/app/(store-owner)/dashboard/store/menu/page.tsx`: danh sách món ăn với form inline thêm/sửa/xóa, confirm dialog trước khi xóa, badge "Chờ duyệt" cho món `is_in_draft=true`
- [X] T053 [US1] Hiển thị rejection reason và nút "Chỉnh sửa lại" trong `apps/frontend/src/app/(store-owner)/dashboard/store/page.tsx` khi draft status='rejected'

### Frontend — Admin Review (US2)

- [X] T054 [US2] Tạo `apps/frontend/src/app/(admin)/admin/store-drafts/page.tsx`: danh sách các store draft `pending`, paginated, hiển thị storeName, ownerName, submittedAt, link đến detail
- [X] T055 [US2] Tạo `apps/frontend/src/app/(admin)/admin/store-drafts/[id]/page.tsx`: fetch `GET /api/admin/store-drafts/:id`, render `DraftCompareView`, nút "Phê duyệt" và "Từ chối"
- [X] T056 [US2] Tạo `apps/frontend/src/components/admin/DraftCompareView.tsx`: hiển thị side-by-side `current` vs `proposed`, highlight các thay đổi (added=xanh, modified=vàng, removed=đỏ) cho tên, mô tả, menu items, images
- [X] T057 [US2] Tạo `apps/frontend/src/components/admin/RejectReasonModal.tsx`: modal nhập lý do từ chối, validate min 10 chars, nút "Xác nhận từ chối" gọi `PATCH /api/admin/store-drafts/:id/reject`

---

## Phase 4 — US3: AI Pipeline

> Toàn bộ phase này là backend-only. Frontend chỉ nhận kết quả qua WebSocket.

- [X] T058 [US3] Tạo `apps/backend/src/commentary/translation.service.ts`: class `TranslationService`, method `translate(text, targetLanguage)` gọi `@google-cloud/translate` v2 API, throw `TranslationError` khi thất bại
- [X] T059 [US3] Tạo `apps/backend/src/commentary/tts.service.ts`: class `TtsService`, method `synthesize(text, languageCode)` gọi `@google-cloud/text-to-speech`, trả về `Buffer` MP3, throw `TtsError` khi thất bại
- [X] T060 [US3] Tạo `apps/backend/src/commentary/commentary.service.ts` method `createCommentary(storeId, sourceText)`: tạo record `commentaries` với `pipeline_status='pending'`, trả về commentaryId (được gọi từ `approveDraft`)
- [X] T061 [US3] Tạo `apps/backend/src/commentary/commentary.processor.ts`: BullMQ Processor class `@Processor('commentary-pipeline')`, method `process(job)`:
  1. Update `pipeline_status='running'`
  2. Lấy `SUPPORTED_LANGUAGES` từ config
  3. Với mỗi ngôn ngữ:
     - **Nếu ngôn ngữ là `vi`**: bỏ qua bước dịch, dùng `sourceText` gốc làm input TTS trực tiếp (KHÔNG gọi `TranslationService.translate()`)
     - **Nếu ngôn ngữ khác `vi`**: gọi `TranslationService.translate(sourceText, lang)` → dùng kết quả làm input TTS
     - Gọi `TtsService.synthesize(inputText, lang)`, upload MP3 lên MinIO (`StorageService`), lưu `commentary_translations` record
  4. Nếu TTS lỗi → lưu record với `audio_url=null`
  5. Nếu Translation lỗi toàn bộ (tất cả ngôn ngữ non-vi đều thất bại) → update `pipeline_status='failed'`
  6. Update `pipeline_status='completed'` sau khi xong
  7. Emit WebSocket event `commentary:updated`
- [X] T062 [US3] Tạo `apps/backend/src/commentary/commentary.gateway.ts`: Socket.io Gateway `@WebSocketGateway`, event `joinStore(storeId)` → join room `store:{storeId}`, method `emitCommentaryUpdated(storeId, payload)` emit đến room; đăng ký `CommentaryGateway` làm provider trong `apps/backend/src/commentary/commentary.module.ts` để NestJS khởi tạo WebSocket server
- [X] T063 [US3] Implement partial failure handling trong `apps/backend/src/commentary/commentary.processor.ts`: `try/catch` per language — translation thất bại → bỏ qua ngôn ngữ đó + log; TTS thất bại → lưu record với `audio_url=null`; chỉ set `pipeline_status='failed'` khi 0 ngôn ngữ nào dịch được
- [X] T064 [US3] Cấu hình BullMQ retry trong `apps/backend/src/commentary/commentary.module.ts`: `defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 5000 } }`
- [X] T065 [US3] Tạo `apps/frontend/src/components/stores/PipelineBanner.tsx`: banner hiển thị "Thuyết minh đang được tổng hợp..." khi `pipelineStatus='running'`, ẩn khi `pipelineStatus='completed'`; subscribe WebSocket room `store:{storeId}`, khi nhận `commentary:updated` với status='completed' → invalidate TanStack Query cache `['commentary', storeId, lang]`

---

## Phase 5 — US4: Customer Browse & Store Detail

- [X] T066 [US4] Tạo `apps/backend/src/public/public-stores.service.ts` method `listStores(q, page, limit)`: query `stores` WHERE status='active', nếu `q` → LEFT JOIN `menu_items` + WHERE ILIKE + GIN search, SELECT id/name/description/thumbnail_url/menu_item_count/has_commentary, paginated
- [X] T067 [US4] Tạo `apps/backend/src/public/public-stores.service.ts` method `getStoreDetail(storeId)`: query store + menu_items (is_in_draft=false) + store_images (is_in_draft=false) + active_commentary_id + pipeline_status, trả về đủ fields theo API contract
- [X] T068 [US4] Tạo `apps/backend/src/public/public-stores.service.ts` method `getCommentary(storeId, lang)`: lấy `stores.active_commentary_id`, query `commentaries` + `commentary_translations` WHERE `language_code=lang`; fallback logic theo API contract (pipeline_running, pipeline_failed, no_translation)
- [X] T069 [US4] Tạo `apps/backend/src/public/public-stores.controller.ts`: routes `GET /stores`, `GET /stores/:id`, `GET /stores/:id/commentary` — không có auth guard; đọc `Accept-Language` header cho `GET /stores/:id/commentary` làm default `lang` nếu query param không có
- [X] T070 [US4] Tạo `apps/frontend/src/app/(public)/stores/page.tsx`: server component, fetch `GET /api/stores`, render danh sách `StoreCard`, có `StoreSearchBar` với debounce 300ms, không yêu cầu đăng nhập
- [X] T071 [US4] Tạo `apps/frontend/src/components/stores/StoreCard.tsx`: card hiển thị thumbnail, tên store, số lượng món, badge "Có thuyết minh" nếu `hasCommentary=true`
- [X] T072 [US4] Tạo `apps/frontend/src/components/stores/StoreSearchBar.tsx`: input search với debounce 300ms, update URL query param `?q=`, trigger refetch danh sách
- [X] T073 [US4] Tạo `apps/frontend/src/app/(public)/stores/[id]/page.tsx`: server component, fetch `GET /api/stores/:id` + `GET /api/stores/:id/commentary?lang={detected}`, render `StoreDetailView` + `CommentaryPlayer` + `PipelineBanner`; hiển thị "Gian hàng hiện không hoạt động" nếu status='inactive'; hiển thị "Chưa có nội dung thuyết minh" nếu commentary null
- [X] T074 [US4] Tạo `apps/frontend/src/components/stores/StoreDetailView.tsx`: layout trang chi tiết — ảnh carousel (sắp xếp theo orderIndex), tên, mô tả, danh sách món ăn kèm giá (VND format)
- [X] T075 [US4] Tạo `apps/frontend/src/components/stores/CommentaryPlayer.tsx`: hiển thị `translatedText`, audio player HTML5 native (play/pause/seek) với src=`audioUrl`, ẩn audio player nếu `audioUrl=null`, hiển thị "Audio tạm thời không khả dụng" nếu `message` có
- [X] T076 [US4] Tạo `apps/frontend/src/lib/api/commentary.ts`: functions `getStoreCommentary(storeId, lang)`, `getStoreDetail(storeId)`, `listStores(params)` — sử dụng TanStack Query

---

## Phase 6 — US5: Language Switcher

- [X] T077 [US5] Tạo `apps/frontend/src/components/LanguageSwitcher.tsx`: dropdown chọn ngôn ngữ (vi, en, fr, zh, ja, ko, th), đọc ngôn ngữ hiện tại từ i18next, khi chọn → gọi `i18n.changeLanguage()`, lưu vào `localStorage` key `phat_lang`, set cookie `phat_lang` để Next.js server đọc
- [X] T078 [US5] Tạo `apps/frontend/src/app/layout.tsx` hoặc middleware: đọc cookie `phat_lang` (fallback `Accept-Language` header, fallback `vi`), set ngôn ngữ mặc định cho i18next SSR
- [X] T079 [US5] Cập nhật `apps/frontend/src/app/(public)/stores/[id]/page.tsx`: đọc `lang` từ cookie/localStorage để gọi `GET /api/stores/:id/commentary?lang={lang}` đúng ngôn ngữ Customer đang dùng
- [X] T080 [US5] Tạo `apps/frontend/src/hooks/useCommentary.ts`: custom hook TanStack Query gọi `getStoreCommentary(storeId, lang)`, re-fetch khi `lang` thay đổi (key array `['commentary', storeId, lang]`); expose `{ translatedText, audioUrl, pipelineStatus, fallback, message, isLoading }`
- [X] T081 [US5] Cập nhật `apps/frontend/src/components/stores/CommentaryPlayer.tsx`: sử dụng `useCommentary` hook, khi ngôn ngữ đổi → tự động fetch commentary mới, reset audio player về đầu
- [X] T082 [US5] Cập nhật `apps/frontend/src/lib/i18n/locales/vi.json` và `en.json` (và thêm `fr.json`, `zh.json`, `ja.json`, `ko.json`, `th.json`): thêm các string UI cho LanguageSwitcher, PipelineBanner, fallback messages

---

## Phase N — Polish & Edge Cases

> Các task này không thuộc user story cụ thể — là hardening và xử lý edge case.

- [X] T083 [P] Implement `PATCH /api/store-owner/store/images/:id/confirm` trong `apps/backend/src/stores/stores.controller.ts` + `apps/backend/src/stores/stores.service.ts`: sau khi frontend upload xong presigned URL, backend ghi record `store_images` chính thức với `is_in_draft=true`, set url từ S3 key
- [X] T084 [P] Implement `DELETE /api/store-owner/store/images/:id` trong `apps/backend/src/stores/stores.service.ts`: xóa record `store_images`, gọi `StorageService.deleteObject(s3Key)` để xóa file thật; kiểm tra ownership (throw 403)
- [X] T085 [P] Tạo `apps/frontend/src/app/(store-owner)/dashboard/store/images/page.tsx`: grid ảnh hiện tại, nút upload (trigger flow presigned URL → upload → confirm), nút xóa mỗi ảnh, hiển thị số ảnh còn được upload (10 - current count), báo lỗi khi vượt 10 ảnh hoặc file > 10MB
- [X] T086 [P] Validate charset và size trong `apps/backend/src/stores/dto/update-store.dto.ts`: `@Matches(/^[\p{L}\p{N}\s\p{P}]+$/u)` cho name/description để chặn control characters; validate `contentType` trong image upload DTO chỉ cho phép `image/jpeg`, `image/png`, `image/webp`
- [X] T087 [P] Implement image upload presigned URL endpoint `POST /api/store-owner/store/images` trong `apps/backend/src/stores/stores.service.ts`: kiểm tra tổng ảnh hiện tại < 10 (throw 422 nếu không), gọi `StorageService.generatePresignedPutUrl()`, tạo record `store_images` với `is_in_draft=true` và url tạm
- [X] T088 [P] Tạo fallback UI states trong `apps/frontend/src/components/stores/CommentaryPlayer.tsx`: skeleton loading khi `isLoading=true`, empty state "Chưa có nội dung thuyết minh" khi `translatedText=null`, error state khi fetch thất bại
- [X] T089 [P] Xử lý race condition Admin approve đúng lúc Store Owner revoke trong `apps/backend/src/stores/stores.service.ts` method `revokeDraft`: dùng `SELECT ... FOR UPDATE` trong transaction, nếu draft đã `approved` → throw 409 với message "Thông tin đã được Admin duyệt. Không thể thu hồi."
- [X] T090 [P] Xử lý gian hàng inactive khi AI pipeline đang chạy trong `apps/backend/src/public/public-stores.service.ts` method `getCommentary`: kiểm tra `stores.status`, nếu `inactive` → return 404; pipeline vẫn chạy bình thường nhưng kết quả chỉ được serve khi store active trở lại
- [X] T091 [P] Implement NotificationsService email trong `apps/backend/src/notifications/notifications.service.ts`: method `notifyAdminNewDraft(adminEmail, storeName)`, `notifyOwnerApproved(ownerEmail, storeName)`, `notifyOwnerRejected(ownerEmail, storeName, reason)` — dùng Nodemailer, template HTML đơn giản
- [X] T092 [P] Implement NotificationsService in-app notification: lưu record vào bảng `notifications` (spec 001 nếu đã có) hoặc tạo table mới; expose qua `GET /api/notifications` endpoint (scope task này chỉ là emit, không cần UI phức tạp)
- [X] T093 [P] Thêm guard vào `apps/backend/src/public/public-stores.service.ts` method `getStoreDetail`: nếu `store.status === 'inactive'` → throw `NotFoundException('Store not found')` thay vì trả 200 với dữ liệu; cập nhật frontend T073 để bắt lỗi 404 và hiển thị "Gian hàng hiện không hoạt động" (SC-005)
- [X] T094 [P] Integration test SC-002 pipeline SLA trong `apps/backend/test/commentary-pipeline.e2e-spec.ts`: mock Google Translate + TTS trả về nhanh; POST approve draft → poll `GET /api/admin/store-drafts/:id` hoặc `commentary_translations` table → assert có ít nhất 1 row với `audio_url != null` trong vòng 60 giây; fail test nếu vượt timeout (SC-002)

---

## Dependency Graph

```
T001–T005  (parallel setup)
     ↓
T006–T013  (parallel config/skeleton)
     ↓
T010, T011 (register modules — sau T006-T009)
     ↓
T014       (enums migration — phải chạy đầu tiên)
     ↓
T015–T020  (migrations — theo thứ tự FK dependency)
     ↓
T021–T030  (entities + module skeletons — parallel)
     ↓
Phase 3 backend (T031–T048 — US1 trước, US2 sau do US2 gọi service của US1)
     ↓
Phase 3 frontend (T049–T057 — parallel sau backend)
     ↓
Phase 4 (T058–T065 — US3, phụ thuộc T046 approveDraft enqueue job)
     ↓
Phase 5 (T066–T076 — US4, phụ thuộc Phase 4 có commentary data)
     ↓
Phase 6 (T077–T082 — US5, phụ thuộc US4 UI và US3 pipeline)
     ↓
Phase N (T083–T092 — polish, có thể làm song song với Phase 5-6)
```

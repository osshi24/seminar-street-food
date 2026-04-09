# Tasks: Gợi ý món ăn theo sở thích

**Spec**: 006-food-recommendation | **Date**: 2026-04-05
**Branch**: `006-food-recommendation`
**Depends on**: spec 002 (menu_items, stores đã có)

---

## Legend

- `[P]` — Task có thể chạy song song với các task khác trong cùng phase
- `[US1]` — Task thuộc User Story 1: Customer nhận gợi ý món ăn phù hợp với sở thích

---

## Phase 2 — Foundation (Database & Entities)

> Thiết lập schema và entities. Phải hoàn thành trước Phase 3.

- [X] T001 Tạo migration `preference_tags` table tại `apps/backend/src/database/migrations/YYYYMMDD_create_preference_tags.ts` — SERIAL PK, `name_vi VARCHAR(100)`, `name_en VARCHAR(100)`, `group_type VARCHAR(50) CHECK IN ('dish_type','flavor','allergen')`, `created_at`, `updated_at`, index trên `group_type`
- [X] T002 Tạo migration `menu_item_tags` join table tại `apps/backend/src/database/migrations/YYYYMMDD_create_menu_item_tags.ts` — composite PK `(menu_item_id UUID, tag_id INT)`, FK `menu_item_id → menu_items.id ON DELETE CASCADE`, FK `tag_id → preference_tags.id` (không CASCADE), index phụ trên `tag_id`
- [X] T003 [P] Tạo `PreferenceTag` entity tại `apps/backend/src/tags/entities/preference-tag.entity.ts` — `@Entity('preference_tags')`, các cột `id`, `nameVi`, `nameEn`, `groupType`, `createdAt`, `updatedAt`, `@ManyToMany` relation với `MenuItem`
- [X] T004 [P] Extend `MenuItem` entity tại `apps/backend/src/menu-items/entities/menu-item.entity.ts` — thêm `@ManyToMany(() => PreferenceTag)` với `@JoinTable({ name: 'menu_item_tags', joinColumn: { name: 'menu_item_id' }, inverseJoinColumn: { name: 'tag_id' } })`
- [X] T005 Tạo seed file `apps/backend/src/database/seeds/preference-tags.seed.ts` — seed ít nhất 3 nhóm: `dish_type` (Cơm, Phở, Bánh mì, Lẩu, Bún), `flavor` (Cay, Ngọt, Chay, Mặn, Ít dầu mỡ), `allergen` (Không gluten, Không hải sản, Không đậu phộng)

---

## Phase 3 — User Story 1: Customer nhận gợi ý món ăn [US1]

> Luồng chính: Customer chọn tags → nhận danh sách gợi ý. Không yêu cầu đăng nhập.

### Backend — Tags Module

- [X] T006 [P] [US1] Tạo `TagsModule` tại `apps/backend/src/tags/tags.module.ts` — import `TypeOrmModule.forFeature([PreferenceTag])`, export `TagsService`
- [X] T007 [P] [US1] Tạo `TagsService` tại `apps/backend/src/tags/tags.service.ts` — method `findGrouped()`: query tất cả tags, nhóm theo `group_type` theo thứ tự cố định `dish_type → flavor → allergen`, sắp xếp tags trong nhóm theo `id ASC`, trả về array `{ groupType, label, tags[] }`
- [X] T008 [P] [US1] Tạo `TagsController` tại `apps/backend/src/tags/tags.controller.ts` — `GET /api/tags` (public, không auth), gọi `tagsService.findGrouped()`, trả response theo contract `api.md` (200 OK, field `groups`)
- [X] T009 [US1] Đăng ký `TagsModule` vào `apps/backend/src/app.module.ts`

### Backend — Recommendations Module

- [X] T010 [P] [US1] Tạo `GetRecommendationsDto` tại `apps/backend/src/recommendations/dto/get-recommendations.dto.ts` — validate `tags` (required, parse comma-separated string → number[], min 1, max 5, mỗi phần tử là số nguyên dương), validate `page` (optional, integer ≥ 1, default 1), error codes `TAGS_REQUIRED`, `TOO_MANY_TAGS`, `INVALID_TAG_IDS`, `INVALID_PAGE`
- [X] T011 [P] [US1] Tạo `RecommendationsService` tại `apps/backend/src/recommendations/recommendations.service.ts` — inject `DataSource`, method `getRecommendations(tagIds: number[], page: number)`: chạy song song raw SQL query chính (COUNT GROUP BY ORDER BY match_count DESC, LIMIT 20 OFFSET) và COUNT DISTINCT query cho pagination, trả `{ items, totalCount }`
- [X] T012 [P] [US1] Tạo `RecommendationsController` tại `apps/backend/src/recommendations/recommendations.controller.ts` — `GET /api/recommendations` (public), nhận và validate `GetRecommendationsDto`, gọi service, tính `totalPages/hasNextPage/hasPreviousPage`, trả response theo contract `api.md`
- [X] T013 [P] [US1] Tạo `RecommendationsModule` tại `apps/backend/src/recommendations/recommendations.module.ts` — import `TypeOrmModule.forFeature` nếu cần, export `RecommendationsService`
- [X] T014 [US1] Đăng ký `RecommendationsModule` vào `apps/backend/src/app.module.ts`

### Frontend — API Layer

- [X] T015 [P] [US1] Tạo `apps/frontend/src/lib/api/tags.ts` — function `fetchTags(): Promise<TagsGroupedResponse>` gọi `GET /api/tags`, type `TagGroup`, `TagItem`, `TagsGroupedResponse`
- [X] T016 [P] [US1] Tạo `apps/frontend/src/lib/api/recommendations.ts` — function `fetchRecommendations(tagIds: number[], page: number): Promise<RecommendationsResponse>` gọi `GET /api/recommendations?tags=...&page=...`, types `RecommendationItem`, `Pagination`, `RecommendationsResponse`

### Frontend — Components

- [X] T017 [P] [US1] Tạo `TagSelector` component tại `apps/frontend/src/components/recommendation/TagSelector.tsx` — nhận `groups: TagGroup[]`, `selectedIds: number[]`, `onChange: (ids: number[]) => void`; render checkbox groups gom nhóm theo `groupType` (Loại món ăn / Khẩu vị / Dị ứng thực phẩm); hard limit 5 (disable các checkbox chưa chọn khi đã đủ 5); hiển thị counter "Đã chọn X/5 nhãn"
- [X] T018 [P] [US1] Tạo `RecommendationCard` component tại `apps/frontend/src/components/recommendation/RecommendationCard.tsx` — nhận `item: RecommendationItem`; hiển thị tên món, tên gian hàng, giá (format VND), `matchCount`; toàn bộ card là link navigate đến `/stores/:storeId` (FR-007)
- [X] T019 [P] [US1] Tạo `RecommendationList` component tại `apps/frontend/src/components/recommendation/RecommendationList.tsx` — nhận `items: RecommendationItem[]`, `pagination: Pagination`, `onPageChange: (page: number) => void`; render danh sách `RecommendationCard`, sắp xếp đã được backend xử lý (match_count DESC); hiển thị `EmptyState` khi `items` rỗng; tích hợp `Pagination` component ở cuối danh sách
- [X] T020 [P] [US1] Tạo `EmptyState` component tại `apps/frontend/src/components/recommendation/EmptyState.tsx` — hiển thị thông báo "Không tìm thấy gợi ý phù hợp" kèm đề xuất "Thử lại với tiêu chí khác" (FR-006)
- [X] T021 [P] [US1] Tạo `Pagination` component tại `apps/frontend/src/components/recommendation/Pagination.tsx` — nhận `pagination: Pagination`, `onPageChange: (page: number) => void`; nút "Xem thêm" / điều hướng trang; ẩn khi `totalPages <= 1` (FR-011, 20 items/page)

### Frontend — Page

- [X] T022 [US1] Tạo recommendation page tại `apps/frontend/src/app/recommendations/page.tsx` — Server Component fetch tags (`fetchTags()`), render `TagSelector` + `RecommendationList`; khi Customer xác nhận tags được chọn, gọi `fetchRecommendations(selectedIds, page)`; tích hợp đầy đủ `TagSelector`, `RecommendationList`, `EmptyState`, `Pagination`; URL state: sync `tags` và `page` vào query string để shareable URL

---

## Phase Admin — Tag Management

> Admin quản lý vòng đời PreferenceTag. Không phải user story của Customer.

### Backend — Admin Tags Module

- [X] T023 [P] Tạo `CreateTagDto` tại `apps/backend/src/admin/tags/dto/create-tag.dto.ts` — `nameVi: string` (required, maxLength 100), `nameEn: string` (required, maxLength 100), `groupType: TagGroupType` (required, IsIn `['dish_type','flavor','allergen']`)
- [X] T024 [P] Tạo `UpdateTagDto` tại `apps/backend/src/admin/tags/dto/update-tag.dto.ts` — cùng fields với `CreateTagDto`, tất cả required (không hỗ trợ partial update ở MVP)
- [X] T025 [P] Tạo `AdminTagsService` tại `apps/backend/src/admin/tags/admin-tags.service.ts` — methods: `findAll()` (flat list kèm `usageCount` bằng LEFT JOIN `menu_item_tags`, sort `group_type → id ASC`), `create(dto)`, `update(id, dto)` (throw 404 nếu không tìm thấy), `remove(id)` (kiểm tra `usage_count` trước, throw 409 `TAG_IN_USE` kèm `count` nếu > 0, xóa nếu = 0)
- [X] T026 [P] Tạo `AdminTagsController` tại `apps/backend/src/admin/tags/admin-tags.controller.ts` — `GET /api/admin/tags`, `POST /api/admin/tags`, `PUT /api/admin/tags/:id`, `DELETE /api/admin/tags/:id`; tất cả bảo vệ bằng `AdminJwtGuard`; DELETE trả `204 No Content` khi thành công, `409 Conflict` kèm `{ code, message, count }` khi tag đang dùng
- [X] T027 Tạo `AdminTagsModule` tại `apps/backend/src/admin/tags/admin-tags.module.ts` và đăng ký vào `apps/backend/src/admin/admin.module.ts`

### Frontend — Admin Tag Management Page

- [X] T028 [P] Tạo Admin tags page tại `apps/frontend/src/app/admin/tags/page.tsx` — bảng danh sách tags (cột: ID, Tên VI, Tên EN, Nhóm, Đang dùng bởi); nút "Thêm nhãn mới"; nút Sửa / Xóa trên từng row; hiển thị `usageCount` để Admin biết tag đang được dùng bởi bao nhiêu món
- [X] T029 [P] Tạo form dialog tạo/sửa tag tại `apps/frontend/src/app/admin/tags/TagFormDialog.tsx` — fields `nameVi`, `nameEn`, `groupType` (select dropdown); validation phía client; submit gọi `POST /api/admin/tags` hoặc `PUT /api/admin/tags/:id`
- [X] T030 [P] Xử lý xóa tag trong Admin page `apps/frontend/src/app/admin/tags/page.tsx` — khi DELETE trả 409 `TAG_IN_USE`, hiển thị thông báo "Nhãn này đang được dùng bởi X món ăn. Hãy gỡ nhãn khỏi tất cả món ăn trước khi xóa." (FR-010)

### Frontend — Store Owner Menu Tagging

- [X] T031 Extend form tạo/sửa món ăn tại `apps/frontend/src/app/store-owner/menu/MenuItemForm.tsx` (hoặc component tương đương từ spec 002) — thêm tag picker cho phép Store Owner chọn `PreferenceTag` để gắn vào món ăn; fetch tags từ `GET /api/tags`; submit cập nhật `tags` vào payload của `PUT /api/store-owner/menu-items/:id`
- [X] T032 Extend backend Store Owner menu item endpoint tại `apps/backend/src/store-owner/menu-items/` — cho phép `PUT /api/store-owner/menu-items/:id` nhận và lưu `tagIds: number[]`; dùng `MenuItem.tags` ManyToMany relation để sync `menu_item_tags`

---

## Phase N — Polish

> Cải thiện UX và edge cases sau khi core functionality hoạt động.

- [X] T033 [P] Thêm debounce (300ms) cho tag selection trong `apps/frontend/src/components/recommendation/TagSelector.tsx` — tránh gọi API recommendation ngay khi Customer vừa check/uncheck một tag; auto-trigger sau khi dừng chọn
- [X] T034 [P] Mobile-friendly tag chips layout cho `apps/frontend/src/components/recommendation/TagSelector.tsx` — responsive grid/flex wrap cho checkbox groups; dạng chip button thay checkbox thuần trên mobile
- [X] T035 [P] Kiểm tra DISTINCT trong recommendation query tại `apps/backend/src/recommendations/recommendations.service.ts` — đảm bảo `GROUP BY mi.id` trong raw SQL loại trùng lặp (FR-008, SC-002); thêm integration test kiểm tra món khớp nhiều tags chỉ xuất hiện 1 lần trong kết quả
- [X] T036 [P] Empty state cho trang recommendations khi chưa chọn tag nào tại `apps/frontend/src/app/recommendations/page.tsx` — hiển thị hướng dẫn "Chọn các nhãn sở thích để nhận gợi ý món ăn phù hợp" thay vì gọi API khi `selectedIds` rỗng
- [X] T037 [P] Loading state trong `apps/frontend/src/components/recommendation/RecommendationList.tsx` — skeleton cards khi đang fetch; tránh layout shift

---

## Dependency Graph

```
T001 → T002 → T003, T004
T003, T004 → T005
T003 → T006, T007, T008 → T009
T003, T004 → T010, T011, T012, T013 → T014
T015, T016 → T017, T018, T019, T020, T021 → T022
T023, T024 → T025 → T026 → T027
T027 → T028, T029, T030
T009, T014 → T031, T032
T022 → T033, T034, T035, T036, T037
```

---

## Task Count Summary

| Phase | Tasks | Notes |
| ----- | ----- | ----- |
| Phase 2 — Foundation | T001–T005 | Sequential (migration order matters) |
| Phase 3 — US1 Backend Tags | T006–T009 | T006–T008 parallelizable |
| Phase 3 — US1 Backend Recommendations | T010–T014 | T010–T013 parallelizable |
| Phase 3 — US1 Frontend API Layer | T015–T016 | Parallelizable |
| Phase 3 — US1 Frontend Components | T017–T021 | Parallelizable |
| Phase 3 — US1 Frontend Page | T022 | Depends on T017–T021 |
| Phase Admin — Backend | T023–T027 | T023–T026 parallelizable |
| Phase Admin — Frontend | T028–T030 | Parallelizable |
| Phase Admin — Store Owner | T031–T032 | Sequential |
| Phase N — Polish | T033–T037 | All parallelizable |
| **Total** | **37 tasks** | |

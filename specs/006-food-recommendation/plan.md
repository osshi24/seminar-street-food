# Implementation Plan: Gợi ý món ăn theo sở thích

**Branch**: `006-food-recommendation` | **Date**: 2026-04-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-food-recommendation/spec.md`

## Summary

Feature này xây dựng hệ thống gợi ý món ăn dựa trên nhãn sở thích (tag-based recommendation)
cho hệ thống Phố Ẩm Thực. Customer chọn tối đa 5 nhãn từ ba nhóm (loại món, khẩu vị, dị ứng)
— không cần đăng nhập — rồi nhận danh sách món ăn phù hợp kèm tên gian hàng và giá. Kết quả
được sắp xếp theo số nhãn khớp giảm dần (tag matching sort), không có trùng lặp, phân trang
20 kết quả/trang. Customer chọn kết quả → điều hướng đến trang chi tiết gian hàng. Admin quản
lý đầy đủ vòng đời của PreferenceTag (thêm/sửa/xóa) qua giao diện quản trị; xóa bị chặn nếu
còn món đang dùng nhãn đó.

Approach kỹ thuật: many-to-many join table `menu_item_tags` kết nối `menu_items` với
`preference_tags`; recommendation query dùng SQL `COUNT(matching_tags) GROUP BY menu_item ORDER
BY match_count DESC`; phân trang offset-based (đơn giản, đủ cho quy mô MVP); validation tối đa
5 nhãn thực hiện ở cả frontend và backend (backend trả 400 nếu vi phạm).

## Technical Context

**Language/Version**: TypeScript 5.x (backend NestJS 10+, frontend Next.js 14 App Router)
**Primary Dependencies**: NestJS, TypeORM, class-validator, class-transformer, Passport JWT (cho Admin endpoints)
**Storage**: PostgreSQL 15 (primary) — join table `menu_item_tags`, bảng `preference_tags`
**Testing**: Jest + Supertest (backend unit/integration), Playwright (E2E frontend)
**Target Platform**: Linux server (Docker Compose), web browser (Chrome/Firefox/Safari/Edge)
**Project Type**: Monorepo web application — REST API backend (NestJS) + React frontend (Next.js)
**Performance Goals**: API gợi ý p95 ≤ 300ms; danh sách tags p95 ≤ 100ms (có thể cache)
**Constraints**: Tối đa 5 nhãn/lần gợi ý (hard limit); chỉ món của gian hàng `active`; phân trang 20/trang; xóa tag bị chặn nếu còn món đang dùng
**Scale/Scope**: ~100 gian hàng, vài nghìn menu items, vài chục tags; không yêu cầu horizontal scaling ở MVP

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Nguyên tắc | Trạng thái | Ghi chú |
| ---------- | ---------- | ------- |
| **Principle I — Approval-First** (nội dung phải được duyệt trước khi công khai) | PASS | Recommendation query có điều kiện `s.status = 'active'` — chỉ món của gian hàng active mới xuất hiện trong kết quả. Gian hàng chưa được Admin duyệt (status `inactive`) hoàn toàn bị loại khỏi gợi ý. FR-004 đảm bảo tuân thủ. |
| **Principle II — RBAC** (phân quyền rõ ràng theo vai trò) | PASS — CẦN THỰC HIỆN | Ba nhóm endpoint: (1) Public endpoints (`GET /api/tags`, `GET /api/recommendations`) — không yêu cầu auth, Customer dùng tự do. (2) Admin endpoints (`/api/admin/tags/*`) — bảo vệ bằng `AdminJwtGuard`, chỉ Admin có token hợp lệ mới truy cập. Không có endpoint nào cho phép Customer gọi Admin operations. |
| **Principle III — AI Multilingual** | N/A | Spec này không sử dụng AI. |
| **Principle IV — GPS** | N/A | Spec này không sử dụng GPS/location. |
| **Principle V — Data Integrity** | PASS — CẦN THỰC HIỆN | Xóa PreferenceTag bị chặn ở service layer nếu còn bản ghi trong `menu_item_tags`; trả về 409 Conflict kèm số món đang dùng. Validation ≤5 tags thực hiện ở cả frontend (UX) và backend (API guard). |

## Project Structure

### Documentation (this feature)

```text
specs/006-food-recommendation/
├── plan.md              # File này — implementation plan
├── spec.md              # Feature specification (source of truth)
├── research.md          # Quyết định design và lý do chọn
├── data-model.md        # PostgreSQL schema, entity definitions, query logic
├── contracts/
│   └── api.md           # REST API contracts đầy đủ (tất cả endpoints)
└── checklists/
    └── requirements.md  # Checklist kiểm tra requirements
```

### Source Code (repository root)

Monorepo theo cấu trúc đã thiết lập ở spec 002:

```text
apps/
├── backend/                              # NestJS API
│   └── src/
│       ├── tags/                         # Module: PreferenceTag (public + admin)
│       │   ├── tags.module.ts
│       │   ├── tags.controller.ts        # GET /api/tags (public)
│       │   ├── tags.service.ts           # findAll, findGrouped
│       │   └── entities/
│       │       └── preference-tag.entity.ts
│       ├── recommendations/              # Module: gợi ý món ăn (public)
│       │   ├── recommendations.module.ts
│       │   ├── recommendations.controller.ts  # GET /api/recommendations
│       │   ├── recommendations.service.ts     # tag matching query, pagination
│       │   └── dto/
│       │       └── get-recommendations.dto.ts # validate tagIds ≤5, page ≥1
│       ├── admin/
│       │   └── tags/                     # Module: Admin quản lý PreferenceTag
│       │       ├── admin-tags.controller.ts   # GET/POST/PUT/DELETE /api/admin/tags
│       │       ├── admin-tags.service.ts      # create, update, delete (với guard xóa)
│       │       └── dto/
│       │           ├── create-tag.dto.ts      # { name_vi, name_en, group_type }
│       │           └── update-tag.dto.ts
│       └── entities/
│           ├── preference-tag.entity.ts       # PreferenceTag entity
│           └── menu-item-tag.entity.ts        # Join table entity (menu_item_tags)
│
└── frontend/                             # Next.js 14 App Router
    └── src/
        ├── app/
        │   ├── (public)/
        │   │   └── recommendations/
        │   │       └── page.tsx          # Trang gợi ý: chọn tags + kết quả
        │   └── (admin)/
        │       └── admin/
        │           └── tags/
        │               └── page.tsx      # Admin quản lý PreferenceTag
        ├── components/
        │   └── recommendations/
        │       ├── TagSelector.tsx       # Chọn tags (≤5, grouped by type)
        │       ├── RecommendationList.tsx # Danh sách kết quả + phân trang
        │       ├── RecommendationCard.tsx # Card: tên món, tên gian hàng, giá
        │       └── EmptyState.tsx        # Thông báo không tìm thấy (FR-006)
        └── lib/
            └── api/
                ├── tags.ts               # API calls: fetchTags()
                └── recommendations.ts    # API calls: fetchRecommendations(tagIds, page)
```

**Structure Decision**: Monorepo `apps/backend` + `apps/frontend` theo cấu trúc đã thiết lập ở
spec 002. Feature 006 thêm hai module mới vào backend (`tags/` và `recommendations/`) và một
admin sub-module (`admin/tags/`). Frontend thêm route `(public)/recommendations/` và
`(admin)/admin/tags/`. Không cần package mới hay service độc lập.

## Complexity Tracking

> Không có violation nào cần justification. Tất cả Constitution Check đều PASS.

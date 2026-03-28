# Implementation Plan: Quản lý gian hàng & Thuyết minh AI

**Branch**: `002-store-management-ai-commentary` | **Date**: 2026-04-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-store-management-ai-commentary/spec.md`

## Summary

Feature này xây dựng hai luồng chính liên kết chặt chẽ với nhau:

1. **Content management flow** (Approval-First): Store Owner chỉnh sửa thông tin gian hàng
   (tên, mô tả ≤1000 ký tự, món ăn kèm giá, ảnh ≤10 ảnh/10MB) → thay đổi lưu ở trạng
   thái `pending` trong bảng `store_content_drafts`; thông tin cũ vẫn công khai. Admin xem
   so sánh cũ/mới, phê duyệt hoặc từ chối kèm lý do bắt buộc. Khi có bản `pending` đang
   xử lý, hệ thống chặn chỉnh sửa mới; Store Owner phải thu hồi trước.

2. **AI pipeline approach** (Asynchronous, Cache-First): Sau khi Admin phê duyệt, trường mô
   tả trở thành nội dung thuyết minh chính thức (`Commentary`). Hệ thống đẩy job vào BullMQ
   queue — job này gọi Google Cloud Translation API để dịch sang toàn bộ ngôn ngữ hỗ trợ,
   sau đó Google Cloud Text-to-Speech tổng hợp audio cho mỗi bản dịch, kết quả lưu vào
   S3-compatible storage. Customer luôn đọc từ cache; AI không được gọi lại mỗi request.
   Khi pipeline đang chạy, Customer thấy text tiếng Việt + banner "Audio đang được tổng
   hợp..."; audio xuất hiện tự động (WebSocket/polling) khi pipeline hoàn thành. Pipeline
   thất bại một phần (dịch OK, TTS lỗi) → phục vụ text, không có audio; fallback hoàn toàn
   về tiếng Việt khi cả dịch lẫn TTS đều lỗi.

## Technical Context

**Language/Version**: TypeScript 5.x (backend NestJS 10+, frontend Next.js 14+), Node.js 20 LTS
**Primary Dependencies**:

- Backend: NestJS, TypeORM, BullMQ, `@google-cloud/translate`, `@google-cloud/text-to-speech`, AWS SDK v3 (S3 client), Passport JWT, Nodemailer
- Frontend: Next.js 14 App Router, TanStack Query, Zustand, i18next/react-i18next, Tailwind CSS

**Storage**:

- PostgreSQL 15 — dữ liệu chính (stores, drafts, menu items, commentaries, translations)
- Redis 7 — BullMQ job queue + Bull Board dashboard
- MinIO (self-hosted S3-compatible) — lưu ảnh gian hàng và file audio TTS

**Testing**: Jest + Supertest (backend unit/integration), Playwright (E2E frontend)
**Target Platform**: Linux server (Docker Compose / Kubernetes)
**Project Type**: Monorepo web application (NestJS API + Next.js frontend)
**Performance Goals**: API p95 ≤200ms cho public endpoints; AI pipeline hoàn thành ≥1 ngôn ngữ trong 60 giây sau phê duyệt
**Constraints**: Mô tả ≤1000 ký tự; ảnh ≤10 ảnh/gian hàng, mỗi ảnh ≤10MB; không gọi AI trực tiếp từ request Customer
**Scale/Scope**: ~100 gian hàng, ~500 Customer concurrent, 5–10 ngôn ngữ hỗ trợ

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Áp dụng | Trạng thái |
| --------- | ------- | ---------- |
| **Principle I — Approval-First** | Mọi thay đổi nội dung gian hàng PHẢI đi qua `pending` → Admin duyệt. Thông tin cũ vẫn public trong thời gian chờ. Store Owner bị chặn chỉnh sửa khi đang `pending`. | PASS — FR-002, FR-003, FR-007 đảm bảo đúng flow. |
| **Principle III — AI Multilingual** | AI pipeline chạy bất đồng bộ sau phê duyệt; kết quả cache trong storage; Customer đọc từ cache. Fallback về tiếng Việt khi AI thất bại, kèm thông báo rõ ràng. | PASS — FR-010, FR-013 đảm bảo cache-first và fallback. |
| **Principle V — Single-Active-State** | Mỗi gian hàng chỉ có đúng một `Commentary` hoạt động tại một thời điểm. Khi Admin phê duyệt bản mới, bản cũ bị thay thế (field `active_commentary_id` trên bảng `stores`). | PASS — FR-016; constraint enforced bằng FK duy nhất. |

Không có vi phạm constitution. Complexity Tracking không cần điền.

## Project Structure

### Documentation (this feature)

```text
specs/002-store-management-ai-commentary/
├── plan.md              # This file
├── spec.md              # Feature specification (source of truth)
├── research.md          # Design decisions: storage, AI vendor, queue strategy
├── data-model.md        # PostgreSQL schema, state machines, indexes
├── contracts/
│   └── api.md           # REST API contract (all endpoints)
└── tasks.md             # Task breakdown (created by /speckit.tasks — NOT this command)
```

### Source Code (repository root)

Monorepo với hai ứng dụng chính, chia sẻ package types:

```text
apps/
├── backend/                          # NestJS API
│   └── src/
│       ├── stores/                   # Module: quản lý gian hàng (Store Owner)
│       │   ├── stores.module.ts
│       │   ├── stores.controller.ts
│       │   ├── stores.service.ts
│       │   ├── dto/
│       │   │   ├── update-store.dto.ts
│       │   │   └── submit-draft.dto.ts
│       │   └── entities/
│       │       ├── store.entity.ts
│       │       ├── store-content-draft.entity.ts
│       │       ├── menu-item.entity.ts
│       │       └── store-image.entity.ts
│       ├── admin/                    # Module: Admin duyệt nội dung
│       │   ├── admin-stores.controller.ts
│       │   └── admin-stores.service.ts
│       ├── commentary/               # Module: Commentary + AI pipeline
│       │   ├── commentary.module.ts
│       │   ├── commentary.service.ts
│       │   ├── commentary.processor.ts   # BullMQ job processor
│       │   ├── translation.service.ts    # Google Translate wrapper
│       │   ├── tts.service.ts            # Google TTS wrapper
│       │   └── entities/
│       │       ├── commentary.entity.ts
│       │       └── commentary-translation.entity.ts
│       ├── public/                   # Module: public endpoints (Customer)
│       │   ├── public-stores.controller.ts
│       │   └── public-stores.service.ts
│       ├── storage/                  # Module: S3/MinIO wrapper
│       │   ├── storage.module.ts
│       │   └── storage.service.ts
│       └── notifications/            # Module: email + in-app notification
│           ├── notifications.module.ts
│           └── notifications.service.ts
│
└── frontend/                         # Next.js 14 App Router
    └── src/
        ├── app/
        │   ├── (public)/
        │   │   ├── stores/
        │   │   │   ├── page.tsx              # Danh sách gian hàng + search
        │   │   │   └── [id]/
        │   │   │       └── page.tsx          # Trang chi tiết gian hàng
        │   ├── (store-owner)/
        │   │   └── dashboard/
        │   │       └── store/
        │   │           ├── page.tsx          # Quản lý thông tin gian hàng
        │   │           ├── menu/page.tsx     # Quản lý món ăn
        │   │           └── images/page.tsx   # Quản lý ảnh
        │   └── (admin)/
        │       └── admin/
        │           └── store-drafts/
        │               ├── page.tsx          # Danh sách chờ duyệt
        │               └── [id]/page.tsx     # So sánh + phê duyệt/từ chối
        ├── components/
        │   ├── stores/
        │   │   ├── StoreCard.tsx
        │   │   ├── StoreSearchBar.tsx
        │   │   ├── StoreDetailView.tsx
        │   │   ├── CommentaryPlayer.tsx      # Text + audio player
        │   │   └── PipelineBanner.tsx        # "Audio đang được tổng hợp..."
        │   └── admin/
        │       └── DraftCompareView.tsx      # So sánh cũ/mới
        └── lib/
            ├── api/
            │   ├── stores.ts
            │   └── commentary.ts
            └── i18n/
                └── config.ts                 # i18next setup

packages/
└── types/                                    # Shared TypeScript types
    └── src/
        ├── store.types.ts
        └── commentary.types.ts
```

**Structure Decision**: Monorepo `apps/backend` + `apps/frontend` + `packages/types`. Backend
tổ chức theo feature module (NestJS convention). Frontend theo Next.js 14 App Router với route
groups phân tách public / store-owner / admin. AI pipeline tách thành module `commentary/`
độc lập để dễ test và scale.

## Complexity Tracking

> Không có vi phạm constitution — bảng này để trống theo convention.

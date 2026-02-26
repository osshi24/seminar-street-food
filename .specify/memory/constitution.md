<!-- Sync Impact Report
Version change: 1.0.0 → 1.1.0
Added sections:
  - Principle VI: Mandatory API Testing
Changes:
  - Added Core Principle VI requiring automated tests for all backend API endpoints
  - Updated tasks-template.md: Tests are now REQUIRED (not optional) for API tasks
  - Rule applies to all specs from 2026-04-08 onward
Templates reviewed:
  ✅ .specify/templates/plan-template.md — Constitution Check gate aligns with these principles
  ✅ .specify/templates/spec-template.md — FR/SC sections aligned; BR-verify.md referenced
  ✅ .specify/templates/tasks-template.md — Updated to reflect mandatory test requirement
Deferred TODOs: None
-->

# Hệ thống Web Phố Ẩm Thực Constitution

## Core Principles

### I. Approval-First Content

All content submitted by Store Owners — store information (name, description, menu, images),
location pins, and commentary — MUST go through Admin approval before becoming publicly visible.

- Content in **pending** (chờ duyệt) status MUST NOT be editable by Store Owner; Store Owner
  MUST revoke the submission before making any changes.
- When Admin rejects content, the rejection notification MUST include a written reason.
- Each store MUST have at most one active approved commentary at any given time.
- The store description field, once approved, simultaneously becomes the active commentary
  content for that store.

**Rationale**: Ensures content quality and prevents misinformation on the public-facing food
street platform.

### II. Role-Based Access Control (RBAC)

The system defines three distinct roles with non-overlapping privileges:

- **Customer**: May browse all public content without authentication. MUST authenticate via
  Google OAuth 2.0 to submit reviews. MUST NOT be able to modify or delete reviews after
  submission. One review per store per Google account is the hard limit.
- **Store Owner**: MUST self-register and await Admin approval before accessing the management
  dashboard. MUST manage only their own store(s). MUST NOT delete or edit Customer reviews.
  Account is blocked from login while in pending or inactive state.
- **Admin**: Internal account only; MUST NOT be creatable via the public registration flow.
  Has full authority over all content, accounts, store states, and location pins.

**Rationale**: Prevents unauthorized access and clearly delineates responsibility between actors.

### III. AI-Powered Multilingual Commentary

- Store Owner MUST input commentary content in Vietnamese (source language only).
- The system MUST process commentary through a two-step AI pipeline:
  1. **Translation**: AI translates the Vietnamese source text into the Customer's active language.
  2. **TTS Synthesis**: The translated text is passed to a Text-to-Speech engine to generate
     the audio output in that language.
- Audio MUST always be synthesized from the already-translated text — never from the original
  Vietnamese source directly (except when the Customer's active language is Vietnamese).
- The Customer interface MUST auto-detect the preferred language from browser settings on first
  visit; Customers MAY manually override the language at any time.
- If AI translation or TTS synthesis fails for a requested language, the system MUST fall back
  to Vietnamese text and Vietnamese audio, and MUST display a notification indicating the
  language is temporarily unavailable.

**Rationale**: Supports international visitors without requiring Store Owners to manage multiple
language versions manually. The translation-first pipeline ensures audio content is linguistically
correct in the target language rather than being a transliteration of Vietnamese phonetics.

### IV. GPS/Location-Based Features

- Location-based features (auto-play commentary, navigation directions, location sharing) MUST
  request browser Geolocation API permission before activation.
- The auto-play commentary feature MUST trigger automatically when a Customer enters within a
  **4-meter radius** of a store, provided GPS permission has been granted and the store has an
  approved location pin and approved commentary.
- If multiple stores fall within range simultaneously, the system MUST play the commentary for
  the nearest store only.
- When GPS permission is denied or unavailable, all GPS-dependent features MUST gracefully
  degrade: features are disabled and the system MUST display a prompt asking the user to
  enable GPS.

**Rationale**: Enables a seamless, physically-immersive experience for visitors at the food
street without disruptive failures.

### V. Data Integrity & Single-Active-State

- Each Customer Google account MUST submit at most **one review per store**; reviews MUST NOT
  be editable or re-submittable after submission.
- Each store MUST have at most one active approved location pin at a time.
- Each store MUST have at most one active approved commentary at a time.
- When a store is inactive (status = inactive), its QR code MUST return an error/notice page
  and MUST NOT redirect to store content.
- Store Owner accounts in pending or inactive status MUST NOT be granted login access.

**Rationale**: Prevents duplicate data, gaming of review systems, and ambiguous states for
end users.

## System Flows

Các luồng dưới đây mô tả toàn bộ hành trình chính của hệ thống. Mọi `spec.md` phải xác định
luồng liên quan và không được mâu thuẫn với các bước đã định nghĩa ở đây.

---

### FLOW-01: Store Owner Onboarding

```text
Store Owner tự đăng ký (email + password + thông tin gian hàng)
    → Tài khoản tạo ra ở trạng thái [PENDING]
    → Admin nhận thông báo (email + in-app)
    → Admin xem xét và phê duyệt HOẶC từ chối (kèm lý do)
        [APPROVED] → Tài khoản chuyển sang [ACTIVE]
                   → Store Owner nhận thông báo → có thể đăng nhập
        [REJECTED] → Tài khoản ở trạng thái [REJECTED]
                   → Store Owner nhận thông báo kèm lý do
```

---

### FLOW-02: Store Content Management & Approval

```text
Store Owner đăng nhập → chỉnh sửa thông tin gian hàng
    (tên, mô tả, danh sách món ăn, hình ảnh)
    → Lưu → Thay đổi ở trạng thái [PENDING]
    → Thông tin cũ vẫn hiển thị công khai
    → Admin nhận thông báo (email + in-app)
    → Admin xem xét (so sánh cũ vs mới) và phê duyệt HOẶC từ chối
        [APPROVED] → Thông tin mới lên live (công khai)
                   → Trường mô tả trở thành nội dung thuyết minh
                   → Kích hoạt FLOW-04 (AI Pipeline) tự động
                   → Store Owner nhận thông báo
        [REJECTED] → Thông tin cũ tiếp tục hiển thị
                   → Store Owner nhận thông báo kèm lý do
                   → Store Owner có thể chỉnh sửa và gửi lại

Ghi chú: Store Owner KHÔNG thể chỉnh sửa khi đang ở [PENDING];
         phải thu hồi (revoke) trước, thông tin quay về bản hiện hành.
```

---

### FLOW-03: Location Pin Management & Approval

```text
Store Owner thiết lập vị trí gian hàng
    (kéo thả trên bản đồ HOẶC nhập tọa độ thủ công)
    → Vị trí ở trạng thái [PENDING]
    → Admin nhận thông báo
    → Admin xem xét, có thể điều chỉnh tọa độ, rồi phê duyệt HOẶC từ chối
        [APPROVED] → Ghim hiển thị công khai trên bản đồ cho Customer
                   → Store Owner nhận thông báo
        [REJECTED] → Ghim không hiển thị
                   → Store Owner nhận thông báo kèm lý do
```

---

### FLOW-04: AI Commentary Pipeline (kích hoạt sau FLOW-02 approved)

```text
[Mô tả tiếng Việt đã được duyệt]
    → AI Translation
    → [Bản dịch sang ngôn ngữ X]
    → TTS Synthesis
    → [Audio ngôn ngữ X]
    → Lưu trữ & phục vụ cho Customer theo ngôn ngữ đang dùng

Ngôn ngữ X = ngôn ngữ hiện tại của Customer (auto-detect từ browser HOẶC do Customer chọn)
Fallback: nếu AI Translation hoặc TTS thất bại → hiển thị text tiếng Việt + audio tiếng Việt
          + thông báo "Ngôn ngữ này tạm thời không khả dụng"
```

---

### FLOW-05: GPS Auto-Play Commentary

```text
Customer truy cập web → hệ thống yêu cầu quyền GPS
    [GPS DENIED]  → Tính năng auto-play bị vô hiệu hóa
                  → Hiển thị thông báo yêu cầu bật GPS
    [GPS GRANTED] → Hệ thống liên tục theo dõi vị trí Customer
                  → Phát hiện Customer vào trong vùng 4m quanh gian hàng
                  → Điều kiện: gian hàng có ghim đã duyệt + thuyết minh đã duyệt
                  → Tự động phát audio thuyết minh (theo FLOW-04)
                  → Nếu nhiều gian hàng trong vùng → phát gian hàng gần nhất
                  → Customer có thể dừng / bỏ qua bất kỳ lúc nào
```

---

### FLOW-06: Customer Review & Comment Report

```text
Customer (chưa đăng nhập) xem gian hàng
    → Chọn "Viết đánh giá" → redirect sang Google OAuth login
Customer (đã đăng nhập Google OAuth) viết đánh giá
    → Chọn số sao + nhập bình luận → Gửi
    → Đánh giá lưu và hiển thị ngay (không cần duyệt)
    → Mỗi tài khoản Google chỉ đánh giá 1 lần / gian hàng (không thể sửa hoặc gửi lại)

Store Owner phát hiện bình luận vi phạm
    → Chọn "Báo cáo" + chọn lý do → Gửi báo cáo
    → Bình luận vẫn hiển thị bình thường
    → Admin nhận thông báo
    → Admin xem xét:
        [VI PHẠM]   → Ẩn hoặc xóa bình luận
        [KHÔNG VI PHẠM] → Bác bỏ báo cáo; bình luận tiếp tục hiển thị
```

---

### FLOW-07: QR Code

```text
Store Owner (gian hàng đang ACTIVE) tạo QR code
    → Hệ thống sinh QR code liên kết đến trang chi tiết gian hàng
    → Store Owner tải xuống (PNG / PDF)

Customer quét QR code:
    [Gian hàng ACTIVE]   → Điều hướng đến trang chi tiết gian hàng
    [Gian hàng INACTIVE] → Trả về trang thông báo lỗi (không điều hướng nội dung)
```

---

### FLOW-08: Notification Event Map

| Sự kiện | Người nhận | Kênh |
| --- | --- | --- |
| Store Owner đăng ký mới | Admin | email + in-app |
| Admin phê duyệt / từ chối tài khoản | Store Owner | email + in-app |
| Store Owner gửi thông tin gian hàng chờ duyệt | Admin | email + in-app |
| Admin phê duyệt / từ chối thông tin gian hàng | Store Owner | email + in-app |
| Store Owner gửi ghim vị trí chờ duyệt | Admin | email + in-app |
| Admin phê duyệt / từ chối ghim vị trí | Store Owner | email + in-app |
| Store Owner báo cáo bình luận | Admin | email + in-app |
| Admin gửi thông báo thủ công | Store Owner(s) được chọn | email + in-app |

---

## Technology Stack Constraints

- **Backend**: NestJS (Node.js / TypeScript)
- **Frontend**: Next.js (React / TypeScript)
- **Database**: PostgreSQL
- **Authentication**:
  - Customer: Google OAuth 2.0 (read-only browsing requires no auth)
  - Store Owner: Email + Password (account created via self-registration, approved by Admin)
  - Admin: Internal system credentials (no public registration path)
- **AI Services**: Text translation (multilingual) + Text-to-Speech audio synthesis
- **Location**: Browser Geolocation API + Map provider integration (display and routing)
- **Notifications**: Two channels — **email** and **in-app** (internal notification system)

All architectural decisions MUST be compatible with this stack. Deviations require explicit
justification documented in the relevant `plan.md` Complexity Tracking section and a
constitution amendment if the stack itself changes.

### VI. Mandatory API Testing

Every backend API endpoint implemented as part of any feature MUST have corresponding
automated tests written alongside the implementation. This rule applies to all specs.

**Requirements**:

- Each task that implements a backend API endpoint MUST include a test task immediately
  before or alongside it in `tasks.md`.
- A task implementing an API endpoint CANNOT be marked `[X]` (complete) until its
  corresponding test file exists and passes.
- Tests MUST use **Jest + Supertest** (NestJS stack) and cover at minimum:
  1. **Happy path**: valid request → expected response shape and status code.
  2. **Error cases**: invalid input → correct 4xx error code and `code` field.
  3. **Auth guard**: unauthenticated request to protected endpoint → 401.
- Test files MUST be placed at `apps/backend/src/<module>/<controller>.spec.ts` or
  `apps/backend/test/<feature>.e2e-spec.ts`.
- `/speckit-implement` MUST generate test tasks for every API endpoint task and MUST NOT
  mark an API task as `[X]` without verifying the test file exists.

**Scope**: All backend API endpoints across all specs. Frontend API calls and non-HTTP
backend services (workers, queues) are encouraged but not required.

**Rationale**: Prevents regressions when specs build on each other. Catches contract
mismatches between frontend and backend before manual testing is needed.

---

## Development & Content Workflow

- **Approval gate is blocking**: no Store Owner content goes public without explicit Admin
  approval. Features MUST enforce this gate at the API level, not only at the UI level.
- **Notification events** MUST be delivered via both channels (email + in-app):
  - Store Owner is notified when: store info/commentary is approved or rejected (with reason),
    location pin is approved or rejected, account registration is approved or rejected.
  - Admin is notified when: new Store Owner registration is pending, store info or commentary
    is submitted for review, a Customer comment is reported by a Store Owner.
- Each `spec.md` MUST reference the relevant Business Rule IDs (e.g., BR-02.3, BR-06.2) from
  `requirement/BR-verify.md` in its Functional Requirements section.
- All features involving user-facing content MUST include edge cases for the "no content yet"
  state and the "inactive store" state.
- The authoritative source for all business rules is `requirement/BR-verify.md`. Any conflict
  with other files in `requirement/` is resolved in favor of `BR-verify.md`.

## Governance

This constitution supersedes all other requirement documents in case of conflict.

Amendments require:

1. Explicit written justification tied to a business or technical need.
2. Version increment per semantic versioning:
   - **MAJOR**: Removal or fundamental redefinition of a principle.
   - **MINOR**: New principle or material expansion of guidance.
   - **PATCH**: Clarification, wording fix, non-semantic refinement.
3. Propagation review across all dependent templates and any existing `spec.md` / `plan.md`
   documents.

All spec, plan, and task documents MUST pass a Constitution Check gate before proceeding to
implementation phases.

**Version**: 1.1.0 | **Ratified**: 2026-03-28 | **Last Amended**: 2026-04-08

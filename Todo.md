# TODO - Rà soát Seminar.md vs Source Code

> File tạo tự động sau khi cross-reference Seminar.md với toàn bộ source.
> Mức độ: **HIGH** = thiếu hoàn toàn / sai lệch nghiêm trọng, **MEDIUM** = có nhưng chưa đủ, **LOW** = nên bổ sung.

---

## MỤC LỤC TODO

- [A. Lỗi cấu trúc & format báo cáo](#a-lỗi-cấu-trúc--format-báo-cáo)
- [B. Chương 1 - Giới thiệu](#b-chương-1---giới-thiệu)
- [C. Chương 2 - Cơ sở lý thuyết](#c-chương-2---cơ-sở-lý-thuyết)
- [D. Chương 3 - Phân tích và thiết kế](#d-chương-3---phân-tích-và-thiết-kế)
- [E. Chương 4 - Thiết kế hệ thống](#e-chương-4---thiết-kế-hệ-thống)
- [F. Chương 5 - Triển khai (thiếu hoàn toàn)](#f-chương-5---triển-khai-thiếu-hoàn-toàn)
- [G. Chương 6 - Kết luận (thiếu hoàn toàn)](#g-chương-6---kết-luận-thiếu-hoàn-toàn)
- [H. Chương 7 - Tổng kết (thiếu hoàn toàn)](#h-chương-7---tổng-kết-thiếu-hoàn-toàn)
- [I. Nội dung source có nhưng báo cáo chưa đề cập](#i-nội-dung-source-có-nhưng-báo-cáo-chưa-đề-cập)
- [J. Sai lệch giữa báo cáo và source](#j-sai-lệch-giữa-báo-cáo-và-source)

---

## A. Lỗi cấu trúc & format báo cáo

### A1. [HIGH] Mâu thuẫn số lượng chương trong MỤC LỤC vs Cấu trúc báo cáo (1.6)

**Vấn đề:** Mục 1.6 mô tả 5 chương (Ch1-Ch5), nhưng MỤC LỤC và nội dung thực tế có 7 chương (Ch1-Ch7). Tiêu đề chương cũng khác:
- 1.6 ghi "Chương 4: Xây dựng và triển khai" → thực tế Ch4 = "Thiết kế hệ thống", Ch5 = "Triển khai"
- 1.6 ghi "Chương 5: Kết luận" → thực tế Ch6 = "Kết luận", Ch7 = "Tổng kết"

**Cách sửa:** Cập nhật mục 1.6 khớp với cấu trúc thực tế (7 chương). Hoặc gộp Ch6 + Ch7 thành 1 chương nếu nội dung tương tự.

---

### A2. [MEDIUM] Heading level không nhất quán

**Vấn đề:** Chương 4 dùng `# 4.1` thay vì `## 4.1`, khiến 4.1 cùng cấp heading với chương. Các mục 4.3, 4.4 dùng bold text thay vì heading markdown.

**Cách sửa:**
- `# 4.1 Kiến trúc tổng thể` → `## 4.1 Kiến trúc tổng thể`
- `**4.3 Database**` → `## 4.3 Database`
- `**4.4 API**` → `## 4.4 API`

---

### A3. [MEDIUM] "Lời mở đầu" trống

**Vấn đề:** Dòng 177 có heading "Lời mở đầu" nhưng không có nội dung.

**Cách sửa:** Viết 1-2 đoạn giới thiệu tổng quan đề tài, bối cảnh, mục tiêu. Ví dụ:
- Đoạn 1: Bối cảnh chuyển đổi số trong ẩm thực/du lịch
- Đoạn 2: Tóm tắt hệ thống xây dựng và kết quả đạt được

---

### A4. [LOW] Lỗi chính tả "Custome" trong heading

**Vấn đề:** `3.2.2 Use Case Diagram – Custome` thiếu chữ "r".

**Cách sửa:** → `3.2.2 Use Case Diagram – Customer`

---

### A5. [LOW] Lỗi chính tả "Xem thôn tin"

**Vấn đề:** Dòng 752: `UC-C01: Xem thôn tin gian hàng` → thiếu chữ "g".

**Cách sửa:** → `UC-C01: Xem thông tin gian hàng`

---

### A6. [MEDIUM] Ghi chú thô chưa xóa

**Vấn đề:** 2 ghi chú placeholder vẫn còn trong báo cáo:
- Dòng 298: `PHÂN NÀY PHÂN TÍCH VỀ CẤU TRÚC THƯ MỤC`
- Dòng 816: `XEM LẠI CẤU TRÚC THƯ MỤC`

**Cách sửa:** Xóa/thay bằng nội dung hoàn chỉnh. Cấu trúc thư mục đã có ở dòng 327 và 818, nhưng format table bị lỗi — nên chuyển sang code block markdown:

```
seminar-street-food/
├── apps/
│   ├── backend/       # NestJS REST API
│   └── frontend/      # Next.js App Router
├── packages/
│   └── types/         # Shared TypeScript types
├── docs/
├── requirement/
├── specs/
├── docker-compose.yml
├── turbo.json
├── package.json
├── SETUP.md
└── run.md
```

---

### A7. [MEDIUM] Thiếu hình ảnh Sequence Diagram Admin

**Vấn đề:** Mục 3.4.1 liệt kê 3 Sequence Diagram cho Admin (UC-A01, UC-A03, UC-A06) nhưng **không có hình ảnh đính kèm** — chỉ có caption, không có `![][imageXX]`.

**Cách sửa:** Bổ sung 3 hình (Hình 3.25, 3.26, 3.27) tương ứng.

---

### A8. [MEDIUM] Thiếu hình Activity Diagram UC-C03

**Vấn đề:** Hình 3.20 (Activity Diagram gợi ý món ăn UC-C03) chỉ có caption, không có ảnh.

**Cách sửa:** Bổ sung hình cho UC-C03.

---

## B. Chương 1 - Giới thiệu

### B1. [LOW] Nên bổ sung công trình liên quan

**Vấn đề:** Chương 1 thiếu mục "Công trình nghiên cứu liên quan" hoặc "Tổng quan tình hình nghiên cứu" — đây là mục thường được yêu cầu trong đề cương seminar/đồ án.

**Cách sửa:** Thêm mục 1.7 hoặc chèn vào cuối 1.1, liệt kê 2-3 hệ thống tương tự (audio guide museum, food tour apps, QR-based tourism systems) và phân tích điểm khác biệt.

---

## C. Chương 2 - Cơ sở lý thuyết

### C1. [HIGH] Thiếu mục công nghệ sử dụng chi tiết

**Vấn đề:** Chương 2 nói chung về "hệ thống web" nhưng **không trình bày cụ thể** các framework/library thực tế:
- **NestJS** — framework backend chính, source sử dụng 17 module
- **Next.js 14 App Router** — framework frontend, source sử dụng SSR + CSR
- **TypeORM** — ORM cho database, source có 30+ migration files
- **TypeScript** — ngôn ngữ lập trình toàn dự án
- **Turborepo** — build system monorepo
- **Docker** — containerization hạ tầng dev
- **Socket.IO** — real-time WebSocket
- **BullMQ** — job queue bất đồng bộ
- **Leaflet / MapLibre GL** — thư viện bản đồ frontend
- **TanStack React Query** — state management cho API calls
- **Tailwind CSS** — framework CSS

**Cách sửa:** Thêm mục **2.9 Công nghệ phát triển** với bảng liệt kê:

| Công nghệ | Vai trò | Phiên bản |
|:-----------|:--------|:----------|
| NestJS | Backend framework (REST API) | 10.x |
| Next.js | Frontend framework (App Router, SSR) | 14.x |
| TypeScript | Ngôn ngữ lập trình chính | 5.x |
| TypeORM | ORM, database migrations | — |
| PostgreSQL + PostGIS | CSDL chính + dữ liệu không gian | 15 + 3.4 |
| Redis | Job queue (BullMQ) | 7 |
| MinIO | Lưu trữ file tĩnh (S3-compatible) | — |
| Docker | Container hạ tầng dev | — |
| Turborepo | Build orchestration monorepo | — |
| Socket.IO | WebSocket real-time | — |
| Leaflet / MapLibre GL | Bản đồ tương tác | — |
| Tailwind CSS | CSS framework | — |
| i18next | Đa ngôn ngữ frontend | — |

---

### C2. [MEDIUM] Thiếu mô tả Text-to-Speech (TTS)

**Vấn đề:** Mục 2.4 nói về "Tổng hợp giọng nói (Text-to-Speech)" nhưng không trình bày cơ chế TTS cụ thể. Source code cho thấy:
- Backend TTS service = **stub (no-op)** — `TtsService.synthesize()` return `null`
- Frontend dùng **Web Speech API** (browser-based) làm fallback
- `@google-cloud/text-to-speech` có trong dependencies nhưng **chưa được implement**

**Cách sửa:** Trình bày rõ cơ chế TTS hiện tại:
1. Web Speech API qua `SpeechSynthesisUtterance` — ưu/nhược điểm
2. Lý do chưa dùng Google Cloud TTS (chi phí, phức tạp triển khai)
3. Dual audio strategy: thử server audio trước → fallback browser TTS

---

### C3. [MEDIUM] Thiếu mô tả Google Gemini AI

**Vấn đề:** Mục 2.4 nói chung về "AI" nhưng không nêu cụ thể model nào. Source code sử dụng **Google Gemini AI** (`gemini-flash-latest`) cho dịch thuật, với **MyMemory API** làm fallback.

**Cách sửa:** Bổ sung:
- Mô tả Gemini AI: large language model, khả năng dịch đa ngôn ngữ
- Chiến lược dual provider: Gemini (primary) → MyMemory (fallback)
- Prompt engineering: `"Translate the following Vietnamese text to {langName}. Return ONLY the translated text..."`

---

### C4. [MEDIUM] Thiếu mô tả i18next / đa ngôn ngữ frontend

**Vấn đề:** Báo cáo nói "hỗ trợ đa ngôn ngữ" nhưng không trình bày cơ chế. Source sử dụng **i18next + react-i18next** với 7 ngôn ngữ (vi, en, fr, zh, ja, ko, th), lazy-load locale files, cookie `phat_lang` cho persistence.

**Cách sửa:** Mô tả kiến trúc i18n: provider pattern, language detection order (localStorage → browser → fallback vi), locale file structure.

---

## D. Chương 3 - Phân tích và thiết kế

### D1. [MEDIUM] Thiếu Use Case UC-C06 (Chuyển đổi ngôn ngữ)

**Vấn đề:** Mục 3.2.2 liệt kê "Chuyển đổi ngôn ngữ" là chức năng Customer, nhưng danh sách Activity Diagram (3.3.3) nhảy từ UC-C05 sang UC-C07, thiếu UC-C06.

**Cách sửa:** Bổ sung Activity Diagram + Sequence Diagram cho UC-C06 (Chuyển đổi ngôn ngữ). Source code tham khảo: `LanguageSwitcher.tsx`, `LanguageContext.tsx`.

---

### D2. [LOW] Thiếu Use Case cho Store Owner: Xem thông báo

**Vấn đề:** Mục 3.2.3 liệt kê "Xem thông báo" là chức năng Store Owner nhưng không có UC-SO07 tương ứng trong Activity/Sequence diagram.

**Cách sửa:** Bổ sung Activity Diagram cho UC-SO07 (Xem thông báo). Source code: `NotificationBell.tsx`, `NotificationList.tsx`, `notifications.module.ts`.

---

### D3. [LOW] Thiếu Use Case Specification (bảng chi tiết)

**Vấn đề:** Chương 3 có Use Case Diagram nhưng thiếu **Use Case Specification** (bảng mô tả chi tiết mỗi UC: Actor, Precondition, Main Flow, Alternative Flow, Postcondition, Business Rules).

**Cách sửa:** Thêm mục 3.2.5 với bảng UC Specification cho ít nhất các UC quan trọng:
- UC-C07: Xem thuyết minh
- UC-C08: Tự động phát thuyết minh
- UC-SO03: Quản lý gian hàng (có workflow draft → approve)
- UC-A03: Duyệt thông tin gian hàng

Ví dụ format:

| Mục | Nội dung |
|:----|:---------|
| Use Case ID | UC-C08 |
| Tên | Tự động phát thuyết minh khi đến gần |
| Actor | Customer |
| Precondition | Customer bật GPS, hệ thống được cấp quyền Geolocation |
| Main Flow | 1. Hệ thống watchPosition GPS<br>2. Tính khoảng cách Haversine tới tất cả pin<br>3. Nếu khoảng cách <= 4m → fetch commentary<br>4. Phát audio tự động |
| Alternative Flow | Browser chặn autoplay → hiển thị AutoplayBanner |
| Postcondition | StoreId đã phát được ghi nhận, không phát lại trong session |
| Business Rules | Chỉ phát khi gian hàng active, GPS status = 'granted' |

---

### D4. [MEDIUM] Activity Diagram ghi 21 nhưng thiếu UC-A08

**Vấn đề:** Bảng tổng quan ghi 21 Activity Diagram (dòng 487), nhưng đếm thực tế: Admin=8, StoreOwner=6, Customer=7 = 21. Tuy nhiên UC-A08 (Quản lý tài khoản) có Activity Diagram nhưng **thiếu Sequence Diagram** tương ứng.

**Cách sửa:** Đánh giá xem có cần bổ sung Sequence Diagram cho UC-A08 hay không (source code: `admin/admin-store-owners.service.ts` xử lý activate/deactivate tài khoản).

---

## E. Chương 4 - Thiết kế hệ thống

### E1. [HIGH] Mục 4.2 thiếu hoàn toàn — Thiết kế Frontend chi tiết

**Vấn đề:** Chương 4 nhảy từ 4.1 (Kiến trúc tổng thể) sang 4.3 (Database), thiếu mục **4.2 Thiết kế Frontend**. Source có hệ thống frontend phong phú:
- 77+ components tổ chức theo domain (admin, auth, dashboard, gps, map, qr, stores, reviews, notifications, recommendation, reports, layout, ui)
- 4 custom hooks (useGeolocation, useProximityDetection, useAutoPlay, useCommentary)
- 1 context (LanguageContext) + Provider pattern
- Middleware bảo vệ route (admin, store-owner)
- API client architecture (Axios + fetch, token refresh)
- i18n với 7 ngôn ngữ

**Cách sửa:** Thêm mục 4.2 bao gồm:

**4.2.1 Cấu trúc thư mục frontend**
```
apps/frontend/src/
├── app/                    # Next.js App Router (routes)
│   ├── (auth)/             # Auth pages (login, register, callback)
│   ├── (admin)/            # Admin dashboard (17 pages)
│   ├── (store-owner)/      # Store owner dashboard (6 pages)
│   └── (public)/           # Public pages (stores, map, QR)
├── components/             # 77+ React components
│   ├── admin/              # 35+ admin components
│   ├── gps/                # 6 GPS/proximity components
│   ├── map/                # 2 map helpers
│   ├── stores/             # 7 store display components
│   ├── qr/                 # 3 QR components
│   ├── reviews/            # 6 review components
│   ├── recommendation/     # 5 recommendation components
│   ├── notifications/      # 2 notification components
│   ├── reports/            # 2 report components
│   ├── auth/               # 3 auth components
│   └── layout/             # 8 layout components
├── hooks/                  # Custom React hooks
├── contexts/               # React contexts (Language)
├── lib/api/                # API client functions
├── i18n/                   # i18next config + locale files
└── types/                  # Frontend-specific types
```

**4.2.2 Luồng xác thực & bảo vệ route**
- Middleware Next.js kiểm tra cookie `access_token` / `admin_access_token`
- Redirect về login nếu thiếu token
- Token refresh tự động (store-owner) khi gặp 401

**4.2.3 State management**
- TanStack React Query v5 cho server state
- React Context cho language state
- localStorage / cookie cho persistence

**4.2.4 Component architecture**
- Bảng liệt kê component chính và mối quan hệ

---

### E2. [HIGH] Mục 4.3 Database — ERD có ảnh nhưng thiếu mô tả chi tiết

**Vấn đề:** Mục 4.3 chỉ có 2 ảnh ERD (tổng quát + chi tiết) mà không có **bảng mô tả entity/attribute**. Source code có 22 entity, 30+ migration files — đây là nội dung quan trọng cần tài liệu hóa.

**Cách sửa:** Bổ sung bảng mô tả cho mỗi entity. Ví dụ:

**Bảng `stores`**

| Cột | Kiểu | Mô tả |
|:----|:-----|:------|
| id | UUID (PK) | Khóa chính |
| owner_id | UUID (FK) | Liên kết store_owner_accounts |
| name | VARCHAR | Tên gian hàng |
| description | TEXT | Mô tả |
| status | ENUM | draft/pending_review/active/inactive/suspended |
| address | VARCHAR | Địa chỉ |
| lat / lng | FLOAT | Tọa độ |
| phone | VARCHAR | Số điện thoại |
| opening_hours | VARCHAR | Giờ mở cửa |
| social_links | JSONB | Link MXH |
| avg_rating | FLOAT | Điểm đánh giá trung bình |
| review_count | INT | Số lượng đánh giá |
| active_commentary_id | UUID (FK) | Thuyết minh đang active |

Danh sách entity cần mô tả (22 entity):
1. `admin_accounts` — Tài khoản admin
2. `store_owner_accounts` — Tài khoản chủ gian hàng (có lockout, status enum)
3. `stores` — Gian hàng
4. `menu_items` — Món ăn (liên kết tags qua `menu_item_tags`)
5. `store_content_drafts` — Bản nháp nội dung (workflow pending→approved/rejected)
6. `store_images` — Hình ảnh gian hàng
7. `store_translations` — Bản dịch thông tin gian hàng
8. `menu_item_translations` — Bản dịch món ăn
9. `commentaries` — Nội dung thuyết minh (pipeline status tracking)
10. `commentary_translations` — Bản dịch thuyết minh + audio URL
11. `customer_google_accounts` — Tài khoản Google khách hàng
12. `reviews` — Đánh giá (có hidden support)
13. `comment_reports` — Báo cáo bình luận (status: pending/resolved/dismissed)
14. `report_reasons` — Lý do báo cáo (bilingual vi/en)
15. `notifications` — Thông báo (hỗ trợ store_owner + admin)
16. `location_pins` — Ghim vị trí (PostGIS, status workflow)
17. `food_street_boundaries` — Ranh giới phố ẩm thực (PostGIS polygon)
18. `qr_codes` — Mã QR (UUID token, unique partial index cho active)
19. `preference_tags` — Tag sở thích (dish_type/flavor/allergen)
20. `menu_item_tags` — Bảng join M:N giữa menu_items và preference_tags
21. `admin_announcements` — Thông báo admin (draft/sent, recipient modes)

---

### E3. [HIGH] Mục 4.4 API — Chỉ có tiêu đề, thiếu nội dung hoàn toàn

**Vấn đề:** Dòng 881 chỉ ghi `**4.4 API**` rồi không có nội dung nào. Source code có hệ thống API REST đầy đủ với 17 module.

**Cách sửa:** Bổ sung danh sách API endpoints. Nhóm theo module:

**Auth APIs**
| Method | Endpoint | Mô tả |
|:-------|:---------|:------|
| POST | `/api/auth/store-owner/register` | Đăng ký Store Owner |
| POST | `/api/auth/store-owner/login` | Đăng nhập Store Owner |
| POST | `/api/auth/store-owner/refresh` | Refresh token |
| GET | `/api/auth/google` | Redirect Google OAuth |
| GET | `/api/auth/google/callback` | Google OAuth callback |

**Store APIs**
| Method | Endpoint | Mô tả |
|:-------|:---------|:------|
| GET | `/api/stores` | Danh sách gian hàng (public) |
| GET | `/api/stores/:id` | Chi tiết gian hàng |
| PUT | `/api/stores/:id` | Cập nhật gian hàng (Store Owner) |
| POST | `/api/stores/:id/menu-items` | Thêm món ăn |
| POST | `/api/stores/:id/drafts` | Tạo bản nháp nội dung |

*... (tiếp tục cho Commentary, Map, QR, Admin, Reviews, Reports, Recommendations, Notifications, Storage)*

---

### E4. [MEDIUM] Thiếu mục 4.5 — Thiết kế luồng Commentary Pipeline

**Vấn đề:** Commentary pipeline là tính năng cốt lõi nhưng chưa được trình bày chi tiết trong Chương 4. Source code cho thấy luồng phức tạp:

```
Store Owner nhập thuyết minh (tiếng Việt)
  → Backend tạo Commentary entity (status: PENDING)
  → Job vào BullMQ queue "commentary-pipeline"
  → CommentaryProcessor xử lý:
      1. Status → RUNNING
      2. Lưu bản gốc vi
      3. Dịch sang 6 ngôn ngữ (en, fr, zh, ja, ko, th)
         - Primary: Google Gemini AI
         - Fallback: MyMemory API
         - Delay 1.5s giữa mỗi lần gọi (rate limit)
      4. Status → COMPLETED
      5. Emit WebSocket "commentary:updated" → store:{storeId}
  → Frontend nhận event → invalidate React Query cache → hiển thị
```

**Cách sửa:** Thêm mục 4.5 mô tả:
- Sơ đồ luồng pipeline (flowchart)
- Job queue config (max attempts: 3, exponential backoff: 5000ms)
- Error handling strategy
- WebSocket notification mechanism

---

### E5. [MEDIUM] Thiếu mục — Thiết kế luồng Store Translation Pipeline

**Vấn đề:** Ngoài commentary pipeline, source còn có **store-translation-pipeline** riêng dịch tên/mô tả gian hàng + menu items. Báo cáo chưa đề cập.

**Cách sửa:** Bổ sung vào mục pipeline hoặc tạo mục riêng:
- Trigger: khi store content được cập nhật
- Dịch name + description cho store + tất cả menu items
- Cùng TranslationService (Gemini → MyMemory)

---

### E6. [MEDIUM] Thiếu mục — Thiết kế hệ thống Email/Notification

**Vấn đề:** Source có hệ thống email đầy đủ với **8 Handlebars templates** + BullMQ queue `email` + in-app notification, nhưng báo cáo không trình bày.

**Cách sửa:** Bổ sung mục mô tả:
- 8 email templates: account-approved, rejected, deactivated, reactivated, registration-confirmation, admin-new-registration, new-comment-report, admin-announcement
- Notification system: recipientType (store_owner/admin), WebSocket/polling
- Admin announcements: single/multi/all_stores recipient modes

---

### E7. [MEDIUM] Thiếu mục — Thiết kế hệ thống Recommendation

**Vấn đề:** Recommendation engine dùng tag-based matching với raw SQL, nhưng báo cáo chỉ nhắc "gợi ý món ăn" ở mức Use Case, không trình bày thuật toán.

**Cách sửa:** Bổ sung:
- Mô hình preference tags: 3 nhóm (dish_type, flavor, allergen)
- Thuật toán: COUNT matching tags → ORDER BY matchCount DESC
- SQL query logic
- Frontend: TagSelector (max 5 tags) → debounced fetch → paginated results

---

### E8. [LOW] Sơ đồ hạ tầng (4.1.4) dùng ASCII art bị vỡ format

**Vấn đề:** Sơ đồ hạ tầng ở dòng 825 nằm trong table markdown, ASCII art bị nén thành 1 dòng, không đọc được.

**Cách sửa:** Chuyển sang code block markdown:

```
┌─────────────────────────────────────────────┐
│         Trình duyệt (Client)               │
│  Next.js Frontend                           │
│  (React, Tailwind, Leaflet, i18n)           │
│  Port: 3000                                 │
└────────────┬──────────────────┬─────────────┘
             │ REST API (Axios) │ WebSocket
┌────────────▼──────────────────▼─────────────┐
│         NestJS Backend API                  │
│         Port: 3001, Prefix: /api            │
│  Auth   Stores   Map   Commentary           │
│  Module Module  Module  Module              │
│         TypeORM (Data Access Layer)         │
└──────┬──────────────┬─────────────┬─────────┘
       │              │             │
  PostgreSQL 15   Redis 7      MinIO (S3)
  + PostGIS 3.4   Port: 6379   Port: 9000
  Port: 5432      BullMQ       Console: 9001
```

---

## F. Chương 5 - Triển khai (thiếu hoàn toàn)

### F1. [HIGH] Nội dung chương hoàn toàn trống

**Vấn đề:** Chỉ có 1 dòng "Mô tả kết quả đạt được và demo hệ thống." — cần viết đầy đủ.

**Cách sửa:** Đề xuất cấu trúc:

**5.1 Môi trường phát triển**
- Hệ điều hành, IDE, phiên bản Node.js
- Docker services (PostgreSQL, Redis, MinIO)
- npm workspaces + Turborepo workflow
- Cách khởi chạy: `docker-compose up -d` → `npm run dev`

**5.2 Giao diện hệ thống — Customer**
- Screenshot trang chủ / danh sách gian hàng
- Screenshot chi tiết gian hàng (commentary player, menu, reviews)
- Screenshot bản đồ (Leaflet/MapLibre GL, boundary polygon, store pins)
- Screenshot QR scanner modal
- Screenshot GPS autoplay flow (permission banner → status bar → auto-play)
- Screenshot recommendation page (tag selector → results)
- Screenshot language switcher (7 ngôn ngữ)

**5.3 Giao diện hệ thống — Store Owner**
- Screenshot dashboard
- Screenshot quản lý gian hàng (edit form, image uploader, draft submission)
- Screenshot menu management
- Screenshot location pin submission (map picker + coordinate form)
- Screenshot QR code management (generate, download PNG/PDF)
- Screenshot reviews listing + report modal

**5.4 Giao diện hệ thống — Admin**
- Screenshot dashboard overview (metric grid)
- Screenshot store owner management (table, filter, approve/reject modal)
- Screenshot store management (status badge, actions menu)
- Screenshot content draft review (compare view)
- Screenshot location pin review (map + nearby pins)
- Screenshot report management
- Screenshot review moderation
- Screenshot boundary management
- Screenshot announcements (form + recipient picker)
- Screenshot tag management

**5.5 Demo luồng nghiệp vụ chính**
- Luồng: Store Owner đăng ký → Admin duyệt → Tạo gian hàng → Submit draft → Admin approve → Tạo commentary → Pipeline chạy → Customer xem + nghe
- Screenshots từng bước

---

## G. Chương 6 - Kết luận (thiếu hoàn toàn)

### G1. [HIGH] Nội dung chương hoàn toàn trống

**Vấn đề:** Chỉ có 1 dòng "Tổng kết và hướng phát triển."

**Cách sửa:** Đề xuất cấu trúc:

**6.1 Kết quả đạt được**
- Liệt kê các mục tiêu (từ 1.2) và đánh giá hoàn thành:
  - [x] Xem thông tin gian hàng chi tiết (7 store components)
  - [x] Thuyết minh gian hàng text + audio (commentary pipeline + Web Speech API)
  - [x] GPS định vị + thuyết minh tự động (useGeolocation + useProximityDetection, bán kính 4m)
  - [x] QR Code truy cập nhanh (scanner + generator + resolver)
  - [x] Gợi ý món ăn (tag-based recommendation engine)
  - [x] Đa ngôn ngữ (7 ngôn ngữ, i18next + Gemini AI translation)
  - [x] Quản lý Store Owner + Admin (17 backend modules, 35+ admin components)

**6.2 Hạn chế**
- TTS server-side chưa implement (stub) → phụ thuộc browser Web Speech API (chất lượng không đồng nhất)
- GPS accuracy hạn chế trong nhà / khu vực tín hiệu yếu
- Test coverage gần bằng 0 (chỉ 4 unit tests)
- WebSocket không có authentication
- Admin/Store Owner UI chưa đa ngôn ngữ
- Chưa có CI/CD pipeline
- Chưa có Dockerfile cho deployment

**6.3 Hướng phát triển**
- Implement Google Cloud TTS cho audio quality cao, pre-generate audio files lưu MinIO
- Progressive Web App (PWA) cho offline support
- Mobile app (React Native / Flutter)
- Payment integration
- AI chatbot hỗ trợ khách hàng
- Analytics dashboard
- Swagger/OpenAPI documentation
- CI/CD pipeline + Docker deployment

---

## H. Chương 7 - Tổng kết (thiếu hoàn toàn)

### H1. [MEDIUM] Xem xét gộp với Chương 6

**Vấn đề:** Chương 7 "Tổng kết và đánh giá" chồng chéo nội dung với Chương 6 "Kết luận". Cả hai đều trống.

**Cách sửa:** 2 phương án:
1. **Gộp Ch6 + Ch7** thành "Chương 6: Kết luận và hướng phát triển" — phổ biến trong seminar
2. **Tách rõ**: Ch6 = Kết luận kỹ thuật (kết quả, hạn chế), Ch7 = Đánh giá tổng thể + phân công công việc nhóm + bài học kinh nghiệm

Nếu tách:

**Chương 7: Tổng kết và đánh giá**
- 7.1 Đánh giá tổng thể (so sánh mục tiêu vs kết quả)
- 7.2 Phân công công việc (bảng phân công 4 thành viên)
- 7.3 Bài học kinh nghiệm
- 7.4 Tài liệu tham khảo

---

## I. Nội dung source có nhưng báo cáo chưa đề cập

### I1. [HIGH] Hệ thống Content Draft workflow

**Vấn đề:** Source có workflow phức tạp cho content moderation:
- Store Owner submit draft (StoreContentDraft entity, status: pending)
- Admin review + approve/reject (DraftCompareView component so sánh old vs new)
- Reject có reason
- Chỉ khi approved mới public

Báo cáo chỉ nhắc "phê duyệt" chung chung, chưa trình bày workflow chi tiết.

**Cách sửa:** Bổ sung vào Ch3 (Activity/Sequence Diagram cho draft workflow) hoặc Ch4 (thiết kế chi tiết).

---

### I2. [MEDIUM] Store Owner lockout mechanism

**Vấn đề:** Source có cơ chế lockout cho Store Owner:
- `failedLoginAttempts` tracking
- `lockoutUntil` timestamp
- Auto-lock sau nhiều lần login sai

Báo cáo không đề cập security features này.

**Cách sửa:** Bổ sung vào mục Auth hoặc Business Rules.

---

### I3. [MEDIUM] Presigned URL upload flow

**Vấn đề:** Source dùng presigned URL pattern cho file upload:
1. Client request presigned URL từ backend
2. Client upload trực tiếp lên MinIO
3. Client confirm upload với backend

Đây là pattern quan trọng nhưng báo cáo không mô tả.

**Cách sửa:** Bổ sung vào Ch4 — mục Storage hoặc thêm Sequence Diagram.

---

### I4. [MEDIUM] PostGIS boundary checking

**Vấn đề:** Source dùng PostGIS cho:
- `ST_Within` kiểm tra pin nằm trong ranh giới phố ẩm thực
- `ST_DWithin` tìm pin gần nhau (duplicate detection)
- `pin_geom` generated column từ lat/lng

Báo cáo chỉ nhắc PostGIS ở mức "hỗ trợ dữ liệu không gian" nhưng không giải thích cách sử dụng.

**Cách sửa:** Bổ sung vào Ch2 (lý thuyết PostGIS) và Ch4 (thiết kế location module).

---

### I5. [LOW] Dev tools (DevFakeGps)

**Vấn đề:** Source có component `DevFakeGps.tsx` cho phép fake GPS coordinates trong development. Có thể đề cập trong phần triển khai/testing.

---

### I6. [MEDIUM] Thiếu danh sách tài liệu tham khảo

**Vấn đề:** Báo cáo không có mục "Tài liệu tham khảo" — bắt buộc trong đề cương seminar.

**Cách sửa:** Thêm mục cuối cùng, liệt kê:
- Tài liệu NestJS, Next.js, TypeORM, PostGIS
- Tài liệu Google Gemini AI, Google OAuth 2.0
- Tài liệu Web Speech API (MDN)
- Tài liệu OSRM, OpenStreetMap, Leaflet
- Tài liệu BullMQ, Socket.IO, i18next
- Sách/bài báo về hệ thống thuyết minh tự động, du lịch thông minh

---

## J. Sai lệch giữa báo cáo và source

### J1. [HIGH] Tên dự án trong cấu trúc Monorepo (4.1.3) sai

**Vấn đề:** Dòng 818 ghi `seminar-v2/` nhưng thực tế tên thư mục root = `seminar-street-food/`.

**Cách sửa:** → `seminar-street-food/`

---

### J2. [MEDIUM] Báo cáo nói "AI tạo audio" nhưng thực tế TTS là stub

**Vấn đề:** Nhiều chỗ trong báo cáo (2.4.2, 2.5.2) mô tả "AI tạo audio thuyết minh" nhưng source code cho thấy `TtsService.synthesize()` return `null`. Audio thực tế do **browser Web Speech API** xử lý client-side.

**Cách sửa:** Chỉnh lại mô tả cho chính xác:
- AI dịch text (Gemini) — ĐÚNG
- AI tạo audio — SAI (hiện tại dùng browser Web Speech API)
- Nên ghi nhận đây là hạn chế, TTS server-side là hướng phát triển

---

### J3. [LOW] Bảng Sequence Diagram ghi 11 nhưng mục Admin thiếu hình

**Vấn đề:** Tổng quan ghi 11 Sequence Diagram, đếm thực tế: Admin=3, StoreOwner=3, Customer=5 = 11. Đúng số lượng, nhưng 3 sơ đồ Admin (Hình 3.25-3.27) thiếu hình ảnh.

**Cách sửa:** Bổ sung 3 hình Sequence Diagram Admin (xem A7).

---

### J4. [LOW] Số lượng Activity Diagram Customer

**Vấn đề:** Mục 3.3.3 ghi "7 sơ đồ" nhưng liệt kê 7 UC (C01-C08, bỏ C06). Thiếu UC-C06 (Chuyển đổi ngôn ngữ) — nếu bổ sung thì thành 8, cần cập nhật số lượng tổng thành 22.

---

## Checklist tổng hợp theo mức độ ưu tiên

### HIGH (cần làm ngay)
- [ ] F1: Viết nội dung Chương 5 — Triển khai (screenshots + demo)
- [ ] G1: Viết nội dung Chương 6 — Kết luận
- [ ] E1: Bổ sung 4.2 — Thiết kế Frontend chi tiết
- [ ] E2: Bổ sung mô tả chi tiết 22 database entities
- [ ] E3: Viết nội dung 4.4 — API endpoints
- [ ] C1: Thêm mục công nghệ phát triển (2.9)
- [ ] A1: Sửa mâu thuẫn cấu trúc chương (1.6 vs thực tế)
- [ ] I1: Bổ sung Content Draft workflow
- [ ] J1: Sửa tên `seminar-v2/` → `seminar-street-food/`

### MEDIUM (nên làm)
- [ ] E4: Bổ sung thiết kế Commentary Pipeline
- [ ] E5: Bổ sung thiết kế Store Translation Pipeline
- [ ] E6: Bổ sung thiết kế Email/Notification
- [ ] E7: Bổ sung thiết kế Recommendation
- [ ] C2: Mô tả TTS chi tiết (Web Speech API)
- [ ] C3: Mô tả Google Gemini AI
- [ ] C4: Mô tả i18next / đa ngôn ngữ
- [ ] D1: Bổ sung UC-C06 (Chuyển đổi ngôn ngữ)
- [ ] A2: Sửa heading level Ch4
- [ ] A3: Viết "Lời mở đầu"
- [ ] A6: Xóa ghi chú thô + fix format cấu trúc thư mục
- [ ] A7: Bổ sung 3 hình Sequence Diagram Admin
- [ ] A8: Bổ sung hình Activity Diagram UC-C03
- [ ] H1: Xử lý Ch7 (gộp hoặc tách rõ với Ch6)
- [ ] I2: Bổ sung Store Owner lockout mechanism
- [ ] I3: Bổ sung Presigned URL upload flow
- [ ] I4: Bổ sung PostGIS boundary checking
- [ ] I6: Thêm danh sách tài liệu tham khảo
- [ ] J2: Sửa mô tả "AI tạo audio" → Web Speech API
- [ ] E8: Fix ASCII art sơ đồ hạ tầng

### LOW (nên xem xét)
- [ ] A4: Sửa "Custome" → "Customer"
- [ ] A5: Sửa "Xem thôn tin" → "Xem thông tin"
- [ ] B1: Thêm công trình liên quan
- [ ] D2: Bổ sung UC-SO07 (Xem thông báo)
- [ ] D3: Thêm Use Case Specification
- [ ] D4: Bổ sung Sequence Diagram UC-A08
- [ ] I5: Đề cập DevFakeGps
- [ ] J3: Bổ sung hình SD Admin
- [ ] J4: Cập nhật số lượng Activity Diagram

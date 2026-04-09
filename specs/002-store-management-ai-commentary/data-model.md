# Data Model: Quản lý gian hàng & Thuyết minh AI

**Feature**: `002-store-management-ai-commentary`
**Date**: 2026-04-05
**Database**: PostgreSQL 15

---

## Entity Relationship Overview

```
users (spec 001)
 └─< stores (1 owner → 1 store)
      ├─< store_content_drafts
      ├─< menu_items
      ├─< store_images
      └─< commentaries
           ├── stores.active_commentary_id → commentaries.id  (FK, nullable)
           └─< commentary_translations
```

---

## Schema Definitions

### Table: `stores`

Extend từ spec 001 — thêm các field liên quan đến commentary.

```sql
CREATE TABLE stores (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id              UUID NOT NULL REFERENCES store_owner_accounts(id) ON DELETE RESTRICT,

  -- Thông tin hiện hành (đã được Admin phê duyệt hoặc thông tin ban đầu)
  name                  VARCHAR(255) NOT NULL,
  description           VARCHAR(1000),

  status                store_status NOT NULL DEFAULT 'inactive',

  -- FK trỏ đến bản Commentary đang hoạt động (NULL nếu chưa có)
  active_commentary_id  UUID REFERENCES commentaries(id) ON DELETE SET NULL,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE store_status AS ENUM ('active', 'inactive');

-- Index cho listing và search
CREATE INDEX idx_stores_status ON stores(status);
CREATE INDEX idx_stores_owner_id ON stores(owner_id);
```

**Ghi chú thiết kế**:

- `active_commentary_id` là FK nullable — NULL khi gian hàng chưa có thuyết minh nào được duyệt.
- Chỉ có một FK này trên bảng `stores` để enforce Principle V (Single-Active-State); không dùng
  boolean flag trên bảng `commentaries` vì FK duy nhất an toàn hơn về mặt constraint.
- Circular FK (`stores` → `commentaries` → `stores`) được handle bằng `DEFERRABLE INITIALLY DEFERRED`
  hoặc insert theo thứ tự: tạo `stores` trước (NULL), tạo `commentaries`, rồi UPDATE `stores`.

---

### Table: `store_content_drafts`

Lưu bản thay đổi thông tin gian hàng đang chờ Admin duyệt.

```sql
CREATE TABLE store_content_drafts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id          UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  -- Thông tin mới mà Store Owner muốn cập nhật
  name              VARCHAR(255) NOT NULL,
  description       VARCHAR(1000),

  status            draft_status NOT NULL DEFAULT 'pending',
  rejection_reason  TEXT,         -- NULL khi pending/approved; bắt buộc khi rejected

  submitted_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at       TIMESTAMPTZ,  -- NULL cho đến khi Admin xử lý
  reviewed_by       UUID REFERENCES admin_accounts(id) ON DELETE SET NULL  -- Admin user id
);

CREATE TYPE draft_status AS ENUM ('pending', 'approved', 'rejected');

-- Đảm bảo mỗi store chỉ có tối đa 1 bản pending tại một thời điểm
CREATE UNIQUE INDEX idx_store_drafts_one_pending
  ON store_content_drafts(store_id)
  WHERE status = 'pending';

CREATE INDEX idx_store_drafts_store_id ON store_content_drafts(store_id);
CREATE INDEX idx_store_drafts_status ON store_content_drafts(status);
```

**Ghi chú thiết kế**:

- Partial unique index `WHERE status = 'pending'` enforce FR-003 ở tầng database — không thể
  tạo hai bản `pending` cho cùng một store, ngay cả khi có race condition ở tầng application.
- `rejection_reason` là TEXT không giới hạn — Admin cần có chỗ giải thích đầy đủ.
- Các bản `approved` và `rejected` cũ được giữ lại để audit trail; không xóa.

---

### Table: `menu_items`

Danh sách món ăn của gian hàng.

```sql
CREATE TABLE menu_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id      UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  name          VARCHAR(255) NOT NULL,
  description   VARCHAR(500),
  price         NUMERIC(12, 0) NOT NULL,  -- Đơn vị: VND (không có thập phân)

  -- Draft tracking: true = món này được thêm/giữ trong bản draft hiện tại
  -- false = món này bị đánh dấu xóa trong draft (chưa thực sự xóa khỏi DB)
  is_in_draft   BOOLEAN NOT NULL DEFAULT false,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_menu_items_store_id ON menu_items(store_id);

-- Index phục vụ full-text search theo tên món ăn (FR-014)
CREATE INDEX idx_menu_items_name_fts
  ON menu_items USING gin(to_tsvector('simple', name));
```

**Ghi chú thiết kế**:

- `price` dùng `NUMERIC(12, 0)` — VND không có xu/hào, giá trị tối đa 999,999,999,999đ (đủ cho
  mọi món ăn thực tế).
- `is_in_draft = true`: món được thêm mới trong bản draft, chưa được Admin duyệt.
- `is_in_draft = false` (kết hợp với việc record tồn tại): món hiện hành đang bị đánh dấu xóa
  trong draft. Khi Admin phê duyệt → xóa hẳn record. Khi thu hồi/từ chối → giữ nguyên record.
- Khi không có draft, `is_in_draft = false` là trạng thái bình thường của tất cả món ăn hiện hành.

---

### Table: `store_images`

Ảnh của gian hàng, tối đa 10 ảnh mỗi gian hàng.

```sql
CREATE TABLE store_images (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id      UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  url           TEXT NOT NULL,         -- Full URL trỏ đến MinIO/S3
  s3_key        TEXT NOT NULL,         -- Key trong S3 bucket (để xóa file khi cần)
  order_index   SMALLINT NOT NULL DEFAULT 0,  -- Thứ tự hiển thị (0-based)

  -- Draft tracking: tương tự menu_items
  is_in_draft   BOOLEAN NOT NULL DEFAULT false,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_store_images_store_id ON store_images(store_id, order_index);

-- Enforce giới hạn 10 ảnh (active images) per store — check ở application layer
-- DB-level: partial index để đếm nhanh
CREATE INDEX idx_store_images_active
  ON store_images(store_id)
  WHERE is_in_draft = false;
```

**Ghi chú thiết kế**:

- `s3_key` lưu riêng để gọi S3 DeleteObject khi cần xóa file thật sự.
- `order_index` cho phép Store Owner sắp xếp thứ tự ảnh; frontend render theo `ORDER BY order_index`.
- Giới hạn 10 ảnh được enforce ở application layer (trước khi cấp presigned URL) vì PostgreSQL
  không hỗ trợ per-group row count constraint trực tiếp.

---

### Table: `commentaries`

Bản thuyết minh chính thức của gian hàng — được tạo sau mỗi lần Admin phê duyệt.

```sql
CREATE TABLE commentaries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id        UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  -- Nội dung gốc tiếng Việt (copy từ store.description tại thời điểm phê duyệt)
  source_text     VARCHAR(1000) NOT NULL,

  pipeline_status commentary_pipeline_status NOT NULL DEFAULT 'pending',

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE commentary_pipeline_status AS ENUM (
  'pending',    -- Vừa tạo, job chưa được enqueue
  'running',    -- Job đang chạy trong BullMQ
  'completed',  -- Toàn bộ ngôn ngữ đã xử lý (có thể partial audio)
  'failed'      -- Translation thất bại hoàn toàn
);

CREATE INDEX idx_commentaries_store_id ON commentaries(store_id);
CREATE INDEX idx_commentaries_pipeline_status ON commentaries(pipeline_status)
  WHERE pipeline_status IN ('pending', 'running');
```

**Ghi chú thiết kế**:

- Mỗi lần Admin phê duyệt → tạo một `Commentary` mới → cập nhật `stores.active_commentary_id`.
- Commentary cũ (không còn là `active_commentary_id`) được giữ lại cho audit; không xóa.
- `source_text` là snapshot của `stores.description` tại thời điểm phê duyệt — đảm bảo pipeline
  dùng đúng nội dung dù Store Owner sau đó tạo draft mới.
- Partial index trên `pipeline_status` giúp monitor job queue nhanh (chỉ index những row cần theo dõi).

---

### Table: `commentary_translations`

Bản dịch và file audio TTS cho từng ngôn ngữ.

```sql
CREATE TABLE commentary_translations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commentary_id   UUID NOT NULL REFERENCES commentaries(id) ON DELETE CASCADE,

  language_code   VARCHAR(10) NOT NULL,  -- BCP-47: 'en', 'fr', 'zh', 'ja', 'ko', 'th'
  translated_text TEXT NOT NULL,

  -- NULL khi TTS thất bại cho ngôn ngữ này (chỉ phục vụ text)
  audio_url       TEXT,
  audio_s3_key    TEXT,          -- Key trong S3 để xóa file khi cần

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Đảm bảo mỗi commentary chỉ có 1 bản dịch per ngôn ngữ
CREATE UNIQUE INDEX idx_commentary_translations_unique
  ON commentary_translations(commentary_id, language_code);

CREATE INDEX idx_commentary_translations_commentary_id
  ON commentary_translations(commentary_id);
```

**Ghi chú thiết kế**:

- `audio_url = NULL` có nghĩa: dịch thành công nhưng TTS thất bại. Frontend hiển thị text
  nhưng không hiển thị audio player.
- Unique constraint `(commentary_id, language_code)` đảm bảo pipeline không tạo duplicate khi
  retry job.
- `translated_text` là TEXT không giới hạn vì bản dịch có thể dài hơn source sau khi dịch.

---

## State Machines

### StoreContentDraft State Machine

```
                    [Store Owner lưu thay đổi]
                              │
                              ▼
                         ┌─────────┐
                         │ pending │ ◄── Trạng thái ban đầu
                         └─────────┘
                        /           \
         [Admin phê duyệt]         [Admin từ chối (kèm lý do)]
                      /               \
                     ▼                 ▼
              ┌──────────┐      ┌──────────┐
              │ approved │      │ rejected │
              └──────────┘      └──────────┘
                    │                 │
          [Thông tin mới lên live]   [Store Owner nhận lý do]
          [AI pipeline kích hoạt]   [Được phép gửi draft mới]

  Từ pending: Store Owner có thể [Thu hồi] → xóa bản pending → về trạng thái không có draft
```

**Transition rules**:

- `pending → approved`: Chỉ Admin có thể thực hiện. Trigger: cập nhật `stores` (name, description),
  xóa `menu_items is_in_draft=false`, giữ `menu_items is_in_draft=true`, tương tự `store_images`.
  Tạo `Commentary` mới, enqueue BullMQ job, cập nhật `stores.active_commentary_id`.
- `pending → rejected`: Chỉ Admin. `rejection_reason` bắt buộc không rỗng.
- `pending → (deleted)`: Store Owner thu hồi. Xóa record `store_content_drafts`, revert
  `menu_items` và `store_images` draft changes.
- `approved` / `rejected`: Terminal states — không thể chuyển tiếp.

---

### Commentary Pipeline State Machine

```
              [Sau khi Admin phê duyệt draft]
                            │
                            ▼
                       ┌─────────┐
                       │ pending │  (tồn tại vài giây)
                       └─────────┘
                            │
                  [BullMQ job được pick up]
                            │
                            ▼
                       ┌─────────┐
                       │ running │
                       └─────────┘
                       /         \
        [Tất cả ngôn ngữ OK]    [Translation thất bại hoàn toàn]
                    /               \
                   ▼                 ▼
            ┌───────────┐      ┌────────┐
            │ completed │      │ failed │
            └───────────┘      └────────┘

  Note: TTS thất bại một phần (dịch OK, TTS lỗi) → vẫn chuyển sang 'completed'
        nhưng audio_url = NULL cho ngôn ngữ đó trong commentary_translations.
```

**Transition rules**:

- `pending → running`: BullMQ processor bắt đầu xử lý job.
- `running → completed`: Ít nhất một ngôn ngữ được dịch thành công (kể cả khi TTS một số thất bại).
- `running → failed`: Google Translation API trả về lỗi cho toàn bộ ngôn ngữ sau 3 lần retry.
- `running → pending` (retry): BullMQ tự động retry khi processor throw exception toàn bộ.
- `completed` / `failed`: Terminal states. Khi Admin phê duyệt draft mới → tạo `Commentary` mới,
  không thay đổi state của commentary cũ.

---

## Indexes Summary

| Table | Index | Mục đích |
| ----- | ----- | -------- |
| `stores` | `idx_stores_status` | Filter active stores cho public listing |
| `stores` | `idx_stores_owner_id` | Store Owner xem gian hàng của mình |
| `store_content_drafts` | `idx_store_drafts_one_pending` (partial unique) | Enforce one-pending-per-store |
| `store_content_drafts` | `idx_store_drafts_status` | Admin query danh sách pending |
| `menu_items` | `idx_menu_items_store_id` | Load menu theo store |
| `menu_items` | `idx_menu_items_name_fts` (GIN) | Full-text search theo tên món |
| `commentaries` | `idx_commentaries_pipeline_status` (partial) | Monitor running/pending jobs |
| `commentary_translations` | `idx_commentary_translations_unique` (unique) | Prevent duplicate per language |

---

## Full-text Search (FR-014)

Customer tìm kiếm theo tên gian hàng hoặc tên món ăn:

```sql
-- Tìm stores có tên khớp hoặc có món ăn tên khớp với keyword
SELECT DISTINCT s.id, s.name, s.description, s.status
FROM stores s
LEFT JOIN menu_items mi ON mi.store_id = s.id AND mi.is_in_draft = false
WHERE s.status = 'active'
  AND (
    s.name ILIKE '%' || $1 || '%'
    OR to_tsvector('simple', mi.name) @@ plainto_tsquery('simple', $1)
  )
ORDER BY s.name;
```

Dùng `ILIKE` cho tên store (đơn giản, đủ dùng với ~100 stores), GIN index cho tên món ăn
(nhiều records hơn). Nếu cần scale → chuyển sang `pg_trgm` index cho `ILIKE`.

# Data Model: Admin — Quản lý gian hàng & Gửi thông báo

**Spec**: 009-admin-stores-notify | **Date**: 2026-04-10

---

## 1. Bảng hiện có (liên quan)

### 1.1 `stores`

- Đã có cột `status` (`active` | `inactive`) — dùng cho UC-A02.
- Quan hệ: `owner_id` → `store_owner_accounts`, các quan hệ tới `menu_items`, `store_images`, `location_pins`, `reviews`, `qr_codes`, v.v. (theo migration hiện tại).

### 1.2 `notifications`

- `recipient_type` enum: `store_owner` | `admin`
- `recipient_id`: UUID Store Owner
- `event_type`: VARCHAR(100) — thêm giá trị mới **`ADMIN_ANNOUNCEMENT`** (hoặc tên tương đương cố định trong code).
- `title`, `body`, `is_read`, `created_at`

### 1.3 `admin_accounts`

- Người gửi thông báo (foreign key từ bảng mới dưới đây).

---

## 2. Bảng mới đề xuất: `admin_announcements`

Lưu nháp, lịch sử gửi, và metadata lỗi email.

| Cột | Kiểu | Ràng buộc / Ghi chú |
|-----|------|---------------------|
| `id` | UUID | PK, default `gen_random_uuid()` |
| `admin_id` | UUID | FK → `admin_accounts.id`, NOT NULL |
| `title` | VARCHAR(500) | NOT NULL |
| `body` | TEXT | NOT NULL (nháp có thể cho phép empty nếu product cho phép — MVP: NOT NULL khi `status = sent`) |
| `recipient_mode` | ENUM | `single_store` \| `multi_store` \| `all_stores` |
| `store_ids` | UUID[] | NULL nếu `all_stores`; bắt buộc non-empty khi `single` hoặc `multi` |
| `status` | ENUM | `draft` \| `sent` |
| `failed_email_details` | JSONB | NULL cho đến khi xử lý xong; mảng `{ email, error }` |
| `recipient_count` | INT | Số owner đã nhận in-app (sau dedupe) |
| `created_at` | TIMESTAMPTZ | |
| `updated_at` | TIMESTAMPTZ | |
| `sent_at` | TIMESTAMPTZ | NULL khi draft |

**Indexes**: `idx_admin_announcements_admin_id`, `idx_admin_announcements_status`, `idx_admin_announcements_sent_at DESC` (optional, cho lịch sử).

---

## 3. Luồng dữ liệu

### 3.1 Gửi thông báo

1. Admin tạo bản ghi `admin_announcements` (`draft` hoặc gửi thẳng).
2. Khi **send**:
   - Resolve danh sách `store_id` → `owner_id` (dedupe theo `owner_id`).
   - Với mỗi owner: `INSERT notifications` + enqueue email job.
   - Cập nhật `status = sent`, `sent_at`, `recipient_count`; sau khi worker xử lý (hoặc inline log), ghi `failed_email_details`.

### 3.2 Kích hoạt / vô hiệu hóa / xóa store

- **Activate / Deactivate**: `UPDATE stores SET status = ...` với guard Admin JWT.
- **Delete**: Kiểm tra counts (reviews, v.v.) → nếu có và `confirmed=false`, trả 409 + payload cảnh báo; nếu `confirmed=true`, xóa theo thứ tự phụ thuộc FK (hoặc `ON DELETE CASCADE` đã định nghĩa). Chi tiết thứ tự xóa nằm ở service layer và phải khớp schema thực tế sau khi đọc migration.

---

## 4. TypeORM entities (gợi ý)

- `AdminAnnouncement` entity map `admin_announcements`.
- Enum TypeScript: `AnnouncementRecipientMode`, `AnnouncementStatus`.

---

## 5. Không thay đổi

- Không đổi schema Customer/Google accounts.
- Không bắt buộc thêm bảng join announcement↔store nếu `store_ids` array đủ cho MVP; có thể tách bảng `admin_announcement_stores` nếu cần query phức tạp sau này.

# API Contracts: Admin — Quản lý gian hàng & Gửi thông báo

**Spec**: 009-admin-stores-notify | **Date**: 2026-04-10

**Base URL**: `/api`  
**Auth Admin**: `Authorization: Bearer <admin_access_token>` — tất cả endpoint dưới đây bảo vệ bởi `AdminJwtGuard`.

**Format lỗi**: Giống spec 006 — `{ statusCode, error, message, code }`.

---

## Stores — Quản lý gian hàng (UC-A02)

### GET /api/admin/stores

Danh sách gian hàng (phân trang, lọc, tìm kiếm).

**Query**

| Param | Type | Mô tả |
|-------|------|--------|
| `page` | number | Default 1, min 1 |
| `limit` | number | Default 20, max 100 |
| `status` | `active` \| `inactive` | Optional filter |
| `search` | string | Optional — ILIKE tên gian hàng hoặc email chủ |

**Response 200**

```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "string",
        "status": "active",
        "owner": {
          "id": "uuid",
          "email": "string",
          "fullName": "string"
        },
        "createdAt": "ISO8601"
      }
    ],
    "total": 0,
    "page": 1,
    "limit": 20
  }
}
```

---

### PATCH /api/admin/stores/:storeId/activate

Chuyển `stores.status` → `active`.

**Response 200**: `{ "data": { "id": "uuid", "status": "active" } }`  
**404**: Store không tồn tại — `STORE_NOT_FOUND`  
**400**: Đã active — có thể idempotent 200 hoặc `ALREADY_ACTIVE` (chọn một và ghi trong implementation).

---

### PATCH /api/admin/stores/:storeId/deactivate

Chuyển `stores.status` → `inactive`.

**Response 200**: `{ "data": { "id": "uuid", "status": "inactive" } }`  
**404**: `STORE_NOT_FOUND`

---

### GET /api/admin/stores/:storeId/delete-impact

(Xem trước) Trả về số lượng dữ liệu liên quan trước khi xóa (UC-A02 cảnh báo).

**Response 200**

```json
{
  "data": {
    "storeId": "uuid",
    "reviewCount": 0,
    "reportCount": 0,
    "pendingDraft": false,
    "locationPinCount": 0,
    "hasRelatedData": true
  }
}
```

`hasRelatedData` = true nếu bất kỳ count > 0 hoặc `pendingDraft === true` (định nghĩa cụ thể trong service).

---

### DELETE /api/admin/stores/:storeId

Xóa gian hàng. Nếu còn dữ liệu liên quan và `confirmed !== true`, trả **409** yêu cầu xác nhận.

**Query / Body** (chọn một kiểu và thống nhất trong code):

- Option A — Body: `{ "confirmed": true }`

**Response 204**: Xóa thành công (no body) hoặc 200 + `{ "data": { "deleted": true } }` — khớp với global interceptor `{ data: ... }` của backend.

**409 Conflict** — khi chưa xác nhận:

```json
{
  "statusCode": 409,
  "error": "Conflict",
  "message": "Gian hàng còn dữ liệu liên quan. Xác nhận xóa toàn bộ?",
  "code": "STORE_DELETE_REQUIRES_CONFIRMATION",
  "details": {
    "reviewCount": 3,
    "pendingDraft": true
  }
}
```

**404**: `STORE_NOT_FOUND`

---

## Announcements — Gửi thông báo (UC-A07)

### POST /api/admin/announcements

Tạo bản ghi thông báo (`draft` hoặc gửi ngay).

**Body**

```json
{
  "title": "string",
  "body": "string",
  "recipientMode": "single_store | multi_store | all_stores",
  "storeIds": ["uuid"],
  "action": "save_draft | send"
}
```

- `storeIds`: bắt buộc khi `single_store` (đúng 1 phần tử) hoặc `multi_store` (≥1); bỏ trống hoặc null khi `all_stores`.

**Response 201** (draft):

```json
{
  "data": {
    "id": "uuid",
    "status": "draft",
    "title": "string",
    "recipientMode": "single_store",
    "createdAt": "ISO8601"
  }
}
```

**Response 202** hoặc **200** (send): Tùy chọn async — nếu sync MVP:

```json
{
  "data": {
    "id": "uuid",
    "status": "sent",
    "recipientCount": 10,
    "failedEmailDetails": [
      { "email": "a@b.com", "error": "message" }
    ],
    "sentAt": "ISO8601"
  }
}
```

**400**: `EMPTY_BODY`, `INVALID_RECIPIENT_MODE`, `STORE_IDS_REQUIRED`, v.v.

---

### PATCH /api/admin/announcements/:id

Cập nhật nháp (chỉ khi `status === draft`).

**Body**: `{ "title"?, "body"?, "recipientMode"?, "storeIds"? }`

**Response 200**: `{ "data": { ...announcement } }`  
**409**: `ANNOUNCEMENT_ALREADY_SENT`

---

### POST /api/admin/announcements/:id/send

Gửi từ nháp.

**Response**: Giống response send của POST.

**404**: `ANNOUNCEMENT_NOT_FOUND`  
**409**: Đã gửi — `ANNOUNCEMENT_ALREADY_SENT`

---

### GET /api/admin/announcements

Lịch sử (phân trang).

**Query**: `page`, `limit`

**Response 200**

```json
{
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "string",
        "status": "sent",
        "recipientMode": "all_stores",
        "recipientCount": 42,
        "sentAt": "ISO8601",
        "createdAt": "ISO8601"
      }
    ],
    "total": 0,
    "page": 1,
    "limit": 20
  }
}
```

---

## Mã lỗi (tổng hợp)

| Code | HTTP |
|------|------|
| `STORE_NOT_FOUND` | 404 |
| `STORE_DELETE_REQUIRES_CONFIRMATION` | 409 |
| `ANNOUNCEMENT_NOT_FOUND` | 404 |
| `ANNOUNCEMENT_ALREADY_SENT` | 409 |
| `VALIDATION_ERROR` | 400 |
| `EMPTY_BODY` | 400 |

---

## Tests bắt buộc (Constitution Principle VI)

- Mỗi endpoint trên cần ít nhất một integration test (Supertest): happy path + 401 không token + một lỗi domain chính (404/409/400).

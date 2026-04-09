# API Contracts: Đánh giá & Kiểm duyệt bình luận

**Spec**: 004-review-comment-moderation | **Date**: 2026-04-05

Base URL: `http://localhost:3000` (dev) | `https://api.phoamthuc.vn` (prod)

---

## Conventions

**Authentication**:
- `[public]` — Không cần token
- `[customer-jwt]` — JWT Customer (issue sau Google OAuth, 1h), header:
  `Authorization: Bearer <token>`
- `[store-owner-jwt]` — JWT Store Owner (từ spec 001), header:
  `Authorization: Bearer <token>`
- `[admin-jwt]` — JWT Admin (từ spec 001), header:
  `Authorization: Bearer <token>`

**Error format** (chuẩn hóa toàn hệ thống):

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Bạn đã đánh giá gian hàng này rồi",
  "code": "REVIEW_ALREADY_EXISTS"
}
```

**Pagination** (áp dụng cho các endpoint danh sách):

```json
{
  "data": [...],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

---

## Auth Endpoints

### `GET /api/auth/google`

Khởi động Google OAuth flow. Redirect Browser sang trang đăng nhập Google.

**Auth**: `[public]`

**Response**: `302 Redirect` sang Google OAuth authorization URL

```
Location: https://accounts.google.com/o/oauth2/v2/auth?
  client_id=...&
  redirect_uri=http://localhost:3000/api/auth/google/callback&
  response_type=code&
  scope=profile+email&
  state=...
```

---

### `GET /api/auth/google/callback`

Nhận authorization code từ Google sau khi Customer xác thực thành công.
Backend xử lý: upsert `customer_google_accounts`, issue JWT nội bộ, redirect về frontend.

**Auth**: `[public]` (Google gọi endpoint này)

**Query params** (do Google gửi):
- `code` (string): Authorization code
- `state` (string): CSRF token
- `error` (string, optional): Lỗi từ Google nếu Customer từ chối

**Response khi thành công**: `302 Redirect` về frontend kèm token

```
Location: http://localhost:3001/auth/callback?token=eyJhbGciOiJIUzI1NiIs...
```

**Response khi Customer từ chối/lỗi**: `302 Redirect` về frontend

```
Location: http://localhost:3001/auth/callback?error=ACCESS_DENIED
```

---

### `GET /api/auth/me`

Lấy thông tin Customer đang đăng nhập.

**Auth**: `[customer-jwt]`

**Response** `200 OK`:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "displayName": "Nguyễn Văn A",
  "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocKx..."
}
```

**Lưu ý**: `email` không được trả về trong response này (chỉ lưu nội bộ).

**Errors**:
- `401 Unauthorized` — Token không hợp lệ hoặc hết hạn

---

### `POST /api/auth/logout`

Đăng xuất Customer. Xóa JWT khỏi client-side state. Token short-lived (1h) nên không
cần server-side blacklist.

**Auth**: `[customer-jwt]`

**Request body**: (empty)

**Response** `200 OK`:

```json
{
  "message": "Đăng xuất thành công"
}
```

---

## Review Endpoints

### `GET /api/stores/:storeId/reviews`

Danh sách đánh giá của một gian hàng. Chỉ hiển thị reviews chưa bị ẩn (`is_hidden = false`).
Sắp xếp mới nhất lên trước (DESC theo `created_at`).

**Auth**: `[public]`

**Path params**:
- `storeId` (UUID): ID gian hàng

**Query params**:
- `page` (integer, default: `1`): Số trang
- `limit` (integer, default: `20`, max: `50`): Số items mỗi trang

**Response** `200 OK`:

```json
{
  "data": [
    {
      "id": "661e8400-e29b-41d4-a716-446655440001",
      "stars": 5,
      "content": "Quán rất ngon, phục vụ nhiệt tình!",
      "createdAt": "2026-04-05T14:30:00.000Z",
      "customer": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "displayName": "Nguyễn Văn A",
        "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocKx..."
      }
    },
    {
      "id": "661e8400-e29b-41d4-a716-446655440002",
      "stars": 3,
      "content": null,
      "createdAt": "2026-04-04T09:15:00.000Z",
      "customer": {
        "id": "550e8400-e29b-41d4-a716-446655440003",
        "displayName": "Trần Thị B",
        "avatarUrl": null
      }
    }
  ],
  "meta": {
    "total": 47,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  },
  "summary": {
    "avgRating": 4.2,
    "reviewCount": 47
  }
}
```

**Lưu ý**: `summary` chứa `avg_rating` và `review_count` từ `stores` table (cached).

**Errors**:
- `404 Not Found` — Gian hàng không tồn tại

---

### `POST /api/stores/:storeId/reviews`

Gửi đánh giá cho một gian hàng. Customer chỉ được đánh giá mỗi gian hàng một lần.

**Auth**: `[customer-jwt]`

**Path params**:
- `storeId` (UUID): ID gian hàng

**Request body**:

```json
{
  "stars": 4,
  "content": "Đồ ăn ngon, giá hợp lý. Sẽ quay lại."
}
```

| Field | Type | Required | Constraints |
| ----- | ---- | -------- | ----------- |
| `stars` | integer | Có | 1-5 |
| `content` | string | Không | Tối đa 500 ký tự |

**Response** `201 Created`:

```json
{
  "id": "661e8400-e29b-41d4-a716-446655440010",
  "storeId": "772e8400-e29b-41d4-a716-446655440020",
  "stars": 4,
  "content": "Đồ ăn ngon, giá hợp lý. Sẽ quay lại.",
  "createdAt": "2026-04-05T15:00:00.000Z",
  "customer": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "displayName": "Nguyễn Văn A",
    "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocKx..."
  }
}
```

**Errors**:
- `400 Bad Request` — `stars` không nằm trong khoảng 1-5 hoặc `content` vượt 500 ký tự

  ```json
  {
    "statusCode": 400,
    "error": "Bad Request",
    "message": ["stars phải từ 1 đến 5"],
    "code": "VALIDATION_ERROR"
  }
  ```

- `401 Unauthorized` — Chưa đăng nhập
- `404 Not Found` — Gian hàng không tồn tại hoặc không active
- `409 Conflict` — Customer đã đánh giá gian hàng này rồi

  ```json
  {
    "statusCode": 409,
    "error": "Conflict",
    "message": "Bạn đã đánh giá gian hàng này rồi",
    "code": "REVIEW_ALREADY_EXISTS"
  }
  ```

---

### `POST /api/stores/:storeId/reviews/:reviewId/report`

Store Owner báo cáo một bình luận tại gian hàng của mình.

**Auth**: `[store-owner-jwt]`

**Path params**:
- `storeId` (UUID): ID gian hàng (phải là gian hàng của Store Owner đang đăng nhập)
- `reviewId` (UUID): ID bình luận cần báo cáo

**Request body**:

```json
{
  "reasonId": 2
}
```

| Field | Type | Required | Constraints |
| ----- | ---- | -------- | ----------- |
| `reasonId` | integer | Có | ID phải tồn tại trong `report_reasons` |

**Response** `201 Created`:

```json
{
  "id": "881e8400-e29b-41d4-a716-446655440030",
  "reviewId": "661e8400-e29b-41d4-a716-446655440001",
  "reason": {
    "id": 2,
    "labelVi": "Nội dung không phù hợp",
    "labelEn": "Inappropriate content"
  },
  "status": "pending",
  "createdAt": "2026-04-05T15:10:00.000Z"
}
```

**Errors**:
- `400 Bad Request` — `reasonId` không hợp lệ

  ```json
  {
    "statusCode": 400,
    "error": "Bad Request",
    "message": "Lý do báo cáo không hợp lệ",
    "code": "INVALID_REASON_ID"
  }
  ```

- `401 Unauthorized` — Chưa đăng nhập
- `403 Forbidden` — Store Owner cố báo cáo bình luận tại gian hàng không phải của mình

  ```json
  {
    "statusCode": 403,
    "error": "Forbidden",
    "message": "Bạn không có quyền báo cáo bình luận tại gian hàng này",
    "code": "STORE_NOT_OWNED"
  }
  ```

- `404 Not Found` — Review không tồn tại
- `409 Conflict` — Store Owner đã báo cáo bình luận này rồi

  ```json
  {
    "statusCode": 409,
    "error": "Conflict",
    "message": "Bạn đã báo cáo bình luận này rồi",
    "code": "REPORT_ALREADY_EXISTS"
  }
  ```

---

## Admin: Review Management Endpoints

### `GET /api/admin/reviews`

Danh sách tất cả bình luận trong hệ thống. Hỗ trợ filter và tìm kiếm.
Hiển thị cả bình luận đã ẩn.

**Auth**: `[admin-jwt]`

**Query params**:
- `page` (integer, default: `1`)
- `limit` (integer, default: `20`, max: `100`)
- `storeId` (UUID, optional): Lọc theo gian hàng
- `status` (string, optional): `visible` | `hidden` (mặc định: tất cả)
- `keyword` (string, optional): Tìm kiếm trong nội dung bình luận (full-text search
  không phân biệt hoa thường)

**Response** `200 OK`:

```json
{
  "data": [
    {
      "id": "661e8400-e29b-41d4-a716-446655440001",
      "stars": 2,
      "content": "Phục vụ kém, đồ ăn không ngon.",
      "isHidden": false,
      "hiddenAt": null,
      "hiddenBy": null,
      "createdAt": "2026-04-05T14:30:00.000Z",
      "customer": {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "displayName": "Nguyễn Văn A",
        "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocKx..."
      },
      "store": {
        "id": "772e8400-e29b-41d4-a716-446655440020",
        "name": "Quán Phở Hà Nội"
      },
      "reportCount": 1
    }
  ],
  "meta": {
    "total": 320,
    "page": 1,
    "limit": 20,
    "totalPages": 16
  }
}
```

**Errors**:
- `401 Unauthorized`
- `403 Forbidden` — Không phải Admin

---

### `PATCH /api/admin/reviews/:id/hide`

Admin ẩn một bình luận trực tiếp (không cần báo cáo). Bình luận vẫn lưu trong DB,
không hiển thị với Customer. Cập nhật `avg_rating` và `review_count` trong `stores`.

**Auth**: `[admin-jwt]`

**Path params**:
- `id` (UUID): ID bình luận cần ẩn

**Request body**: (empty)

**Response** `200 OK`:

```json
{
  "id": "661e8400-e29b-41d4-a716-446655440001",
  "isHidden": true,
  "hiddenAt": "2026-04-05T16:00:00.000Z",
  "hiddenBy": "993e8400-e29b-41d4-a716-446655440099"
}
```

**Errors**:
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found` — Review không tồn tại
- `409 Conflict` — Bình luận đã ẩn rồi

  ```json
  {
    "statusCode": 409,
    "error": "Conflict",
    "message": "Bình luận này đã ẩn rồi",
    "code": "REVIEW_ALREADY_HIDDEN"
  }
  ```

---

### `PATCH /api/admin/reviews/:id/unhide`

Admin bỏ ẩn một bình luận. Bình luận hiển thị lại với Customer.
Cập nhật `avg_rating` và `review_count` trong `stores`.

**Auth**: `[admin-jwt]`

**Path params**:
- `id` (UUID): ID bình luận cần bỏ ẩn

**Request body**: (empty)

**Response** `200 OK`:

```json
{
  "id": "661e8400-e29b-41d4-a716-446655440001",
  "isHidden": false,
  "hiddenAt": null,
  "hiddenBy": null
}
```

**Errors**:
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`
- `409 Conflict` — Bình luận không đang ở trạng thái ẩn

  ```json
  {
    "statusCode": 409,
    "error": "Conflict",
    "message": "Bình luận này không đang bị ẩn",
    "code": "REVIEW_NOT_HIDDEN"
  }
  ```

---

### `DELETE /api/admin/reviews/:id`

Admin xóa vĩnh viễn một bình luận khỏi hệ thống. Xóa luôn các `comment_reports` liên
quan (CASCADE). Cập nhật `avg_rating` và `review_count` trong `stores`.

**Auth**: `[admin-jwt]`

**Path params**:
- `id` (UUID): ID bình luận cần xóa

**Request body**: (empty)

**Response** `204 No Content`

**Errors**:
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`

---

## Admin: Report Management Endpoints

### `GET /api/admin/reports`

Danh sách tất cả báo cáo bình luận. Hỗ trợ filter theo trạng thái.

**Auth**: `[admin-jwt]`

**Query params**:
- `page` (integer, default: `1`)
- `limit` (integer, default: `20`, max: `100`)
- `status` (string, optional): `pending` | `resolved` | `dismissed` (mặc định: tất cả)
- `storeId` (UUID, optional): Lọc theo gian hàng

**Response** `200 OK`:

```json
{
  "data": [
    {
      "id": "881e8400-e29b-41d4-a716-446655440030",
      "status": "pending",
      "createdAt": "2026-04-05T15:10:00.000Z",
      "resolvedAt": null,
      "resolvedBy": null,
      "reason": {
        "id": 2,
        "labelVi": "Nội dung không phù hợp",
        "labelEn": "Inappropriate content"
      },
      "reporter": {
        "id": "aa1e8400-e29b-41d4-a716-446655440040",
        "name": "Chủ Quán Phở Hà Nội"
      },
      "review": {
        "id": "661e8400-e29b-41d4-a716-446655440001",
        "stars": 1,
        "content": "Đồ ăn rất dở, không bao giờ quay lại.",
        "isHidden": false,
        "customer": {
          "displayName": "Nguyễn Văn A",
          "avatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocKx..."
        },
        "store": {
          "id": "772e8400-e29b-41d4-a716-446655440020",
          "name": "Quán Phở Hà Nội"
        }
      }
    }
  ],
  "meta": {
    "total": 12,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

**Errors**:
- `401 Unauthorized`
- `403 Forbidden`

---

### `PATCH /api/admin/reports/:id/resolve`

Admin xử lý báo cáo bằng cách ẩn hoặc xóa bình luận. Báo cáo chuyển sang trạng thái
`resolved`.

**Auth**: `[admin-jwt]`

**Path params**:
- `id` (UUID): ID báo cáo cần xử lý

**Request body**:

```json
{
  "action": "hide"
}
```

| Field | Type | Required | Giá trị hợp lệ |
| ----- | ---- | -------- | -------------- |
| `action` | string | Có | `"hide"` — ẩn bình luận; `"delete"` — xóa vĩnh viễn |

**Response** `200 OK` (khi action = `"hide"`):

```json
{
  "id": "881e8400-e29b-41d4-a716-446655440030",
  "status": "resolved",
  "resolvedAt": "2026-04-05T17:00:00.000Z",
  "resolvedBy": "993e8400-e29b-41d4-a716-446655440099",
  "action": "hide",
  "review": {
    "id": "661e8400-e29b-41d4-a716-446655440001",
    "isHidden": true
  }
}
```

**Response** `200 OK` (khi action = `"delete"`):

```json
{
  "id": "881e8400-e29b-41d4-a716-446655440030",
  "status": "resolved",
  "resolvedAt": "2026-04-05T17:00:00.000Z",
  "resolvedBy": "993e8400-e29b-41d4-a716-446655440099",
  "action": "delete",
  "review": null
}
```

**Errors**:
- `400 Bad Request` — `action` không hợp lệ

  ```json
  {
    "statusCode": 400,
    "error": "Bad Request",
    "message": "action phải là 'hide' hoặc 'delete'",
    "code": "INVALID_ACTION"
  }
  ```

- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found` — Báo cáo không tồn tại
- `409 Conflict` — Báo cáo đã được xử lý rồi

  ```json
  {
    "statusCode": 409,
    "error": "Conflict",
    "message": "Báo cáo này đã được xử lý rồi",
    "code": "REPORT_ALREADY_PROCESSED"
  }
  ```

---

### `PATCH /api/admin/reports/:id/dismiss`

Admin bác bỏ báo cáo — bình luận vẫn hiển thị bình thường. Báo cáo chuyển sang trạng
thái `dismissed`.

**Auth**: `[admin-jwt]`

**Path params**:
- `id` (UUID): ID báo cáo cần bác bỏ

**Request body**: (empty)

**Response** `200 OK`:

```json
{
  "id": "881e8400-e29b-41d4-a716-446655440030",
  "status": "dismissed",
  "resolvedAt": "2026-04-05T17:30:00.000Z",
  "resolvedBy": "993e8400-e29b-41d4-a716-446655440099"
}
```

**Errors**:
- `401 Unauthorized`
- `403 Forbidden`
- `404 Not Found`
- `409 Conflict` — Báo cáo đã được xử lý rồi

  ```json
  {
    "statusCode": 409,
    "error": "Conflict",
    "message": "Báo cáo này đã được xử lý rồi",
    "code": "REPORT_ALREADY_PROCESSED"
  }
  ```

---

## Report Reasons Endpoint

### `GET /api/report-reasons`

Danh sách tất cả lý do báo cáo. Dùng để populate dropdown khi Store Owner báo cáo bình
luận.

**Auth**: `[public]`

**Response** `200 OK`:

```json
{
  "data": [
    {
      "id": 1,
      "labelVi": "Spam hoặc quảng cáo",
      "labelEn": "Spam or advertisement"
    },
    {
      "id": 2,
      "labelVi": "Nội dung không phù hợp",
      "labelEn": "Inappropriate content"
    },
    {
      "id": 3,
      "labelVi": "Thông tin sai lệch",
      "labelEn": "Misleading information"
    },
    {
      "id": 4,
      "labelVi": "Ngôn ngữ thù địch hoặc xúc phạm",
      "labelEn": "Hate speech or offensive language"
    },
    {
      "id": 5,
      "labelVi": "Không liên quan đến gian hàng",
      "labelEn": "Not relevant to the store"
    }
  ]
}
```

---

## Error Code Reference

| Code | HTTP Status | Mô tả |
| ---- | ----------- | ----- |
| `VALIDATION_ERROR` | 400 | Request body không hợp lệ (class-validator) |
| `INVALID_REASON_ID` | 400 | `reasonId` không tồn tại trong `report_reasons` |
| `INVALID_ACTION` | 400 | `action` trong resolve report không hợp lệ |
| `UNAUTHORIZED` | 401 | Thiếu hoặc token không hợp lệ |
| `FORBIDDEN` | 403 | Không đủ quyền thực hiện thao tác |
| `STORE_NOT_OWNED` | 403 | Store Owner cố thao tác trên gian hàng không phải của mình |
| `REVIEW_NOT_FOUND` | 404 | Review không tồn tại |
| `REPORT_NOT_FOUND` | 404 | Report không tồn tại |
| `STORE_NOT_FOUND` | 404 | Gian hàng không tồn tại |
| `REVIEW_ALREADY_EXISTS` | 409 | Customer đã đánh giá gian hàng này rồi |
| `REPORT_ALREADY_EXISTS` | 409 | Store Owner đã báo cáo bình luận này rồi |
| `REVIEW_ALREADY_HIDDEN` | 409 | Bình luận đã ẩn rồi |
| `REVIEW_NOT_HIDDEN` | 409 | Bình luận không đang bị ẩn |
| `REPORT_ALREADY_PROCESSED` | 409 | Báo cáo đã được xử lý (resolved hoặc dismissed) |

# API Contracts: Xác thực & Quản lý tài khoản

**Spec**: 001-auth-account-management | **Date**: 2026-04-05
**Base URL**: `/api`
**Content-Type**: `application/json` (tất cả request và response)

---

## Quy ước chung

### Authentication

- **Store Owner endpoints**: yêu cầu header `Authorization: Bearer <access_token>`
- **Admin endpoints**: yêu cầu header `Authorization: Bearer <admin_access_token>`
- Refresh token được gửi/nhận qua **HttpOnly cookie** (`refresh_token`), không xuất
  hiện trong request/response body.

### Response format chuẩn

```json
// Thành công
{
  "data": { ... },
  "meta": { ... }  // tùy endpoint, dùng cho pagination
}

// Lỗi
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Mô tả lỗi bằng tiếng Việt",
  "code": "ERROR_CODE_CONSTANT"
}
```

### Error codes

| Code | HTTP Status | Mô tả |
| ---- | ----------- | ----- |
| `EMAIL_ALREADY_EXISTS` | 409 | Email đã được đăng ký |
| `ACCOUNT_PENDING` | 403 | Tài khoản đang chờ phê duyệt |
| `ACCOUNT_INACTIVE` | 403 | Tài khoản bị vô hiệu hóa |
| `ACCOUNT_REJECTED` | 403 | Tài khoản bị từ chối |
| `INVALID_CREDENTIALS` | 401 | Email hoặc mật khẩu không đúng |
| `ACCOUNT_LOCKED` | 429 | Tài khoản bị khóa tạm thời do đăng nhập sai quá nhiều lần |
| `INVALID_TOKEN` | 401 | Token không hợp lệ hoặc đã hết hạn |
| `REFRESH_TOKEN_MISSING` | 401 | Không tìm thấy refresh token cookie |
| `STORE_OWNER_NOT_FOUND` | 404 | Không tìm thấy Store Owner |
| `INVALID_STATUS_TRANSITION` | 422 | Chuyển đổi trạng thái không hợp lệ |
| `REJECTION_REASON_REQUIRED` | 422 | Lý do từ chối là bắt buộc |
| `NOTIFICATION_NOT_FOUND` | 404 | Không tìm thấy thông báo |
| `VALIDATION_ERROR` | 400 | Dữ liệu request không hợp lệ |

---

## Auth — Store Owner

### POST /api/auth/store-owner/register

Đăng ký tài khoản Store Owner mới. Tạo `StoreOwnerAccount` ở trạng thái `pending` và
`Store` ở trạng thái `inactive` trong cùng một transaction.

**Auth required**: Không

**Request body**:

```json
{
  "fullName": "Nguyễn Văn An",
  "email": "an.nguyen@example.com",
  "phone": "0901234567",
  "password": "Abcdef123!",
  "storeName": "Quán Ăn Nhà Bà Nội",
  "registrationReason": "Tôi muốn mở rộng kênh bán hàng online cho quán ăn gia đình đã hoạt động 5 năm."
}
```

**Validation rules**:

| Field | Quy tắc |
| ----- | ------- |
| `fullName` | Bắt buộc, chuỗi, 2–255 ký tự |
| `email` | Bắt buộc, định dạng email hợp lệ, tối đa 255 ký tự |
| `phone` | Bắt buộc, 9–15 ký tự, chỉ chứa số, dấu `+`, dấu `-` |
| `password` | Bắt buộc, tối thiểu 8 ký tự, có ít nhất 1 chữ hoa, 1 số, 1 ký tự đặc biệt |
| `storeName` | Bắt buộc, chuỗi, 2–255 ký tự |
| `registrationReason` | Bắt buộc, chuỗi, tối thiểu 20 ký tự, tối đa 1000 ký tự |

**Response 201 Created**:

```json
{
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "fullName": "Nguyễn Văn An",
    "email": "an.nguyen@example.com",
    "status": "pending",
    "store": {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "name": "Quán Ăn Nhà Bà Nội",
      "status": "inactive"
    },
    "createdAt": "2026-04-05T10:00:00.000Z"
  },
  "message": "Đăng ký thành công. Tài khoản của bạn đang chờ Admin phê duyệt."
}
```

**Errors**:

| Status | Code | Điều kiện |
| ------ | ---- | --------- |
| 400 | `VALIDATION_ERROR` | Thiếu field bắt buộc hoặc không đúng định dạng |
| 409 | `EMAIL_ALREADY_EXISTS` | Email đã tồn tại trong hệ thống |

---

### POST /api/auth/store-owner/login

Đăng nhập cho Store Owner. Chỉ tài khoản ở trạng thái `active` mới đăng nhập được.

**Auth required**: Không

**Request body**:

```json
{
  "email": "an.nguyen@example.com",
  "password": "Abcdef123!"
}
```

**Response 200 OK**:

```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 28800,
    "storeOwner": {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "fullName": "Nguyễn Văn An",
      "email": "an.nguyen@example.com",
      "status": "active",
      "store": {
        "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        "name": "Quán Ăn Nhà Bà Nội",
        "status": "inactive"
      }
    }
  }
}
```

Set-Cookie header (server tự động set):

```
Set-Cookie: refresh_token=<token>; HttpOnly; Secure; SameSite=Strict; Max-Age=86400; Path=/api/auth/store-owner/refresh
```

**Errors**:

| Status | Code | Mô tả |
| ------ | ---- | ----- |
| 401 | `INVALID_CREDENTIALS` | Email hoặc mật khẩu sai |
| 403 | `ACCOUNT_PENDING` | Tài khoản đang chờ phê duyệt |
| 403 | `ACCOUNT_INACTIVE` | Tài khoản bị vô hiệu hóa |
| 403 | `ACCOUNT_REJECTED` | Tài khoản bị từ chối |
| 429 | `ACCOUNT_LOCKED` | Bị khóa tạm thời; response kèm field `lockedUntil: "2026-04-05T10:05:00.000Z"` |

---

### POST /api/auth/store-owner/logout

Đăng xuất, invalidate refresh token hiện tại.

**Auth required**: Store Owner JWT

**Request**: Không có body. Server đọc refresh token từ cookie.

**Response 200 OK**:

```json
{
  "message": "Đăng xuất thành công."
}
```

Set-Cookie header (server tự động xóa cookie):

```
Set-Cookie: refresh_token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/api/auth/store-owner/refresh
```

**Errors**:

| Status | Code | Mô tả |
| ------ | ---- | ----- |
| 401 | `INVALID_TOKEN` | Access token không hợp lệ hoặc hết hạn |

---

### POST /api/auth/store-owner/refresh

Cấp access token mới bằng refresh token. Sử dụng token rotation: refresh token cũ bị
invalidate, refresh token mới được set trong cookie.

**Auth required**: Không (dùng HttpOnly cookie `refresh_token`)

**Request**: Không có body.

**Response 200 OK**:

```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 28800
  }
}
```

Set-Cookie header: refresh token mới được set, token cũ bị invalidate.

**Errors**:

| Status | Code | Mô tả |
| ------ | ---- | ----- |
| 401 | `REFRESH_TOKEN_MISSING` | Cookie `refresh_token` không có |
| 401 | `INVALID_TOKEN` | Refresh token không hợp lệ, hết hạn, hoặc đã bị invalidate |

---

## Auth — Admin

### POST /api/auth/admin/login

Đăng nhập cho Admin. Giao diện đăng nhập riêng, không liên quan đến giao diện Store
Owner.

**Auth required**: Không

**Request body**:

```json
{
  "email": "admin@phoamthuc.vn",
  "password": "AdminPass123!"
}
```

**Response 200 OK**:

```json
{
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 28800,
    "admin": {
      "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
      "fullName": "Admin Hệ Thống",
      "email": "admin@phoamthuc.vn"
    }
  }
}
```

**Errors**:

| Status | Code | Mô tả |
| ------ | ---- | ----- |
| 401 | `INVALID_CREDENTIALS` | Email hoặc mật khẩu sai |
| 400 | `VALIDATION_ERROR` | Thiếu field hoặc sai định dạng |

---

## Admin — Quản lý Store Owner

### GET /api/admin/store-owners

Lấy danh sách tất cả Store Owner với khả năng lọc và tìm kiếm.

**Auth required**: Admin JWT

**Query parameters**:

| Param | Kiểu | Mô tả |
| ----- | ---- | ----- |
| `status` | `pending` \| `active` \| `inactive` \| `rejected` | Lọc theo trạng thái |
| `search` | string | Tìm kiếm theo tên hoặc email (ILIKE `%search%`) |
| `page` | integer (default: 1) | Trang hiện tại |
| `limit` | integer (default: 20, max: 100) | Số bản ghi mỗi trang |
| `sortBy` | `createdAt` \| `fullName` \| `email` (default: `createdAt`) | Sắp xếp theo |
| `sortOrder` | `asc` \| `desc` (default: `desc`) | Thứ tự sắp xếp |

**Response 200 OK**:

```json
{
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "fullName": "Nguyễn Văn An",
      "email": "an.nguyen@example.com",
      "phone": "0901234567",
      "status": "pending",
      "registrationReason": "Tôi muốn mở rộng kênh bán hàng...",
      "store": {
        "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        "name": "Quán Ăn Nhà Bà Nội",
        "status": "inactive"
      },
      "createdAt": "2026-04-05T10:00:00.000Z",
      "updatedAt": "2026-04-05T10:00:00.000Z"
    }
  ],
  "meta": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

**Errors**:

| Status | Code | Mô tả |
| ------ | ---- | ----- |
| 401 | `INVALID_TOKEN` | Token Admin không hợp lệ hoặc hết hạn |

---

### GET /api/admin/store-owners/:id

Lấy thông tin chi tiết một Store Owner.

**Auth required**: Admin JWT

**Path parameters**: `id` — UUID của Store Owner

**Response 200 OK**:

```json
{
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "fullName": "Nguyễn Văn An",
    "email": "an.nguyen@example.com",
    "phone": "0901234567",
    "status": "pending",
    "registrationReason": "Tôi muốn mở rộng kênh bán hàng online cho quán ăn gia đình đã hoạt động 5 năm.",
    "store": {
      "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "name": "Quán Ăn Nhà Bà Nội",
      "status": "inactive"
    },
    "createdAt": "2026-04-05T10:00:00.000Z",
    "updatedAt": "2026-04-05T10:00:00.000Z"
  }
}
```

**Errors**:

| Status | Code | Mô tả |
| ------ | ---- | ----- |
| 401 | `INVALID_TOKEN` | Token Admin không hợp lệ hoặc hết hạn |
| 404 | `STORE_OWNER_NOT_FOUND` | Không tìm thấy Store Owner với ID này |

---

### PATCH /api/admin/store-owners/:id/approve

Admin phê duyệt tài khoản Store Owner đang ở trạng thái `pending`. Chuyển trạng thái
sang `active`, gửi thông báo email + in-app cho Store Owner.

**Auth required**: Admin JWT

**Path parameters**: `id` — UUID của Store Owner

**Request**: Không có body.

**Response 200 OK**:

```json
{
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "fullName": "Nguyễn Văn An",
    "email": "an.nguyen@example.com",
    "status": "active",
    "updatedAt": "2026-04-05T10:30:00.000Z"
  },
  "message": "Tài khoản đã được phê duyệt. Store Owner sẽ nhận được thông báo."
}
```

**Errors**:

| Status | Code | Mô tả |
| ------ | ---- | ----- |
| 401 | `INVALID_TOKEN` | Token Admin không hợp lệ hoặc hết hạn |
| 404 | `STORE_OWNER_NOT_FOUND` | Không tìm thấy Store Owner |
| 422 | `INVALID_STATUS_TRANSITION` | Tài khoản không ở trạng thái `pending` (chỉ `pending` → `active` hợp lệ) |

---

### PATCH /api/admin/store-owners/:id/reject

Admin từ chối tài khoản Store Owner đang ở trạng thái `pending`. Lý do từ chối là bắt
buộc. Chuyển trạng thái sang `rejected`, gửi thông báo email + in-app kèm lý do.

**Auth required**: Admin JWT

**Path parameters**: `id` — UUID của Store Owner

**Request body**:

```json
{
  "reason": "Thông tin đăng ký không đầy đủ và lý do mở gian hàng không rõ ràng. Vui lòng liên hệ hỗ trợ để được hướng dẫn."
}
```

**Validation**: `reason` bắt buộc, tối thiểu 10 ký tự.

**Response 200 OK**:

```json
{
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "fullName": "Nguyễn Văn An",
    "email": "an.nguyen@example.com",
    "status": "rejected",
    "updatedAt": "2026-04-05T10:30:00.000Z"
  },
  "message": "Tài khoản đã bị từ chối. Store Owner sẽ nhận được thông báo kèm lý do."
}
```

**Errors**:

| Status | Code | Mô tả |
| ------ | ---- | ----- |
| 401 | `INVALID_TOKEN` | Token Admin không hợp lệ hoặc hết hạn |
| 404 | `STORE_OWNER_NOT_FOUND` | Không tìm thấy Store Owner |
| 422 | `REJECTION_REASON_REQUIRED` | Thiếu field `reason` hoặc quá ngắn |
| 422 | `INVALID_STATUS_TRANSITION` | Tài khoản không ở trạng thái `pending` |

---

### PATCH /api/admin/store-owners/:id/deactivate

Admin vô hiệu hóa tài khoản Store Owner đang ở trạng thái `active`. Chuyển sang
`inactive`, gửi thông báo email + in-app. Nếu Store Owner có nội dung gian hàng đang
chờ duyệt, response trả về `hasPendingContent: true` để frontend hiển thị cảnh báo
xác nhận trước khi gọi endpoint này.

**Auth required**: Admin JWT

**Path parameters**: `id` — UUID của Store Owner

**Request**: Không có body. Nếu frontend muốn bỏ qua cảnh báo (đã xác nhận), gửi
query param `?confirmed=true`.

**Response 200 OK**:

```json
{
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "fullName": "Nguyễn Văn An",
    "email": "an.nguyen@example.com",
    "status": "inactive",
    "updatedAt": "2026-04-05T10:30:00.000Z"
  },
  "message": "Tài khoản đã bị vô hiệu hóa."
}
```

**Response 200 OK (khi có nội dung pending và chưa xác nhận)**:

```json
{
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "status": "active",
    "hasPendingContent": true
  },
  "message": "Gian hàng này có nội dung đang chờ duyệt. Vui lòng xác nhận vô hiệu hóa bằng cách gọi lại endpoint với ?confirmed=true."
}
```

**Errors**:

| Status | Code | Mô tả |
| ------ | ---- | ----- |
| 401 | `INVALID_TOKEN` | Token Admin không hợp lệ hoặc hết hạn |
| 404 | `STORE_OWNER_NOT_FOUND` | Không tìm thấy Store Owner |
| 422 | `INVALID_STATUS_TRANSITION` | Tài khoản không ở trạng thái `active` |

---

### PATCH /api/admin/store-owners/:id/reactivate

Admin kích hoạt lại tài khoản Store Owner đang ở trạng thái `inactive`. Chuyển sang
`active`, gửi thông báo email + in-app.

**Auth required**: Admin JWT

**Path parameters**: `id` — UUID của Store Owner

**Request**: Không có body.

**Response 200 OK**:

```json
{
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "fullName": "Nguyễn Văn An",
    "email": "an.nguyen@example.com",
    "status": "active",
    "updatedAt": "2026-04-05T10:30:00.000Z"
  },
  "message": "Tài khoản đã được kích hoạt lại. Store Owner sẽ nhận được thông báo."
}
```

**Errors**:

| Status | Code | Mô tả |
| ------ | ---- | ----- |
| 401 | `INVALID_TOKEN` | Token Admin không hợp lệ hoặc hết hạn |
| 404 | `STORE_OWNER_NOT_FOUND` | Không tìm thấy Store Owner |
| 422 | `INVALID_STATUS_TRANSITION` | Tài khoản không ở trạng thái `inactive` |

---

## Notifications

### GET /api/notifications

Lấy danh sách thông báo in-app của người dùng đang đăng nhập (Store Owner hoặc Admin,
tùy token).

**Auth required**: Store Owner JWT hoặc Admin JWT

**Query parameters**:

| Param | Kiểu | Mô tả |
| ----- | ---- | ----- |
| `isRead` | `true` \| `false` | Lọc theo trạng thái đã đọc (mặc định: trả về tất cả) |
| `page` | integer (default: 1) | Trang hiện tại |
| `limit` | integer (default: 20, max: 50) | Số bản ghi mỗi trang |

**Response 200 OK**:

```json
{
  "data": [
    {
      "id": "d4e5f6a7-b8c9-0123-defa-234567890123",
      "eventType": "ACCOUNT_APPROVED",
      "title": "Tài khoản đã được phê duyệt",
      "body": "Chúc mừng! Tài khoản Store Owner của bạn đã được Admin phê duyệt. Bạn có thể đăng nhập và bắt đầu quản lý gian hàng.",
      "isRead": false,
      "createdAt": "2026-04-05T10:30:00.000Z"
    }
  ],
  "meta": {
    "total": 5,
    "unreadCount": 3,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

**Errors**:

| Status | Code | Mô tả |
| ------ | ---- | ----- |
| 401 | `INVALID_TOKEN` | Token không hợp lệ hoặc hết hạn |

---

### PATCH /api/notifications/:id/read

Đánh dấu một thông báo là đã đọc. Chỉ người nhận của thông báo mới có thể đánh dấu.

**Auth required**: Store Owner JWT hoặc Admin JWT

**Path parameters**: `id` — UUID của Notification

**Request**: Không có body.

**Response 200 OK**:

```json
{
  "data": {
    "id": "d4e5f6a7-b8c9-0123-defa-234567890123",
    "isRead": true,
    "updatedAt": "2026-04-05T10:35:00.000Z"
  }
}
```

**Errors**:

| Status | Code | Mô tả |
| ------ | ---- | ----- |
| 401 | `INVALID_TOKEN` | Token không hợp lệ hoặc hết hạn |
| 404 | `NOTIFICATION_NOT_FOUND` | Không tìm thấy thông báo hoặc không phải của người dùng này |

---

## Tổng hợp endpoints

| Method | Path | Auth | Mô tả |
| ------ | ---- | ---- | ----- |
| POST | `/api/auth/store-owner/register` | Không | Đăng ký Store Owner |
| POST | `/api/auth/store-owner/login` | Không | Đăng nhập Store Owner |
| POST | `/api/auth/store-owner/logout` | Store Owner | Đăng xuất Store Owner |
| POST | `/api/auth/store-owner/refresh` | Cookie | Refresh access token |
| POST | `/api/auth/admin/login` | Không | Đăng nhập Admin |
| GET | `/api/admin/store-owners` | Admin | Danh sách Store Owner |
| GET | `/api/admin/store-owners/:id` | Admin | Chi tiết Store Owner |
| PATCH | `/api/admin/store-owners/:id/approve` | Admin | Phê duyệt tài khoản |
| PATCH | `/api/admin/store-owners/:id/reject` | Admin | Từ chối tài khoản |
| PATCH | `/api/admin/store-owners/:id/deactivate` | Admin | Vô hiệu hóa tài khoản |
| PATCH | `/api/admin/store-owners/:id/reactivate` | Admin | Kích hoạt lại tài khoản |
| GET | `/api/notifications` | Store Owner / Admin | Danh sách thông báo in-app |
| PATCH | `/api/notifications/:id/read` | Store Owner / Admin | Đánh dấu thông báo đã đọc |

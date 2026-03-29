# API Contract: GPS Auto-Play & QR Code

**Spec**: 005-gps-autoplay-qr-code | **Date**: 2026-04-05

**Ghi chú tổng quan**: GPS auto-play logic chạy hoàn toàn client-side. Các endpoint dưới
đây chỉ phục vụ QR code management. GPS feature tái sử dụng endpoint đã có từ spec 002
(`GET /api/stores/:id/commentary`) và spec 003 (`GET /api/map/pins`).

**Authentication**: Các endpoint của Store Owner yêu cầu JWT Bearer token trong header
`Authorization: Bearer <access_token>`. Public endpoint không cần auth.

---

## Endpoint 1: Tạo QR Code mới

### `POST /api/store-owner/stores/:storeId/qr`

Tạo QR code mới cho gian hàng. Invalidate tất cả QR cũ của gian hàng ngay lập tức.
Chỉ hoạt động khi gian hàng đang `active`.

**Authentication**: Store Owner JWT (gian hàng phải thuộc sở hữu của Store Owner đang đăng nhập)

**Path Parameters**

| Tham số | Kiểu | Mô tả |
| ------- | ---- | ----- |
| `storeId` | integer | ID của gian hàng cần tạo QR |

**Request Body**: Không có (empty body)

**Success Response** — `201 Created`

```json
{
  "id": 42,
  "storeId": 7,
  "token": "550e8400-e29b-41d4-a716-446655440000",
  "isActive": true,
  "createdAt": "2026-04-05T10:30:00.000Z",
  "qrImageUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
  "scanUrl": "https://phoamthuc.vn/qr/550e8400-e29b-41d4-a716-446655440000"
}
```

| Trường | Kiểu | Mô tả |
| ------ | ---- | ----- |
| `id` | integer | ID bản ghi QR code trong database |
| `storeId` | integer | ID gian hàng |
| `token` | string (UUID) | Token dùng trong URL QR |
| `isActive` | boolean | Luôn `true` cho QR mới tạo |
| `createdAt` | string (ISO 8601) | Thời điểm tạo |
| `qrImageUrl` | string | Base64 PNG data URL để hiển thị ngay trên UI |
| `scanUrl` | string | URL đầy đủ được nhúng vào QR code |

**Error Responses**

| HTTP Status | Code | Mô tả |
| ----------- | ---- | ----- |
| `400 Bad Request` | `INVALID_STORE_ID` | `storeId` không phải số nguyên hợp lệ |
| `401 Unauthorized` | `UNAUTHORIZED` | Token JWT thiếu hoặc hết hạn |
| `403 Forbidden` | `STORE_NOT_OWNED` | Store Owner không sở hữu gian hàng này |
| `403 Forbidden` | `STORE_INACTIVE` | Gian hàng đang `inactive`; không thể tạo QR (FR-011) |
| `404 Not Found` | `STORE_NOT_FOUND` | Gian hàng không tồn tại |

```json
{
  "statusCode": 403,
  "error": "Forbidden",
  "message": "Gian hàng cần được Admin kích hoạt trước khi tạo QR code.",
  "code": "STORE_INACTIVE"
}
```

---

## Endpoint 2: Tải xuống QR Code dạng PNG

### `GET /api/store-owner/stores/:storeId/qr/png`

Tải xuống file PNG của QR code đang active cho gian hàng.

**Authentication**: Store Owner JWT

**Path Parameters**

| Tham số | Kiểu | Mô tả |
| ------- | ---- | ----- |
| `storeId` | integer | ID của gian hàng |

**Request Parameters**: Không có

**Success Response** — `200 OK`

```
Content-Type: image/png
Content-Disposition: attachment; filename="qr-store-7.png"
Content-Length: <byte_count>

<binary PNG data>
```

Server stream binary PNG trực tiếp về client. Frontend tạo download link từ Blob URL.

**Error Responses**

| HTTP Status | Code | Mô tả |
| ----------- | ---- | ----- |
| `401 Unauthorized` | `UNAUTHORIZED` | Token JWT thiếu hoặc hết hạn |
| `403 Forbidden` | `STORE_NOT_OWNED` | Store Owner không sở hữu gian hàng này |
| `404 Not Found` | `QR_NOT_FOUND` | Gian hàng chưa có QR code active nào |
| `404 Not Found` | `STORE_NOT_FOUND` | Gian hàng không tồn tại |

---

## Endpoint 3: Tải xuống QR Code dạng PDF

### `GET /api/store-owner/stores/:storeId/qr/pdf`

Tải xuống file PDF một trang chứa QR code, tên gian hàng, và hướng dẫn quét.

**Authentication**: Store Owner JWT

**Path Parameters**

| Tham số | Kiểu | Mô tả |
| ------- | ---- | ----- |
| `storeId` | integer | ID của gian hàng |

**Request Parameters**: Không có

**Success Response** — `200 OK`

```
Content-Type: application/pdf
Content-Disposition: attachment; filename="qr-store-7.pdf"
Content-Length: <byte_count>

<binary PDF data>
```

PDF layout (A4, portrait):
- Tên gian hàng (16pt, centered, top)
- QR code image (300×300px, centered)
- Dòng hướng dẫn "Quét mã QR để xem chi tiết gian hàng" (10pt, centered, bottom)

**Error Responses**

| HTTP Status | Code | Mô tả |
| ----------- | ---- | ----- |
| `401 Unauthorized` | `UNAUTHORIZED` | Token JWT thiếu hoặc hết hạn |
| `403 Forbidden` | `STORE_NOT_OWNED` | Store Owner không sở hữu gian hàng này |
| `404 Not Found` | `QR_NOT_FOUND` | Gian hàng chưa có QR code active nào |
| `404 Not Found` | `STORE_NOT_FOUND` | Gian hàng không tồn tại |

---

## Endpoint 4: Public QR Redirect (Customer quét QR)

### `GET /api/qr/:token`

Public endpoint — không cần authentication. Kiểm tra token, xác định trạng thái gian hàng
tại thời điểm quét, rồi redirect phù hợp.

**Authentication**: Không cần

**Path Parameters**

| Tham số | Kiểu | Mô tả |
| ------- | ---- | ----- |
| `token` | string (UUID) | Token được nhúng trong QR code |

**Request Parameters**: Không có

**Success Response — Gian hàng active** — `302 Found`

```
Location: /stores/7
```

Redirect đến trang chi tiết gian hàng (Next.js route). Frontend xử lý redirect này.

**Success Response — Gian hàng inactive** — `302 Found`

```
Location: /store-unavailable
```

Redirect đến trang thông báo gian hàng không khả dụng. Không lộ thông tin gian hàng.

**Error Responses**

| HTTP Status | Code | Mô tả |
| ----------- | ---- | ----- |
| `302 Found` | — | Token không tồn tại trong DB → redirect `/store-unavailable` |
| `302 Found` | — | Token tồn tại nhưng `is_active = false` (QR đã bị invalidate) → redirect `/store-unavailable` |

**Ghi chú**: Endpoint này luôn trả về `302 redirect`, không bao giờ trả về JSON error.
Mọi trường hợp lỗi (token không tồn tại, QR inactive, gian hàng inactive) đều redirect
đến `/store-unavailable` để tránh lộ thông tin nội bộ.

**Logic xử lý chi tiết**:

```
1. Tìm QR code theo token trong bảng qr_codes
   → Không tìm thấy → redirect /store-unavailable
   → is_active = false → redirect /store-unavailable

2. Tìm gian hàng theo qr_code.store_id
   → store.status = 'active' → redirect /stores/:storeId
   → store.status = 'inactive' → redirect /store-unavailable
```

---

## Endpoint 5: Server-Side Proximity Check (Optional)

### `GET /api/stores/:storeId/proximity-check?lat=&lng=`

**Trạng thái**: OPTIONAL — không bắt buộc cho MVP. GPS proximity detection hoàn toàn
client-side. Endpoint này chỉ tạo nếu cần server-side logging, analytics, hoặc debug.

**Authentication**: Không cần (public endpoint)

**Path Parameters**

| Tham số | Kiểu | Mô tả |
| ------- | ---- | ----- |
| `storeId` | integer | ID của gian hàng cần kiểm tra |

**Query Parameters**

| Tham số | Kiểu | Bắt buộc | Mô tả |
| ------- | ---- | -------- | ----- |
| `lat` | number | Có | Latitude của Customer (decimal degrees, -90 đến 90) |
| `lng` | number | Có | Longitude của Customer (decimal degrees, -180 đến 180) |

**Success Response** — `200 OK`

```json
{
  "storeId": 7,
  "distanceMeters": 2.7,
  "withinRadius": true,
  "radiusMeters": 4,
  "pinStatus": "approved",
  "storeStatus": "active"
}
```

| Trường | Kiểu | Mô tả |
| ------ | ---- | ----- |
| `storeId` | integer | ID gian hàng |
| `distanceMeters` | number | Khoảng cách từ Customer đến ghim (tính bằng mét) |
| `withinRadius` | boolean | `true` nếu `distanceMeters <= 4` |
| `radiusMeters` | number | Ngưỡng hiện tại (luôn là 4 trong MVP) |
| `pinStatus` | string | Trạng thái ghim: `approved`, `pending`, `rejected` |
| `storeStatus` | string | Trạng thái gian hàng: `active`, `inactive` |

**Error Responses**

| HTTP Status | Code | Mô tả |
| ----------- | ---- | ----- |
| `400 Bad Request` | `INVALID_COORDINATES` | `lat` hoặc `lng` không hợp lệ hoặc thiếu |
| `404 Not Found` | `STORE_NOT_FOUND` | Gian hàng không tồn tại |
| `404 Not Found` | `PIN_NOT_FOUND` | Gian hàng chưa có ghim nào |

---

## Tóm tắt Endpoints

| Method | Path | Auth | Mô tả |
| ------ | ---- | ---- | ----- |
| `POST` | `/api/store-owner/stores/:storeId/qr` | Store Owner JWT | Tạo QR code mới (FR-008, FR-011) |
| `GET` | `/api/store-owner/stores/:storeId/qr/png` | Store Owner JWT | Tải xuống PNG (FR-009) |
| `GET` | `/api/store-owner/stores/:storeId/qr/pdf` | Store Owner JWT | Tải xuống PDF (FR-009) |
| `GET` | `/api/qr/:token` | Không cần | Public QR redirect (FR-010) |
| `GET` | `/api/stores/:storeId/proximity-check` | Không cần | [Optional] Server proximity check |

## API đã có từ Spec Khác (GPS Auto-Play tái sử dụng)

| Spec | Method | Path | Mục đích trong GPS Auto-Play |
| ---- | ------ | ---- | ---------------------------- |
| 003 | `GET` | `/api/map/pins` | Fetch danh sách ghim approved + tọa độ lat/lng để tính Haversine distance |
| 002 | `GET` | `/api/stores/:id/commentary` | Fetch audio URL thuyết minh khi Customer vào vùng 4m |

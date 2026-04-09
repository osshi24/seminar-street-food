# API Contract: Bản đồ & Vị trí gian hàng

**Feature**: `003-map-location` | **Date**: 2026-04-05

---

## Quy ước chung

- **Base URL**: `https://api.pho-am-thuc.example.com`
- **Content-Type**: `application/json` cho tất cả request/response
- **Authentication**: JWT Bearer token trong header `Authorization: Bearer <token>`
- **Timestamp format**: ISO 8601 UTC, ví dụ `2026-04-05T10:30:00.000Z`
- **Coordinate precision**: latitude/longitude trả về dạng `number` với tối đa 8 chữ số thập phân

### HTTP Status Codes

| Code | Ý nghĩa |
| ---- | ------- |
| 200 | Thành công (GET, PATCH, DELETE trả về data) |
| 201 | Tạo mới thành công (POST) |
| 400 | Request không hợp lệ (validation error) |
| 401 | Chưa xác thực |
| 403 | Không có quyền |
| 404 | Không tìm thấy resource |
| 409 | Conflict (ví dụ: đã có pending đang chờ duyệt) |

### Error Response Format

```json
{
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "message": "Mô tả lỗi cụ thể",
  "code": "LOCATION_OUT_OF_BOUNDARY"
}
```

**Error codes đặc thù cho feature này**:

| Code | HTTP | Mô tả |
| ---- | ---- | ----- |
| `LOCATION_OUT_OF_BOUNDARY` | 400 | Tọa độ nằm ngoài ranh giới phố ẩm thực |
| `INVALID_COORDINATES` | 400 | Lat/lng không hợp lệ (ngoài phạm vi -90/+90, -180/+180) |
| `PENDING_EXISTS` | 409 | Store Owner đã có ghim pending đang chờ duyệt |
| `NO_PENDING_FOUND` | 404 | Không tìm thấy ghim pending để thu hồi |
| `PIN_NOT_FOUND` | 404 | Không tìm thấy ghim với ID đã cho |
| `REJECTION_REASON_REQUIRED` | 400 | Từ chối ghim phải kèm lý do |
| `NO_ACTIVE_BOUNDARY` | 500 | Chưa có boundary active (Admin chưa cấu hình) |

---

## Store Owner Endpoints

*Yêu cầu: JWT của Store Owner (role `store_owner`). Store Owner chỉ thao tác được với gian
hàng của chính mình (storeId lấy từ JWT payload).*

---

### `GET /api/store-owner/location`

Lấy thông tin vị trí hiện tại của gian hàng: ghim `approved` đang hiển thị và ghim `pending`
đang chờ duyệt (nếu có).

**Request**

```
GET /api/store-owner/location
Authorization: Bearer <store_owner_token>
```

**Response 200 — Có cả ghim approved và pending**

```json
{
  "approved": {
    "id": "a1b2c3d4-0001-0000-0000-000000000001",
    "latitude": 10.76262200,
    "longitude": 106.66017200,
    "status": "approved",
    "reviewedAt": "2026-03-20T08:15:00.000Z",
    "reviewedBy": {
      "id": "admin-uuid-0001",
      "name": "Admin Nguyễn"
    }
  },
  "pending": {
    "id": "a1b2c3d4-0002-0000-0000-000000000002",
    "latitude": 10.76270000,
    "longitude": 106.66025000,
    "status": "pending",
    "submittedAt": "2026-04-04T14:30:00.000Z"
  }
}
```

**Response 200 — Không có ghim nào**

```json
{
  "approved": null,
  "pending": null
}
```

**Response 200 — Chỉ có pending, chưa có approved**

```json
{
  "approved": null,
  "pending": {
    "id": "a1b2c3d4-0003-0000-0000-000000000003",
    "latitude": 10.76270000,
    "longitude": 106.66025000,
    "status": "pending",
    "submittedAt": "2026-04-05T09:00:00.000Z"
  }
}
```

---

### `POST /api/store-owner/location`

Store Owner gửi vị trí mới để Admin xét duyệt. Tạo bản ghi `LocationPin` mới ở trạng thái
`pending`. Ghim `approved` hiện tại (nếu có) vẫn hiển thị công khai cho đến khi bản mới được
duyệt.

**Điều kiện**:
- Store Owner chưa có ghim `pending` đang chờ duyệt (nếu có → trả về 409)
- Tọa độ hợp lệ (latitude trong [-90, 90], longitude trong [-180, 180])
- Tọa độ nằm trong ranh giới phố ẩm thực (kiểm tra point-in-polygon)

**Request**

```
POST /api/store-owner/location
Authorization: Bearer <store_owner_token>
Content-Type: application/json

{
  "lat": 10.76270000,
  "lng": 106.66025000
}
```

| Field | Kiểu | Bắt buộc | Mô tả |
| ----- | ---- | --------- | ----- |
| `lat` | number | Có | Vĩ độ; phạm vi [-90, 90] |
| `lng` | number | Có | Kinh độ; phạm vi [-180, 180] |

**Response 201 — Tạo pending thành công**

```json
{
  "id": "a1b2c3d4-0004-0000-0000-000000000004",
  "storeId": "store-uuid-0001",
  "latitude": 10.76270000,
  "longitude": 106.66025000,
  "status": "pending",
  "submittedAt": "2026-04-05T10:00:00.000Z"
}
```

**Response 400 — Tọa độ không hợp lệ**

```json
{
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "message": "Tọa độ không hợp lệ. Latitude phải trong khoảng [-90, 90].",
  "code": "INVALID_COORDINATES"
}
```

**Response 400 — Ngoài ranh giới phố ẩm thực**

```json
{
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "message": "Vị trí nằm ngoài phạm vi phố ẩm thực.",
  "code": "LOCATION_OUT_OF_BOUNDARY"
}
```

**Response 409 — Đã có pending đang chờ duyệt**

```json
{
  "statusCode": 409,
  "error": "CONFLICT",
  "message": "Bạn đã có một vị trí đang chờ duyệt. Vui lòng thu hồi trước khi gửi vị trí mới.",
  "code": "PENDING_EXISTS",
  "pendingPinId": "a1b2c3d4-0002-0000-0000-000000000002"
}
```

---

### `DELETE /api/store-owner/location/pending`

Store Owner thu hồi ghim `pending` đang chờ duyệt. Xóa bản ghi khỏi database. Ghim `approved`
(nếu có) không bị ảnh hưởng.

**Request**

```
DELETE /api/store-owner/location/pending
Authorization: Bearer <store_owner_token>
```

**Response 200 — Thu hồi thành công**

```json
{
  "message": "Đã thu hồi ghim vị trí đang chờ duyệt.",
  "deletedPinId": "a1b2c3d4-0002-0000-0000-000000000002"
}
```

**Response 404 — Không có pending nào để thu hồi**

```json
{
  "statusCode": 404,
  "error": "NOT_FOUND",
  "message": "Không tìm thấy ghim vị trí đang chờ duyệt.",
  "code": "NO_PENDING_FOUND"
}
```

---

## Admin Endpoints

*Yêu cầu: JWT của Admin (role `admin`).*

---

### `GET /api/admin/location-pins`

Lấy danh sách tất cả ghim đang chờ duyệt (`pending`). Hỗ trợ filter theo trạng thái và phân
trang.

**Request**

```
GET /api/admin/location-pins?status=pending&page=1&limit=20
Authorization: Bearer <admin_token>
```

**Query Parameters**

| Tham số | Kiểu | Mặc định | Mô tả |
| ------- | ---- | --------- | ----- |
| `status` | string | `pending` | Filter theo trạng thái: `pending`, `approved`, `rejected`, `superseded`, `all` |
| `page` | number | 1 | Trang hiện tại (bắt đầu từ 1) |
| `limit` | number | 20 | Số bản ghi mỗi trang (tối đa 100) |

**Response 200**

```json
{
  "data": [
    {
      "id": "a1b2c3d4-0002-0000-0000-000000000002",
      "storeId": "store-uuid-0001",
      "storeName": "Bún bò Hương Giang",
      "storeAvatar": "https://storage.example.com/stores/bun-bo-huong-giang.jpg",
      "latitude": 10.76270000,
      "longitude": 106.66025000,
      "status": "pending",
      "submittedAt": "2026-04-04T14:30:00.000Z",
      "reviewedAt": null,
      "reviewedBy": null,
      "hasDuplicateWarning": false
    },
    {
      "id": "a1b2c3d4-0005-0000-0000-000000000005",
      "storeId": "store-uuid-0002",
      "storeName": "Phở Tái Nam",
      "storeAvatar": "https://storage.example.com/stores/pho-tai-nam.jpg",
      "latitude": 10.76268000,
      "longitude": 106.66023000,
      "status": "pending",
      "submittedAt": "2026-04-05T09:45:00.000Z",
      "reviewedAt": null,
      "reviewedBy": null,
      "hasDuplicateWarning": true
    }
  ],
  "meta": {
    "total": 2,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

### `GET /api/admin/location-pins/:id`

Lấy chi tiết một ghim vị trí, bao gồm thông tin cảnh báo trùng tọa độ nếu có.

**Request**

```
GET /api/admin/location-pins/a1b2c3d4-0005-0000-0000-000000000005
Authorization: Bearer <admin_token>
```

**Response 200**

```json
{
  "id": "a1b2c3d4-0005-0000-0000-000000000005",
  "storeId": "store-uuid-0002",
  "storeName": "Phở Tái Nam",
  "storeAvatar": "https://storage.example.com/stores/pho-tai-nam.jpg",
  "latitude": 10.76268000,
  "longitude": 106.66023000,
  "status": "pending",
  "submittedAt": "2026-04-05T09:45:00.000Z",
  "reviewedAt": null,
  "reviewedBy": null,
  "currentApproved": {
    "id": "a1b2c3d4-0001-0000-0000-000000000001",
    "latitude": 10.76262200,
    "longitude": 106.66017200,
    "reviewedAt": "2026-03-20T08:15:00.000Z"
  },
  "duplicateWarnings": [
    {
      "pinId": "a1b2c3d4-0002-0000-0000-000000000002",
      "storeId": "store-uuid-0001",
      "storeName": "Bún bò Hương Giang",
      "latitude": 10.76270000,
      "longitude": 106.66025000,
      "distanceMeters": 3.2
    }
  ]
}
```

**Response 404**

```json
{
  "statusCode": 404,
  "error": "NOT_FOUND",
  "message": "Không tìm thấy ghim vị trí.",
  "code": "PIN_NOT_FOUND"
}
```

---

### `PATCH /api/admin/location-pins/:id/approve`

Admin phê duyệt ghim `pending`. Có thể điều chỉnh tọa độ trước khi duyệt (body optional).

**Hành động phụ (atomic transaction)**:
1. Cập nhật bản `pending` → `approved` (với tọa độ điều chỉnh nếu có)
2. Cập nhật bản `approved` cũ (nếu có) → `superseded`
3. Gửi thông báo đến Store Owner

**Request — Duyệt không điều chỉnh**

```
PATCH /api/admin/location-pins/a1b2c3d4-0005-0000-0000-000000000005/approve
Authorization: Bearer <admin_token>
Content-Type: application/json

{}
```

**Request — Duyệt có điều chỉnh tọa độ**

```
PATCH /api/admin/location-pins/a1b2c3d4-0005-0000-0000-000000000005/approve
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "lat": 10.76265000,
  "lng": 106.66020000
}
```

| Field | Kiểu | Bắt buộc | Mô tả |
| ----- | ---- | --------- | ----- |
| `lat` | number | Không | Tọa độ vĩ độ điều chỉnh; nếu bỏ qua, dùng tọa độ Store Owner đã gửi |
| `lng` | number | Không | Tọa độ kinh độ điều chỉnh; nếu bỏ qua, dùng tọa độ Store Owner đã gửi |

**Response 200**

```json
{
  "id": "a1b2c3d4-0005-0000-0000-000000000005",
  "storeId": "store-uuid-0002",
  "latitude": 10.76265000,
  "longitude": 106.66020000,
  "status": "approved",
  "reviewedAt": "2026-04-05T11:00:00.000Z",
  "reviewedBy": {
    "id": "admin-uuid-0001",
    "name": "Admin Nguyễn"
  },
  "supersededPinId": "a1b2c3d4-0001-0000-0000-000000000001"
}
```

*`supersededPinId`: ID ghim cũ vừa được chuyển sang `superseded`; `null` nếu không có ghim
approved cũ.*

**Response 400 — Ghim không ở trạng thái pending**

```json
{
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "message": "Chỉ có thể phê duyệt ghim ở trạng thái pending.",
  "code": "INVALID_STATUS_TRANSITION"
}
```

---

### `PATCH /api/admin/location-pins/:id/reject`

Admin từ chối ghim `pending` kèm lý do bắt buộc. Gửi thông báo đến Store Owner.

**Request**

```
PATCH /api/admin/location-pins/a1b2c3d4-0004-0000-0000-000000000004/reject
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "reason": "Tọa độ không chính xác, gian hàng không nằm trong phố ẩm thực."
}
```

| Field | Kiểu | Bắt buộc | Mô tả |
| ----- | ---- | --------- | ----- |
| `reason` | string | Có | Lý do từ chối; không được để trống; tối đa 500 ký tự |

**Response 200**

```json
{
  "id": "a1b2c3d4-0004-0000-0000-000000000004",
  "storeId": "store-uuid-0001",
  "status": "rejected",
  "rejectionReason": "Tọa độ không chính xác, gian hàng không nằm trong phố ẩm thực.",
  "reviewedAt": "2026-04-05T11:05:00.000Z",
  "reviewedBy": {
    "id": "admin-uuid-0001",
    "name": "Admin Nguyễn"
  }
}
```

**Response 400 — Thiếu lý do**

```json
{
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "message": "Lý do từ chối không được để trống.",
  "code": "REJECTION_REASON_REQUIRED"
}
```

---

### `DELETE /api/admin/location-pins/:id`

Admin xóa ghim bất kỳ (bất kể trạng thái). Gửi thông báo đến Store Owner sau khi xóa.

**Lưu ý**: Nếu xóa ghim `approved`, gian hàng sẽ không còn hiển thị trên bản đồ công khai.

**Request**

```
DELETE /api/admin/location-pins/a1b2c3d4-0001-0000-0000-000000000001
Authorization: Bearer <admin_token>
```

**Response 200**

```json
{
  "message": "Đã xóa ghim vị trí thành công.",
  "deletedPinId": "a1b2c3d4-0001-0000-0000-000000000001",
  "storeId": "store-uuid-0001",
  "notifiedStoreOwner": true
}
```

**Response 404**

```json
{
  "statusCode": 404,
  "error": "NOT_FOUND",
  "message": "Không tìm thấy ghim vị trí.",
  "code": "PIN_NOT_FOUND"
}
```

---

### `GET /api/admin/boundaries`

Lấy thông tin boundary phố ẩm thực hiện tại đang active.

**Request**

```
GET /api/admin/boundaries
Authorization: Bearer <admin_token>
```

**Response 200 — Có boundary**

```json
{
  "id": "boundary-uuid-0001",
  "name": "Ranh giới phố ẩm thực",
  "isActive": true,
  "polygonCoordinates": [
    { "lat": 10.762500, "lng": 106.660100 },
    { "lat": 10.763200, "lng": 106.661500 },
    { "lat": 10.762800, "lng": 106.662300 },
    { "lat": 10.761900, "lng": 106.661200 }
  ],
  "createdAt": "2026-03-01T07:00:00.000Z",
  "updatedAt": "2026-03-15T09:30:00.000Z"
}
```

**Response 200 — Chưa có boundary**

```json
null
```

---

### `PUT /api/admin/boundaries`

Admin cập nhật polygon ranh giới phố ẩm thực. Thay thế toàn bộ boundary hiện tại.

**Hành động phụ**:
1. Deactivate boundary cũ (nếu có): `is_active = false`
2. Tạo boundary mới với `is_active = true`
3. Tính toán và lưu `polygon_geom` từ danh sách tọa độ

**Request**

```
PUT /api/admin/boundaries
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Ranh giới phố ẩm thực mở rộng",
  "coordinates": [
    { "lat": 10.762200, "lng": 106.659800 },
    { "lat": 10.763500, "lng": 106.661800 },
    { "lat": 10.763100, "lng": 106.662800 },
    { "lat": 10.761700, "lng": 106.661700 },
    { "lat": 10.761900, "lng": 106.659900 }
  ]
}
```

| Field | Kiểu | Bắt buộc | Mô tả |
| ----- | ---- | --------- | ----- |
| `name` | string | Không | Tên mô tả boundary; mặc định "Ranh giới phố ẩm thực" |
| `coordinates` | array | Có | Danh sách tọa độ đỉnh polygon; tối thiểu 3 phần tử |
| `coordinates[].lat` | number | Có | Vĩ độ đỉnh |
| `coordinates[].lng` | number | Có | Kinh độ đỉnh |

**Response 200**

```json
{
  "id": "boundary-uuid-0002",
  "name": "Ranh giới phố ẩm thực mở rộng",
  "isActive": true,
  "polygonCoordinates": [
    { "lat": 10.762200, "lng": 106.659800 },
    { "lat": 10.763500, "lng": 106.661800 },
    { "lat": 10.763100, "lng": 106.662800 },
    { "lat": 10.761700, "lng": 106.661700 },
    { "lat": 10.761900, "lng": 106.659900 }
  ],
  "createdAt": "2026-04-05T12:00:00.000Z",
  "updatedAt": "2026-04-05T12:00:00.000Z"
}
```

**Response 400 — Không đủ tọa độ**

```json
{
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "message": "Polygon phải có ít nhất 3 điểm tọa độ.",
  "code": "INVALID_POLYGON"
}
```

---

## Public Map Endpoints (Customer)

*Không yêu cầu authentication. Trả về chỉ dữ liệu public.*

---

### `GET /api/map/pins`

Lấy danh sách tất cả ghim đã được duyệt (`approved`) của các gian hàng đang hoạt động
(`active`). Đây là endpoint chính để render bản đồ cho Customer.

**Không yêu cầu authentication.**

**Request**

```
GET /api/map/pins
```

**Response 200 — Có ghim**

```json
{
  "pins": [
    {
      "pinId": "a1b2c3d4-0001-0000-0000-000000000001",
      "storeId": "store-uuid-0001",
      "storeName": "Bún bò Hương Giang",
      "storeAvatar": "https://storage.example.com/stores/bun-bo-huong-giang.jpg",
      "latitude": 10.76262200,
      "longitude": 106.66017200
    },
    {
      "pinId": "a1b2c3d4-0006-0000-0000-000000000006",
      "storeId": "store-uuid-0003",
      "storeName": "Cơm tấm Sài Gòn",
      "storeAvatar": "https://storage.example.com/stores/com-tam-sai-gon.jpg",
      "latitude": 10.76285000,
      "longitude": 106.66040000
    }
  ],
  "total": 2,
  "boundary": {
    "polygonCoordinates": [
      { "lat": 10.762500, "lng": 106.660100 },
      { "lat": 10.763200, "lng": 106.661500 },
      { "lat": 10.762800, "lng": 106.662300 },
      { "lat": 10.761900, "lng": 106.661200 }
    ]
  }
}
```

*`boundary`: Ranh giới phố ẩm thực để hiển thị polygon trên bản đồ Customer; `null` nếu chưa
có boundary được cấu hình.*

**Response 200 — Không có ghim nào**

```json
{
  "pins": [],
  "total": 0,
  "boundary": null
}
```

---

### `GET /api/map/pins/:storeId`

Lấy thông tin tóm tắt của một gian hàng để hiển thị trong popup khi Customer chọn ghim trên
bản đồ.

**Không yêu cầu authentication.**

**Request**

```
GET /api/map/pins/store-uuid-0001
```

**Response 200**

```json
{
  "storeId": "store-uuid-0001",
  "storeName": "Bún bò Hương Giang",
  "storeAvatar": "https://storage.example.com/stores/bun-bo-huong-giang.jpg",
  "storeDescription": "Quán bún bò Huế truyền thống với hơn 20 năm kinh nghiệm.",
  "latitude": 10.76262200,
  "longitude": 106.66017200,
  "pinId": "a1b2c3d4-0001-0000-0000-000000000001"
}
```

**Response 404 — Gian hàng không có ghim approved hoặc gian hàng không active**

```json
{
  "statusCode": 404,
  "error": "NOT_FOUND",
  "message": "Không tìm thấy thông tin vị trí cho gian hàng này.",
  "code": "PIN_NOT_FOUND"
}
```

---

## Tóm tắt Endpoints

| Method | Path | Role | Mô tả |
| ------ | ---- | ---- | ----- |
| GET | `/api/store-owner/location` | StoreOwner | Xem vị trí hiện tại + pending |
| POST | `/api/store-owner/location` | StoreOwner | Gửi vị trí mới để duyệt |
| DELETE | `/api/store-owner/location/pending` | StoreOwner | Thu hồi ghim pending |
| GET | `/api/admin/location-pins` | Admin | Danh sách ghim (filter theo status) |
| GET | `/api/admin/location-pins/:id` | Admin | Chi tiết ghim + cảnh báo trùng |
| PATCH | `/api/admin/location-pins/:id/approve` | Admin | Phê duyệt (có thể điều chỉnh tọa độ) |
| PATCH | `/api/admin/location-pins/:id/reject` | Admin | Từ chối kèm lý do bắt buộc |
| DELETE | `/api/admin/location-pins/:id` | Admin | Xóa ghim bất kỳ |
| GET | `/api/admin/boundaries` | Admin | Xem boundary hiện tại |
| PUT | `/api/admin/boundaries` | Admin | Cập nhật boundary polygon |
| GET | `/api/map/pins` | Public | Danh sách ghim public cho Customer |
| GET | `/api/map/pins/:storeId` | Public | Thông tin tóm tắt gian hàng khi chọn ghim |

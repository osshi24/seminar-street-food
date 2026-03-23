# API Contracts: Gợi ý món ăn theo sở thích

**Spec**: 006-food-recommendation | **Date**: 2026-04-05

Tài liệu này định nghĩa đầy đủ tất cả REST endpoints cho feature gợi ý món ăn.

---

## Quy ước chung

**Base URL**: `/api`

**Format lỗi chuẩn** (áp dụng cho tất cả endpoints):

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Mô tả lỗi bằng tiếng Việt",
  "code": "ERROR_CODE_CONSTANT"
}
```

**Authentication**: Các public endpoints không yêu cầu header Authorization. Các admin
endpoints yêu cầu `Authorization: Bearer <access_token>` — token thuộc Admin account
(không phải Store Owner).

---

## Public Endpoints (không yêu cầu auth)

---

### GET /api/tags

Lấy toàn bộ danh sách nhãn sở thích, gom nhóm theo `group_type`. Dùng để hiển thị UI
chọn tags cho Customer.

**Auth**: Không yêu cầu

**Request**

```
GET /api/tags
```

Không có query parameters.

**Response thành công — 200 OK**

```json
{
  "groups": [
    {
      "groupType": "dish_type",
      "label": "Loại món ăn",
      "tags": [
        { "id": 1, "nameVi": "Cơm", "nameEn": "Rice" },
        { "id": 2, "nameVi": "Phở", "nameEn": "Pho" },
        { "id": 3, "nameVi": "Bánh mì", "nameEn": "Banh Mi" },
        { "id": 4, "nameVi": "Lẩu", "nameEn": "Hot Pot" }
      ]
    },
    {
      "groupType": "flavor",
      "label": "Khẩu vị",
      "tags": [
        { "id": 10, "nameVi": "Cay", "nameEn": "Spicy" },
        { "id": 11, "nameVi": "Ngọt", "nameEn": "Sweet" },
        { "id": 12, "nameVi": "Chay", "nameEn": "Vegetarian" }
      ]
    },
    {
      "groupType": "allergen",
      "label": "Dị ứng thực phẩm",
      "tags": [
        { "id": 20, "nameVi": "Không gluten", "nameEn": "Gluten-free" },
        { "id": 21, "nameVi": "Không hải sản", "nameEn": "No seafood" },
        { "id": 22, "nameVi": "Không đậu phộng", "nameEn": "No peanuts" }
      ]
    }
  ]
}
```

Thứ tự nhóm cố định: `dish_type` → `flavor` → `allergen`. Tags trong mỗi nhóm sắp xếp
theo `id` tăng dần (thứ tự tạo).

**Trường hợp không có tag nào**:

```json
{
  "groups": [
    { "groupType": "dish_type", "label": "Loại món ăn", "tags": [] },
    { "groupType": "flavor", "label": "Khẩu vị", "tags": [] },
    { "groupType": "allergen", "label": "Dị ứng thực phẩm", "tags": [] }
  ]
}
```

**Errors**: Không có lỗi đặc thù ngoài lỗi server chung (500).

---

### GET /api/recommendations

Lấy danh sách gợi ý món ăn dựa trên các tags đã chọn. Sắp xếp theo số tag khớp giảm
dần, phân trang 20 kết quả/trang.

**Auth**: Không yêu cầu

**Request**

```
GET /api/recommendations?tags=1,2,3&page=1
```

**Query Parameters**:

| Tham số | Bắt buộc | Kiểu | Mô tả |
| ------- | -------- | ---- | ----- |
| `tags` | Có | string | Danh sách tag IDs phân cách bởi dấu phẩy. Tối đa 5 giá trị. Mỗi giá trị là số nguyên dương. VD: `1,2,3` |
| `page` | Không | integer | Số trang, bắt đầu từ 1. Mặc định: `1`. |

**Validation rules**:
- `tags`: bắt buộc, tối thiểu 1 tag, tối đa 5 tags.
- `tags`: mỗi tag ID phải là số nguyên dương hợp lệ.
- `page`: phải là số nguyên ≥ 1 nếu được cung cấp.

**Response thành công — 200 OK (có kết quả)**

```json
{
  "items": [
    {
      "menuItemId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "menuItemName": "Phở bò tái chín",
      "price": 75000,
      "storeId": "f1e2d3c4-b5a6-7890-cdef-ab1234567890",
      "storeName": "Quán Phở Hương",
      "matchCount": 3
    },
    {
      "menuItemId": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      "menuItemName": "Bún bò Huế cay đặc biệt",
      "price": 65000,
      "storeId": "e2d3c4b5-a6f7-8901-cdef-123456789012",
      "storeName": "Bún Bò Cô Ba",
      "matchCount": 2
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalCount": 47,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

**Response thành công — 200 OK (không có kết quả)**

```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalCount": 0,
    "totalPages": 0,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

Frontend hiển thị thông báo "Không tìm thấy gợi ý phù hợp" khi `items` là mảng rỗng
(FR-006). Backend luôn trả về 200 — không trả 404 khi không có kết quả.

**Mô tả các trường response**:

| Trường | Kiểu | Mô tả |
| ------ | ---- | ----- |
| `items[].menuItemId` | string (UUID) | ID của món ăn |
| `items[].menuItemName` | string | Tên món ăn (hiển thị trực tiếp) |
| `items[].price` | number | Giá món ăn (đơn vị VND, số nguyên) |
| `items[].storeId` | string (UUID) | ID gian hàng — dùng để điều hướng (FR-007) |
| `items[].storeName` | string | Tên gian hàng |
| `items[].matchCount` | number | Số tag khớp với lựa chọn của Customer |
| `pagination.page` | number | Trang hiện tại |
| `pagination.pageSize` | number | Số kết quả/trang (luôn là 20) |
| `pagination.totalCount` | number | Tổng số món ăn khớp |
| `pagination.totalPages` | number | Tổng số trang |
| `pagination.hasNextPage` | boolean | Có trang tiếp theo không |
| `pagination.hasPreviousPage` | boolean | Có trang trước không |

**Errors**:

| HTTP Status | Code | Điều kiện |
| ----------- | ---- | --------- |
| 400 | `TAGS_REQUIRED` | `tags` parameter bị thiếu hoặc rỗng |
| 400 | `TOO_MANY_TAGS` | Số lượng tag > 5 |
| 400 | `INVALID_TAG_IDS` | Tag ID không phải số nguyên dương |
| 400 | `INVALID_PAGE` | `page` không phải số nguyên ≥ 1 |

Ví dụ lỗi khi chọn quá 5 tags:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Không thể chọn quá 5 nhãn sở thích",
  "code": "TOO_MANY_TAGS"
}
```

Ví dụ lỗi khi không truyền tags:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Phải chọn ít nhất 1 nhãn sở thích",
  "code": "TAGS_REQUIRED"
}
```

---

## Admin Endpoints (yêu cầu Admin JWT)

Tất cả endpoints dưới đây yêu cầu header:

```
Authorization: Bearer <admin_access_token>
```

Nếu thiếu hoặc token không hợp lệ → `401 Unauthorized`.
Nếu token hợp lệ nhưng không phải Admin role → `403 Forbidden`.

---

### GET /api/admin/tags

Lấy toàn bộ danh sách tags cho giao diện Admin quản lý. Bao gồm thông tin `usageCount`
để Admin biết tag đang được dùng bởi bao nhiêu món.

**Auth**: Admin JWT

**Request**

```
GET /api/admin/tags
```

Không có query parameters.

**Response thành công — 200 OK**

```json
{
  "tags": [
    {
      "id": 1,
      "nameVi": "Cơm",
      "nameEn": "Rice",
      "groupType": "dish_type",
      "usageCount": 12,
      "createdAt": "2026-04-05T10:00:00.000Z",
      "updatedAt": "2026-04-05T10:00:00.000Z"
    },
    {
      "id": 10,
      "nameVi": "Cay",
      "nameEn": "Spicy",
      "groupType": "flavor",
      "usageCount": 0,
      "createdAt": "2026-04-05T10:05:00.000Z",
      "updatedAt": "2026-04-05T10:05:00.000Z"
    }
  ]
}
```

Tags trả về dạng flat list (không gom nhóm), sắp xếp theo `group_type` rồi `id` tăng dần.
`usageCount` là số bản ghi trong `menu_item_tags` tham chiếu đến tag đó.

**Errors**: `401 Unauthorized`, `403 Forbidden`.

---

### POST /api/admin/tags

Tạo PreferenceTag mới.

**Auth**: Admin JWT

**Request**

```
POST /api/admin/tags
Content-Type: application/json

{
  "nameVi": "Ít dầu mỡ",
  "nameEn": "Low fat",
  "groupType": "flavor"
}
```

**Request body fields**:

| Trường | Bắt buộc | Kiểu | Validation |
| ------ | -------- | ---- | ---------- |
| `nameVi` | Có | string | Không rỗng, tối đa 100 ký tự |
| `nameEn` | Có | string | Không rỗng, tối đa 100 ký tự |
| `groupType` | Có | string | Phải là một trong: `dish_type`, `flavor`, `allergen` |

**Response thành công — 201 Created**

```json
{
  "id": 23,
  "nameVi": "Ít dầu mỡ",
  "nameEn": "Low fat",
  "groupType": "flavor",
  "usageCount": 0,
  "createdAt": "2026-04-05T14:30:00.000Z",
  "updatedAt": "2026-04-05T14:30:00.000Z"
}
```

**Errors**:

| HTTP Status | Code | Điều kiện |
| ----------- | ---- | --------- |
| 400 | `VALIDATION_ERROR` | Thiếu field bắt buộc, vượt 100 ký tự, hoặc `groupType` không hợp lệ |
| 401 | — | Không có hoặc token không hợp lệ |
| 403 | — | Token hợp lệ nhưng không phải Admin |

Ví dụ lỗi validation:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "groupType phải là một trong: dish_type, flavor, allergen",
  "code": "VALIDATION_ERROR"
}
```

---

### PUT /api/admin/tags/:id

Cập nhật thông tin một PreferenceTag. Thay đổi có hiệu lực ngay — tên mới xuất hiện
ngay trong kết quả gợi ý và danh sách tags công khai.

**Auth**: Admin JWT

**Request**

```
PUT /api/admin/tags/10
Content-Type: application/json

{
  "nameVi": "Rất cay",
  "nameEn": "Very spicy",
  "groupType": "flavor"
}
```

**Path Parameters**:

| Tham số | Kiểu | Mô tả |
| ------- | ---- | ----- |
| `id` | integer | ID của PreferenceTag cần cập nhật |

**Request body fields**: Tất cả các trường đều bắt buộc (không hỗ trợ partial update ở MVP).

| Trường | Bắt buộc | Kiểu | Validation |
| ------ | -------- | ---- | ---------- |
| `nameVi` | Có | string | Không rỗng, tối đa 100 ký tự |
| `nameEn` | Có | string | Không rỗng, tối đa 100 ký tự |
| `groupType` | Có | string | Phải là một trong: `dish_type`, `flavor`, `allergen` |

**Response thành công — 200 OK**

```json
{
  "id": 10,
  "nameVi": "Rất cay",
  "nameEn": "Very spicy",
  "groupType": "flavor",
  "usageCount": 8,
  "createdAt": "2026-04-05T10:05:00.000Z",
  "updatedAt": "2026-04-05T15:00:00.000Z"
}
```

**Errors**:

| HTTP Status | Code | Điều kiện |
| ----------- | ---- | --------- |
| 400 | `VALIDATION_ERROR` | Thiếu field, vượt 100 ký tự, hoặc `groupType` không hợp lệ |
| 401 | — | Không có hoặc token không hợp lệ |
| 403 | — | Token hợp lệ nhưng không phải Admin |
| 404 | `TAG_NOT_FOUND` | Không tìm thấy tag với ID đã cho |

Ví dụ lỗi 404:

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "Không tìm thấy nhãn sở thích với ID 999",
  "code": "TAG_NOT_FOUND"
}
```

---

### DELETE /api/admin/tags/:id

Xóa một PreferenceTag. Bị chặn nếu tag đang được sử dụng bởi ít nhất một món ăn.

**Auth**: Admin JWT

**Request**

```
DELETE /api/admin/tags/10
```

**Path Parameters**:

| Tham số | Kiểu | Mô tả |
| ------- | ---- | ----- |
| `id` | integer | ID của PreferenceTag cần xóa |

**Response thành công — 204 No Content**

```
HTTP/1.1 204 No Content
```

Không có response body.

**Response thất bại — 409 Conflict (tag đang được dùng)**

```json
{
  "statusCode": 409,
  "error": "Conflict",
  "message": "Không thể xóa nhãn này vì đang được dùng bởi 8 món ăn. Hãy gỡ nhãn khỏi tất cả món ăn trước khi xóa.",
  "code": "TAG_IN_USE",
  "count": 8
}
```

Trường `count` là số món ăn đang dùng nhãn này — Frontend hiển thị số này cho Admin
biết cần gỡ bao nhiêu món trước khi có thể xóa (FR-010).

**Errors**:

| HTTP Status | Code | Điều kiện |
| ----------- | ---- | --------- |
| 401 | — | Không có hoặc token không hợp lệ |
| 403 | — | Token hợp lệ nhưng không phải Admin |
| 404 | `TAG_NOT_FOUND` | Không tìm thấy tag với ID đã cho |
| 409 | `TAG_IN_USE` | Tag đang được dùng bởi ≥ 1 món ăn; response body chứa `count` |

---

## Tổng hợp endpoints

| Method | Path | Auth | Mô tả |
| ------ | ---- | ---- | ----- |
| GET | `/api/tags` | Public | Danh sách tất cả tags, gom nhóm theo type |
| GET | `/api/recommendations` | Public | Gợi ý món ăn theo tags, phân trang 20/trang |
| GET | `/api/admin/tags` | Admin JWT | Danh sách tags kèm usage count cho Admin quản lý |
| POST | `/api/admin/tags` | Admin JWT | Tạo tag mới |
| PUT | `/api/admin/tags/:id` | Admin JWT | Sửa tag (name_vi, name_en, group_type) |
| DELETE | `/api/admin/tags/:id` | Admin JWT | Xóa tag; 409 nếu còn món đang dùng |

---

## Mapping FR → Endpoint

| Functional Requirement | Endpoint(s) |
| ---------------------- | ----------- |
| FR-001: Customer dùng không cần đăng nhập | `GET /api/tags`, `GET /api/recommendations` — không có auth |
| FR-002: Hiển thị danh sách nhãn (3 nhóm) | `GET /api/tags` — response gom nhóm sẵn |
| FR-003: Gợi ý theo tag, sort theo match_count | `GET /api/recommendations` |
| FR-004: Chỉ gian hàng active | `GET /api/recommendations` — filter `s.status = 'active'` trong query |
| FR-005: Hiển thị tên món, tên gian hàng, giá | `GET /api/recommendations` — fields trong `items[]` |
| FR-006: Thông báo khi không tìm thấy | `GET /api/recommendations` — trả `items: []`, frontend xử lý |
| FR-007: Điều hướng đến chi tiết gian hàng | `GET /api/recommendations` — `storeId` trong response dùng để build link |
| FR-008: Không trùng lặp | `GET /api/recommendations` — GROUP BY trong SQL |
| FR-009: Admin quản lý tag | `GET/POST/PUT/DELETE /api/admin/tags/*` |
| FR-010: Chặn xóa tag đang dùng | `DELETE /api/admin/tags/:id` — 409 Conflict + `count` |
| FR-002 (hard limit 5 tags) | `GET /api/recommendations` — validate `tags.length ≤ 5`, 400 nếu vi phạm |
| FR-003 (phân trang 20/trang) | `GET /api/recommendations` — `page` parameter + `pagination` object trong response |

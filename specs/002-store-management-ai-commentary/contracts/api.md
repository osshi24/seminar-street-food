# API Contract: Quản lý gian hàng & Thuyết minh AI

**Feature**: `002-store-management-ai-commentary`
**Date**: 2026-04-05
**Base URL**: `/api`
**Authentication**: JWT Bearer token (trừ các endpoint public)
**Content-Type**: `application/json` (trừ upload endpoints)

---

## Quy ước chung

### HTTP Status Codes

| Code | Ý nghĩa |
| ---- | ------- |
| 200 | Thành công, trả về data |
| 201 | Tạo mới thành công |
| 204 | Thành công, không có data trả về |
| 400 | Request body không hợp lệ (validation error) |
| 401 | Chưa đăng nhập hoặc token hết hạn |
| 403 | Không có quyền thực hiện hành động này |
| 404 | Resource không tồn tại |
| 409 | Conflict — ví dụ: đang có bản pending, không thể tạo mới |
| 422 | Lỗi business logic (ví dụ: vượt giới hạn 10 ảnh) |
| 500 | Lỗi server |

### Error Response Format

```json
{
  "statusCode": 409,
  "error": "Conflict",
  "message": "Gian hàng đang có bản chờ duyệt. Vui lòng thu hồi trước khi chỉnh sửa."
}
```

---

## Store Owner Endpoints

> Yêu cầu JWT token với role `store_owner`. Store Owner chỉ thao tác được trên gian hàng của chính mình.

---

### GET /api/store-owner/store

Xem thông tin hiện hành của gian hàng đang quản lý.

**Request**: Không có body. JWT xác định owner.

**Response 200**:

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Bún Bò Huế Cô Ba",
  "description": "Quán bún bò Huế gia truyền với hơn 30 năm kinh nghiệm. Nước dùng được ninh từ xương bò và mắm ruốc Huế chính gốc, tạo nên hương vị đặc trưng không thể nhầm lẫn.",
  "status": "active",
  "menuItems": [
    {
      "id": "m1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Bún Bò đặc biệt",
      "description": "Tô lớn với giò heo, chả cua, bắp bò",
      "price": 65000
    },
    {
      "id": "m2b3c4d5-e6f7-8901-bcde-f12345678901",
      "name": "Bún Bò thường",
      "description": "Tô vừa với thịt bò",
      "price": 45000
    }
  ],
  "images": [
    {
      "id": "i1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "url": "https://media.phoamthuc.vn/images/a1b2c3d4/i1b2c3d4.jpg",
      "orderIndex": 0
    }
  ],
  "hasPendingDraft": false,
  "activeCommentaryStatus": "completed",
  "createdAt": "2026-01-15T08:00:00Z",
  "updatedAt": "2026-03-20T14:30:00Z"
}
```

**Response 404**: Gian hàng chưa được tạo cho Store Owner này.

---

### PUT /api/store-owner/store

Cập nhật thông tin gian hàng — lưu vào draft, chưa public ngay.

**Điều kiện tiên quyết**: Không được có bản `pending` đang tồn tại (trả về 409 nếu có).

**Request Body**:

```json
{
  "name": "Bún Bò Huế Cô Ba - Cơ sở 1",
  "description": "Quán bún bò Huế gia truyền với hơn 30 năm kinh nghiệm..."
}
```

**Validation**:

- `name`: bắt buộc, 1–255 ký tự.
- `description`: tùy chọn, tối đa 1000 ký tự.

**Response 200** — Draft được tạo/cập nhật thành công:

```json
{
  "draftId": "d1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "pending",
  "name": "Bún Bò Huế Cô Ba - Cơ sở 1",
  "description": "Quán bún bò Huế gia truyền với hơn 30 năm kinh nghiệm...",
  "submittedAt": "2026-04-05T09:15:00Z"
}
```

**Response 409**:

```json
{
  "statusCode": 409,
  "error": "Conflict",
  "message": "Gian hàng đang có bản chờ duyệt. Vui lòng thu hồi trước khi chỉnh sửa."
}
```

**Response 400** (ví dụ mô tả quá 1000 ký tự):

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["description must be shorter than or equal to 1000 characters"]
}
```

---

### POST /api/store-owner/store/submit

Gửi draft hiện tại để Admin duyệt. Draft chuyển sang trạng thái `pending` chính thức và thông báo được gửi đến Admin.

**Request**: Không có body.

**Response 200**:

```json
{
  "draftId": "d1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "pending",
  "submittedAt": "2026-04-05T09:20:00Z",
  "message": "Bản thay đổi đã được gửi. Admin sẽ xem xét trong thời gian sớm nhất."
}
```

**Response 404**: Không có draft nào để gửi.

**Response 409**: Draft đã ở trạng thái `pending` (đã gửi trước đó).

---

### DELETE /api/store-owner/store/draft

Thu hồi bản draft đang `pending`. Thông tin gian hàng quay về bản hiện hành. Sau khi thu hồi, Store Owner có thể chỉnh sửa lại.

**Request**: Không có body.

**Response 204**: Thu hồi thành công, không có body.

**Response 404**: Không có bản `pending` nào để thu hồi.

**Response 409**: Bản draft đã được Admin xử lý (approved/rejected) — không thể thu hồi.

---

### GET /api/store-owner/store/draft

Xem bản draft hiện tại (nếu đang có).

**Response 200**:

```json
{
  "draftId": "d1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "pending",
  "name": "Bún Bò Huế Cô Ba - Cơ sở 1",
  "description": "Quán bún bò Huế gia truyền với hơn 30 năm...",
  "rejectionReason": null,
  "submittedAt": "2026-04-05T09:20:00Z",
  "reviewedAt": null
}
```

**Response 200** (draft bị từ chối):

```json
{
  "draftId": "d2c3d4e5-f6a7-8901-bcde-f12345678902",
  "status": "rejected",
  "name": "Bún Bò Huế Cô Ba - Cơ sở 1",
  "description": "...",
  "rejectionReason": "Mô tả chứa thông tin liên hệ (số điện thoại). Vui lòng xóa và gửi lại.",
  "submittedAt": "2026-04-04T10:00:00Z",
  "reviewedAt": "2026-04-04T14:30:00Z"
}
```

**Response 404**: Không có draft nào (gian hàng chưa có thay đổi nào pending/rejected).

---

### GET /api/store-owner/store/menu-items

Danh sách món ăn hiện hành của gian hàng.

**Response 200**:

```json
{
  "items": [
    {
      "id": "m1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Bún Bò đặc biệt",
      "description": "Tô lớn với giò heo, chả cua, bắp bò",
      "price": 65000,
      "isInDraft": false,
      "createdAt": "2026-01-15T08:00:00Z",
      "updatedAt": "2026-01-15T08:00:00Z"
    }
  ],
  "total": 1
}
```

---

### POST /api/store-owner/store/menu-items

Thêm món ăn mới vào gian hàng (lưu ở trạng thái draft — chỉ public sau khi Admin phê duyệt).

**Request Body**:

```json
{
  "name": "Bún Bò chay",
  "description": "Phiên bản chay với nấm và đậu hũ",
  "price": 40000
}
```

**Validation**:

- `name`: bắt buộc, 1–255 ký tự.
- `description`: tùy chọn, tối đa 500 ký tự.
- `price`: bắt buộc, số nguyên dương, đơn vị VND.

**Response 201**:

```json
{
  "id": "m3c4d5e6-f7a8-9012-cdef-123456789012",
  "name": "Bún Bò chay",
  "description": "Phiên bản chay với nấm và đậu hũ",
  "price": 40000,
  "isInDraft": true,
  "createdAt": "2026-04-05T09:30:00Z"
}
```

---

### PUT /api/store-owner/store/menu-items/:id

Sửa thông tin một món ăn.

**Path Parameters**: `id` — UUID của menu item.

**Request Body** (tất cả fields đều optional — chỉ gửi fields cần sửa):

```json
{
  "name": "Bún Bò đặc biệt cao cấp",
  "price": 70000
}
```

**Response 200**:

```json
{
  "id": "m1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Bún Bò đặc biệt cao cấp",
  "description": "Tô lớn với giò heo, chả cua, bắp bò",
  "price": 70000,
  "isInDraft": true,
  "updatedAt": "2026-04-05T09:35:00Z"
}
```

**Response 403**: Menu item không thuộc gian hàng của Store Owner này.

**Response 404**: Menu item không tồn tại.

---

### DELETE /api/store-owner/store/menu-items/:id

Xóa một món ăn. Nếu đang có draft, món bị đánh dấu xóa trong draft (chưa xóa thật sự cho đến khi Admin duyệt).

**Path Parameters**: `id` — UUID của menu item.

**Response 204**: Thành công, không có body.

**Response 403**: Menu item không thuộc gian hàng của Store Owner này.

**Response 404**: Menu item không tồn tại.

---

### POST /api/store-owner/store/images

Yêu cầu presigned URL để upload ảnh trực tiếp lên MinIO/S3.

**Request Body**:

```json
{
  "filename": "tiem-bun-bo.jpg",
  "contentType": "image/jpeg",
  "fileSize": 2457600
}
```

**Validation**:

- `contentType`: một trong `image/jpeg`, `image/png`, `image/webp`.
- `fileSize`: tối đa 10485760 (10MB).
- Tổng số ảnh hiện tại của gian hàng phải < 10.

**Response 201**:

```json
{
  "imageId": "i2c3d4e5-f6a7-8901-bcde-f12345678902",
  "uploadUrl": "https://minio.phoamthuc.vn/phoamthuc-media/images/a1b2c3d4/i2c3d4e5.jpg?X-Amz-Signature=abc123&X-Amz-Expires=300",
  "expiresAt": "2026-04-05T09:25:00Z"
}
```

**Sau khi frontend upload xong**, frontend gọi `PATCH /api/store-owner/store/images/:id/confirm`
để backend ghi record chính thức vào DB (endpoint này không liệt kê riêng — có thể merge vào flow trên tùy implementation).

**Response 422** (quá 10 ảnh):

```json
{
  "statusCode": 422,
  "error": "Unprocessable Entity",
  "message": "Gian hàng đã đạt giới hạn tối đa 10 ảnh. Vui lòng xóa ảnh cũ trước khi thêm mới."
}
```

---

### DELETE /api/store-owner/store/images/:id

Xóa ảnh khỏi gian hàng (xóa record DB và file trên S3).

**Path Parameters**: `id` — UUID của store image.

**Response 204**: Thành công, không có body.

**Response 403**: Ảnh không thuộc gian hàng của Store Owner này.

**Response 404**: Ảnh không tồn tại.

---

## Admin Endpoints

> Yêu cầu JWT token với role `admin`.

---

### GET /api/admin/store-drafts

Danh sách các gian hàng đang có bản `pending` chờ duyệt.

**Query Parameters**:

| Tham số | Kiểu | Mặc định | Mô tả |
| ------- | ---- | -------- | ----- |
| `page` | integer | 1 | Số trang (1-based) |
| `limit` | integer | 20 | Số bản ghi mỗi trang, tối đa 100 |

**Response 200**:

```json
{
  "items": [
    {
      "draftId": "d1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "storeId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "storeName": "Bún Bò Huế Cô Ba",
      "ownerName": "Nguyễn Thị Ba",
      "ownerEmail": "coba@example.com",
      "submittedAt": "2026-04-05T09:20:00Z",
      "status": "pending"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 20
}
```

---

### GET /api/admin/store-drafts/:id

Xem chi tiết bản draft để so sánh thông tin cũ và mới trước khi duyệt.

**Path Parameters**: `id` — UUID của `store_content_draft`.

**Response 200**:

```json
{
  "draftId": "d1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "pending",
  "submittedAt": "2026-04-05T09:20:00Z",
  "owner": {
    "id": "u1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "name": "Nguyễn Thị Ba",
    "email": "coba@example.com"
  },
  "current": {
    "name": "Bún Bò Huế Cô Ba",
    "description": "Quán bún bò Huế gia truyền với hơn 30 năm kinh nghiệm.",
    "menuItems": [
      { "id": "m1b2c3d4-e5f6-7890-abcd-ef1234567890", "name": "Bún Bò đặc biệt", "price": 65000 }
    ],
    "images": [
      { "id": "i1b2c3d4-e5f6-7890-abcd-ef1234567890", "url": "https://media.phoamthuc.vn/images/a1b2c3d4/i1b2c3d4.jpg", "orderIndex": 0 }
    ]
  },
  "proposed": {
    "name": "Bún Bò Huế Cô Ba - Cơ sở 1",
    "description": "Quán bún bò Huế gia truyền với hơn 30 năm kinh nghiệm. Nước dùng được ninh từ xương bò và mắm ruốc Huế chính gốc.",
    "menuItems": [
      { "id": "m1b2c3d4-e5f6-7890-abcd-ef1234567890", "name": "Bún Bò đặc biệt", "price": 70000, "action": "modified" },
      { "id": "m3c4d5e6-f7a8-9012-cdef-123456789012", "name": "Bún Bò chay", "price": 40000, "action": "added" }
    ],
    "images": [
      { "id": "i1b2c3d4-e5f6-7890-abcd-ef1234567890", "url": "https://media.phoamthuc.vn/images/a1b2c3d4/i1b2c3d4.jpg", "orderIndex": 0 },
      { "id": "i2c3d4e5-f6a7-8901-bcde-f12345678902", "url": "https://media.phoamthuc.vn/images/a1b2c3d4/i2c3d4e5.jpg", "orderIndex": 1, "action": "added" }
    ]
  }
}
```

**Ghi chú**: Field `action` trong `proposed` cho biết thay đổi: `"added"` | `"modified"` | `"removed"`. Nếu không có `action` → không thay đổi.

**Response 404**: Draft không tồn tại.

---

### PATCH /api/admin/store-drafts/:id/approve

Phê duyệt bản draft. Thông tin mới lên live, AI pipeline kích hoạt, Store Owner nhận thông báo.

**Path Parameters**: `id` — UUID của `store_content_draft`.

**Request**: Không có body.

**Side effects**:

1. Cập nhật `store_content_drafts.status = 'approved'`, `reviewed_at`, `reviewed_by`.
2. Cập nhật `stores.name`, `stores.description` với thông tin từ draft.
3. Commit `menu_items` và `store_images` draft changes.
4. Tạo record `commentaries` mới với `source_text = stores.description`.
5. Cập nhật `stores.active_commentary_id` trỏ đến commentary mới.
6. Enqueue BullMQ job `commentary-pipeline`.
7. Gửi thông báo in-app + email cho Store Owner.

**Response 200**:

```json
{
  "draftId": "d1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "approved",
  "reviewedAt": "2026-04-05T10:00:00Z",
  "commentaryId": "c1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "pipelineStatus": "pending",
  "message": "Đã phê duyệt. Thông tin mới đã lên live và AI pipeline đã được kích hoạt."
}
```

**Response 404**: Draft không tồn tại.

**Response 409**: Draft không ở trạng thái `pending` (đã được xử lý trước đó).

---

### PATCH /api/admin/store-drafts/:id/reject

Từ chối bản draft kèm lý do bắt buộc. Store Owner nhận thông báo và được phép gửi lại.

**Path Parameters**: `id` — UUID của `store_content_draft`.

**Request Body**:

```json
{
  "reason": "Mô tả chứa thông tin liên hệ cá nhân (số điện thoại). Vui lòng xóa thông tin này và gửi lại."
}
```

**Validation**: `reason` bắt buộc, 10–2000 ký tự.

**Response 200**:

```json
{
  "draftId": "d1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "rejected",
  "rejectionReason": "Mô tả chứa thông tin liên hệ cá nhân (số điện thoại). Vui lòng xóa thông tin này và gửi lại.",
  "reviewedAt": "2026-04-05T10:05:00Z",
  "message": "Đã từ chối. Store Owner đã được thông báo."
}
```

**Response 400** (thiếu lý do):

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["reason must be longer than or equal to 10 characters"]
}
```

**Response 404**: Draft không tồn tại.

**Response 409**: Draft không ở trạng thái `pending`.

---

## Public Endpoints (Customer)

> Không yêu cầu authentication.

---

### GET /api/stores

Danh sách gian hàng đang `active`. Hỗ trợ tìm kiếm theo tên gian hàng hoặc tên món ăn.

**Query Parameters**:

| Tham số | Kiểu | Mặc định | Mô tả |
| ------- | ---- | -------- | ----- |
| `q` | string | (trống) | Từ khóa tìm kiếm (tên gian hàng hoặc tên món ăn) |
| `page` | integer | 1 | Số trang (1-based) |
| `limit` | integer | 20 | Số bản ghi mỗi trang, tối đa 50 |

**Response 200**:

```json
{
  "items": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Bún Bò Huế Cô Ba",
      "description": "Quán bún bò Huế gia truyền với hơn 30 năm kinh nghiệm.",
      "thumbnailUrl": "https://media.phoamthuc.vn/images/a1b2c3d4/i1b2c3d4.jpg",
      "menuItemCount": 5,
      "hasCommentary": true
    }
  ],
  "total": 12,
  "page": 1,
  "limit": 20
}
```

---

### GET /api/stores/:id

Trang chi tiết gian hàng.

**Path Parameters**: `id` — UUID của gian hàng.

**Response 200**:

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "name": "Bún Bò Huế Cô Ba",
  "description": "Quán bún bò Huế gia truyền với hơn 30 năm kinh nghiệm. Nước dùng được ninh từ xương bò và mắm ruốc Huế chính gốc.",
  "status": "active",
  "menuItems": [
    {
      "id": "m1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Bún Bò đặc biệt",
      "description": "Tô lớn với giò heo, chả cua, bắp bò",
      "price": 65000
    }
  ],
  "images": [
    {
      "id": "i1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "url": "https://media.phoamthuc.vn/images/a1b2c3d4/i1b2c3d4.jpg",
      "orderIndex": 0
    }
  ],
  "activeCommentaryId": "c1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "pipelineStatus": "completed"
}
```

**Response 200** (gian hàng inactive):

```json
{
  "id": "a2b3c4d5-e6f7-8901-bcde-f12345678901",
  "name": "Bánh Mì Thịt Nướng",
  "status": "inactive",
  "message": "Gian hàng hiện không hoạt động."
}
```

**Response 404**: Gian hàng không tồn tại.

---

### GET /api/stores/:id/commentary

Lấy nội dung thuyết minh theo ngôn ngữ. Đây là endpoint mà frontend gọi để hiển thị text và audio.

**Path Parameters**: `id` — UUID của gian hàng.

**Query Parameters**:

| Tham số | Kiểu | Mặc định | Mô tả |
| ------- | ---- | -------- | ----- |
| `lang` | string | `vi` | BCP-47 language code: `vi`, `en`, `fr`, `zh`, `ja`, `ko`, `th` |

**Response 200** — Pipeline đã hoàn thành, ngôn ngữ được hỗ trợ:

```json
{
  "commentaryId": "c1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "pipelineStatus": "completed",
  "language": "en",
  "translatedText": "A traditional Hue beef noodle soup restaurant with over 30 years of experience. The broth is slow-simmered from beef bones and authentic Hue shrimp paste, creating a distinctive and unmistakable flavor.",
  "audioUrl": "https://media.phoamthuc.vn/audio/a1b2c3d4/c1b2c3d4/en.mp3",
  "fallback": false
}
```

**Response 200** — Pipeline đang chạy (Customer thấy tiếng Việt + banner):

```json
{
  "commentaryId": "c1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "pipelineStatus": "running",
  "language": "vi",
  "translatedText": "Quán bún bò Huế gia truyền với hơn 30 năm kinh nghiệm. Nước dùng được ninh từ xương bò và mắm ruốc Huế chính gốc.",
  "audioUrl": null,
  "fallback": true,
  "fallbackReason": "pipeline_running",
  "message": "Thuyết minh đang được tổng hợp. Nội dung sẽ tự động cập nhật khi hoàn thành."
}
```

**Response 200** — Pipeline failed hoặc ngôn ngữ không có audio (TTS lỗi riêng):

```json
{
  "commentaryId": "c1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "pipelineStatus": "completed",
  "language": "fr",
  "translatedText": "Un restaurant de soupe de nouilles de bœuf de Hué traditionnel avec plus de 30 ans d'expérience.",
  "audioUrl": null,
  "fallback": false,
  "message": "Audio tạm thời không khả dụng cho ngôn ngữ này."
}
```

**Response 200** — Pipeline failed hoàn toàn, fallback tiếng Việt:

```json
{
  "commentaryId": "c1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "pipelineStatus": "failed",
  "language": "vi",
  "translatedText": "Quán bún bò Huế gia truyền với hơn 30 năm kinh nghiệm.",
  "audioUrl": null,
  "fallback": true,
  "fallbackReason": "pipeline_failed",
  "message": "Ngôn ngữ này tạm thời không khả dụng. Đang hiển thị nội dung tiếng Việt."
}
```

**Response 200** — Gian hàng chưa có thuyết minh:

```json
{
  "commentaryId": null,
  "pipelineStatus": null,
  "language": "vi",
  "translatedText": null,
  "audioUrl": null,
  "fallback": false,
  "message": "Chưa có nội dung thuyết minh."
}
```

**Response 404**: Gian hàng không tồn tại hoặc không `active`.

---

## WebSocket Events (Socket.io)

Frontend subscribe vào room `store:{storeId}` khi render trang chi tiết gian hàng.

### Event: `commentary:updated`

Server emit khi `pipeline_status` của Commentary thay đổi.

```json
{
  "event": "commentary:updated",
  "data": {
    "storeId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "commentaryId": "c1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "pipelineStatus": "completed"
  }
}
```

**Frontend behavior**: Khi nhận event với `pipelineStatus = 'completed'` → invalidate TanStack
Query cache cho `GET /api/stores/:id/commentary?lang=*` → UI tự cập nhật, audio player xuất hiện.

# Chương 4 — Nội dung cần bổ sung (Phần 2: 4.4 API + 4.5-4.8 Pipelines)

> **Tasks:** E3 (API), E4 (Commentary Pipeline), E5 (Store Translation), E6 (Email/Notification), E7 (Recommendation)
> **Người phụ trách:** E3, E4, E5, E6, E7 → Người 2

---

## E3. Nội dung mục 4.4 — API Endpoints

> **Vị trí:** Thay thế dòng 881 (`**4.4 API**` trống)

## **4.4 Thiết kế API** {#4.4-thiết-kế-api}

Hệ thống cung cấp **90 REST API endpoints**, tổ chức theo module nghiệp vụ. Prefix chung: `/api`. Dưới đây là danh sách đầy đủ:

### **4.4.1. API xác thực (Auth)** — 9 endpoints

| Method | Endpoint | Mô tả | Auth |
| :--- | :--- | :--- | :--- |
| GET | `/api/auth/google` | Redirect đến Google OAuth | — |
| GET | `/api/auth/google/callback` | Callback Google OAuth, phát JWT | — |
| GET | `/api/auth/me` | Lấy thông tin Customer đang đăng nhập | Customer |
| POST | `/api/auth/logout` | Đăng xuất Customer | Customer |
| POST | `/api/auth/store-owner/register` | Đăng ký Store Owner | — |
| POST | `/api/auth/store-owner/login` | Đăng nhập Store Owner | — |
| POST | `/api/auth/store-owner/refresh` | Refresh access token | — |
| POST | `/api/auth/store-owner/logout` | Đăng xuất Store Owner | Store Owner |
| POST | `/api/auth/admin/login` | Đăng nhập Admin | — |

### **4.4.2. API gian hàng — Store Owner** — 15 endpoints

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| GET | `/api/store-owner/store` | Lấy thông tin gian hàng của mình |
| PATCH | `/api/store-owner/store/info` | Cập nhật thông tin cơ bản |
| PUT | `/api/store-owner/store` | Lưu bản nháp |
| POST | `/api/store-owner/store/submit` | Submit bản nháp để duyệt |
| DELETE | `/api/store-owner/store/draft` | Thu hồi bản nháp |
| GET | `/api/store-owner/store/draft` | Lấy bản nháp hiện tại |
| GET | `/api/store-owner/store/menu-items` | Danh sách món ăn |
| POST | `/api/store-owner/store/menu-items` | Thêm món ăn |
| PUT | `/api/store-owner/store/menu-items/:id` | Cập nhật món ăn |
| DELETE | `/api/store-owner/store/menu-items/:id` | Xóa món ăn |
| POST | `/api/store-owner/store/menu-items/:id/image` | Tạo presigned URL upload ảnh món |
| DELETE | `/api/store-owner/store/menu-items/:id/image` | Xóa ảnh món |
| POST | `/api/store-owner/store/images` | Tạo presigned URL upload ảnh gian hàng |
| PATCH | `/api/store-owner/store/images/:id/confirm` | Xác nhận upload ảnh |
| DELETE | `/api/store-owner/store/images/:id` | Xóa ảnh gian hàng |

### **4.4.3. API công khai (Public)** — 12 endpoints

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| GET | `/api/stores` | Danh sách gian hàng (hỗ trợ search, pagination, lang) |
| GET | `/api/stores/:id` | Chi tiết gian hàng |
| GET | `/api/stores/:id/commentary` | Lấy thuyết minh (theo ngôn ngữ) |
| GET | `/api/stores/:storeId/reviews` | Danh sách đánh giá |
| POST | `/api/stores/:storeId/reviews` | Gửi đánh giá (Customer) |
| GET | `/api/map/pins` | Tất cả pin trên bản đồ |
| GET | `/api/map/pins/:storeId` | Chi tiết pin của gian hàng |
| GET | `/api/qr/:token/resolve` | Giải mã QR token (JSON) |
| GET | `/api/qr/:token` | Giải mã QR token (redirect) |
| GET | `/api/tags` | Danh sách tag theo nhóm |
| GET | `/api/recommendations` | Gợi ý món ăn theo tag |
| GET | `/api/report-reasons` | Danh sách lý do báo cáo |

### **4.4.4. API Store Owner — Vị trí và QR** — 7 endpoints

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| GET | `/api/store-owner/location` | Lấy vị trí gian hàng |
| POST | `/api/store-owner/location` | Submit/cập nhật vị trí |
| DELETE | `/api/store-owner/location/pending` | Thu hồi vị trí đang chờ duyệt |
| GET | `/api/store-owner/stores/:storeId/qr` | Lấy QR code active |
| POST | `/api/store-owner/stores/:storeId/qr` | Tạo/tái tạo QR code |
| GET | `/api/store-owner/stores/:storeId/qr/png` | Tải QR dạng PNG |
| GET | `/api/store-owner/stores/:storeId/qr/pdf` | Tải QR dạng PDF |

### **4.4.5. API báo cáo và thông báo** — 5 endpoints

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| POST | `/api/stores/:storeId/reviews/:reviewId/report` | Báo cáo bình luận (Store Owner) |
| GET | `/api/notifications/store-owner` | Thông báo Store Owner |
| GET | `/api/notifications/admin` | Thông báo Admin |
| PATCH | `/api/notifications/store-owner/:id/read` | Đánh dấu đã đọc (SO) |
| PATCH | `/api/notifications/admin/:id/read` | Đánh dấu đã đọc (Admin) |

### **4.4.6. API Admin** — 41 endpoints

**Quản lý Store Owner (6):**

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| GET | `/api/admin/store-owners` | Danh sách tài khoản (filter, pagination) |
| GET | `/api/admin/store-owners/:id` | Chi tiết tài khoản |
| PATCH | `/api/admin/store-owners/:id/approve` | Duyệt tài khoản |
| PATCH | `/api/admin/store-owners/:id/reject` | Từ chối tài khoản |
| PATCH | `/api/admin/store-owners/:id/deactivate` | Vô hiệu hóa |
| PATCH | `/api/admin/store-owners/:id/reactivate` | Kích hoạt lại |

**Quản lý gian hàng (6):**

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| GET | `/api/admin/stores` | Danh sách gian hàng |
| GET | `/api/admin/stores/:id` | Chi tiết gian hàng |
| PATCH | `/api/admin/stores/:id/activate` | Kích hoạt |
| PATCH | `/api/admin/stores/:id/deactivate` | Vô hiệu hóa |
| GET | `/api/admin/stores/:id/delete-impact` | Xem trước ảnh hưởng xóa |
| DELETE | `/api/admin/stores/:id` | Xóa gian hàng |

**Duyệt bản nháp (6):**

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| GET | `/api/admin/store-drafts` | Danh sách bản nháp chờ duyệt |
| GET | `/api/admin/store-drafts/:id` | Chi tiết bản nháp |
| PATCH | `/api/admin/store-drafts/:id/approve` | Phê duyệt |
| PATCH | `/api/admin/store-drafts/:id/reject` | Từ chối (kèm lý do) |
| POST | `/api/admin/store-drafts/reprocess-commentaries` | Chạy lại tất cả commentary pipeline |
| POST | `/api/admin/store-drafts/reprocess-translations` | Chạy lại tất cả store translations |

**Quản lý báo cáo (3):**

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| GET | `/api/admin/reports` | Danh sách báo cáo |
| PATCH | `/api/admin/reports/:id/resolve` | Xử lý (ẩn/xóa review) |
| PATCH | `/api/admin/reports/:id/dismiss` | Bỏ qua |

**Kiểm duyệt đánh giá (4):**

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| GET | `/api/admin/reviews` | Danh sách đánh giá |
| PATCH | `/api/admin/reviews/:id/hide` | Ẩn đánh giá |
| PATCH | `/api/admin/reviews/:id/unhide` | Bỏ ẩn |
| DELETE | `/api/admin/reviews/:id` | Xóa vĩnh viễn |

**Thông báo hệ thống (4):**

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| POST | `/api/admin/announcements` | Tạo thông báo mới |
| PATCH | `/api/admin/announcements/:id` | Cập nhật bản nháp |
| POST | `/api/admin/announcements/:id/send` | Gửi/phát thông báo |
| GET | `/api/admin/announcements` | Danh sách thông báo |

**Quản lý vị trí + ranh giới (7):**

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| GET | `/api/admin/location-pins` | Danh sách ghim vị trí |
| GET | `/api/admin/location-pins/:id` | Chi tiết ghim |
| PATCH | `/api/admin/location-pins/:id/approve` | Duyệt ghim |
| PATCH | `/api/admin/location-pins/:id/reject` | Từ chối ghim |
| DELETE | `/api/admin/location-pins/:id` | Xóa ghim |
| GET | `/api/admin/boundaries` | Lấy ranh giới bản đồ |
| PUT | `/api/admin/boundaries` | Cập nhật ranh giới |

**Quản lý tag (4):**

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| GET | `/api/admin/tags` | Danh sách tag |
| POST | `/api/admin/tags` | Tạo tag |
| PUT | `/api/admin/tags/:id` | Cập nhật tag |
| DELETE | `/api/admin/tags/:id` | Xóa tag |

**Dashboard (1):**

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| GET | `/api/admin/overview` | Thống kê tổng quan dashboard |

**Health Check (1):**

| Method | Endpoint | Mô tả |
| :--- | :--- | :--- |
| GET | `/api/health` | Kiểm tra trạng thái hệ thống |

---

## E4. Thêm mục 4.5 — Commentary Pipeline

> **Vị trí:** Sau mục 4.4

## **4.5 Luồng xử lý Commentary Pipeline** {#4.5-commentary-pipeline}

Commentary Pipeline là quy trình bất đồng bộ dịch nội dung thuyết minh từ tiếng Việt sang 6 ngôn ngữ. Sử dụng **BullMQ** job queue và **WebSocket** để thông báo trạng thái.

### **4.5.1. Luồng xử lý**

```
Store Owner nhập thuyết minh (tiếng Việt)
  → Backend tạo Commentary entity (pipelineStatus: PENDING)
  → Job vào BullMQ queue "commentary-pipeline"
  → CommentaryProcessor xử lý:
      1. pipelineStatus → RUNNING
      2. Lưu bản gốc tiếng Việt vào CommentaryTranslation (lang: 'vi')
      3. Với mỗi ngôn ngữ đích [en, fr, zh, ja, ko, th]:
         a. Bỏ qua nếu đã dịch (idempotent re-run)
         b. Gọi TranslationService.translate(text, lang)
            - Primary: Google Gemini AI
            - Fallback: MyMemory API
         c. Lưu CommentaryTranslation
         d. Chờ 1.5s (rate limit protection)
      4. pipelineStatus → COMPLETED (hoặc FAILED nếu 0 thành công)
      5. Emit WebSocket "commentary:updated" tới room "store:{storeId}"
  → Frontend nhận event → invalidate React Query cache → hiển thị
```

### **4.5.2. Cấu hình Job Queue**

| Tham số | Giá trị |
| :--- | :--- |
| Queue name | `commentary-pipeline` |
| Max attempts | 3 |
| Backoff strategy | Exponential, starting 5000ms |
| Delay giữa mỗi ngôn ngữ | 1500ms |

### **4.5.3. WebSocket thông báo**

Sử dụng **Socket.IO** với pattern room-based:
* Frontend emit `joinStore(storeId)` → join room `store:{storeId}`
* Backend emit `commentary:updated` với payload `{ commentaryId, pipelineStatus, successCount }` khi pipeline hoàn tất
* Frontend nhận event → invalidate cache → re-fetch commentary mới

---

## E5. Thêm mục 4.6 — Store Translation Pipeline

> **Vị trí:** Sau mục 4.5

## **4.6 Luồng xử lý Store Translation Pipeline** {#4.6-store-translation-pipeline}

Pipeline riêng biệt dịch **tên và mô tả** gian hàng + tất cả món ăn sang 6 ngôn ngữ.

**Trigger:** Khi Admin approve bản nháp nội dung gian hàng.

**Luồng:**
1. Job vào BullMQ queue `store-translation-pipeline`
2. StoreTranslationProcessor xử lý:
   * Nếu có `menuItemId` → chỉ dịch món ăn đó
   * Nếu không → dịch toàn bộ (store name + description + tất cả menu items)
3. Với mỗi ngôn ngữ [en, fr, zh, ja, ko, th]:
   * Dịch name → `translatedName`
   * Dịch description → `translatedDescription`
   * Upsert vào `store_translations` hoặc `menu_item_translations`
   * Chờ 1.5s giữa mỗi lần gọi

Sử dụng cùng `TranslationService` (Gemini → MyMemory fallback) như Commentary Pipeline.

---

## E6. Thêm mục 4.7 — Hệ thống Email và Notification

> **Vị trí:** Sau mục 4.6

## **4.7 Hệ thống Email và Notification** {#4.7-email-notification}

### **4.7.1. Email (SMTP + BullMQ)**

Gửi email qua **Nodemailer** với BullMQ queue `email`, sử dụng **Handlebars** templates:

| Template | Trigger | Người nhận |
| :--- | :--- | :--- |
| `registration-confirmation` | Store Owner đăng ký | Store Owner |
| `admin-new-registration` | Store Owner đăng ký mới | Admin |
| `account-approved` | Admin duyệt tài khoản | Store Owner |
| `account-rejected` | Admin từ chối tài khoản | Store Owner |
| `account-deactivated` | Admin vô hiệu hóa tài khoản | Store Owner |
| `account-reactivated` | Admin kích hoạt lại tài khoản | Store Owner |
| `new-comment-report` | Store Owner báo cáo bình luận | Admin |
| `admin-announcement` | Admin gửi thông báo | Store Owner(s) |

### **4.7.2. In-app Notification**

Thông báo trong ứng dụng lưu trong bảng `notifications`, hỗ trợ 2 loại người nhận:
* `store_owner`: thông báo về tài khoản, bản nháp, vị trí
* `admin`: thông báo đăng ký mới, báo cáo mới

Frontend dùng `NotificationBell` component polling danh sách thông báo khi mount, hiển thị badge số chưa đọc (tối đa 99+).

### **4.7.3. Admin Announcements**

Admin có thể gửi thông báo hàng loạt qua 3 chế độ:
* `single`: gửi cho 1 Store Owner
* `multi`: gửi cho nhiều Store Owner được chọn
* `all_stores`: gửi cho tất cả Store Owner active

Quy trình: tạo draft → chọn người nhận → gửi → hệ thống tạo notification + email cho từng người.

---

## E7. Thêm mục 4.8 — Hệ thống gợi ý món ăn

> **Vị trí:** Sau mục 4.7

## **4.8 Hệ thống gợi ý món ăn (Recommendation)** {#4.8-recommendation}

### **4.8.1. Mô hình Preference Tags**

Hệ thống sử dụng **tag-based recommendation** với 3 nhóm tag:

| Nhóm | Mô tả | Ví dụ |
| :--- | :--- | :--- |
| `dish_type` | Loại món ăn | Phở, bún, cơm, bánh mì |
| `flavor` | Hương vị | Cay, chua, ngọt, mặn |
| `allergen` | Chất gây dị ứng | Hải sản, đậu phộng, gluten |

Mỗi món ăn (`menu_items`) được gắn nhiều tag qua bảng `menu_item_tags` (quan hệ M:N).

### **4.8.2. Thuật toán gợi ý**

**Input:** Danh sách 1-5 tag IDs do Customer chọn

**Query logic (raw SQL):**

```sql
SELECT mi.id, mi.name, mi.price,
       s.id AS store_id, s.name AS store_name,
       COUNT(mit.tag_id) AS match_count
FROM menu_items mi
JOIN stores s ON mi.store_id = s.id
JOIN menu_item_tags mit ON mi.id = mit.menu_item_id
WHERE mit.tag_id = ANY($1)
  AND s.status = 'active'
GROUP BY mi.id, mi.name, mi.price, s.id, s.name
ORDER BY match_count DESC, mi.id ASC
LIMIT 20 OFFSET $2
```

**Ranking:** Sắp xếp theo số tag khớp (`match_count`) giảm dần — món ăn khớp nhiều tag nhất hiển thị đầu tiên.

### **4.8.3. Frontend**

1. Fetch tag groups qua `GET /api/tags`
2. `TagSelector` component hiển thị tag theo nhóm, cho phép chọn tối đa 5 tag
3. Debounce 300ms → gọi `GET /api/recommendations?tags=1,2,3&page=1`
4. Hiển thị kết quả dạng `RecommendationCard` với pagination (20 item/page)

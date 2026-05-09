# Chương 4 — Nội dung cần bổ sung (Phần 1: 4.2 Frontend + 4.3 Database)

> **Tasks:** E1 (4.2 Frontend), E2 (4.3 Database entities), I2 (lockout), I3 (presigned URL)
> **Người phụ trách:** E1, I3 → Người 1 | E2, I2 → Người 2

---

## Sửa heading level (A2)

> Thay đổi nhanh trong Seminar.md:
> - Dòng 789: `# **4.1  Kiến trúc tổng thể**` → `## **4.1 Kiến trúc tổng thể**`
> - Dòng 871: `**4.3 Database**` → `## **4.3 Database**`
> - Dòng 881: `**4.4 API**` → `## **4.4 API**`

---

## E1. Thêm mục 4.2 — Thiết kế Frontend

> **Vị trí:** Chèn sau mục 4.1.6, trước mục 4.3

## **4.2 Thiết kế Frontend** {#4.2-thiết-kế-frontend}

### **4.2.1. Cấu trúc thư mục** {#4.2.1-cấu-trúc-thư-mục-frontend}

Frontend được xây dựng trên **Next.js 14 App Router**, tổ chức theo cấu trúc sau:

```
apps/frontend/src/
├── app/                        # Next.js App Router (routes)
│   ├── (auth)/                 # Nhóm route xác thực
│   │   ├── admin/login/        # Đăng nhập Admin
│   │   ├── store-owner/login/  # Đăng nhập Store Owner
│   │   ├── store-owner/register/ # Đăng ký Store Owner
│   │   └── auth/callback/      # Google OAuth callback
│   ├── (admin)/                # Nhóm route Admin (17 trang)
│   │   └── admin/
│   │       ├── stores/         # Quản lý gian hàng
│   │       ├── store-owners/   # Quản lý tài khoản Store Owner
│   │       ├── store-drafts/   # Duyệt bản nháp nội dung
│   │       ├── location-pins/  # Quản lý ghim vị trí
│   │       ├── reports/        # Quản lý báo cáo
│   │       ├── reviews/        # Kiểm duyệt đánh giá
│   │       ├── boundaries/     # Quản lý ranh giới bản đồ
│   │       ├── announcements/  # Thông báo hệ thống
│   │       └── tags/           # Quản lý tag sở thích
│   ├── (store-owner)/          # Nhóm route Store Owner (6 trang)
│   │   └── dashboard/
│   │       ├── store/          # Chỉnh sửa thông tin + menu
│   │       ├── location/       # Ghim vị trí
│   │       ├── qr/             # Quản lý mã QR
│   │       └── reviews/        # Xem đánh giá
│   └── (public)/               # Nhóm route công khai
│       ├── stores/             # Danh sách + chi tiết gian hàng
│       ├── map/                # Bản đồ tương tác
│       └── qr/[token]/        # Giải mã QR Code
├── components/                 # 77+ React components
├── hooks/                      # 4 custom hooks
├── contexts/                   # React Context (Language)
├── lib/api/                    # API client functions
├── i18n/                       # i18next config + 7 locale files
└── types/                      # Frontend-specific TypeScript types
```

### **4.2.2. Hệ thống component** {#4.2.2-hệ-thống-component}

Components tổ chức theo domain nghiệp vụ:

| Nhóm | Số lượng | Chức năng chính |
| :--- | :--- | :--- |
| `admin/` | 35+ | Bảng dữ liệu, filter, pagination, modal duyệt/từ chối, metric grid |
| `stores/` | 7 | StoreCard, StoreDetailView, CommentaryPlayer, ImageUploader, StoreEditForm, PipelineBanner, StoreSearchBar |
| `gps/` | 6 | GpsAutoPlayController, GpsPermissionBanner, GpsStatusBar, AudioControls, AutoplayBanner, DevFakeGps |
| `qr/` | 3 | QRCodeDisplay, QRDownloadButtons, QrScannerModal |
| `reviews/` | 6 | ReviewCard, ReviewForm, ReviewList, StarRating, CharacterCounter, ReviewListSkeleton |
| `recommendation/` | 5 | TagSelector, RecommendationCard, RecommendationList, Pagination, EmptyState |
| `notifications/` | 2 | NotificationBell, NotificationList |
| `reports/` | 2 | ReportModal, ReportReasonSelect |
| `layout/` | 8 | AdminHeader, AdminSidebar, DashboardHeader, DashboardSidebar, PublicHeader, BottomTabBar, CustomerAuthSection, LanguageSwitcher |
| `auth/` | 3 | LoginForm, RegisterForm, DeactivateWarningModal |
| `map/` | 2 | BoundaryPolygon, LeafletDynamic (SSR-safe wrapper) |

**CommentaryPlayer** — component quan trọng nhất, xử lý chiến lược dual audio:
1. Thử phát file audio từ server (`audioUrl`) qua `new Audio(audioUrl)`
2. Nếu thất bại → fallback sang Web Speech API (`SpeechSynthesisUtterance`)
3. Hỗ trợ play/pause/resume/stop
4. Hỗ trợ auto-play mode (kích hoạt bởi GPS proximity)

### **4.2.3. Custom Hooks** {#4.2.3-custom-hooks}

| Hook | Chức năng | Chi tiết |
| :--- | :--- | :--- |
| `useGeolocation` | Theo dõi vị trí GPS | Dùng `navigator.geolocation.watchPosition`, high accuracy, timeout 5s. Trả về `position`, `gpsStatus`, `error` |
| `useProximityDetection` | Phát hiện gian hàng gần nhất | Fetch tất cả public pins, tính khoảng cách Haversine, trả về store gần nhất trong bán kính 4m. Debounce 500ms |
| `useAutoPlay` | Tự động phát thuyết minh | Fetch commentary cho nearestStore, phát audio tự động. Tracking stores đã phát để tránh lặp trong session |
| `useCommentary` | Lấy dữ liệu thuyết minh | TanStack React Query wrapper, stale time 30s. Trả về `translatedText`, `audioUrl`, `pipelineStatus` |

### **4.2.4. Luồng xác thực và bảo vệ route** {#4.2.4-xác-thực-route}

Hệ thống sử dụng **Next.js Middleware** để bảo vệ route:

| Route Group | Cookie kiểm tra | Redirect nếu thiếu |
| :--- | :--- | :--- |
| `/dashboard/*` | `access_token` | `/store-owner/login` |
| `/admin/*` (trừ login) | `admin_access_token` | `/admin/login` |

**Cơ chế token refresh (Store Owner):**
* Axios interceptor bắt response 401
* Tự động gọi `POST /api/auth/store-owner/refresh` (dùng refresh token trong cookie httpOnly)
* Nếu refresh thành công → retry request gốc
* Nếu refresh thất bại → redirect về login

**API Client architecture:**
* **Axios client** (`lib/api/client.ts`): cho các API cần xác thực (Store Owner, Admin). Base URL: `/api/backend` (proxy qua Next.js rewrites)
* **Native fetch**: cho các API public (stores, recommendations, tags). Dùng `getApiUrl()` trả về `/api/backend` (client) hoặc `${BACKEND_URL}/api` (server)

### **4.2.5. State management** {#4.2.5-state-management}

| Loại state | Công nghệ | Mục đích |
| :--- | :--- | :--- |
| Server state | TanStack React Query v5 | Caching, invalidation, refetch dữ liệu từ API |
| Language state | React Context (`LanguageProvider`) | Ngôn ngữ hiện tại, speech code cho TTS |
| Persistence | localStorage + Cookie | Lưu ngôn ngữ (`phat-lang`), token xác thực |

---

## E2. Bổ sung mô tả chi tiết Database Entities (mục 4.3)

> **Vị trí:** Chèn sau 2 ảnh ERD hiện tại (dòng 875-879 Seminar.md)

### **4.3.3. Mô tả chi tiết các bảng dữ liệu** {#4.3.3-mô-tả-chi-tiết-bảng}

Hệ thống gồm **21 bảng dữ liệu**, quản lý bởi **30+ migration files** qua TypeORM. Dưới đây là mô tả chi tiết từng bảng:

#### **Nhóm 1: Quản lý tài khoản**

**Bảng `admin_accounts`** — Tài khoản quản trị viên

| Cột | Kiểu | Mô tả |
| :--- | :--- | :--- |
| id | UUID (PK) | Khóa chính |
| full_name | VARCHAR | Họ tên |
| email | VARCHAR (UNIQUE) | Email đăng nhập |
| password_hash | VARCHAR | Mật khẩu đã hash (bcrypt) |
| created_at | TIMESTAMP | Thời điểm tạo |

**Bảng `store_owner_accounts`** — Tài khoản chủ gian hàng

| Cột | Kiểu | Mô tả |
| :--- | :--- | :--- |
| id | UUID (PK) | Khóa chính |
| full_name | VARCHAR | Họ tên |
| email | VARCHAR (UNIQUE) | Email đăng nhập |
| phone | VARCHAR | Số điện thoại |
| password_hash | VARCHAR | Mật khẩu đã hash |
| status | ENUM | `pending` / `active` / `inactive` / `rejected` |
| registration_reason | TEXT | Lý do đăng ký (Admin xem xét) |
| failed_login_attempts | INT | Số lần đăng nhập sai (lockout mechanism) |
| lockout_until | TIMESTAMP | Thời điểm hết khóa tài khoản |
| created_at | TIMESTAMP | Thời điểm tạo |

**Bảng `customer_google_accounts`** — Tài khoản Google khách hàng

| Cột | Kiểu | Mô tả |
| :--- | :--- | :--- |
| id | UUID (PK) | Khóa chính |
| google_id | VARCHAR (UNIQUE) | Google Account ID |
| email | VARCHAR | Email Google |
| display_name | VARCHAR | Tên hiển thị |
| avatar_url | VARCHAR | URL ảnh đại diện |
| created_at | TIMESTAMP | Thời điểm tạo |

#### **Nhóm 2: Gian hàng và nội dung**

**Bảng `stores`** — Gian hàng

| Cột | Kiểu | Mô tả |
| :--- | :--- | :--- |
| id | UUID (PK) | Khóa chính |
| owner_id | UUID (FK → store_owner_accounts) | Chủ gian hàng |
| name | VARCHAR | Tên gian hàng |
| description | TEXT | Mô tả chi tiết |
| status | ENUM | `draft` / `pending_review` / `active` / `inactive` / `suspended` |
| address | VARCHAR | Địa chỉ |
| lat / lng | FLOAT | Tọa độ vị trí |
| phone | VARCHAR | Số điện thoại liên hệ |
| opening_hours | VARCHAR | Giờ mở cửa |
| social_links | JSONB | Link mạng xã hội (Facebook, Instagram, ...) |
| avg_rating | FLOAT | Điểm đánh giá trung bình (tự động tính) |
| review_count | INT | Số lượng đánh giá |
| active_commentary_id | UUID (FK → commentaries) | Thuyết minh đang active |
| created_at / updated_at | TIMESTAMP | Thời gian tạo/cập nhật |

**Bảng `menu_items`** — Món ăn

| Cột | Kiểu | Mô tả |
| :--- | :--- | :--- |
| id | UUID (PK) | Khóa chính |
| store_id | UUID (FK → stores) | Gian hàng sở hữu |
| name | VARCHAR | Tên món ăn |
| description | TEXT | Mô tả |
| price | DECIMAL | Giá (VND) |
| image_url | VARCHAR | URL ảnh món ăn |
| image_s3_key | VARCHAR | S3 key trong MinIO |
| is_in_draft | BOOLEAN | Đang trong bản nháp hay không |
| created_at | TIMESTAMP | Thời điểm tạo |

**Bảng `menu_item_tags`** — Liên kết M:N giữa menu_items và preference_tags

| Cột | Kiểu | Mô tả |
| :--- | :--- | :--- |
| menu_item_id | UUID (FK → menu_items) | Món ăn |
| tag_id | UUID (FK → preference_tags) | Tag sở thích |

**Bảng `store_content_drafts`** — Bản nháp nội dung gian hàng

| Cột | Kiểu | Mô tả |
| :--- | :--- | :--- |
| id | UUID (PK) | Khóa chính |
| store_id | UUID (FK → stores) | Gian hàng |
| name | VARCHAR | Tên mới (bản nháp) |
| description | TEXT | Mô tả mới (bản nháp) |
| status | ENUM | `pending` / `approved` / `rejected` |
| rejection_reason | TEXT | Lý do từ chối (nếu rejected) |
| created_at / updated_at | TIMESTAMP | Thời gian |

**Bảng `store_images`** — Hình ảnh gian hàng

| Cột | Kiểu | Mô tả |
| :--- | :--- | :--- |
| id | UUID (PK) | Khóa chính |
| store_id | UUID (FK → stores) | Gian hàng |
| url | VARCHAR | URL công khai |
| s3_key | VARCHAR | S3 key trong MinIO |
| order_index | INT | Thứ tự hiển thị |
| is_in_draft | BOOLEAN | Thuộc bản nháp hay không |

#### **Nhóm 3: Dịch thuật và thuyết minh**

**Bảng `commentaries`** — Nội dung thuyết minh

| Cột | Kiểu | Mô tả |
| :--- | :--- | :--- |
| id | UUID (PK) | Khóa chính |
| store_id | UUID (FK → stores) | Gian hàng |
| source_text | TEXT | Nội dung gốc (tiếng Việt) |
| pipeline_status | ENUM | `pending` / `running` / `completed` / `failed` |
| created_at / updated_at | TIMESTAMP | Thời gian |

**Bảng `commentary_translations`** — Bản dịch thuyết minh

| Cột | Kiểu | Mô tả |
| :--- | :--- | :--- |
| id | UUID (PK) | Khóa chính |
| commentary_id | UUID (FK → commentaries) | Nội dung thuyết minh gốc |
| language_code | VARCHAR | Mã ngôn ngữ (vi, en, fr, zh, ja, ko, th) |
| translated_text | TEXT | Văn bản đã dịch |
| audio_url | VARCHAR | URL file audio (nếu có) |
| audio_s3_key | VARCHAR | S3 key file audio |

**Bảng `store_translations`** — Bản dịch thông tin gian hàng

| Cột | Kiểu | Mô tả |
| :--- | :--- | :--- |
| store_id | UUID (FK → stores) | Gian hàng |
| language_code | VARCHAR | Mã ngôn ngữ |
| translated_name | VARCHAR | Tên đã dịch |
| translated_description | TEXT | Mô tả đã dịch |
| PK | (store_id, language_code) | Composite primary key |

**Bảng `menu_item_translations`** — Bản dịch món ăn

| Cột | Kiểu | Mô tả |
| :--- | :--- | :--- |
| menu_item_id | UUID (FK → menu_items) | Món ăn |
| language_code | VARCHAR | Mã ngôn ngữ |
| translated_name | VARCHAR | Tên đã dịch |
| translated_description | TEXT | Mô tả đã dịch |
| PK | (menu_item_id, language_code) | Composite primary key |

#### **Nhóm 4: Đánh giá và báo cáo**

**Bảng `reviews`** — Đánh giá gian hàng

| Cột | Kiểu | Mô tả |
| :--- | :--- | :--- |
| id | UUID (PK) | Khóa chính |
| store_id | UUID (FK → stores) | Gian hàng được đánh giá |
| customer_id | UUID (FK → customer_google_accounts) | Khách hàng |
| stars | INT | Điểm đánh giá (1-5) |
| content | TEXT | Nội dung bình luận |
| is_hidden | BOOLEAN | Đã bị ẩn bởi Admin |
| hidden_at | TIMESTAMP | Thời điểm bị ẩn |
| hidden_by | UUID | Admin thực hiện ẩn |
| created_at | TIMESTAMP | Thời điểm tạo |

**Bảng `comment_reports`** — Báo cáo bình luận vi phạm

| Cột | Kiểu | Mô tả |
| :--- | :--- | :--- |
| id | UUID (PK) | Khóa chính |
| review_id | UUID (FK → reviews) | Bình luận bị báo cáo |
| reporter_id | UUID (FK → store_owner_accounts) | Store Owner báo cáo |
| reason_id | UUID (FK → report_reasons) | Lý do báo cáo |
| status | ENUM | `pending` / `resolved` / `dismissed` |
| resolved_at | TIMESTAMP | Thời điểm xử lý |
| resolved_by | UUID | Admin xử lý |

**Bảng `report_reasons`** — Danh sách lý do báo cáo

| Cột | Kiểu | Mô tả |
| :--- | :--- | :--- |
| id | UUID (PK) | Khóa chính |
| label_vi | VARCHAR | Nhãn tiếng Việt |
| label_en | VARCHAR | Nhãn tiếng Anh |

#### **Nhóm 5: Vị trí và bản đồ**

**Bảng `location_pins`** — Ghim vị trí gian hàng

| Cột | Kiểu | Mô tả |
| :--- | :--- | :--- |
| id | UUID (PK) | Khóa chính |
| store_id | UUID (FK → stores) | Gian hàng |
| lat / lng | FLOAT | Tọa độ |
| pin_geom | GEOMETRY(Point, 4326) | Cột PostGIS tự động tạo từ lat/lng |
| status | ENUM | `pending` / `approved` / `rejected` / `superseded` |
| rejection_reason | TEXT | Lý do từ chối |
| created_at | TIMESTAMP | Thời điểm tạo |

**Bảng `food_street_boundaries`** — Ranh giới phố ẩm thực

| Cột | Kiểu | Mô tả |
| :--- | :--- | :--- |
| id | UUID (PK) | Khóa chính |
| name | VARCHAR | Tên khu vực |
| polygon_coordinates | JSONB | Tọa độ polygon dạng JSON |
| polygon_geom | GEOMETRY(Polygon, 4326) | Cột PostGIS cho spatial query |
| is_active | BOOLEAN | Đang hoạt động |

#### **Nhóm 6: Hệ thống phụ trợ**

**Bảng `qr_codes`** — Mã QR

| Cột | Kiểu | Mô tả |
| :--- | :--- | :--- |
| id | UUID (PK) | Khóa chính |
| store_id | UUID (FK → stores) | Gian hàng |
| token | UUID (UNIQUE) | Token để resolve QR |
| is_active | BOOLEAN | Đang active (partial unique index: chỉ 1 QR active/store) |
| created_by | UUID | Người tạo |
| created_at | TIMESTAMP | Thời điểm tạo |

**Bảng `preference_tags`** — Tag sở thích

| Cột | Kiểu | Mô tả |
| :--- | :--- | :--- |
| id | UUID (PK) | Khóa chính |
| name_vi | VARCHAR | Tên tiếng Việt |
| name_en | VARCHAR | Tên tiếng Anh |
| group_type | ENUM | `dish_type` / `flavor` / `allergen` |

**Bảng `notifications`** — Thông báo

| Cột | Kiểu | Mô tả |
| :--- | :--- | :--- |
| id | UUID (PK) | Khóa chính |
| recipient_type | ENUM | `store_owner` / `admin` |
| recipient_id | UUID | ID người nhận |
| event_type | VARCHAR | Loại sự kiện |
| title | VARCHAR | Tiêu đề |
| body | TEXT | Nội dung |
| is_read | BOOLEAN | Đã đọc chưa |
| created_at | TIMESTAMP | Thời điểm tạo |

**Bảng `admin_announcements`** — Thông báo từ Admin

| Cột | Kiểu | Mô tả |
| :--- | :--- | :--- |
| id | UUID (PK) | Khóa chính |
| admin_id | UUID (FK → admin_accounts) | Admin tạo |
| title | VARCHAR | Tiêu đề |
| body | TEXT | Nội dung |
| recipient_mode | ENUM | `single` / `multi` / `all_stores` |
| store_ids | JSONB | Danh sách store ID nhận (nếu single/multi) |
| status | ENUM | `draft` / `sent` |
| recipient_count | INT | Số người nhận |
| failed_email_details | JSONB | Chi tiết email gửi thất bại |
| created_at / sent_at | TIMESTAMP | Thời gian tạo/gửi |

---

## I2. Bổ sung Store Owner Lockout Mechanism

> **Vị trí:** Thêm vào mục 2.7.2 (Business Rules) hoặc mục 4.2.4 (Xác thực)

### Cơ chế khóa tài khoản Store Owner (Lockout)

Hệ thống triển khai cơ chế bảo mật chống brute-force cho tài khoản Store Owner:

* Mỗi lần đăng nhập sai → tăng `failed_login_attempts`
* Khi số lần sai vượt ngưỡng cho phép → thiết lập `lockout_until` (thời điểm tương lai)
* Trong thời gian lockout, mọi request đăng nhập đều bị từ chối, kèm thông báo thời gian còn lại
* Khi đăng nhập thành công → reset `failed_login_attempts` về 0

Cơ chế này được implement trong `AuthService` và lưu trữ trực tiếp trên entity `StoreOwnerAccount`.

---

## I3. Bổ sung Presigned URL Upload Flow

> **Vị trí:** Thêm vào mục 4.1.5 (MinIO) hoặc mục 4.2 (Frontend)

### Luồng upload file qua Presigned URL

Hệ thống sử dụng pattern **Presigned URL** cho việc upload ảnh gian hàng và ảnh món ăn, giúp giảm tải cho backend:

**Bước 1:** Client gọi API backend yêu cầu presigned URL
* `POST /api/store-owner/store/images` (ảnh gian hàng)
* `POST /api/store-owner/store/menu-items/:id/image` (ảnh món ăn)

**Bước 2:** Backend tạo presigned URL từ MinIO (S3-compatible), trả về URL + S3 key

**Bước 3:** Client upload file trực tiếp lên MinIO qua HTTP PUT đến presigned URL
* Hỗ trợ: JPG, PNG, WebP
* Giới hạn: tối đa 5MB/file, tối đa 10 ảnh/gian hàng

**Bước 4:** Client gọi API confirm upload
* `PATCH /api/store-owner/store/images/:id/confirm`
* Backend xác nhận file tồn tại trên MinIO → cập nhật URL công khai vào database

**Ưu điểm:**
* Backend không phải xử lý file binary → giảm tải CPU/memory
* Client upload trực tiếp lên object storage → tốc độ nhanh hơn
* Presigned URL có thời hạn → bảo mật

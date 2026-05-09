# Chương 3 — Nội dung cần bổ sung

> **Tasks:** D1 (UC-C06), D2 (UC-SO07), D3 (Use Case Specification), I1 (Content Draft workflow)
> **Người phụ trách:** D1 → Người 1 | D2, D3, I1 → Người 2

---

## D1. Bổ sung UC-C06 — Chuyển đổi ngôn ngữ

> **Vị trí 1:** Thêm vào danh sách Activity Diagram mục 3.3.3 (sau UC-C05)
> **Vị trí 2:** Thêm Activity Diagram + Sequence Diagram cho UC-C06

### Thêm vào danh sách 3.3.3:

```
* UC-C06: Chuyển đổi ngôn ngữ
```

### Mô tả Activity Diagram UC-C06:

**Quy trình chuyển đổi ngôn ngữ (UC-C06):**

1. Customer mở dropdown ngôn ngữ trên giao diện
2. Hệ thống hiển thị 7 ngôn ngữ: Tiếng Việt, English, Français, 中文, 日本語, 한국어, ภาษาไทย
3. Customer chọn ngôn ngữ mong muốn
4. Hệ thống cập nhật `LanguageContext`:
   * Lưu vào `localStorage` (key: `phat-lang`)
   * Lưu vào cookie (`phat_lang`, 365 ngày)
   * Cập nhật i18next language
5. Giao diện tự động render lại với ngôn ngữ mới
6. Nếu file locale chưa tải → lazy load từ server → hiển thị sau khi tải xong
7. Nội dung thuyết minh và thông tin gian hàng hiển thị bản dịch tương ứng

*Lưu ý: Cần vẽ Activity Diagram cho luồng trên và chèn hình ảnh vào báo cáo.*

### Mô tả Sequence Diagram UC-C06:

**Các thành phần tham gia:**
* Customer (Actor)
* LanguageSwitcher (Component)
* LanguageContext (Context)
* i18next (Library)
* localStorage / Cookie (Storage)

**Luồng:**
1. Customer → LanguageSwitcher: Chọn ngôn ngữ
2. LanguageSwitcher → LanguageContext: `setLang(newLang)`
3. LanguageContext → localStorage: `setItem('phat-lang', newLang)`
4. LanguageContext → Cookie: Set `phat_lang = newLang`
5. LanguageContext → i18next: `changeLanguage(newLang)`
6. i18next → Server: `import(`./locales/${newLang}.json`)` (nếu chưa tải)
7. Server → i18next: Trả về file locale JSON
8. i18next → LanguageContext: Ngôn ngữ sẵn sàng
9. LanguageContext → UI: Re-render toàn bộ giao diện

*Lưu ý: Cần vẽ Sequence Diagram cho luồng trên và chèn hình ảnh vào báo cáo.*

---

## D2. Bổ sung UC-SO07 — Xem thông báo (Store Owner)

> **Vị trí:** Thêm vào danh sách Activity Diagram mục 3.3.2 (sau UC-SO06)

### Thêm vào danh sách 3.3.2:

```
* UC-SO07: Xem thông báo
```

### Mô tả Activity Diagram UC-SO07:

**Quy trình xem thông báo (UC-SO07):**

1. Store Owner đăng nhập hệ thống
2. Hệ thống hiển thị biểu tượng chuông thông báo (NotificationBell) trên header
3. Hệ thống gọi API `GET /api/notifications/store-owner` lấy danh sách thông báo (limit: 20)
4. Hiển thị số lượng thông báo chưa đọc (badge, tối đa hiển thị 99+)
5. Store Owner nhấn vào chuông → hiển thị dropdown danh sách thông báo
6. Mỗi thông báo gồm: tiêu đề, nội dung, thời gian tương đối ("3 phút trước")
7. Thông báo chưa đọc có dấu chấm xanh
8. Store Owner nhấn vào thông báo → gọi API `PATCH /api/notifications/store-owner/:id/read` → đánh dấu đã đọc
9. Nhấn bên ngoài dropdown → đóng danh sách

**Các loại thông báo Store Owner nhận:**
* Tài khoản được duyệt/từ chối
* Bản nháp nội dung được duyệt/từ chối
* Ghim vị trí được duyệt/từ chối
* Thông báo từ Admin

*Lưu ý: Cần vẽ Activity Diagram cho luồng trên.*

---

## D3. Bổ sung Use Case Specification

> **Vị trí:** Thêm mục 3.2.5 sau mục 3.2.4

### **3.2.5 Use Case Specification — Các Use Case quan trọng** {#3.2.5-use-case-specification}

#### UC-C07: Xem thuyết minh gian hàng

| Mục | Nội dung |
| :--- | :--- |
| Use Case ID | UC-C07 |
| Tên | Xem thuyết minh gian hàng |
| Actor | Customer |
| Precondition | Gian hàng ở trạng thái active và có commentary đã COMPLETED |
| Main Flow | 1. Customer truy cập trang chi tiết gian hàng<br>2. Hệ thống gọi API `GET /api/stores/:id/commentary?lang={lang}`<br>3. Backend tìm commentary translation theo ngôn ngữ hiện tại<br>4. Trả về `translatedText` + `audioUrl` (nếu có) + `pipelineStatus`<br>5. Frontend hiển thị nội dung thuyết minh dạng text<br>6. Customer nhấn nút "Nghe" → phát audio |
| Alternative Flow | a) Pipeline đang chạy (status: running/pending) → hiển thị PipelineBanner với spinner, kết nối WebSocket chờ event `commentary:updated`<br>b) Không có bản dịch cho ngôn ngữ hiện tại → fallback hiển thị tiếng Việt (bản gốc)<br>c) Audio URL không tồn tại → fallback sang Web Speech API (browser TTS) |
| Postcondition | Customer xem/nghe được nội dung thuyết minh |
| Business Rules | Chỉ hiển thị commentary khi gian hàng active; ưu tiên server audio, fallback browser TTS |

#### UC-C08: Tự động phát thuyết minh khi đến gần

| Mục | Nội dung |
| :--- | :--- |
| Use Case ID | UC-C08 |
| Tên | Tự động phát thuyết minh khi đến gần gian hàng |
| Actor | Customer |
| Precondition | Customer bật GPS, trình duyệt được cấp quyền Geolocation |
| Main Flow | 1. Hệ thống gọi `navigator.geolocation.watchPosition` (high accuracy, timeout 5s)<br>2. GPS status chuyển sang `granted`<br>3. Hệ thống fetch tất cả public pins qua `GET /api/map/pins`<br>4. Với mỗi cập nhật vị trí (debounce 500ms), tính khoảng cách Haversine tới tất cả pin<br>5. Nếu có pin trong bán kính 4m → xác định là `nearestStore`<br>6. Fetch commentary cho store đó: `GET /api/stores/:id/commentary?lang={lang}`<br>7. Phát audio tự động |
| Alternative Flow | a) GPS bị từ chối → hiển thị `GpsPermissionBanner` hướng dẫn bật GPS<br>b) Browser chặn autoplay (NotAllowedError) → hiển thị `AutoplayBanner`, user phải tap để phát<br>c) Không có gian hàng trong bán kính 4m → không làm gì |
| Postcondition | StoreId đã phát được ghi nhận trong session, không phát lại cho cùng store trong session hiện tại |
| Business Rules | Bán kính phát hiện: 4m (PROXIMITY_RADIUS_METERS); chỉ phát khi gian hàng active; GPS status phải là `granted` |

#### UC-SO03: Quản lý gian hàng (Store Owner)

| Mục | Nội dung |
| :--- | :--- |
| Use Case ID | UC-SO03 |
| Tên | Quản lý thông tin gian hàng |
| Actor | Store Owner |
| Precondition | Store Owner đã đăng nhập, tài khoản ở trạng thái active |
| Main Flow | 1. Store Owner truy cập trang quản lý gian hàng<br>2. Hệ thống tải thông tin gian hàng hiện tại qua `GET /api/store-owner/store`<br>3. Store Owner chỉnh sửa: tên, mô tả, địa chỉ, SĐT, giờ mở cửa, link MXH<br>4. Lưu bản nháp: `PUT /api/store-owner/store` (status: draft)<br>5. Submit để duyệt: `POST /api/store-owner/store/submit` (status: pending_review)<br>6. Hệ thống tạo StoreContentDraft entity, gửi thông báo cho Admin<br>7. Chờ Admin duyệt |
| Alternative Flow | a) Store Owner muốn thu hồi draft đang chờ duyệt → `DELETE /api/store-owner/store/draft`<br>b) Admin từ chối draft → Store Owner nhận thông báo kèm lý do, có thể chỉnh sửa và submit lại<br>c) Quản lý menu: thêm/sửa/xóa món ăn qua `/api/store-owner/store/menu-items`<br>d) Upload ảnh: presigned URL → upload lên MinIO → confirm |
| Postcondition | Bản nháp được tạo hoặc cập nhật, chờ Admin phê duyệt |
| Business Rules | Mọi thay đổi nội dung phải qua workflow draft → Admin approve; chỉ có 1 draft pending tại 1 thời điểm |

#### UC-A03: Duyệt thông tin gian hàng (Admin)

| Mục | Nội dung |
| :--- | :--- |
| Use Case ID | UC-A03 |
| Tên | Duyệt thông tin gian hàng |
| Actor | Admin |
| Precondition | Admin đã đăng nhập, có draft ở trạng thái pending_review |
| Main Flow | 1. Admin truy cập danh sách drafts chờ duyệt: `GET /api/admin/store-drafts`<br>2. Chọn draft cần xem → `GET /api/admin/store-drafts/:id`<br>3. Hệ thống hiển thị DraftCompareView: so sánh nội dung cũ vs nội dung mới<br>4. Admin xem xét thay đổi<br>5a. Phê duyệt: `PATCH /api/admin/store-drafts/:id/approve`<br>&nbsp;&nbsp;→ Áp dụng thay đổi vào store<br>&nbsp;&nbsp;→ Kích hoạt commentary pipeline + store translation pipeline<br>&nbsp;&nbsp;→ Gửi thông báo cho Store Owner |
| Alternative Flow | 5b. Từ chối: `PATCH /api/admin/store-drafts/:id/reject` kèm lý do<br>&nbsp;&nbsp;→ Draft status chuyển thành rejected<br>&nbsp;&nbsp;→ Gửi thông báo + email cho Store Owner kèm lý do |
| Postcondition | Draft được approve (nội dung public) hoặc reject (Store Owner được thông báo) |
| Business Rules | Admin phải cung cấp lý do khi từ chối; approve kích hoạt tự động pipeline dịch thuật |

---

## I1. Bổ sung Content Draft Workflow

> **Vị trí:** Thêm vào Chương 3 hoặc Chương 4 (mục thiết kế chi tiết)

### Luồng Content Draft Workflow

Hệ thống áp dụng cơ chế **content moderation** cho mọi thay đổi nội dung gian hàng. Luồng xử lý:

**Bước 1: Store Owner tạo/chỉnh sửa bản nháp**
* Store Owner chỉnh sửa thông tin gian hàng (tên, mô tả, menu, ảnh)
* Gọi `PUT /api/store-owner/store` → lưu bản nháp (StoreContentDraft, status: `draft`)
* Store Owner có thể lưu nhiều lần mà chưa cần submit

**Bước 2: Submit để duyệt**
* Store Owner nhấn "Gửi duyệt" → `POST /api/store-owner/store/submit`
* Draft status chuyển thành `pending_review`
* Hệ thống gửi thông báo cho Admin (in-app notification)
* Quy tắc: chỉ cho phép 1 draft pending tại 1 thời điểm

**Bước 3: Admin xem xét**
* Admin vào danh sách drafts chờ duyệt (`GET /api/admin/store-drafts`)
* Xem chi tiết draft → DraftCompareView hiển thị so sánh nội dung cũ vs mới
* Hai lựa chọn:

**3a. Phê duyệt (Approve):**
* `PATCH /api/admin/store-drafts/:id/approve`
* Nội dung draft được áp dụng vào store chính thức
* Tự động kích hoạt:
  * Commentary Pipeline: dịch thuyết minh sang 6 ngôn ngữ
  * Store Translation Pipeline: dịch tên + mô tả gian hàng + menu
* Gửi email + notification cho Store Owner

**3b. Từ chối (Reject):**
* `PATCH /api/admin/store-drafts/:id/reject` kèm `rejectionReason`
* Draft status → `rejected`
* Gửi email + notification cho Store Owner kèm lý do
* Store Owner có thể chỉnh sửa và submit lại

**Bước 4: Thu hồi (tùy chọn)**
* Store Owner có thể thu hồi draft đang chờ duyệt: `DELETE /api/store-owner/store/draft`
* Draft bị xóa, Store Owner có thể tạo draft mới

*Lưu ý: Nên vẽ Activity Diagram hoặc Flowchart cho luồng này.*

---

## Cập nhật số liệu

> Nếu bổ sung UC-C06, cần cập nhật:

**Dòng 487 (bảng tổng quan):**
* Activity Diagram: 21 → **22**

**Dòng 659 (mục 3.3.3):**
* "Bao gồm 7 sơ đồ" → "Bao gồm **8** sơ đồ"
* Thêm `UC-C06: Chuyển đổi ngôn ngữ` vào danh sách

# Business Rules — Hệ thống Web Phố Ẩm Thực

> Phiên bản: 1.0 | Ngày: 2026-03-28

---

## Actors

| Actor | Loại | Mô tả |
|-------|------|-------|
| Customer | Primary | Khách tham quan phố ẩm thực; không cần tài khoản để khám phá cơ bản |
| Store Owner | Primary | Chủ gian hàng; được Admin duyệt tài khoản để quản lý nội dung gian hàng |
| Admin | Primary | Quản trị viên hệ thống; kiểm soát toàn bộ nội dung và tài khoản |

---

## BR-01: Truy cập hệ thống
# Business Rules — Hệ thống Web Phố Ẩm Thực

> Phiên bản: 1.0 | Ngày: 2026-03-28

---

## Actors

| Actor | Loại | Mô tả |
|-------|------|-------|
| Customer | Primary | Khách tham quan phố ẩm thực; không cần tài khoản để khám phá cơ bản |
| Store Owner | Primary | Chủ gian hàng; được Admin duyệt tài khoản để quản lý nội dung gian hàng |
| Admin | Primary | Quản trị viên hệ thống; kiểm soát toàn bộ nội dung và tài khoản |

---

## BR-01: Truy cập hệ thống

| ID | Rule |
|----|------|
| BR-01.1 | Customer không cần tài khoản để xem thông tin phố ẩm thực, nghe thuyết minh và xem bản đồ. |
| BR-01.2 | Customer phải đăng nhập bằng tài khoản Google để sử dụng chức năng đánh giá quán. |
| BR-01.3 | Tài khoản Store Owner được duyệt bởi Admin — Store Owner tự đăng ký. |
| BR-01.4 | Admin là tài khoản hệ thống nội bộ, không tạo qua luồng đăng ký thông thường. |
| BR-01.5 | Tài khoản Store Owner ở trạng thái chờ duyệt sau khi đăng ký; không thể đăng nhập cho đến khi Admin phê duyệt. |
| BR-01.6 | Customer nhập các thông sở thích để nhận được gợi ý món ăn phù hợp. |

---

## BR-02: Quản lý Gian hàng (Store)

| ID | Rule |
|----|------|
| BR-02.1 | Mỗi Store Owner chỉ quản lý gian hàng của mình. |
| BR-02.2 | Store Owner có thể cập nhật thông tin gian hàng: tên, mô tả, danh sách món ăn, hình ảnh. |
| BR-02.3 | Gian hàng chỉ hiển thị công khai khi Admin kích hoạt (status = active). |
| BR-02.4 | Admin có quyền vô hiệu hóa hoặc xóa và vô hiệu gian hàng bất kỳ lúc nào. |

---

## BR-03: Thuyết minh (Commentary)

| ID | Rule |
|----|------|
| BR-03.1 | Thuyết minh gian hàng gồm hai dạng: văn bản (text) và âm thanh (audio). Store Owner cung cấp nội dung văn bản gốc; hệ thống sử dụng AI để dịch audio theo ngôn ngữ của Customer. |
| BR-03.2 | Store Owner soạn nội dung thuyết minh và gửi lên hệ thống để Admin phê duyệt. |
| BR-03.3 | Nội dung thuyết minh chỉ hiển thị cho Customer sau khi Admin phê duyệt. |
| BR-03.4 | Khi Admin từ chối, Store Owner nhận thông báo kèm lý do và được phép chỉnh sửa, gửi lại. |
| BR-03.5 | Store Owner không thể chỉnh sửa bản thuyết minh đang ở trạng thái **chờ duyệt** — phải thu hồi trước khi chỉnh sửa. |
| BR-03.6 | Mỗi gian hàng chỉ có một bản thuyết minh chính thức đang hoạt động tại một thời điểm. |
| BR-03.7 | Khi người dùng tiến lại gần một gian hàng cụ thể (kích thước 4m) thì hệ thống sẽ tự động phát nội dung thuyết minh (audio/text) mà không cần thao tác thủ công.|
| BR-03.8 | Nếu Customer tắt GPS hoặc từ chối quyền vị trí, tính năng tự động phát thuyết minh (BR-03.7) sẽ bị vô hiệu hóa; hệ thống hiển thị thông báo yêu cầu bật GPS.|



---

## BR-04: Bản đồ & Ghim vị trí

| ID | Rule |
|----|------|
| BR-04.1 | Store Owner thiết lập vị trí gian hàng bằng cách kéo thả trực tiếp trên bản đồ hoặc nhập tọa độ thủ công. |
| BR-04.2 | Vị trí ghim chỉ hiển thị công khai sau khi Admin phê duyệt. |
| BR-04.3 | Admin có quyền điều chỉnh tọa độ hoặc xóa ghim của bất kỳ gian hàng nào. |
| BR-04.4 | Customer có thể xem bản đồ và nhận chỉ đường đến gian hàng mà không cần đăng nhập. |
| BR-04.5 | Customer có thể chia sẻ vị trí hiện tại của mình; chức năng này yêu cầu quyền truy cập GPS từ trình duyệt. |

---

## BR-05: QR Code

| ID | Rule |
|----|------|
| BR-05.1 | Store Owner có thể tạo QR code riêng cho gian hàng của mình. |
| BR-05.2 | QR code khi quét sẽ dẫn đến trang thông tin chi tiết của gian hàng trên web. |
| BR-05.3 | Khi gian hàng bị vô hiệu hóa (inactive), QR code trả về trang thông báo lỗi (không điều hướng đến nội dung). |

---

## BR-06: Đánh giá & Bình luận

| ID | Rule |
|----|------|
| BR-06.1 | Chỉ Customer đã đăng nhập bằng Google mới được phép đánh giá hoặc bình luận gian hàng. |
| BR-06.2 | Mỗi tài khoản Google chỉ được đánh giá một gian hàng **một lần duy nhất**; không thể chỉnh sửa hoặc đánh giá lại sau khi gửi. |
| BR-06.3 | Admin có quyền ẩn hoặc xóa bình luận vi phạm tiêu chuẩn cộng đồng. |
| BR-06.4 | Store Owner không có quyền xóa hoặc chỉnh sửa đánh giá của Customer. |
| BR-06.5 | Store Owner có báo cáo bình luận từ Customer ở gian hàng của họ. |
| BR-06.6 | Sau khi Store Owner có thể báo cáo bình luận, Admin nhận thông báo để xem xét; bình luận vẫn hiển thị bình thường cho đến khi Admin xử lý.|
---

## BR-07: Thông báo

| ID | Rule |
|----|------|
| BR-07.1 | Admin có thể gửi thông báo đến một gian hàng cụ thể hoặc toàn bộ hệ thống. |
| BR-07.2 | Thông báo được gửi qua đồng thời ba kênh: **email**, và vào hệ thống thông báo nội bộ. |
| BR-07.3 | Chủ gian hàng (Store Owner) sẽ tự động nhận thông báo khi nội dung mô tả gian hàng được Admin phê duyệt hoặc từ chối. Nếu bị từ chối, thông báo phải kèm theo lý do. |
| BR-07.4 | Admin sẽ nhận thông báo khi Store Owner gửi mới hoặc cập nhật mô tả gian hàng và đang ở trạng thái chờ phê duyệt. |

---

## BR-08: Đa ngôn ngữ (AI-powered)

| ID | Rule |
|----|------|
| BR-08.1 | Hệ thống hỗ trợ đa ngôn ngữ với AI tích hợp; không giới hạn số lượng ngôn ngữ cố định. |
| BR-08.2 | Giao diện Customer tự động hiển thị ngôn ngữ phù hợp dựa theo cài đặt trình duyệt; Customer có thể chủ động chuyển ngôn ngữ. |
| BR-08.3 | Nội dung thuyết minh (text) được AI dịch và tổng hợp theo ngôn ngữ Customer đang sử dụng. |
| BR-08.4 | Store Owner nhập nội dung thuyết minh gốc bằng tiếng Việt; AI chịu trách nhiệm dịch sang các ngôn ngữ khác. |

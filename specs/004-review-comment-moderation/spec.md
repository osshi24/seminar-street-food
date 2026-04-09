# Feature Specification: Đánh giá & Kiểm duyệt bình luận

**Feature Branch**: `004-review-comment-moderation`
**Created**: 2026-04-05
**Status**: Draft
**Business Rules**: BR-01.2, BR-06.1, BR-06.2, BR-06.3, BR-06.4, BR-06.5, BR-06.6
**Depends on**: spec 001 (tài khoản hệ thống), spec 002 (gian hàng active)

---

## User Scenarios & Testing

### User Story 1 — Customer đăng nhập Google OAuth và viết đánh giá (Priority: P1)

Customer chưa đăng nhập xem gian hàng và chọn viết đánh giá; hệ thống redirect sang
Google OAuth. Sau khi xác thực, Customer chọn số sao và nhập bình luận, gửi đánh giá.
Đánh giá hiển thị ngay trên trang gian hàng. Mỗi tài khoản Google chỉ được đánh giá
một gian hàng một lần duy nhất, không thể sửa hoặc gửi lại.

**Why this priority**: Đây là flow tương tác cốt lõi của Customer với nội dung — cũng là
lý do duy nhất Customer cần đăng nhập vào hệ thống.

**Independent Test**: Customer chưa đăng nhập → chọn "Viết đánh giá" → hoàn thành Google
OAuth → gửi đánh giá → xác nhận hiển thị ngay trên trang gian hàng → thử đánh giá lần
hai → xác nhận bị chặn.

**Acceptance Scenarios**:

1. **Given** Customer chưa đăng nhập, **When** chọn "Viết đánh giá", **Then** hệ thống
   redirect sang Google OAuth; sau khi xác thực thành công quay về trang gian hàng.
2. **Given** Customer đã đăng nhập Google và chưa đánh giá gian hàng này, **When** gửi
   đánh giá với ít nhất một số sao, **Then** đánh giá lưu và hiển thị ngay trên trang
   gian hàng.
3. **Given** Customer đã đánh giá gian hàng này rồi, **When** vào trang gian hàng, **Then**
   hệ thống hiển thị "Bạn đã đánh giá gian hàng này rồi" và ẩn nút viết đánh giá.
4. **Given** Customer gửi đánh giá không có số sao, **When** submit, **Then** hệ thống yêu
   cầu chọn ít nhất một số sao trước khi gửi.
5. **Given** Customer hủy đăng nhập Google OAuth, **When** quay lại, **Then** hệ thống giữ
   Customer ở trạng thái chưa đăng nhập và không tạo đánh giá.

---

### User Story 2 — Store Owner báo cáo bình luận vi phạm (Priority: P2)

Store Owner xem danh sách bình luận tại gian hàng của mình, phát hiện bình luận vi phạm
tiêu chuẩn cộng đồng, chọn báo cáo kèm lý do. Bình luận vẫn hiển thị bình thường cho
đến khi Admin xử lý.

**Why this priority**: Phụ thuộc US1 (cần có bình luận mới báo cáo được). Là cơ chế kiểm
soát nội dung từ phía Store Owner.

**Independent Test**: Có ít nhất một bình luận trên gian hàng → Store Owner báo cáo →
xác nhận Admin nhận thông báo → xác nhận bình luận vẫn hiển thị bình thường.

**Acceptance Scenarios**:

1. **Given** Có bình luận hiển thị tại gian hàng của Store Owner, **When** Store Owner chọn
   "Báo cáo" và chọn lý do, **Then** báo cáo được lưu, Admin nhận thông báo, bình luận
   vẫn hiển thị bình thường.
2. **Given** Store Owner đã báo cáo bình luận này rồi, **When** cố báo cáo lại, **Then**
   hệ thống thông báo "Bạn đã báo cáo bình luận này rồi."
3. **Given** Store Owner chọn "Báo cáo" nhưng không chọn lý do, **When** submit, **Then**
   hệ thống yêu cầu chọn lý do trước khi gửi.

---

### User Story 3 — Admin xử lý báo cáo bình luận (Priority: P2)

Admin nhận thông báo có báo cáo mới, xem nội dung bình luận và lý do báo cáo, rồi quyết
định ẩn/xóa bình luận (nếu vi phạm) hoặc bác bỏ báo cáo (nếu không vi phạm).

**Why this priority**: Hoàn thiện FLOW-06. Cần có US2 trước.

**Independent Test**: Store Owner báo cáo bình luận → Admin xem báo cáo → Admin ẩn bình
luận → xác nhận bình luận không còn hiển thị với Customer.

**Acceptance Scenarios**:

1. **Given** Có báo cáo bình luận chờ xử lý, **When** Admin chọn "Ẩn bình luận", **Then**
   bình luận không còn hiển thị với Customer, báo cáo đánh dấu "đã xử lý".
2. **Given** Có báo cáo bình luận chờ xử lý, **When** Admin chọn "Bác bỏ báo cáo", **Then**
   bình luận tiếp tục hiển thị bình thường, báo cáo đánh dấu "bác bỏ".
3. **Given** Admin chọn "Xóa bình luận" và xác nhận, **When** thực hiện, **Then** bình luận
   bị xóa vĩnh viễn khỏi hệ thống.

---

### User Story 4 — Admin quản lý toàn bộ bình luận (Priority: P3)

Admin xem danh sách tất cả bình luận trong hệ thống, lọc theo gian hàng/trạng thái/từ
khóa, chủ động ẩn hoặc xóa bình luận vi phạm mà không cần báo cáo từ Store Owner.

**Why this priority**: Mở rộng quyền kiểm duyệt của Admin; không blocking các story khác.

**Independent Test**: Admin vào mục quản lý bình luận → lọc theo gian hàng → ẩn bình
luận vi phạm → xác nhận bình luận không hiển thị với Customer.

**Acceptance Scenarios**:

1. **Given** Admin đã đăng nhập, **When** vào mục "Quản lý bình luận", **Then** hệ thống
   hiển thị danh sách tất cả bình luận của toàn hệ thống.
2. **Given** Admin lọc theo gian hàng/trạng thái/từ khóa, **When** áp dụng bộ lọc, **Then**
   danh sách cập nhật theo tiêu chí.
3. **Given** Admin chọn "Ẩn bình luận" trực tiếp (không qua báo cáo), **When** xác nhận,
   **Then** bình luận không còn hiển thị với Customer nhưng vẫn lưu trong hệ thống.
4. **Given** Admin chọn "Bỏ ẩn" bình luận đã ẩn, **When** xác nhận, **Then** bình luận
   hiển thị lại với Customer.

---

### Edge Cases

- Customer đánh giá xong rồi tài khoản Google của họ bị đóng → đánh giá vẫn tồn tại trong
  hệ thống (không bị xóa theo tài khoản).
- Store Owner không có quyền xem đánh giá của các gian hàng khác, chỉ xem được gian hàng
  của mình.
- Admin xóa gian hàng có bình luận → hệ thống cảnh báo trước khi xóa toàn bộ dữ liệu
  liên quan (bao gồm đánh giá và bình luận).
- Customer đăng nhập Google OAuth lần đầu → hệ thống tạo hồ sơ Customer tự động từ thông
  tin Google; không cần đăng ký thêm bước nào.

---

## Requirements

### Functional Requirements

- **FR-001**: Customer PHẢI có thể đăng nhập bằng Google OAuth để viết đánh giá; không yêu
  cầu đăng nhập cho các tính năng xem công khai. (BR-01.2, BR-06.1)
- **FR-002**: Customer đã đăng nhập PHẢI có thể gửi đánh giá gồm số sao 1-5 (bắt buộc)
  và nội dung bình luận tối đa 500 ký tự (tùy chọn) cho một gian hàng đang active.
  (BR-06.1)
- **FR-003**: Mỗi tài khoản Google PHẢI chỉ được đánh giá một gian hàng một lần duy nhất;
  không thể chỉnh sửa hoặc gửi lại sau khi đã gửi. (BR-06.2)
- **FR-004**: Đánh giá của Customer PHẢI hiển thị ngay trên trang gian hàng sau khi gửi
  (không cần qua duyệt); điểm trung bình và tổng số đánh giá PHẢI cập nhật ngay sau mỗi
  đánh giá mới được gửi.
- **FR-005**: Store Owner PHẢI có thể báo cáo bình luận tại gian hàng của mình với lý do
  được chọn từ danh sách định sẵn. (BR-06.5)
- **FR-006**: Bình luận bị báo cáo PHẢI vẫn hiển thị bình thường cho Customer cho đến khi
  Admin xử lý; Admin nhận thông báo. (BR-06.6)
- **FR-007**: Store Owner PHẢI KHÔNG có quyền xóa hoặc chỉnh sửa đánh giá của Customer.
  (BR-06.4)
- **FR-008**: Admin PHẢI có thể xem, ẩn hoặc xóa bình luận vi phạm trực tiếp mà không cần
  báo cáo từ Store Owner. (BR-06.3)
- **FR-009**: Admin PHẢI có thể xem và xử lý báo cáo bình luận: ẩn, xóa bình luận hoặc
  bác bỏ báo cáo.
- **FR-010**: Admin PHẢI có thể lọc và tìm kiếm bình luận theo gian hàng, trạng thái,
  và từ khóa.
- **FR-011**: Hệ thống PHẢI thông báo (email + in-app) đến Admin khi có báo cáo bình luận
  mới từ Store Owner. (BR-06.6)
- **FR-012**: Hệ thống PHẢI ngăn Store Owner báo cáo cùng một bình luận nhiều lần.

### Key Entities

- **Review**: Đánh giá của Customer cho một gian hàng; gồm số sao (1-5, bắt buộc), nội
  dung bình luận (tùy chọn, tối đa 500 ký tự), thời gian, và liên kết với tài khoản
  Google và gian hàng. Không thể sửa sau khi gửi.
- **CustomerGoogleAccount**: Hồ sơ Customer xác thực qua Google OAuth; lưu tên và ảnh đại
  diện từ Google để hiển thị cùng đánh giá; email lưu nội bộ để xác định danh tính nhưng
  không hiển thị công khai; dùng để xác định giới hạn một đánh giá mỗi gian hàng.
- **CommentReport**: Báo cáo của Store Owner về một bình luận; gồm lý do, trạng thái
  `pending / resolved / dismissed`; liên kết với bình luận và Store Owner.

---

## Clarifications

### Session 2026-04-05

- Q: Thang điểm đánh giá (số sao) là bao nhiêu? → A: 1-5 sao (tiêu chuẩn phổ biến).
- Q: Điểm trung bình có hiển thị trên trang gian hàng không? → A: Hiển thị điểm trung bình (VD: ⭐ 4.2) cùng tổng số đánh giá; cập nhật ngay sau mỗi đánh giá mới.
- Q: Thông tin Google nào hiển thị công khai cùng đánh giá? → A: Tên + ảnh đại diện Google; không hiển thị email.
- Q: Giới hạn độ dài nội dung bình luận? → A: Tối đa 500 ký tự; hiển thị bộ đếm ký tự còn lại khi nhập.
- Q: Thứ tự hiển thị danh sách đánh giá trên trang gian hàng? → A: Mới nhất lên trước (sắp xếp theo thời gian giảm dần).

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Customer hoàn thành đăng nhập Google OAuth và gửi đánh giá trong vòng 3 phút.
- **SC-002**: Đánh giá của Customer hiển thị trên trang gian hàng trong vòng 5 giây sau
  khi gửi.
- **SC-003**: 100% tài khoản Google bị chặn đánh giá lần thứ hai cho cùng một gian hàng.
- **SC-004**: Admin xem và xử lý báo cáo bình luận trong vòng 5 thao tác từ khi mở trang
  danh sách báo cáo.

---

## Assumptions

- Google OAuth được tích hợp ở phía backend; tên và ảnh đại diện từ Google được hiển thị
  công khai cùng đánh giá; email chỉ lưu nội bộ để xác định danh tính, không hiển thị.
- Danh sách lý do báo cáo (spam, nội dung không phù hợp, thông tin sai lệch...) được cấu
  hình sẵn trong hệ thống; không cho phép Store Owner nhập lý do tự do.
- Đánh giá không qua Admin duyệt — hiển thị ngay; Admin có quyền ẩn/xóa sau đó.
- Danh sách đánh giá hiển thị theo thứ tự mới nhất lên trước (thời gian giảm dần).
- Bình luận ẩn vẫn lưu trong hệ thống; Admin có thể bỏ ẩn; không hiển thị với Customer.
- Chức năng "quên đăng nhập / đăng xuất Google" là hành vi tiêu chuẩn của OAuth; hệ thống
  không quản lý phiên Google trực tiếp.

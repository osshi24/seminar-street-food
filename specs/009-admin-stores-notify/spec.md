# Feature Specification: Admin — Quản lý gian hàng & Gửi thông báo

**Feature Branch**: `009-admin-stores-notify`  
**Created**: 2026-04-10  
**Status**: Draft  
**Input**: User description: "Admin: Quản lý gian hàng và Gửi thông báo (UC-A02, UC-A07)" — nguồn chi tiết: `requirement/UC-admin.md`

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Admin quản lý trạng thái và xóa gian hàng (Priority: P1)

Admin đã đăng nhập mở mục **Quản lý gian hàng**, xem danh sách tất cả gian hàng kèm trạng thái (active / inactive), tên gian hàng, chủ sở hữu (Store Owner), và thông tin tối thiểu để nhận diện. Admin có thể **kích hoạt** gian hàng đang inactive, **vô hiệu hóa** gian hàng đang active, hoặc **xóa** gian hàng. Khi vô hiệu hóa, gian hàng không còn hiển thị công khai và QR trỏ tới gian hàng đó phải dẫn tới trạng thái “không khả dụng” như các luồng hiện có. Khi xóa, hệ thống xóa gian hàng và dữ liệu phụ thuộc theo quy tắc toàn vẹn dữ liệu; nếu còn đánh giá/bình luận hoặc dữ liệu liên quan đáng kể, hệ thống cảnh báo và yêu cầu xác nhận lần hai trước khi xóa.

**Why this priority**: Đây là UC-A02 — kiểm soát nội dung công khai và vòng đời gian hàng; không có màn hình này thì Admin khó vận hành phố ẩm thực ở quy mô thực tế.

**Independent Test**: Đăng nhập Admin → mở danh sách gian hàng → đổi trạng thái một gian hàng → xác minh trang public/map/QR phản ứng đúng → thử xóa (có/không có dữ liệu liên quan) và xác minh DB/UI.

**Acceptance Scenarios**:

1. **Given** Admin đã đăng nhập, **When** mở Quản lý gian hàng, **Then** hệ thống hiển thị danh sách gian hàng có phân trang/tìm kiếm tối thiểu (theo tên hoặc email chủ) và cột trạng thái rõ ràng.
2. **Given** một gian hàng đang inactive, **When** Admin chọn Kích hoạt, **Then** trạng thái chuyển sang active và gian hàng xuất hiện trong luồng công khai (theo các điều kiện duyệt nội dung/ghim hiện có của hệ thống).
3. **Given** một gian hàng đang active, **When** Admin chọn Vô hiệu hóa, **Then** trạng thái chuyển sang inactive, gian hàng ẩn khỏi danh sách công khai, và QR resolve trả về trạng thái không khả dụng.
4. **Given** Admin chọn Xóa gian hàng, **When** chưa xác nhận, **Then** không có thay đổi dữ liệu.
5. **Given** gian hàng có đánh giá hoặc bình luận (hoặc chỉ số “dữ liệu liên quan” do hệ thống định nghĩa), **When** Admin chọn Xóa, **Then** hệ thống hiển thị cảnh báo theo UC-A02 và chỉ xóa sau khi Admin xác nhận.
6. **Given** Admin xác nhận xóa, **When** thao tác hoàn tất, **Then** gian hàng và dữ liệu phụ thuộc được xử lý nhất quán (không còn bản ghi “mồ côi” gây lỗi public API).

---

### User Story 2 — Admin gửi thông báo tới chủ gian hàng (Priority: P2)

Admin mở mục **Gửi thông báo**, soạn tiêu đề và nội dung, chọn đối tượng nhận: **một gian hàng**, **nhiều gian hàng** (chọn danh sách), hoặc **tất cả gian hàng**. Admin có thể **xem trước** rồi **Gửi**. Hệ thống tạo thông báo nội bộ cho từng Store Owner tương ứng (theo gian hàng được chọn) và đưa email vào hàng đợi gửi (async). Nếu một số email gửi thất bại, thông báo nội bộ vẫn được tạo cho các recipient hợp lệ và hệ thống ghi nhận danh sách lỗi để Admin theo dõi. Nội dung trống không được phép gửi.

**Why this priority**: UC-A07 — kênh liên lạc chính thức từ Ban quản trị tới tiểu thương; P2 vì vận hành vẫn chạy được nếu chỉ có P1, nhưng thiếu tính năng này sẽ phải dùng công cụ ngoài (email thủ công).

**Independent Test**: Admin gửi tới một gian hàng → kiểm tra bảng thông báo / UI Store Owner và job email. Gửi “tất cả” với 2+ gian hàng → số notification đúng. Giả lập lỗi SMTP một phần → response có phần failed recipients.

**Acceptance Scenarios**:

1. **Given** Admin đã đăng nhập, **When** mở Gửi thông báo, **Then** thấy form tiêu đề, nội dung, chọn phạm vi nhận và nút Gửi / (tuỳ chọn) Lưu nháp.
2. **Given** nội dung hoặc tiêu đề rỗng (theo quy tắc validation đã thống nhất), **When** Admin bấm Gửi, **Then** hệ thống từ chối và hiển thị lỗi thân thiện (theo UC-A07).
3. **Given** Admin chọn một gian hàng cụ thể và soạn nội dung hợp lệ, **When** bấm Gửi, **Then** Store Owner của gian hàng đó nhận thông báo nội bộ và email được enqueue.
4. **Given** Admin chọn nhiều gian hàng, **When** bấm Gửi, **Then** mỗi gian hàng được map đúng tới chủ sở hữu và mỗi chủ nhận đủ thông báo (nếu một chủ có nhiều gian hàng được chọn, có thể gộp một thông báo hoặc nhiều thông báo — cần nhất quán với `research.md`/API contract).
5. **Given** Admin chọn tất cả gian hàng, **When** bấm Gửi, **Then** hệ thống gửi tới toàn bộ gian hàng hiện có trong phạm vi đã định nghĩa (ví dụ: tất cả bản ghi store, hoặc chỉ store còn “hoạt động” — theo quyết định trong plan).
6. **Given** một số địa chỉ email gửi thất bại, **When** request hoàn tất, **Then** phần nội bộ vẫn thành công cho các recipient hợp lệ và response/log có danh sách email thất bại (UC-A07).
7. **Given** Admin chọn Lưu nháp, **When** lưu thành công, **Then** có thể mở lại và chỉnh sửa trước khi gửi (nếu phạm vi MVP bao gồm nháp).

---

### Edge Cases

- Gian hàng không có chủ hợp lệ (dữ liệu bất thường): không gửi notification “rỗng”; log/ skip với cảnh báo cho Admin.
- Broadcast tới “tất cả” với số lượng rất lớn: tránh timeout HTTP — xử lý bất đồng bộ (queue) và trả job id hoặc 202 + polling tùy contract.
- Xóa gian hàng đang có draft chờ duyệt: hành vi phải nhất quán với Constitution (nội dung chờ duyệt) — hoặc chặn xóa, hoặc cascade có kiểm soát; ghi rõ trong plan/data-model.
- Trùng Store Owner cho nhiều gian hàng (nếu sau này mở rộng 1-N): tránh spam email/notification trùng lặp (dedupe theo `owner_id`).

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Hệ thống MUST cung cấp giao diện Admin để xem danh sách gian hàng với trạng thái `active` / `inactive` và thông tin nhận diện (tên gian hàng, chủ sở hữu).
- **FR-002**: Admin MUST có thể chuyển gian hàng từ `inactive` sang `active` và ngược lại, với kiểm tra quyền Admin (JWT Admin).
- **FR-003**: Admin MUST có thể xóa gian hàng với bước xác nhận; nếu có dữ liệu liên quan (đánh giá/bình luận hoặc metric tương đương), MUST hiển thị cảnh báo và yêu cầu xác nhận lần hai theo UC-A02.
- **FR-004**: Sau khi vô hiệu hóa, gian hàng MUST không hiển thị trong luồng công khai và QR MUST resolve như “không khả dụng” (nhất quán với hành vi hiện có của hệ thống).
- **FR-005**: Hệ thống MUST cung cấp giao diện Admin để soạn thông báo (tiêu đề, nội dung) và chọn phạm vi: một gian hàng, nhiều gian hàng, hoặc tất cả gian hàng (UC-A07).
- **FR-006**: Khi gửi thông báo, hệ thống MUST tạo thông báo nội bộ cho Store Owner liên quan và MUST enqueue email qua cơ chế gửi mail async hiện có (ví dụ BullMQ).
- **FR-007**: Nếu gửi email một phần thất bại, hệ thống MUST vẫn hoàn thành thông báo nội bộ cho các recipient hợp lệ và MUST trả về hoặc lưu thông tin danh sách email thất bại cho Admin (UC-A07).
- **FR-008**: Validation MUST từ chối gửi khi nội dung thông báo không hợp lệ (trống / vượt giới hạn ký tự nếu có).
- **FR-009** (tuỳ MVP): Admin MAY lưu nháp thông báo và gửi sau; nếu không làm nháp trong MVP, ghi rõ trong plan và loại FR-009 khỏi phạm vi giao hàng đầu tiên.

### Key Entities

- **Store (Gian hàng)**: Đã tồn tại; thêm/thắt các thao tác Admin list/update status/delete và quy tắc cascade.
- **StoreOwnerAccount**: Người nhận thông báo và email; liên kết với Store.
- **Notification (in-app)**: Bản ghi thông báo cho `store_owner`; có thể dùng `event_type` mới cho thông báo từ Admin.
- **AdminAnnouncement / Broadcast (mới)**: Tuỳ thiết kế — lưu lịch sử gửi, trạng thái nháp/đã gửi, phạm vi nhận, và metadata lỗi email (xem `data-model.md`).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admin hoàn tất kích hoạt/vô hiệu hóa một gian hàng trong không quá 5 thao tác (mở danh sách → chọn hành động → xác nhận nếu có) mà không cần truy cập DB trực tiếp.
- **SC-002**: Sau khi vô hiệu hóa, 100% request công khai tới gian hàng đó trả về trạng thái “không tồn tại / không khả dụng” nhất quán với policy hiện tại (verified bằng test hoặc checklist thủ công).
- **SC-003**: Gửi thông báo tới một gian hàng: Store Owner thấy thông báo trong app trong vòng thời gian tương đương các thông báo hệ thống hiện có (cùng độ trễ notification).
- **SC-004**: Với broadcast tới N gian hàng (N ≤ 100 trong môi trường thử nghiệm), không có lỗi 500 do timeout đồng bộ — xử lý bất đồng bộ hoặc batch được chứng minh trong test/quickstart.

---

## Assumptions

- Một Store Owner gắn với một gian hàng trong schema hiện tại (1:1); nếu khác, dedupe và mapping được điều chỉnh trong plan.
- Email và notification infrastructure (Nodemailer + BullMQ + bảng `notifications`) được tái sử dụng như spec 001/002.
- Ngôn ngữ UI Admin: tiếng Việt, nhất quán với các trang admin hiện có.
- Không yêu cầu Customer nhận thông báo từ luồng này.

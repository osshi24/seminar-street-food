# Feature Specification: Xác thực & Quản lý tài khoản

**Feature Branch**: `001-auth-account-management`
**Created**: 2026-04-05
**Status**: Draft
**Business Rules**: BR-01.1, BR-01.3, BR-01.4, BR-01.5, BR-07.2, BR-07.3, BR-07.4

---

## User Scenarios & Testing

### User Story 1 — Store Owner tự đăng ký và chờ duyệt (Priority: P1)

Store Owner truy cập trang đăng ký, điền thông tin cá nhân và gian hàng, gửi yêu cầu.
Tài khoản được tạo ở trạng thái chờ duyệt. Store Owner nhận email xác nhận và không thể
đăng nhập cho đến khi Admin phê duyệt.

**Why this priority**: Đây là cổng vào duy nhất của Store Owner. Không có tài khoản được
duyệt thì không thể thực hiện bất kỳ flow nào khác trong hệ thống.

**Independent Test**: Điền form đăng ký → xác nhận tài khoản xuất hiện ở trạng thái
`pending` → xác nhận email xác nhận được gửi → xác nhận Store Owner không thể đăng nhập.

**Acceptance Scenarios**:

1. **Given** Store Owner chưa có tài khoản, **When** điền đầy đủ thông tin hợp lệ và gửi
   đăng ký, **Then** hệ thống tạo tài khoản ở trạng thái `pending`, gửi email xác nhận
   cho Store Owner và thông báo (email + in-app) cho Admin.
2. **Given** Store Owner gửi đăng ký với email đã tồn tại, **When** submit form, **Then**
   hệ thống hiển thị lỗi "Email này đã được đăng ký".
3. **Given** Store Owner bỏ trống trường bắt buộc, **When** submit form, **Then** hệ thống
   hiển thị lỗi cụ thể và không tạo tài khoản.
4. **Given** Tài khoản Store Owner đang `pending`, **When** thử đăng nhập, **Then** hệ
   thống thông báo "Tài khoản đang chờ Admin phê duyệt".

---

### User Story 2 — Admin duyệt hoặc từ chối tài khoản Store Owner (Priority: P1)

Admin xem danh sách tài khoản đang chờ duyệt, xem chi tiết thông tin đăng ký, rồi phê
duyệt hoặc từ chối kèm lý do bắt buộc. Store Owner nhận thông báo kết quả qua cả hai
kênh email và in-app.

**Why this priority**: Cùng mức với US1 — Admin phải duyệt thì Store Owner mới hoạt động
được. Đây là hai nửa của FLOW-01.

**Independent Test**: Tạo tài khoản Store Owner ở trạng thái `pending` → Admin phê duyệt
→ xác nhận tài khoản chuyển sang `active` → xác nhận Store Owner nhận thông báo và có
thể đăng nhập.

**Acceptance Scenarios**:

1. **Given** Có tài khoản Store Owner đang `pending`, **When** Admin chọn "Phê duyệt",
   **Then** tài khoản chuyển sang `active`, Store Owner nhận thông báo qua email và in-app.
2. **Given** Có tài khoản Store Owner đang `pending`, **When** Admin chọn "Từ chối" và
   nhập lý do, **Then** tài khoản chuyển sang `rejected`, Store Owner nhận thông báo
   kèm lý do qua email và in-app.
3. **Given** Admin chọn "Từ chối" nhưng không nhập lý do, **When** submit, **Then** hệ
   thống yêu cầu nhập lý do trước khi thực hiện.

---

### User Story 3 — Store Owner đăng nhập và đăng xuất (Priority: P2)

Store Owner đã được phê duyệt đăng nhập bằng email và mật khẩu, truy cập trang quản lý
gian hàng. Có thể đăng xuất bất kỳ lúc nào.

**Why this priority**: Phụ thuộc US1 + US2. Là điều kiện tiên quyết cho tất cả các spec
Store Owner tiếp theo.

**Independent Test**: Dùng tài khoản đã được Admin phê duyệt → đăng nhập → xác nhận
chuyển đến trang quản lý gian hàng → đăng xuất → xác nhận phiên kết thúc.

**Acceptance Scenarios**:

1. **Given** Tài khoản Store Owner đang `active`, **When** đăng nhập với thông tin đúng,
   **Then** hệ thống tạo phiên và chuyển đến trang quản lý gian hàng.
2. **Given** Tài khoản Store Owner đang `inactive`, **When** thử đăng nhập, **Then** hệ
   thống thông báo "Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ Admin."
3. **Given** Store Owner nhập sai email hoặc mật khẩu, **When** submit, **Then** hệ thống
   thông báo "Email hoặc mật khẩu không đúng."
4. **Given** Store Owner đang đăng nhập, **When** chọn đăng xuất, **Then** phiên kết thúc
   và hệ thống chuyển về trang đăng nhập.
5. **Given** Tài khoản Store Owner đang `rejected`, **When** thử đăng nhập, **Then** hệ
   thống thông báo "Tài khoản đăng ký của bạn đã bị từ chối. Vui lòng xem email để biết
   lý do và liên hệ Admin nếu cần."

---

### User Story 4 — Admin quản lý vòng đời tài khoản Store Owner (Priority: P2)

Admin xem danh sách toàn bộ tài khoản Store Owner, lọc và tìm kiếm, vô hiệu hóa hoặc
kích hoạt lại tài khoản đã tồn tại sau khi được phê duyệt.

**Why this priority**: Mở rộng từ US2. Cần thiết để Admin kiểm soát hệ thống sau khi
tài khoản đã được phê duyệt.

**Independent Test**: Admin vô hiệu hóa tài khoản `active` → xác nhận Store Owner không
thể đăng nhập → Admin kích hoạt lại → xác nhận Store Owner đăng nhập được.

**Acceptance Scenarios**:

1. **Given** Tài khoản Store Owner đang `active`, **When** Admin chọn "Vô hiệu hóa",
   **Then** tài khoản chuyển sang `inactive`, Store Owner nhận thông báo qua email
   và in-app, không thể đăng nhập.
2. **Given** Tài khoản Store Owner đang `inactive`, **When** Admin chọn "Kích hoạt lại",
   **Then** tài khoản chuyển sang `active`, Store Owner nhận thông báo qua email và in-app.
3. **Given** Tài khoản Store Owner có nội dung gian hàng đang chờ duyệt, **When** Admin
   vô hiệu hóa, **Then** hệ thống hiển thị cảnh báo xác nhận trước khi thực hiện.
4. **Given** Admin tìm kiếm theo tên/email/trạng thái, **When** nhập từ khóa hoặc chọn
   bộ lọc, **Then** danh sách cập nhật theo tiêu chí tương ứng.

---

### Edge Cases

- Store Owner đăng ký trùng email với tài khoản đã bị từ chối → hệ thống thông báo
  email đã tồn tại (không phân biệt trạng thái tài khoản).
- Tài khoản Admin không có giao diện đăng ký công khai; Admin đăng nhập qua trang riêng
  với thông tin nội bộ, không thể tạo tài khoản Admin qua luồng thông thường.
- Store Owner đăng nhập sai 5 lần liên tiếp → hệ thống khóa tạm thời theo thứ tự tăng
  dần: 1 phút → 5 phút → 30 phút cho mỗi lần vượt ngưỡng tiếp theo; hệ thống hiển thị
  thời gian chờ còn lại cho Store Owner.
- Admin cố vô hiệu hóa tài khoản duy nhất đang `active` trong hệ thống → hệ thống vẫn
  cho phép (không có ràng buộc tối thiểu tài khoản active).
- Gửi email thông báo thất bại (lỗi SMTP, địa chỉ không hợp lệ) → thao tác chính vẫn
  hoàn thành; hệ thống tự động retry email tối đa 3 lần; in-app notification gửi thành
  công bình thường; lỗi được ghi log để Admin theo dõi.

---

## Clarifications

### Session 2026-04-05

- Q: Khi Store Owner đăng ký và nhập tên gian hàng, Store entity được tạo khi nào? → A: Tạo `Store` entity ngay khi đăng ký ở trạng thái `inactive`, liên kết với `StoreOwnerAccount` ngay lập tức.
- Q: Chính sách giới hạn đăng nhập sai (brute-force) là gì? → A: Khóa tạm thời tăng dần sau mỗi 5 lần sai liên tiếp: 1 phút → 5 phút → 30 phút (exponential backoff). Sau khi đạt mức 30 phút, mọi lần vượt ngưỡng tiếp theo giữ nguyên 30 phút (không tăng thêm).
- Q: Hệ thống có nhiều Admin không? → A: Có thể có nhiều Admin; tài khoản Admin được tạo thủ công qua script/seeding khi deploy, không qua giao diện.
- Q: Hành vi khi gửi email thông báo thất bại? → A: Thao tác vẫn hoàn thành; email tự động retry tối đa 3 lần; in-app notification gửi thành công bình thường; lỗi email ghi log để theo dõi.
- Q: Thời hạn phiên đăng nhập của Store Owner? → A: 8 giờ hoạt động; tự động hết hạn sau 24 giờ idle; Store Owner phải đăng nhập lại khi phiên hết hạn.
- Q: Thời hạn phiên đăng nhập của Admin? → A: Admin dùng access token JWT không có refresh mechanism; token hết hạn sau 8 giờ và Admin phải đăng nhập lại thủ công. Không có idle timeout riêng cho Admin ở MVP.

---

## Requirements

### Functional Requirements

- **FR-001**: Hệ thống PHẢI cho phép Store Owner tự đăng ký tài khoản với các trường bắt
  buộc: họ tên, email, số điện thoại, mật khẩu, tên gian hàng, lý do đăng ký. (BR-01.3)
- **FR-002**: Tài khoản Store Owner PHẢI được tạo ở trạng thái `pending` ngay sau khi đăng
  ký; không thể đăng nhập cho đến khi Admin phê duyệt. (BR-01.5)
- **FR-002b**: Hệ thống PHẢI tạo entity `Store` ngay khi Store Owner đăng ký, ở trạng thái
  `inactive`, liên kết với `StoreOwnerAccount` vừa tạo. `Store` chỉ hiển thị công khai
  sau khi Admin phê duyệt tài khoản và kích hoạt gian hàng.
- **FR-003**: Hệ thống PHẢI gửi email xác nhận đến Store Owner sau khi đăng ký thành công
  và thông báo (email + in-app) đến Admin. (BR-07.4)
- **FR-004**: Admin PHẢI có thể xem danh sách tài khoản Store Owner đang `pending` và xem
  chi tiết thông tin đăng ký.
- **FR-005**: Admin PHẢI có thể phê duyệt tài khoản Store Owner; hệ thống chuyển trạng
  thái sang `active` và thông báo Store Owner qua email + in-app. (BR-07.3)
- **FR-006**: Admin PHẢI có thể từ chối tài khoản Store Owner kèm lý do bắt buộc; hệ
  thống thông báo kèm lý do đến Store Owner qua email + in-app. (BR-07.3)
- **FR-007**: Store Owner đã `active` PHẢI có thể đăng nhập bằng email và mật khẩu.
- **FR-008**: Hệ thống PHẢI hiển thị thông báo trạng thái phù hợp khi Store Owner đăng
  nhập với tài khoản `pending`, `inactive`, hoặc `rejected`; mỗi trạng thái có thông báo
  riêng biệt để Store Owner hiểu lý do bị chặn.
- **FR-009**: Admin PHẢI có thể vô hiệu hóa tài khoản `active`; tài khoản bị vô hiệu hóa
  không thể đăng nhập và Store Owner nhận thông báo. (BR-01.4)
- **FR-010**: Admin PHẢI có thể kích hoạt lại tài khoản `inactive` và thông báo Store Owner.
- **FR-011**: Admin PHẢI có thể tìm kiếm và lọc tài khoản Store Owner theo tên, email,
  trạng thái.
- **FR-012**: Hệ thống PHẢI ngăn đăng ký với email đã tồn tại trong hệ thống.
- **FR-012b**: Hệ thống PHẢI khóa tạm thời tài khoản Store Owner sau mỗi 5 lần đăng nhập
  sai liên tiếp với thời gian tăng dần (1 phút → 5 phút → 30 phút); hiển thị thời gian
  chờ còn lại.
- **FR-013**: Admin PHẢI đăng nhập qua giao diện riêng; không có luồng đăng ký công khai
  cho Admin. (BR-01.4) Hệ thống hỗ trợ nhiều tài khoản Admin; tài khoản được khởi tạo
  thủ công qua script/seeding khi deploy.
- **FR-014**: Hệ thống PHẢI hiển thị cảnh báo xác nhận khi Admin vô hiệu hóa tài khoản
  Store Owner có nội dung đang chờ duyệt.

### Key Entities

- **StoreOwnerAccount**: Tài khoản Store Owner với các trạng thái `pending / active /
  inactive / rejected`; chứa thông tin đăng ký (họ tên, email, số điện thoại, lý do
  đăng ký); liên kết 1-1 với `Store` entity được tạo đồng thời lúc đăng ký.
- **Store**: Entity gian hàng được tạo ngay khi Store Owner đăng ký, trạng thái `inactive`;
  chứa tên gian hàng ban đầu; chỉ hiển thị công khai khi Admin kích hoạt (spec 002).
- **AdminAccount**: Tài khoản nội bộ với quyền quản trị toàn hệ thống; hỗ trợ nhiều Admin;
  không tạo qua luồng đăng ký công khai — được khởi tạo thủ công qua script/seeding
  trong quá trình deploy hệ thống.
- **Notification**: Sự kiện thông báo gửi đến Admin hoặc Store Owner qua hai kênh email
  và in-app; gắn với loại sự kiện, người nhận, và nội dung kèm lý do khi cần.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Store Owner hoàn thành quy trình đăng ký trong vòng 3 phút.
- **SC-002**: Admin xem xét và phê duyệt/từ chối tài khoản trong vòng 5 thao tác kể từ
  khi mở trang danh sách chờ duyệt.
- **SC-003**: Thông báo kết quả duyệt tài khoản được gửi đến Store Owner trong vòng
  30 giây sau khi Admin thực hiện thao tác.
- **SC-004**: 100% tài khoản ở trạng thái `pending` hoặc `inactive` bị chặn đăng nhập.
- **SC-005**: Toàn bộ luồng đăng ký → chờ duyệt → phê duyệt → đăng nhập hoàn thành
  không có bước thủ công nào ngoài thao tác xét duyệt của Admin.

---

## Assumptions

- Admin được cấp thông tin đăng nhập nội bộ trước khi hệ thống ra mắt; luồng "quên mật
  khẩu" cho Admin nằm ngoài phạm vi spec này.
- Email là định danh duy nhất cho tài khoản Store Owner.
- Chức năng đặt lại mật khẩu cho Store Owner nằm ngoài phạm vi MVP này.
- Hệ thống thông báo in-app được xây dựng ở mức cơ bản (badge số chưa đọc + danh sách
  thông báo); giao diện chi tiết mở rộng ở các spec sau nếu cần.
- Phạm vi spec này không bao gồm Google OAuth cho Customer (thuộc spec 004).
- Phiên đăng nhập Store Owner có hiệu lực 8 giờ kể từ lần hoạt động cuối; tự động hết
  hạn sau 24 giờ idle; hệ thống redirect về trang đăng nhập khi phiên hết hạn.
- Admin không có refresh token; session kết thúc sau 8 giờ và Admin đăng nhập lại thủ
  công. Không có cơ chế idle timeout riêng cho Admin ở giai đoạn MVP.
- Trạng thái `rejected` là trạng thái cuối — không có transition ra khỏi `rejected`. Store
  Owner bị từ chối không thể tái đăng ký với cùng email (FR-012 áp dụng mọi trạng thái).
  Admin liên hệ trực tiếp nếu cần giải quyết trường hợp ngoại lệ.
- Kiểm tra "nội dung đang chờ duyệt" trong cảnh báo vô hiệu hóa (FR-014) được triển khai
  dưới dạng placeholder trả về `false` ở MVP (spec 002 chưa tồn tại); cảnh báo sẽ hoạt
  động thực khi tích hợp spec 002 hoàn thành.

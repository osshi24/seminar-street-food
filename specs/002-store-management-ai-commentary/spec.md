# Feature Specification: Quản lý gian hàng & Thuyết minh AI

**Feature Branch**: `002-store-management-ai-commentary`
**Created**: 2026-04-05
**Status**: Draft
**Business Rules**: BR-02.1, BR-02.2, BR-02.3, BR-03.1, BR-03.2, BR-03.3, BR-03.4,
BR-03.5, BR-03.6, BR-08.1, BR-08.2, BR-08.3, BR-08.4
**Depends on**: spec 001 (tài khoản Store Owner đã được phê duyệt)

---

## User Scenarios & Testing

### User Story 1 — Store Owner chỉnh sửa thông tin gian hàng và gửi Admin duyệt (Priority: P1)

Store Owner đăng nhập, vào trang quản lý gian hàng, chỉnh sửa tên, mô tả, danh sách món
ăn và hình ảnh. Sau khi lưu, toàn bộ thay đổi ở trạng thái chờ duyệt — thông tin cũ vẫn
hiển thị công khai cho đến khi Admin phê duyệt.

**Why this priority**: Đây là luồng tạo nội dung cốt lõi. Không có nội dung được duyệt
thì Customer không thể xem bất cứ thứ gì trên hệ thống.

**Independent Test**: Store Owner chỉnh sửa mô tả → lưu → xác nhận trạng thái `pending`
→ xác nhận thông tin cũ vẫn hiển thị công khai → Admin nhận thông báo.

**Acceptance Scenarios**:

1. **Given** Store Owner đã đăng nhập và gian hàng không đang chờ duyệt, **When** chỉnh
   sửa thông tin và lưu, **Then** thay đổi ở trạng thái `pending`, thông tin cũ vẫn công
   khai, Admin nhận thông báo qua email + in-app.
2. **Given** Thông tin gian hàng đang `pending`, **When** Store Owner cố chỉnh sửa, **Then**
   hệ thống hiển thị cảnh báo và chặn; Store Owner phải thu hồi trước.
3. **Given** Store Owner chọn "Thu hồi" bản đang chờ duyệt, **When** xác nhận, **Then**
   bản `pending` bị hủy, thông tin quay về bản hiện hành, Store Owner có thể chỉnh sửa lại.
4. **Given** Thông tin gian hàng bị Admin từ chối, **When** Store Owner vào trang quản lý,
   **Then** hệ thống hiển thị lý do từ chối và cho phép chỉnh sửa ngay.
5. **Given** Dữ liệu không hợp lệ (tên trống, ảnh quá dung lượng), **When** lưu, **Then**
   hệ thống hiển thị lỗi cụ thể và không lưu thay đổi.

---

### User Story 2 — Admin duyệt hoặc từ chối thông tin gian hàng (Priority: P1)

Admin nhận thông báo có nội dung gian hàng mới chờ duyệt, xem so sánh thông tin cũ và
mới, rồi phê duyệt (thông tin mới lên live, AI pipeline kích hoạt) hoặc từ chối kèm lý
do bắt buộc.

**Why this priority**: Cùng mức P1 với US1 — hai nửa của FLOW-02. Phê duyệt xong mới
kích hoạt được FLOW-04 (AI pipeline).

**Independent Test**: Gửi nội dung chờ duyệt → Admin phê duyệt → xác nhận thông tin mới
hiển thị công khai → xác nhận AI pipeline bắt đầu xử lý.

**Acceptance Scenarios**:

1. **Given** Có thông tin gian hàng đang `pending`, **When** Admin chọn "Phê duyệt",
   **Then** thông tin mới lên live, trường mô tả trở thành nội dung thuyết minh, hệ thống
   kích hoạt AI pipeline, Store Owner nhận thông báo.
2. **Given** Có thông tin gian hàng đang `pending`, **When** Admin chọn "Từ chối" và nhập
   lý do, **Then** thông tin cũ tiếp tục hiển thị, Store Owner nhận thông báo kèm lý do.
3. **Given** Admin chọn "Từ chối" nhưng không nhập lý do, **When** submit, **Then** hệ
   thống yêu cầu nhập lý do trước khi thực hiện.

---

### User Story 3 — AI Pipeline: dịch và tổng hợp audio thuyết minh (Priority: P1)

Sau khi Admin phê duyệt nội dung gian hàng, hệ thống tự động chạy pipeline: lấy trường
mô tả (tiếng Việt) → AI dịch sang ngôn ngữ yêu cầu → TTS tổng hợp audio từ bản dịch.
Kết quả phục vụ Customer theo ngôn ngữ đang dùng.

**Why this priority**: Đây là tính năng cốt lõi phân biệt hệ thống. Không có AI pipeline
thì Customer không có thuyết minh audio.

**Independent Test**: Phê duyệt nội dung gian hàng → Customer chọn ngôn ngữ → xác nhận
text thuyết minh hiển thị đúng ngôn ngữ → nhấn phát audio → xác nhận audio phát bằng
ngôn ngữ đó.

**Acceptance Scenarios**:

1. **Given** Nội dung gian hàng vừa được Admin phê duyệt, **When** AI pipeline hoàn thành,
   **Then** thuyết minh text và audio có sẵn cho mọi ngôn ngữ được hỗ trợ.
2. **Given** Customer đang dùng ngôn ngữ X, **When** xem trang chi tiết gian hàng, **Then**
   thuyết minh text hiển thị bằng ngôn ngữ X (dịch từ tiếng Việt bởi AI).
3. **Given** Customer chọn "Phát audio", **When** audio sẵn sàng, **Then** audio phát bằng
   ngôn ngữ X (TTS từ bản dịch ngôn ngữ X, không phải từ tiếng Việt gốc).
4. **Given** AI dịch hoặc TTS thất bại cho ngôn ngữ X, **When** Customer xem thuyết minh,
   **Then** hệ thống hiển thị text tiếng Việt + audio tiếng Việt và thông báo "Ngôn ngữ
   này tạm thời không khả dụng".

---

### User Story 4 — Customer duyệt danh sách gian hàng và xem chi tiết (Priority: P1)

Customer truy cập trang web, xem danh sách các gian hàng đang hoạt động, tìm kiếm theo
tên, chọn gian hàng để xem chi tiết (tên, mô tả, món ăn kèm giá, hình ảnh, thuyết minh).

**Why this priority**: Đây là giao diện Customer cơ bản nhất — nếu không có màn hình này
thì hệ thống chưa có giá trị sử dụng với người dùng cuối.

**Independent Test**: Truy cập web không cần đăng nhập → thấy danh sách gian hàng active
→ chọn gian hàng → thấy trang chi tiết đầy đủ thông tin.

**Acceptance Scenarios**:

1. **Given** Có ít nhất một gian hàng `active`, **When** Customer truy cập trang chủ,
   **Then** hệ thống hiển thị danh sách các gian hàng đang hoạt động (không cần đăng nhập).
2. **Given** Customer tìm kiếm theo tên gian hàng, **When** nhập từ khóa, **Then** hệ thống
   lọc và hiển thị kết quả phù hợp.
3. **Given** Customer chọn một gian hàng, **When** vào trang chi tiết, **Then** hệ thống
   hiển thị: tên, mô tả, danh sách món ăn kèm giá, hình ảnh, và thuyết minh theo ngôn ngữ
   hiện tại.
4. **Given** Gian hàng bị vô hiệu hóa (inactive), **When** Customer truy cập trang chi tiết,
   **Then** hệ thống hiển thị thông báo "Gian hàng hiện không hoạt động".
5. **Given** Gian hàng chưa có thuyết minh được duyệt, **When** Customer vào trang chi tiết,
   **Then** khu vực thuyết minh hiển thị "Chưa có nội dung thuyết minh".

---

### User Story 5 — Customer chuyển ngôn ngữ (Priority: P2)

Customer chủ động thay đổi ngôn ngữ hiển thị; giao diện và nội dung thuyết minh cập nhật
theo ngôn ngữ được chọn. Lần đầu truy cập hệ thống tự động chọn ngôn ngữ theo trình duyệt.

**Why this priority**: Phụ thuộc US3 (AI pipeline). Là tính năng đa ngôn ngữ, giá trị cốt
lõi cho khách quốc tế.

**Independent Test**: Truy cập web → xác nhận ngôn ngữ tự động khớp trình duyệt → chuyển
sang ngôn ngữ khác → xác nhận giao diện và thuyết minh cập nhật.

**Acceptance Scenarios**:

1. **Given** Customer truy cập lần đầu, **When** trang load, **Then** hệ thống tự động hiển
   thị ngôn ngữ theo cài đặt trình duyệt.
2. **Given** Customer chọn ngôn ngữ khác từ menu, **When** xác nhận, **Then** toàn bộ giao
   diện và nội dung thuyết minh cập nhật sang ngôn ngữ được chọn.
3. **Given** AI không hỗ trợ ngôn ngữ được chọn, **When** chuyển ngôn ngữ, **Then** hệ
   thống hiển thị nội dung tiếng Việt và thông báo "Ngôn ngữ này tạm thời không khả dụng".

---

### Edge Cases

- Store Owner thêm món ăn mới: nhập tên món, mô tả, giá; hệ thống thêm vào danh sách
  trong bản chờ duyệt.
- Store Owner xóa món ăn: hệ thống yêu cầu xác nhận trước khi xóa khỏi bản chờ duyệt.
- Admin phê duyệt nội dung đúng lúc Store Owner đang thu hồi → hệ thống thông báo "Thông
  tin đã được Admin duyệt. Không thể thu hồi." và cập nhật lại trạng thái hiển thị.
- Mỗi gian hàng chỉ có một bản thuyết minh chính thức hoạt động tại một thời điểm; khi
  Admin phê duyệt bản mới, bản cũ bị thay thế.
- AI pipeline thất bại một phần (dịch thành công nhưng TTS lỗi) → chỉ phục vụ text,
  không có audio; thông báo cho Customer rằng audio tạm thời không khả dụng.
- AI pipeline đang chạy (chưa hoàn thành) sau khi Admin phê duyệt → Customer thấy text
  tiếng Việt ngay lập tức kèm thông báo "Audio đang được tổng hợp..."; audio tự động
  xuất hiện khi pipeline hoàn thành, không cần Customer reload trang.
- Gian hàng bị Admin vô hiệu hóa trong lúc AI pipeline đang chạy → pipeline kết thúc
  bình thường nhưng kết quả chỉ được phục vụ khi gian hàng active trở lại.

---

## Requirements

### Functional Requirements

- **FR-001**: Hệ thống PHẢI cho phép Store Owner chỉnh sửa thông tin gian hàng: tên, mô
  tả (tối đa 1000 ký tự), danh sách món ăn (kèm giá), hình ảnh (tối đa 10 ảnh, mỗi ảnh
  ≤10MB). (BR-02.2)
- **FR-002**: Thay đổi thông tin gian hàng PHẢI được lưu ở trạng thái `pending`; thông
  tin cũ vẫn hiển thị công khai cho đến khi Admin phê duyệt. (BR-02.3, FLOW-02)
- **FR-003**: Hệ thống PHẢI chặn Store Owner chỉnh sửa khi bản thay đổi đang `pending`;
  Store Owner PHẢI thu hồi trước khi chỉnh sửa. (BR-03.5)
- **FR-004**: Store Owner PHẢI có thể thu hồi bản đang `pending`; thông tin quay về bản
  hiện hành.
- **FR-005**: Hệ thống PHẢI gửi thông báo (email + in-app) đến Admin khi có thông tin
  gian hàng mới chờ duyệt. (BR-07.4)
- **FR-006**: Admin PHẢI có thể xem so sánh thông tin cũ và mới của gian hàng đang `pending`.
- **FR-007**: Admin PHẢI có thể phê duyệt thông tin gian hàng; thông tin mới lên live và
  hệ thống kích hoạt AI pipeline tự động. (BR-03.3, FLOW-02)
- **FR-008**: Admin PHẢI có thể từ chối thông tin gian hàng kèm lý do bắt buộc; Store Owner
  nhận thông báo kèm lý do và được phép chỉnh sửa gửi lại. (BR-03.4)
- **FR-009**: Trường mô tả gian hàng sau khi được Admin phê duyệt PHẢI đồng thời trở thành
  nội dung thuyết minh chính thức của gian hàng đó. (BR-03.6)
- **FR-010**: Hệ thống PHẢI tự động chạy AI pipeline sau khi phê duyệt: dịch mô tả tiếng
  Việt sang tất cả ngôn ngữ được hỗ trợ → TTS từ mỗi bản dịch → lưu text + audio vào
  storage. Customer đọc từ cache; không gọi AI lại mỗi request. Ngoại lệ ngôn ngữ tiếng
  Việt (`vi`): PHẢI bỏ qua bước dịch và dùng trực tiếp mô tả gốc tiếng Việt làm đầu vào
  TTS — không được dịch `vi → vi`. (BR-08.3, BR-08.4, FLOW-04, Principle III)
- **FR-011**: Hệ thống PHẢI tự động phát hiện ngôn ngữ trình duyệt của Customer và hiển
  thị giao diện + thuyết minh theo ngôn ngữ đó khi truy cập lần đầu. (BR-08.2)
- **FR-012**: Customer PHẢI có thể chủ động chuyển ngôn ngữ; toàn bộ giao diện và thuyết
  minh cập nhật theo. (BR-08.2)
- **FR-013**: Khi AI thất bại với ngôn ngữ được chọn, hệ thống PHẢI fallback về tiếng Việt
  và thông báo cho Customer. (Principle III constitution)
- **FR-014**: Customer PHẢI có thể xem danh sách gian hàng đang `active` và tìm kiếm theo
  tên gian hàng hoặc tên món ăn mà không cần đăng nhập. (BR-01.1)
- **FR-015**: Customer PHẢI có thể xem trang chi tiết gian hàng: tên, mô tả, món ăn kèm
  giá, hình ảnh, thuyết minh text, và phát audio thuyết minh. (BR-01.1)
- **FR-016**: Mỗi gian hàng PHẢI có đúng một bản thuyết minh chính thức đang hoạt động tại
  một thời điểm; khi Admin phê duyệt bản mới, `stores.active_commentary_id` cập nhật sang
  bản mới — bản cũ vẫn được giữ lại trong DB cho mục đích audit, không bị xóa. (BR-03.6)

### Key Entities

- **Store**: Gian hàng với thông tin: tên, mô tả, danh sách món ăn, hình ảnh, trạng thái
  (`active / inactive`); liên kết với Store Owner và bản thuyết minh đang hoạt động.
- **StoreContentDraft**: Bản thay đổi thông tin gian hàng đang chờ duyệt với trạng thái
  `pending / approved / rejected`; lưu thông tin mới và lý do từ chối khi cần.
- **MenuItem**: Món ăn thuộc một gian hàng với tên, mô tả, giá.
- **Commentary**: Bản thuyết minh chính thức của gian hàng (nội dung gốc tiếng Việt từ
  trường mô tả đã được duyệt); liên kết với các bản dịch đã được AI xử lý.
- **CommentaryTranslation**: Bản dịch thuyết minh sang một ngôn ngữ cụ thể, bao gồm text
  đã dịch và đường dẫn audio TTS tương ứng.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Store Owner hoàn thành chỉnh sửa và gửi duyệt thông tin gian hàng trong vòng
  5 phút.
- **SC-002**: AI pipeline hoàn thành dịch và tổng hợp audio cho ít nhất 1 ngôn ngữ trong
  vòng 60 giây sau khi Admin phê duyệt.
- **SC-003**: Customer xem được thuyết minh text đúng ngôn ngữ ngay khi vào trang chi tiết
  gian hàng mà không cần thao tác thêm.
- **SC-004**: Khi AI thất bại, hệ thống fallback về tiếng Việt trong vòng 5 giây và hiển
  thị thông báo rõ ràng.
- **SC-005**: 100% nội dung gian hàng chưa được Admin phê duyệt không hiển thị công khai
  cho Customer.

---

## Clarifications

### Session 2026-04-05

- Q: Khi Customer chọn ngôn ngữ X, hệ thống gọi AI mỗi lần hay dùng bản dịch đã cache? → A: AI pipeline chạy một lần sau khi Admin phê duyệt, lưu toàn bộ bản dịch text + audio vào storage; Customer luôn đọc từ cache — không gọi AI lại mỗi request.
- Q: Customer thấy gì trong khi AI pipeline đang chạy sau phê duyệt? → A: Hiển thị text tiếng Việt ngay + thông báo "Audio đang được tổng hợp..."; audio tự động xuất hiện khi pipeline hoàn thành mà không cần Customer reload.
- Q: Giới hạn upload ảnh gian hàng? → A: Tối đa 10 ảnh mỗi gian hàng, mỗi ảnh ≤10MB.
- Q: Phạm vi tìm kiếm gian hàng của Customer? → A: Tìm theo tên gian hàng và tên món ăn.
- Q: Giới hạn độ dài nội dung mô tả/thuyết minh gian hàng? → A: Tối đa 1000 ký tự (~1.5 phút audio).

---

## Assumptions

- Số lượng ngôn ngữ AI hỗ trợ không bị giới hạn cố định; phụ thuộc vào dịch vụ AI được
  tích hợp.
- AI pipeline chạy bất đồng bộ sau khi Admin phê duyệt; toàn bộ bản dịch text và audio
  được tổng hợp một lần duy nhất và lưu vào storage. Customer luôn đọc từ cache — không
  gọi AI lại cho mỗi request. Khi nội dung được phê duyệt lần mới, pipeline chạy lại và
  ghi đè cache cũ.
- Mỗi gian hàng được upload tối đa 10 ảnh; mỗi ảnh không quá 10MB. Hệ thống từ chối
  upload khi vượt giới hạn và hiển thị thông báo lỗi cụ thể.
- Spec này không bao gồm tính năng Admin kích hoạt/vô hiệu hóa gian hàng (thuộc spec 001
  phần quản lý gian hàng của Admin) — chỉ bao gồm luồng nội dung gian hàng.
- Chức năng phát audio (play/pause/seek) là tính năng tiêu chuẩn của trình phát media;
  không cần xây dựng custom player phức tạp.
- Trường mô tả gian hàng giới hạn tối đa 1000 ký tự; hệ thống hiển thị bộ đếm ký tự
  còn lại khi Store Owner soạn thảo và chặn lưu khi vượt giới hạn.

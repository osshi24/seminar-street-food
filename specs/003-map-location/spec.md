# Feature Specification: Bản đồ & Vị trí gian hàng

**Feature Branch**: `003-map-location`
**Created**: 2026-04-05
**Status**: Draft
**Business Rules**: BR-04.1, BR-04.2, BR-04.3, BR-04.4, BR-04.5
**Depends on**: spec 001 (tài khoản Store Owner), spec 002 (gian hàng đã active)

---

## User Scenarios & Testing

### User Story 1 — Store Owner ghim vị trí gian hàng và gửi Admin duyệt (Priority: P1)

Store Owner vào mục "Vị trí gian hàng", thiết lập tọa độ bằng cách kéo thả trên bản đồ
hoặc nhập tọa độ thủ công, rồi gửi Admin phê duyệt. Vị trí chỉ hiển thị công khai sau
khi được duyệt.

**Why this priority**: Không có vị trí được duyệt thì bản đồ cho Customer trống rỗng và
tính năng GPS auto-play (spec 005) không hoạt động được.

**Independent Test**: Store Owner nhập tọa độ → gửi duyệt → xác nhận trạng thái `pending`
→ Admin duyệt → xác nhận ghim hiển thị trên bản đồ công khai.

**Acceptance Scenarios**:

1. **Given** Store Owner đã đăng nhập, **When** kéo thả ghim hoặc nhập tọa độ hợp lệ và
   gửi duyệt, **Then** vị trí lưu ở trạng thái `pending`, Admin nhận thông báo.
2. **Given** Store Owner nhập tọa độ không hợp lệ (ngoài phạm vi hợp lệ), **When** gửi,
   **Then** hệ thống hiển thị lỗi "Tọa độ không hợp lệ."
3. **Given** Store Owner nhập tọa độ nằm ngoài khu vực phố ẩm thực, **When** gửi, **Then**
   hệ thống hiển thị cảnh báo "Vị trí nằm ngoài phạm vi phố ẩm thực."

---

### User Story 2 — Admin duyệt, điều chỉnh hoặc từ chối ghim vị trí (Priority: P1)

Admin xem danh sách ghim đang chờ duyệt trên bản đồ, xác minh vị trí hợp lệ, rồi phê
duyệt (ghim hiển thị công khai), điều chỉnh tọa độ trước khi duyệt, hoặc từ chối kèm
lý do.

**Why this priority**: Cùng mức P1 với US1 — hai nửa của FLOW-03.

**Independent Test**: Gửi ghim chờ duyệt → Admin phê duyệt → xác nhận ghim hiển thị
trên bản đồ công khai cho Customer.

**Acceptance Scenarios**:

1. **Given** Có ghim đang `pending`, **When** Admin chọn "Phê duyệt", **Then** ghim hiển
   thị công khai trên bản đồ, Store Owner nhận thông báo.
2. **Given** Có ghim đang `pending`, **When** Admin điều chỉnh tọa độ rồi phê duyệt,
   **Then** ghim hiển thị với tọa độ đã điều chỉnh.
3. **Given** Có ghim đang `pending`, **When** Admin từ chối kèm lý do, **Then** ghim không
   hiển thị, Store Owner nhận thông báo kèm lý do.
4. **Given** Tọa độ mới trùng với ghim của gian hàng khác, **When** Admin xem xét, **Then**
   hệ thống hiển thị cảnh báo để Admin xem xét trước khi duyệt.
5. **Given** Admin xóa ghim của gian hàng đang active, **When** xác nhận xóa, **Then** ghim
   bị xóa, gian hàng không còn hiển thị trên bản đồ, Store Owner nhận thông báo.

---

### User Story 3 — Customer xem bản đồ và nhận chỉ đường (Priority: P1)

Customer truy cập bản đồ phố ẩm thực, thấy tất cả ghim vị trí của các gian hàng đang
active và đã được duyệt, chọn ghim để xem thông tin tóm tắt, rồi nhận chỉ đường đến
gian hàng đó.

**Why this priority**: Đây là tính năng điều hướng cốt lõi cho Customer tại phố ẩm thực.

**Independent Test**: Có ít nhất một gian hàng active với ghim đã duyệt → Customer vào
bản đồ → thấy ghim → chọn → nhận chỉ đường.

**Acceptance Scenarios**:

1. **Given** Có gian hàng active với ghim đã duyệt, **When** Customer vào bản đồ, **Then**
   hệ thống hiển thị các ghim vị trí tương ứng (không cần đăng nhập).
2. **Given** Customer chọn một ghim, **When** click/tap, **Then** hệ thống hiển thị thông
   tin tóm tắt gian hàng (tên, ảnh đại diện).
3. **Given** Customer chọn "Chỉ đường" và đã cấp quyền GPS, **When** xác nhận, **Then** hệ
   thống hiển thị route inline trên bản đồ từ vị trí hiện tại đến gian hàng.
4. **Given** Customer chọn "Chỉ đường" nhưng chưa cấp quyền GPS, **When** hệ thống yêu cầu
   quyền và Customer từ chối, **Then** hệ thống hiển thị ô nhập điểm xuất phát thủ công
   và render route từ điểm đó đến gian hàng inline trên bản đồ.
5. **Given** Không có ghim nào được duyệt, **When** Customer vào bản đồ, **Then** hệ thống
   hiển thị thông báo "Chưa có gian hàng nào trên bản đồ".

---

### User Story 4 — Customer chia sẻ vị trí hiện tại (Priority: P2)

Customer sử dụng tính năng chia sẻ vị trí GPS hiện tại qua đường link để người khác có
thể biết vị trí của mình tại phố ẩm thực.

**Why this priority**: Tính năng bổ trợ; phụ thuộc quyền GPS. Hữu ích nhưng không blocking
các tính năng cốt lõi.

**Independent Test**: Customer cấp quyền GPS → chọn "Chia sẻ vị trí" → hệ thống tạo link
→ Customer sao chép và xác nhận link dẫn đến đúng vị trí.

**Acceptance Scenarios**:

1. **Given** Customer cấp quyền GPS, **When** chọn "Chia sẻ vị trí", **Then** hệ thống
   lấy tọa độ và tạo đường link dẫn đến trang web hệ thống hiển thị vị trí Customer
   trên bản đồ tích hợp.
2. **Given** Customer từ chối cấp quyền GPS, **When** chọn "Chia sẻ vị trí", **Then** hệ
   thống hiển thị "Cần bật GPS để sử dụng chức năng này" và không tạo link.
3. **Given** GPS không xác định được vị trí (tín hiệu yếu), **When** chọn chia sẻ, **Then**
   hệ thống hiển thị thông báo lỗi và yêu cầu thử lại.

---

### Edge Cases

- Store Owner cập nhật tọa độ mới khi đã có ghim `approved` → bản cập nhật tạo bản ghi
  `LocationPin` mới ở trạng thái `pending`; ghim `approved` cũ vẫn hiển thị công khai;
  khi Admin duyệt bản mới, bản cũ tự động chuyển sang `superseded`.
- Admin xóa ghim trong khi Customer đang xem bản đồ → bản đồ cập nhật theo thời gian
  thực hoặc khi Customer refresh.
- Nhiều gian hàng có tọa độ rất gần nhau → bản đồ hiển thị cluster hoặc cho phép zoom
  để chọn riêng từng ghim.

---

## Requirements

### Functional Requirements

- **FR-001**: Store Owner PHẢI có thể thiết lập vị trí gian hàng bằng hai cách: kéo thả
  ghim trực tiếp trên bản đồ hoặc nhập tọa độ (latitude, longitude) thủ công. (BR-04.1)
- **FR-002**: Vị trí ghim PHẢI được lưu ở trạng thái `pending` sau khi Store Owner gửi;
  Admin nhận thông báo. (BR-04.2)
- **FR-003**: Admin PHẢI có thể phê duyệt, điều chỉnh tọa độ, hoặc từ chối ghim vị trí
  kèm lý do bắt buộc khi từ chối. (BR-04.3)
- **FR-004**: Ghim vị trí PHẢI chỉ hiển thị công khai sau khi Admin phê duyệt. (BR-04.2)
- **FR-005**: Admin PHẢI có thể xóa ghim của bất kỳ gian hàng nào; Store Owner nhận thông
  báo sau khi bị xóa. (BR-04.3)
- **FR-006**: Hệ thống PHẢI cảnh báo Admin khi tọa độ mới trùng với ghim của gian hàng
  khác.
- **FR-007**: Customer PHẢI có thể xem bản đồ với tất cả ghim đã duyệt của các gian hàng
  active mà không cần đăng nhập. (BR-04.4)
- **FR-008**: Customer PHẢI có thể xem thông tin tóm tắt gian hàng khi chọn ghim trên
  bản đồ.
- **FR-009**: Customer PHẢI có thể nhận chỉ đường hiển thị inline trên bản đồ từ vị trí
  hiện tại (GPS) hoặc điểm xuất phát thủ công đến gian hàng; route được render trực tiếp
  trên map provider tích hợp. (BR-04.4)
- **FR-010**: Customer PHẢI có thể chia sẻ vị trí GPS hiện tại qua đường link dẫn đến
  trang web hệ thống hiển thị vị trí đó trên bản đồ tích hợp; chức năng yêu cầu quyền
  GPS từ trình duyệt. (BR-04.5)
- **FR-011**: Khi Customer từ chối quyền GPS, hệ thống PHẢI graceful degrade cho tất cả
  các tính năng GPS: (a) Tính năng chỉ đường: thông báo và cung cấp phương án nhập thủ
  công điểm xuất phát; (b) Tính năng chia sẻ vị trí: thông báo "Cần bật GPS để sử dụng
  chức năng này" và KHÔNG tạo link chia sẻ. (Principle IV constitution)

### Key Entities

- **LocationPin**: Vị trí ghim của một gian hàng với tọa độ (latitude, longitude), trạng
  thái `pending / approved / rejected / superseded`; lưu nhiều bản ghi theo lịch sử;
  tại một thời điểm chỉ có tối đa một bản `approved` và một bản `pending` cho mỗi gian
  hàng. Khi bản `pending` được duyệt, bản `approved` cũ chuyển sang `superseded`.
- **FoodStreetBoundary**: Polygon định nghĩa ranh giới khu vực phố ẩm thực dưới dạng danh
  sách tọa độ đỉnh; được Admin cấu hình; dùng để validate tọa độ ghim của Store Owner.
- **Store** (tham chiếu từ spec 002): Gian hàng cần có trạng thái `active` để ghim hiển
  thị trên bản đồ công khai.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Store Owner thiết lập và gửi vị trí ghim trong vòng 2 phút.
- **SC-002**: Bản đồ tải và hiển thị tất cả ghim đã duyệt trong vòng 3 giây khi Customer
  mở trang bản đồ.
- **SC-003**: Customer nhận được chỉ đường đến gian hàng trong vòng 3 thao tác kể từ khi
  mở bản đồ.
- **SC-004**: 100% ghim chưa được Admin phê duyệt không hiển thị trên bản đồ công khai.

---

## Clarifications

### Session 2026-04-05

- Q: Ranh giới "khu vực phố ẩm thực" được định nghĩa theo hình dạng nào? → A: Polygon tùy chỉnh — Admin định nghĩa danh sách tọa độ đỉnh của khu vực; hệ thống kiểm tra tọa độ ghim có nằm trong polygon không.
- Q: Bản đồ Customer cập nhật khi nào sau khi Admin thay đổi ghim? → A: Cập nhật khi Customer reload hoặc mở lại trang bản đồ; không cần real-time.
- Q: Tính năng "Chỉ đường" hiển thị inline hay mở app ngoài? → A: Hiển thị inline trên trang web — route được render trực tiếp trên bản đồ tích hợp.
- Q: Link chia sẻ vị trí dẫn đến đâu? → A: Trang web của hệ thống hiển thị vị trí Customer trên bản đồ tích hợp (không dùng Google Maps external).
- Q: Ghim cũ xử lý thế nào khi Store Owner gửi cập nhật vị trí mới? → A: Lưu nhiều bản ghi LocationPin; ghim approved hiện tại giữ nguyên đến khi bản pending được duyệt; khi duyệt xong bản cũ chuyển sang trạng thái superseded.

---

## Assumptions

- Tích hợp bản đồ dùng provider bên thứ ba (ví dụ: Google Maps, OpenStreetMap); lựa chọn
  cụ thể sẽ được xác định trong giai đoạn plan.
- Ranh giới "khu vực phố ẩm thực" được định nghĩa là một polygon tùy chỉnh gồm danh sách
  tọa độ đỉnh; Admin cấu hình polygon này trong hệ thống; Store Owner không thể thay đổi.
  Hệ thống kiểm tra point-in-polygon khi Store Owner gửi tọa độ ghim.
- Mỗi gian hàng có đúng một ghim vị trí hoạt động tại một thời điểm.
- Bản đồ Customer không cập nhật real-time; dữ liệu ghim được tải khi Customer mở hoặc
  reload trang bản đồ.
- Tính năng cluster (gộp nhiều ghim gần nhau) phụ thuộc vào khả năng của map provider.

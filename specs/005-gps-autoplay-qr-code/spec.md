# Feature Specification: GPS Auto-Play & QR Code

**Feature Branch**: `005-gps-autoplay-qr-code`
**Created**: 2026-04-05
**Status**: Draft
**Business Rules**: BR-03.7, BR-03.8, BR-05.1, BR-05.2, BR-05.3
**Depends on**: spec 002 (thuyết minh AI đã duyệt), spec 003 (ghim vị trí đã duyệt)

---

## User Scenarios & Testing

### User Story 1 — Tự động phát thuyết minh khi Customer vào gần gian hàng 4m (Priority: P1)

Sau khi Customer cấp quyền GPS, hệ thống liên tục theo dõi vị trí. Khi Customer tiến vào
vùng bán kính 4m quanh một gian hàng có ghim đã duyệt và thuyết minh đã duyệt, hệ thống
tự động phát audio thuyết minh theo ngôn ngữ đang dùng — không cần thao tác thủ công.

**Why this priority**: Đây là tính năng trải nghiệm thực địa đặc trưng nhất của hệ thống
— lý do GPS được tích hợp.

**Independent Test**: Cấp quyền GPS → di chuyển vào vùng 4m của gian hàng → xác nhận
audio thuyết minh phát tự động → di chuyển ra ngoài → xác nhận không phát lại ngay.

**Acceptance Scenarios**:

1. **Given** Customer đã cấp quyền GPS và gian hàng có thuyết minh + ghim đã duyệt,
   **When** Customer vào vùng 4m, **Then** hệ thống tự động phát audio thuyết minh theo
   ngôn ngữ đang dùng mà không cần thao tác.
2. **Given** Customer đang trong vùng của nhiều gian hàng cùng lúc, **When** hệ thống phát
   hiện, **Then** chỉ phát thuyết minh của gian hàng gần nhất.
3. **Given** Audio đang phát, **When** Customer chọn dừng hoặc bỏ qua, **Then** audio dừng
   ngay lập tức.
4. **Given** Customer từ chối quyền GPS, **When** truy cập trang web, **Then** tính năng
   auto-play bị vô hiệu hóa và hệ thống hiển thị thông báo yêu cầu bật GPS.
5. **Given** Customer đã cấp quyền GPS sau đó tắt GPS giữa chừng, **When** hệ thống phát
   hiện mất quyền, **Then** tính năng auto-play dừng lại và hiển thị thông báo yêu cầu
   bật lại.

---

### User Story 2 — Store Owner tạo QR Code cho gian hàng (Priority: P2)

Store Owner tạo mã QR dẫn đến trang chi tiết gian hàng trên web, tải xuống để in hoặc
hiển thị tại quầy. QR chỉ có thể tạo khi gian hàng đang active.

**Why this priority**: Tính năng marketing hỗ trợ; không blocking trải nghiệm Customer
trực tiếp nhưng tạo kênh tiếp cận thứ hai.

**Independent Test**: Gian hàng đang active → Store Owner tạo QR → tải xuống → quét QR
→ xác nhận dẫn đến đúng trang chi tiết gian hàng.

**Acceptance Scenarios**:

1. **Given** Gian hàng đang `active`, **When** Store Owner chọn "Tạo QR code", **Then**
   hệ thống sinh QR code liên kết đến trang chi tiết gian hàng và cung cấp tải xuống
   PNG/PDF.
2. **Given** Gian hàng đang `inactive`, **When** Store Owner cố tạo QR, **Then** hệ thống
   thông báo "Gian hàng cần được Admin kích hoạt trước khi tạo QR code."
3. **Given** QR code đã tạo và gian hàng đang `active`, **When** Customer quét QR, **Then**
   hệ thống điều hướng đến trang chi tiết gian hàng.
4. **Given** QR code đã tạo nhưng gian hàng bị vô hiệu hóa (`inactive`), **When** Customer
   quét QR, **Then** hệ thống trả về trang thông báo lỗi, không điều hướng đến nội dung
   gian hàng. (BR-05.3)

---

### Edge Cases

- Customer đứng đúng ranh giới 4m (trong/ngoài liên tục) → hệ thống áp dụng debounce để
  tránh phát/dừng liên tục.
- Gian hàng có ghim đã duyệt nhưng thuyết minh chưa duyệt → auto-play không kích hoạt
  cho gian hàng đó dù Customer vào vùng 4m.
- Nhiều gian hàng liền kề và Customer di chuyển liên tục → hệ thống chỉ phát thuyết minh
  của gian hàng gần nhất tại từng thời điểm; không chồng chéo audio.
- Store Owner tạo QR code khi gian hàng đang active; sau đó gian hàng bị vô hiệu hóa →
  QR code đã tạo tự động chuyển sang hành vi inactive (trả về trang lỗi) mà không cần
  tạo lại QR.

---

## Requirements

### Functional Requirements

- **FR-001**: Hệ thống PHẢI yêu cầu quyền GPS từ trình duyệt trước khi kích hoạt tính năng
  auto-play; nếu từ chối, tính năng bị vô hiệu hóa hoàn toàn. (BR-03.8, Principle IV)
- **FR-002**: Hệ thống PHẢI liên tục theo dõi vị trí GPS của Customer sau khi được cấp
  quyền. (BR-03.7)
- **FR-003**: Hệ thống PHẢI tự động phát audio thuyết minh khi Customer vào vùng bán kính
  **4 mét** quanh gian hàng có đủ điều kiện (ghim đã duyệt + thuyết minh đã duyệt).
  (BR-03.7, FLOW-05)
- **FR-004**: Khi nhiều gian hàng trong vùng 4m cùng lúc, hệ thống PHẢI chỉ phát thuyết
  minh của gian hàng gần nhất. (FLOW-05)
- **FR-005**: Customer PHẢI có thể dừng hoặc bỏ qua audio đang phát bất kỳ lúc nào.
- **FR-006**: Khi Customer mất quyền GPS giữa chừng (tắt GPS hoặc thu hồi quyền), hệ thống
  PHẢI vô hiệu hóa auto-play và hiển thị thông báo yêu cầu bật lại. (BR-03.8)
- **FR-007**: Hệ thống PHẢI áp dụng cơ chế chống phát lặp lại liên tục khi Customer đứng
  ở ranh giới vùng 4m (debounce).
- **FR-008**: Store Owner PHẢI có thể tạo QR code cho gian hàng đang `active`; QR liên kết
  đến trang chi tiết gian hàng. (BR-05.1, BR-05.2)
- **FR-009**: Store Owner PHẢI có thể tải xuống QR code ở định dạng PNG và PDF. (UC-SO05)
- **FR-010**: Khi gian hàng ở trạng thái `inactive`, QR code PHẢI trả về trang thông báo
  lỗi và không điều hướng đến nội dung gian hàng. (BR-05.3)
- **FR-011**: Hệ thống PHẢI ngăn Store Owner tạo QR code khi gian hàng đang `inactive`.

## Clarifications

### Session 2026-04-05

- Q: Fallback khi trình duyệt chặn autoplay? → A: Hiển thị banner nhỏ "Nhấn để nghe thuyết minh" khi Customer vào vùng 4m; Customer tap một lần để phát; banner tự ẩn sau khi tap hoặc rời vùng.
- Q: Audio có tự dừng khi Customer rời khỏi vùng 4m không? → A: Không — audio tiếp tục phát sau khi rời vùng; Customer tự dừng bằng nút điều khiển; hệ thống không tự dừng khi rời vùng.
- Q: Debounce — khi Customer quay lại vùng 4m của gian hàng đã phát, hệ thống xử lý thế nào? → A: Không phát lại trong cùng phiên (session); mỗi gian hàng chỉ kích hoạt auto-play một lần duy nhất cho đến khi Customer reload hoặc mở lại trang.
- Q: Khi Store Owner tạo QR mới, QR cũ xử lý thế nào? → A: QR cũ bị vô hiệu hóa ngay lập tức; chỉ QR mới nhất hoạt động; QR cũ trả về trang lỗi khi quét.
- Q: Độ trễ tối đa từ khi vào vùng 4m đến khi audio phát? → A: Tối đa 1 giây; ưu tiên trải nghiệm mượt mà tại thực địa.

---

### Key Entities

- **ProximitySession**: Trạng thái theo dõi vị trí GPS của Customer trong một phiên; ghi
  nhận gian hàng gần nhất và trạng thái auto-play hiện tại.
- **QRCode**: Mã QR liên kết với một gian hàng cụ thể; hành vi điều hướng phụ thuộc vào
  trạng thái active/inactive của gian hàng tại thời điểm quét; mỗi gian hàng chỉ có một
  QR Code hiệu lực tại một thời điểm — khi tạo mới, QR cũ bị vô hiệu hóa ngay lập tức.
- **Store** (tham chiếu spec 002): Cần có `status = active`, ghim đã duyệt (spec 003), và
  thuyết minh đã duyệt (spec 002) để auto-play hoạt động.

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Thời gian từ khi Customer vào vùng 4m đến khi audio bắt đầu phát không quá
  1 giây.
- **SC-002**: 100% trường hợp gian hàng inactive, QR code trả về trang thông báo lỗi thay
  vì trang nội dung.
- **SC-003**: Khi nhiều gian hàng trong vùng 4m, hệ thống chỉ phát đúng 1 audio (của gian
  hàng gần nhất), không phát đồng thời.
- **SC-004**: Store Owner tạo và tải xuống QR code trong vòng 3 thao tác.

---

## Assumptions

- Theo dõi vị trí GPS dùng Browser Geolocation API (Geolocation.watchPosition); độ chính
  xác phụ thuộc thiết bị và môi trường thực địa.
- Ngưỡng 4m là yêu cầu kinh doanh cố định; không có cấu hình linh hoạt theo gian hàng
  trong phạm vi MVP.
- QR code được sinh phía server; URL nhúng trong QR trỏ về trang chi tiết gian hàng,
  trạng thái active/inactive được kiểm tra tại thời điểm quét (realtime).
- Khi trình duyệt chặn autoplay (browser autoplay policy), hệ thống hiển thị banner nhỏ
  "Nhấn để nghe thuyết minh" thay vì phát tự động; Customer chỉ cần một lần tap để phát.
  Banner xuất hiện khi Customer vào vùng 4m và biến mất sau khi Customer tap hoặc rời vùng.
- Audio không tự dừng khi Customer rời vùng 4m; Customer kiểm soát hoàn toàn việc dừng
  audio bằng nút điều khiển; auto-play chỉ kích hoạt khi vào vùng mới, không khi rời vùng.
- Mỗi gian hàng chỉ kích hoạt auto-play một lần trong một phiên (session); nếu Customer
  quay lại vùng 4m của gian hàng đã phát, hệ thống không phát lại cho đến khi reload trang.

# Feature Specification: Gợi ý món ăn theo sở thích

**Feature Branch**: `006-food-recommendation`
**Created**: 2026-04-05
**Status**: Draft
**Business Rules**: BR-01.1, BR-02.3
**Depends on**: spec 002 (gian hàng và món ăn đã active)

---

## User Scenarios & Testing

### User Story 1 — Customer nhận gợi ý món ăn phù hợp với sở thích (Priority: P1)

Customer chọn tính năng "Gợi ý món ăn", chọn các nhãn sở thích (loại món, khẩu vị, dị
ứng thực phẩm...) rồi xác nhận. Hệ thống trả về danh sách món ăn phù hợp cùng gian hàng
tương ứng. Không yêu cầu đăng nhập.

**Why this priority**: Đây là tính năng khám phá chủ động — hỗ trợ Customer không biết
bắt đầu tìm gì. Có thể dùng độc lập hoàn toàn.

**Independent Test**: Chọn một số nhãn sở thích → xác nhận → danh sách gợi ý trả về đúng
các món phù hợp với nhãn đã chọn và gian hàng tương ứng đang active.

**Acceptance Scenarios**:

1. **Given** Có ít nhất một gian hàng active với món ăn trong hệ thống, **When** Customer
   chọn nhãn sở thích và xác nhận, **Then** hệ thống hiển thị danh sách món ăn phù hợp
   kèm tên gian hàng và giá.
2. **Given** Customer chọn một số nhãn nhưng không chọn đủ, **When** xác nhận, **Then**
   hệ thống vẫn trả về gợi ý dựa trên các nhãn đã chọn (không bắt buộc chọn đủ tất cả).
3. **Given** Không có món ăn nào phù hợp với nhãn đã chọn, **When** hệ thống xử lý, **Then**
   hiển thị thông báo "Không tìm thấy gợi ý phù hợp" và đề xuất thử lại với tiêu chí
   khác.
4. **Given** Customer xem kết quả gợi ý, **When** chọn một món ăn hoặc gian hàng, **Then**
   hệ thống điều hướng đến trang chi tiết gian hàng tương ứng.

---

### Edge Cases

- Tất cả gian hàng trong hệ thống đều inactive → hệ thống thông báo không có gợi ý và
  không hiển thị gian hàng inactive.
- Customer chọn tổ hợp nhãn mâu thuẫn (ví dụ: "ăn chay" và "hải sản") → hệ thống vẫn
  xử lý và trả về kết quả gần nhất hoặc thông báo không tìm thấy.
- Một món ăn thuộc nhiều nhãn sở thích cùng lúc → không hiển thị trùng trong kết quả.

---

## Requirements

### Functional Requirements

- **FR-001**: Customer PHẢI có thể sử dụng tính năng gợi ý món ăn mà không cần đăng nhập.
  (BR-01.1)
- **FR-002**: Hệ thống PHẢI hiển thị danh sách nhãn sở thích có sẵn để Customer chọn;
  nhãn bao gồm ít nhất các nhóm: loại món ăn, khẩu vị, dị ứng thực phẩm; Customer PHẢI
  KHÔNG thể chọn quá 5 nhãn trong một lần tìm gợi ý. (UC-C03)
- **FR-003**: Hệ thống PHẢI trả về gợi ý dựa trên các nhãn Customer đã chọn, dù không
  chọn đủ tất cả nhóm nhãn; kết quả PHẢI được sắp xếp theo số nhãn khớp giảm dần.
- **FR-004**: Kết quả gợi ý PHẢI chỉ bao gồm món ăn thuộc các gian hàng đang `active`.
  (BR-02.3)
- **FR-005**: Mỗi kết quả gợi ý PHẢI hiển thị: tên món, tên gian hàng, giá.
- **FR-006**: Khi không tìm thấy gợi ý phù hợp, hệ thống PHẢI hiển thị thông báo rõ ràng.
- **FR-007**: Customer PHẢI có thể chọn một kết quả gợi ý và được điều hướng đến trang
  chi tiết gian hàng tương ứng.
- **FR-011**: Kết quả gợi ý PHẢI được phân trang với 20 kết quả mỗi trang; Customer có
  thể tải thêm bằng nút "Xem thêm".
- **FR-008**: Kết quả gợi ý PHẢI không chứa món trùng lặp dù món đó khớp nhiều nhãn.
- **FR-009**: Admin PHẢI có thể thêm, sửa, và xóa PreferenceTag qua giao diện quản trị;
  thay đổi có hiệu lực ngay với toàn bộ món ăn đang được gắn nhãn đó.
- **FR-010**: Hệ thống PHẢI chặn xóa PreferenceTag nếu còn món ăn đang sử dụng nhãn đó;
  thông báo rõ số món đang dùng nhãn để Admin xử lý trước.
- **FR-012**: Store Owner PHẢI có thể gắn một hoặc nhiều PreferenceTag vào từng món ăn khi
  tạo hoặc chỉnh sửa danh sách món ăn; thay đổi gắn nhãn được lưu trong bản draft và áp
  dụng sau khi Admin phê duyệt thông tin gian hàng. (Tích hợp spec 002 — giao diện nằm
  trong Store Owner menu management; backend endpoint thuộc spec 006 scope)

### Key Entities

- **MenuItem** (tham chiếu spec 002): Món ăn với tên, mô tả, giá; liên kết với gian hàng.
  Cần bổ sung gắn nhãn sở thích (tags) vào entity này.
- **PreferenceTag**: Nhãn sở thích dùng để phân loại món ăn; thuộc các nhóm loại món,
  khẩu vị, dị ứng. Được quản lý bởi Admin (danh sách cố định).

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Customer nhận được danh sách gợi ý trong vòng 3 giây sau khi xác nhận sở
  thích.
- **SC-002**: Kết quả gợi ý chỉ bao gồm món ăn của gian hàng đang `active` — 100% không
  lọt gian hàng inactive.
- **SC-003**: Customer điều hướng từ kết quả gợi ý đến trang chi tiết gian hàng trong
  vòng 1 thao tác.

---

## Clarifications

### Session 2026-04-05

- Q: Thứ tự sắp xếp kết quả gợi ý? → A: Sắp xếp theo số nhãn khớp giảm dần — món khớp nhiều nhãn nhất hiển thị trước; nếu bằng nhau thì giữ nguyên thứ tự tự nhiên.
- Q: Admin quản lý PreferenceTag như thế nào? → A: Admin quản lý đầy đủ (thêm, sửa, xóa) qua giao diện admin; thay đổi ảnh hưởng ngay đến gắn nhãn món ăn.
- Q: Xóa PreferenceTag đang được dùng bởi món ăn? → A: Hệ thống chặn xóa và thông báo số món đang dùng nhãn đó; Admin phải gỡ nhãn khỏi tất cả món ăn trước khi có thể xóa nhãn.
- Q: Giới hạn số nhãn Customer chọn? → A: Giới hạn cứng tối đa 5 nhãn; không thể chọn thêm khi đã đạt giới hạn.
- Q: Số kết quả gợi ý hiển thị? → A: Phân trang — hiển thị 20 kết quả/trang; Customer bấm "Xem thêm" để tải trang tiếp theo.

---

## Assumptions

- Danh sách nhãn sở thích (PreferenceTag) được Admin quản lý đầy đủ (thêm, sửa, xóa) qua
  giao diện admin; thay đổi nhãn có hiệu lực ngay; không cho phép Customer tự thêm nhãn mới.
- Gắn nhãn món ăn (tagging) là trách nhiệm của Store Owner khi tạo/chỉnh sửa danh sách
  món ăn; FR-012 định nghĩa requirement này trong spec này; implementation endpoint nằm
  ở Store Owner menu management (spec 002 context) nhưng dùng PreferenceTag từ spec này.
- Thuật toán gợi ý dựa trên khớp nhãn (tag matching); kết quả sắp xếp theo số nhãn khớp
  giảm dần; phân trang 20 kết quả/trang; không yêu cầu AI phức tạp trong phạm vi MVP.
- Tính năng này hoạt động độc lập, không phụ thuộc đăng nhập hay vị trí GPS.

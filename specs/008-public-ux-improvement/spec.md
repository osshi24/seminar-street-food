# Feature Specification: Public UX Improvement & Dashboard Separation

**Feature Branch**: `008-public-ux-improvement`
**Created**: 2026-04-08
**Status**: Draft
**Input**: User description: "Cải thiện UX/UI: phân tách giao diện admin và store-owner, nâng cấp trải nghiệm người dùng public trên trang bản đồ, trang gian hàng và trang chủ theo bối cảnh phố ẩm thực"

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Khách dạo phố ẩm thực tìm gian hàng trên bản đồ (Priority: P1)

Người dùng đang đi bộ qua phố ẩm thực và muốn biết gian hàng nào đang ở gần mình. Họ mở trang bản đồ, thấy các điểm ghim trên bản đồ, chạm vào một gian hàng và xem thông tin nhanh (tên, ảnh, giá tham khảo). Từ đó họ có thể bấm "Chỉ đường" để điều hướng đến gian hàng, hoặc bấm "Nghe thuyết minh" để nghe giới thiệu về gian hàng.

**Why this priority**: Đây là use case cốt lõi của hệ thống — kết nối người dùng thực tế ngoài đường với thông tin gian hàng theo thời gian thực. Nếu bản đồ không usable thì toàn bộ tính năng GPS và thuyết minh không có giá trị.

**Independent Test**: Mở trang bản đồ → bấm vào một ghim gian hàng → thấy panel thông tin → bấm "Chỉ đường" → ứng dụng bản đồ hệ thống (Google Maps / Apple Maps) mở với điểm đến được điền sẵn.

**Acceptance Scenarios**:

1. **Given** người dùng đang ở trang bản đồ, **When** họ chạm vào một ghim gian hàng, **Then** một panel thông tin trượt lên từ dưới màn hình hiển thị ảnh, tên, mô tả ngắn, và giá tham khảo của gian hàng.
2. **Given** panel gian hàng đang mở, **When** người dùng bấm "Chỉ đường", **Then** ứng dụng bản đồ mặc định của thiết bị (Google Maps / Apple Maps) mở ra với tọa độ gian hàng làm điểm đến.
3. **Given** panel gian hàng đang mở, **When** người dùng bấm "Nghe thuyết minh", **Then** audio thuyết minh của gian hàng đó phát lên; nút chuyển thành "Dừng".
4. **Given** người dùng đang xem bản đồ với GPS đang bật và đến trong phạm vi 20 mét từ một gian hàng, **When** hệ thống phát hiện sự tiếp cận, **Then** ghim gian hàng đó nổi bật bằng animation pulse để thu hút sự chú ý.
5. **Given** không có gian hàng nào đang được chọn, **When** người dùng chạm vào vùng trống trên bản đồ, **Then** panel thông tin đóng lại và bản đồ trở về trạng thái bình thường.

---

### User Story 2 — Khách duyệt danh sách gian hàng và tìm theo sở thích (Priority: P2)

Người dùng muốn xem tổng quan tất cả gian hàng trong phố ẩm thực, tìm kiếm theo loại món, hoặc dùng tính năng gợi ý dựa trên nhãn sở thích. Họ duyệt qua danh sách, bấm vào một gian hàng để xem chi tiết đầy đủ.

**Why this priority**: Không phải ai cũng dùng bản đồ — nhiều người thích duyệt danh sách và lọc. Đây là bước vào chính của luồng gợi ý món ăn (spec 006).

**Independent Test**: Mở trang danh sách → chọn nhãn "Cơm" và "Không cay" → danh sách cập nhật → bấm một gian hàng → xem trang chi tiết với thực đơn đầy đủ.

**Acceptance Scenarios**:

1. **Given** người dùng ở trang danh sách, **When** trang tải xong, **Then** danh sách gian hàng hiển thị dưới dạng card với ảnh đại diện, tên, số lượng món, và trạng thái hoạt động.
2. **Given** người dùng ở trang danh sách, **When** họ chọn một hoặc nhiều nhãn sở thích, **Then** danh sách chỉ hiển thị những gian hàng có ít nhất một món khớp nhãn đó.
3. **Given** người dùng đang xem card gian hàng, **When** họ bấm "Xem chi tiết", **Then** trang chi tiết gian hàng hiển thị ảnh gallery, mô tả, địa chỉ, và toàn bộ thực đơn.
4. **Given** người dùng ở trang chi tiết, **When** họ bấm "Nghe thuyết minh" ngay trên ảnh bìa, **Then** audio thuyết minh phát tự động; đây là hành động nổi bật nhất trên trang.
5. **Given** không có gian hàng nào khớp nhãn lọc, **When** danh sách rỗng, **Then** hiển thị thông báo "Không tìm thấy gian hàng phù hợp. Thử bỏ bớt bộ lọc?" kèm nút "Xóa bộ lọc".

---

### User Story 3 — Khách đến trang chủ và biết ứng dụng là gì (Priority: P3)

Người dùng lần đầu mở ứng dụng hoặc trang web. Trang chủ giải thích rõ đây là phố ẩm thực nào, có gì nổi bật, và hướng dẫn nhanh 2 hành động chính: "Khám phá bản đồ" và "Xem danh sách gian hàng".

**Why this priority**: Trang chủ giúp người dùng lần đầu không bị lạc. Tuy nhiên người đang đứng trong phố thường bỏ qua trang chủ và đi thẳng vào bản đồ hoặc danh sách.

**Independent Test**: Mở trang chủ → thấy tên phố ẩm thực + số lượng gian hàng + 2 CTA buttons → bấm "Khám phá bản đồ" → chuyển đến trang bản đồ.

**Acceptance Scenarios**:

1. **Given** người dùng mở trang chủ, **When** trang tải xong, **Then** họ thấy tên phố ẩm thực, ảnh bìa đại diện, số lượng gian hàng đang hoạt động, và 2 nút kêu gọi hành động chính.
2. **Given** người dùng ở trang chủ, **When** họ bấm "Khám phá bản đồ", **Then** họ được điều hướng đến trang bản đồ.
3. **Given** người dùng ở trang chủ, **When** họ bấm "Xem gian hàng", **Then** họ được điều hướng đến trang danh sách gian hàng.
4. **Given** người dùng dùng thiết bị mobile, **When** trang chủ hiển thị, **Then** toàn bộ nội dung và nút bấm có kích thước đủ lớn để chạm tay (tối thiểu 44×44px).

---

### User Story 4 — Admin quản lý hệ thống không nhầm lẫn với giao diện Store Owner (Priority: P4)

Admin đăng nhập vào hệ thống và thấy ngay giao diện quản trị rõ ràng, tách biệt hoàn toàn về visual và routing với dashboard của Store Owner. Store Owner đăng nhập và thấy giao diện quản lý gian hàng của riêng họ. Hai bên không thể vô tình đi vào màn hình của nhau.

**Why this priority**: Quan trọng về bảo mật và UX, nhưng chỉ ảnh hưởng đến nội bộ (admin và store owner) chứ không phải khách hàng đại trà.

**Independent Test**: Đăng nhập bằng tài khoản Admin → chỉ thấy sidebar và nội dung admin (màu sắc, branding khác). Đăng nhập bằng tài khoản Store Owner → chỉ thấy sidebar và nội dung store owner. Truy cập URL admin từ store owner session → bị redirect về trang không có quyền.

**Acceptance Scenarios**:

1. **Given** admin đã đăng nhập, **When** họ xem layout, **Then** sidebar và header rõ ràng thể hiện "Admin Panel" với màu sắc và nhãn phân biệt khác hoàn toàn với giao diện public và store owner.
2. **Given** store owner đã đăng nhập, **When** họ xem layout, **Then** sidebar và header thể hiện "Dashboard Gian Hàng" với màu sắc và nhãn phân biệt khác hoàn toàn với admin.
3. **Given** người dùng là store owner, **When** họ cố truy cập một URL của admin (`/admin/...`), **Then** họ bị redirect về trang báo lỗi "Không có quyền truy cập".
4. **Given** admin đang ở sidebar, **When** họ nhìn menu, **Then** họ thấy các mục quản lý thuần admin: Gian hàng chờ duyệt, Tài khoản, Nhãn món ăn, Ghim bản đồ — không lẫn với menu của store owner.
5. **Given** store owner đang ở sidebar, **When** họ nhìn menu, **Then** họ thấy các mục thuộc gian hàng của họ: Thông tin gian hàng, Thực đơn, Ảnh, QR Code — không lẫn với menu admin.

---

### Edge Cases

- Điều gì xảy ra khi người dùng từ chối quyền định vị GPS? → Bản đồ vẫn hiển thị đầy đủ; nút "Dùng vị trí của tôi" hiển thị để mời bật lại; không có animation ghim.
- Điều gì xảy ra khi gian hàng không có audio thuyết minh? → Nút "Nghe thuyết minh" ẩn hoặc disabled kèm tooltip "Chưa có thuyết minh".
- Điều gì xảy ra khi người dùng mobile đang xem panel chi tiết và di chuyển bản đồ? → Panel vẫn mở, bản đồ scroll được; bấm nút X hoặc vuốt xuống mới đóng panel.
- Điều gì xảy ra khi gian hàng không có ảnh? → Hiển thị ảnh placeholder thể hiện food street aesthetic.
- Điều gì xảy ra khi người dùng dùng màn hình rất nhỏ (320px)? → Layout vẫn usable, không có scroll ngang.
- Điều gì xảy ra khi người dùng bấm "Xem trên bản đồ" từ trang chi tiết? → Chuyển về trang bản đồ và tự động mở panel của gian hàng đó.

---

## Requirements *(mandatory)*

### Functional Requirements

#### Public — Bản đồ

- **FR-001**: Khi người dùng chạm/click vào ghim gian hàng trên bản đồ, hệ thống PHẢI hiển thị panel thông tin nhanh của gian hàng đó ngay trong trang (không điều hướng sang trang khác).
- **FR-002**: Panel thông tin gian hàng PHẢI bao gồm: ảnh đại diện, tên gian hàng, mô tả ngắn (tối đa 2 dòng), khoảng giá tham khảo, nút "Chỉ đường", nút "Nghe thuyết minh" (nếu có audio), nút "Xem chi tiết".
- **FR-003**: Nút "Chỉ đường" PHẢI mở ứng dụng bản đồ mặc định của thiết bị với tọa độ gian hàng làm điểm đến.
- **FR-004**: Khi GPS được cấp quyền và người dùng đến trong phạm vi 20 mét từ một gian hàng, hệ thống PHẢI làm nổi bật ghim gian hàng đó bằng animation.
- **FR-005**: Bản đồ PHẢI hiển thị nút "Định vị tôi" để người dùng căn giữa bản đồ về vị trí hiện tại của mình.

#### Public — Trang chi tiết gian hàng

- **FR-006**: Trang chi tiết gian hàng PHẢI hiển thị nút "Nghe thuyết minh" ở vị trí nổi bật ngay dưới ảnh bìa (above the fold trên màn hình 375px).
- **FR-007**: Trang chi tiết PHẢI bao gồm: gallery ảnh (vuốt được trên mobile), địa chỉ có link "Xem trên bản đồ", danh sách món ăn kèm nhãn sở thích.
- **FR-008**: Khi người dùng bấm "Xem trên bản đồ" từ trang chi tiết, hệ thống PHẢI chuyển về trang bản đồ và tự động mở panel của gian hàng đó.

#### Public — Danh sách gian hàng

- **FR-009**: Trang danh sách PHẢI hỗ trợ lọc theo nhãn sở thích.
- **FR-010**: Mỗi card gian hàng PHẢI hiển thị: ảnh thumbnail, tên, số lượng món, và tối đa 3 nhãn sở thích phổ biến nhất.
- **FR-011**: Trang danh sách PHẢI hỗ trợ hai chế độ hiển thị: lưới (grid) và danh sách (list); người dùng có thể chuyển đổi.

#### Public — Trang chủ

- **FR-012**: Trang chủ PHẢI có tối thiểu 2 nút kêu gọi hành động: "Khám phá bản đồ" và "Xem gian hàng".
- **FR-013**: Trang chủ PHẢI hiển thị số lượng gian hàng đang hoạt động lấy từ dữ liệu thực.

#### Admin & Store Owner — Phân tách giao diện

- **FR-014**: Giao diện admin (`/admin/...`) PHẢI có visual identity riêng biệt (màu sắc, branding, nhãn layout) khác hoàn toàn với giao diện store owner và public.
- **FR-015**: Giao diện store owner PHẢI có visual identity riêng biệt khác với admin và public.
- **FR-016**: Hệ thống PHẢI redirect người dùng không có quyền về trang thông báo lỗi khi cố truy cập URL của role khác.
- **FR-017**: Sidebar admin PHẢI chỉ chứa các mục quản trị: Gian hàng chờ duyệt, Tài khoản người dùng, Nhãn món ăn, Ghim bản đồ, Thông báo.
- **FR-018**: Sidebar store owner PHẢI chỉ chứa các mục liên quan đến gian hàng của họ: Thông tin gian hàng, Thực đơn, Ảnh, QR Code.

### Key Entities

- **Store (Gian hàng)**: Thực thể trung tâm — tên, mô tả, địa chỉ, tọa độ GPS, ảnh gallery, audio thuyết minh, danh sách món ăn, trạng thái hoạt động.
- **LocationPin (Ghim bản đồ)**: Điểm ghim hiển thị trên bản đồ — tọa độ lat/lng, liên kết đến Store.
- **MenuItem (Món ăn)**: Thuộc Store — tên, giá, mô tả, danh sách nhãn sở thích.
- **PreferenceTag (Nhãn sở thích)**: Dùng để lọc và gợi ý — nhóm theo dish_type, flavor, allergen.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Người dùng trên mobile có thể chọn một gian hàng trên bản đồ và bắt đầu nghe thuyết minh trong vòng 3 lần chạm tính từ khi trang bản đồ hiển thị.
- **SC-002**: Người dùng có thể tìm thấy ít nhất 1 gian hàng phù hợp sở thích và điều hướng đến đó trong vòng 60 giây từ lúc mở ứng dụng.
- **SC-003**: Trang bản đồ, trang danh sách, và trang chi tiết đều usable trên màn hình 375px mà không cần scroll ngang.
- **SC-004**: Admin và Store Owner phân biệt được ngay mình đang ở giao diện nào thông qua màu sắc và nhãn header — không cần đọc URL.
- **SC-005**: Nút "Chỉ đường" mở đúng ứng dụng bản đồ mặc định với tọa độ chính xác trên cả iOS và Android.
- **SC-006**: Trang chi tiết gian hàng hiển thị đầy đủ thông tin (ảnh, thuyết minh, thực đơn, chỉ đường) trong một trang duy nhất mà không cần điều hướng thêm.

---

## Assumptions

- Người dùng public chủ yếu dùng điện thoại khi đang ở phố ẩm thực — mobile là ưu tiên thiết kế số 1 cho các trang public.
- Tính năng bản đồ nền đã có sẵn từ spec 003 — spec này chỉ bổ sung UX tương tác (panel, animation ghim, nút định vị).
- Audio thuyết minh đã được upload và lưu trữ từ spec 002 — spec này chỉ bổ sung điểm truy cập thuyết minh trên các trang.
- GPS auto-play đã được implement ở spec 005 — spec này bổ sung visual feedback animation ghim khi gần gian hàng.
- Hệ thống authentication hiện tại (Admin JWT, Store Owner JWT) giữ nguyên — chỉ thay đổi visual và routing guard.
- Deep link chỉ đường dùng Google Maps URL làm universal fallback trên mọi thiết bị.
- Không có tính năng đặt món hoặc thanh toán trong phạm vi spec này.
- Trang danh sách gian hàng hiện tại (`/stores`) được cải thiện UX thay vì tạo mới từ đầu.

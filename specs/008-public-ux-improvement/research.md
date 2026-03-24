# Research: Public UX Improvement & Dashboard Separation

**Branch**: `008-public-ux-improvement` | **Date**: 2026-04-08

---

## 1. Bottom-Sheet Panel trên bản đồ (Google Maps-style)

**Decision**: Dùng CSS-only bottom-sheet (absolute positioned div) được render trong cùng component với MapView; toggle bằng React state khi click marker.

**Rationale**:
- Leaflet popup (`bindPopup`) chỉ render HTML string thuần — không hỗ trợ React components hay Tailwind classes đầy đủ.
- Dùng `L.marker.on('click', callback)` để set state `selectedPin` trong React, rồi render `StoreBottomSheet` bên ngoài Leaflet DOM.
- Bottom-sheet được overlay lên bản đồ bằng `absolute bottom-0 left-0 right-0 z-[1000]` (z-index cao hơn Leaflet layer).
- Vuốt xuống / bấm X để đóng panel bằng state reset.

**Alternatives considered**:
- **Leaflet Popup nâng cao**: Hỗ trợ React portal vào popup DOM, nhưng phức tạp và dễ bị hydration mismatch với Next.js.
- **Modal dialog toàn màn hình**: Che khuất hoàn toàn bản đồ — không phù hợp UX Google Maps.
- **Side panel (desktop)**: Hợp lý cho desktop nhưng awkward trên mobile; bottom-sheet là pattern phổ quát nhất.

---

## 2. Deep link "Chỉ đường" đến ứng dụng bản đồ

**Decision**: Dùng Google Maps URL `https://www.google.com/maps/dir/?api=1&destination={lat},{lng}` mở trong `target="_blank"`.

**Rationale**:
- Universal fallback hoạt động trên mọi thiết bị (iOS, Android, desktop).
- iOS: nếu Google Maps được cài, hệ thống sẽ mở app; nếu không, mở browser.
- Android: tương tự — system chooser sẽ đề xuất Google Maps / Waze / các app navigation.
- Deep link `geo:lat,lng` chỉ hoạt động trên Android native và không được iOS Safari hỗ trợ tốt.
- Apple Maps deep link (`maps://`) chỉ hoạt động trên iOS Safari.

**Alternatives considered**:
- `geo:lat,lng`: chỉ Android, iOS không tin cậy → loại.
- `maps://maps.apple.com/?daddr=lat,lng`: chỉ iOS → loại.
- User-Agent detect để dùng deep link platform-specific: phức tạp, brittle → loại.

---

## 3. Animation ghim khi gần gian hàng

**Decision**: Dùng Leaflet `divIcon` với CSS animation `@keyframes pulse` inline. Khi `nearestStore` trong `useProximityDetection` thay đổi, swap icon của marker đó sang icon có class `animate-pulse-ring`.

**Rationale**:
- Đã có `useProximityDetection` hook từ spec 005 trả về `nearestStore`.
- Leaflet marker support `setIcon()` method để swap icon runtime.
- CSS `box-shadow` animation tạo hiệu ứng "pulse ring" tự nhiên như Google Maps nearby highlight.
- Không cần thêm thư viện animation.

**Alternatives considered**:
- Leaflet CircleMarker overlay: tạo vòng tròn riêng xung quanh ghim — nhiều DOM node hơn không cần thiết.
- Framer Motion trên divIcon: không hoạt động vì Leaflet divIcon render ngoài React tree.

---

## 4. Visual Identity phân tách Admin vs Store Owner

**Decision**:
- **Admin**: Sidebar `bg-slate-900` (dark), text trắng, active item `bg-slate-700`, header badge "Admin Panel" màu đỏ `bg-red-600`.
- **Store Owner**: Sidebar `bg-blue-700` (mid-blue), text trắng, active item `bg-blue-900`, header badge "Gian Hàng" màu xanh nhạt `bg-blue-100 text-blue-800`.
- Đổi toàn bộ label admin sidebar sang tiếng Việt để nhất quán với dashboard.

**Rationale**:
- Hiện tại cả hai đều dùng `bg-white` sidebar với `text-orange-600` active — không phân biệt được.
- Dark sidebar cho admin là convention phổ biến (Vercel, GitHub, Linear admin panels).
- Blue sidebar cho store owner phân biệt rõ với public orange theme nhưng vẫn thân thiện.
- Màu sắc header badge là visual cue nhanh nhất — người dùng nhìn vào góc trên trái là biết mình ở đâu.

**Alternatives considered**:
- Giữ `bg-white` nhưng thêm colored border-left: tinh tế quá, người dùng dễ bỏ qua.
- Dùng gradient: inconsistent với Tailwind utility-first approach trong codebase.

---

## 5. Lọc gian hàng theo nhãn sở thích (trang danh sách)

**Decision**: Dùng lại `TagSelector` component từ spec 006 + API `/api/tags`. Khi user chọn tag, fetch `/api/recommendations?tags=...` thay vì `/api/stores` để lấy danh sách gian hàng có món phù hợp; group kết quả theo `storeId`.

**Rationale**:
- API `/api/recommendations` đã có, trả về `items` với `storeId`. Group by `storeId` để hiển thị danh sách gian hàng (không phải món ăn).
- Không cần backend endpoint mới.
- Khi không có tag nào được chọn, fallback về `/api/stores` bình thường.

**Alternatives considered**:
- Thêm `?tagIds=` param vào `/api/stores`: cần modify backend — out of scope (spec này frontend-only).
- Hiển thị món ăn thay vì gian hàng khi lọc: confusing UX — người dùng muốn đến gian hàng, không phải chọn món.

---

## 6. Trang chủ — số lượng gian hàng thực

**Decision**: Dùng `listStores({ limit: 1 })` và lấy `total` từ response để hiển thị số lượng. Fetch trong Server Component (home page là Server Component).

**Rationale**:
- `listStores` API đã có, trả về `{ data, total }`.
- Fetch với `limit: 1` tối thiểu data transfer — chỉ cần `total`.
- Server Component fetch nên không ảnh hưởng client bundle.

---

## 7. Commentary button "above the fold" trên trang chi tiết

**Decision**: Tái cấu trúc `StoreDetailView.tsx` — đưa `CommentaryPlayer` lên ngay dưới ảnh bìa (sau image carousel, trước description). Thêm styling nổi bật: background màu cam nhạt, icon loa lớn, text "Nghe thuyết minh về gian hàng này".

**Rationale**:
- Hiện tại `CommentaryPlayer` nằm ở giữa trang, sau description — người dùng mobile phải scroll.
- "Above the fold" trên iPhone SE (375×667) = khoảng 300px sau header. Ảnh carousel ~200px + player ~60px = vừa đủ.
- Nút nổi bật là feature differentiator của ứng dụng — phải được thấy ngay.

---

## 8. Grid/List toggle cho trang danh sách

**Decision**: Dùng React state `viewMode: 'grid' | 'list'` với URL param `?view=grid|list` để persist qua reload. Grid = 2 cột mobile / 3 cột desktop. List = 1 cột full-width với ảnh bên trái, info bên phải.

**Rationale**:
- Grid phù hợp khi browse (scan nhiều item nhanh).
- List phù hợp khi compare (đọc mô tả từng gian hàng).
- Persist trong URL để shareable.

---

## NEEDS CLARIFICATION: Không còn mục nào cần làm rõ

Tất cả technical decisions đã được resolved ở trên. Tiến hành Phase 1 Design.

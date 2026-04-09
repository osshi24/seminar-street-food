# Tasks: Bản đồ & Vị trí gian hàng

**Feature**: `003-map-location` | **Date**: 2026-04-05
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

---

## Chú thích

- `[P]` — Task có thể thực hiện song song với các task khác trong cùng phase
- `[US1]` / `[US2]` / `[US3]` / `[US4]` — Task thuộc User Story (chỉ dùng trong Phase 3–5)
- Task không có `[P]` phải thực hiện tuần tự sau task trước đó trong cùng phase

---

## Phase 1 — Setup

> Cài đặt dependencies, cấu hình PostGIS, import Leaflet an toàn với SSR.

- [X] T00X Cài PostGIS extension vào Docker Compose: thêm `postgis/postgis:15-3.4` image và `CREATE EXTENSION IF NOT EXISTS postgis;` vào `apps/backend/src/database/migrations/` init script
- [X] T00X [P] Cài thư viện backend PostGIS: thêm `@types/geojson` vào `apps/backend/package.json`
- [X] T00X [P] Cài thư viện frontend: thêm `leaflet`, `leaflet-routing-machine`, `@types/leaflet` vào `apps/frontend/package.json`
- [X] T00X Cấu hình TypeORM để nhận diện `GEOMETRY` type của PostGIS: thêm `supportBigNumbers`, `extra` options trong `apps/backend/src/database/database.module.ts`
- [X] T00X Tạo `apps/frontend/src/lib/map/leaflet-config.ts` — export hàm `initLeafletIcons()` fix icon paths cho Leaflet khi bundle với Next.js (workaround `L.Icon.Default.mergeOptions`)
- [X] T00X Tạo dynamic import wrapper `apps/frontend/src/components/map/LeafletDynamic.tsx` — dùng `next/dynamic` với `{ ssr: false }` để wrap mọi Leaflet component, tránh `window is not defined` lỗi SSR

---

## Phase 2 — Foundation

> Migration database, module skeleton, boundary check service, partial unique indexes.

- [X] T00X Tạo migration `apps/backend/src/database/migrations/<timestamp>-create-location-pin-status-enum.ts` — tạo enum type `location_pin_status` với 4 giá trị `pending, approved, rejected, superseded`
- [X] T00X Tạo migration `apps/backend/src/database/migrations/<timestamp>-create-location-pins.ts` — tạo bảng `location_pins` với tất cả các cột theo data-model.md, bao gồm cột computed `pin_geom GEOMETRY(POINT, 4326) GENERATED ALWAYS AS (...) STORED`
- [X] T00X Tạo migration `apps/backend/src/database/migrations/<timestamp>-create-location-pins-indexes.ts` — tạo 4 indexes: `idx_location_pins_geom` (GIST), `idx_location_pins_store_status` (B-tree), `idx_location_pins_one_approved_per_store` (unique partial WHERE status='approved'), `idx_location_pins_one_pending_per_store` (unique partial WHERE status='pending')
- [X] T010 Tạo migration `apps/backend/src/database/migrations/<timestamp>-create-food-street-boundaries.ts` — tạo bảng `food_street_boundaries` với cột `polygon_coordinates JSONB` và `polygon_geom GEOMETRY(POLYGON, 4326)`
- [X] T011 Tạo migration `apps/backend/src/database/migrations/<timestamp>-create-food-street-boundaries-indexes.ts` — tạo 2 indexes: `idx_food_street_boundaries_geom` (GIST partial WHERE is_active=true), `idx_food_street_boundaries_one_active` (unique partial WHERE is_active=true)
- [X] T012 [P] Tạo entity `apps/backend/src/location/entities/location-pin.entity.ts` — TypeORM entity theo data-model.md, enum `LocationPinStatus`, relations đến `Store` và `AdminAccount`
- [X] T013 [P] Tạo entity `apps/backend/src/admin/entities/food-street-boundary.entity.ts` — TypeORM entity, interface `BoundaryCoordinate`, column `polygonCoordinates: BoundaryCoordinate[]` type jsonb
- [X] T014 Tạo `apps/backend/src/location/location.module.ts` — skeleton module, import `TypeOrmModule.forFeature([LocationPin])`, export `LocationService`
- [X] T015 [P] Tạo `apps/backend/src/map/map.module.ts` — skeleton module, import `TypeOrmModule.forFeature([LocationPin, FoodStreetBoundary])`, export `MapService`
- [X] T016 Tạo `apps/backend/src/location/boundary-check.service.ts` — service với method `isWithinBoundary(lat: number, lng: number): Promise<boolean>` dùng raw query `ST_Contains` với `polygon_geom` của boundary đang active; throw `NO_ACTIVE_BOUNDARY` khi không có boundary
- [X] T017 Tạo `apps/backend/src/location/duplicate-detection.service.ts` — service với method `findNearbyApprovedPins(lat: number, lng: number, excludeStoreId: string): Promise<NearbyPin[]>` dùng raw query `ST_DWithin` với threshold 5 mét

---

## Phase 3 — User Stories US1 + US2

> Store Owner gửi vị trí, Admin duyệt/từ chối/điều chỉnh.

### Backend — Store Owner (US1)

- [X] T018 [US1] Tạo `apps/backend/src/location/dto/submit-location.dto.ts` — DTO với `lat: number` (IsLatitude, @Min(-90), @Max(90)) và `lng: number` (IsLongitude, @Min(-180), @Max(180)), dùng `class-validator`
- [X] T019 [US1] Tạo `apps/backend/src/location/location.service.ts` — implement method `getMyLocation(storeId: string)`: truy vấn ghim `approved` và `pending` hiện tại của store, trả về `{ approved, pending }`
- [X] T020 [US1] Implement method `submitLocation(storeId: string, dto: SubmitLocationDto)` trong `apps/backend/src/location/location.service.ts`: kiểm tra `pending` tồn tại (throw 409 PENDING_EXISTS), gọi `BoundaryCheckService.isWithinBoundary()` (throw 400 LOCATION_OUT_OF_BOUNDARY), tạo bản ghi `LocationPin` mới status=`pending`, gửi notification Admin
- [X] T021 [US1] Implement method `revokePending(storeId: string)` trong `apps/backend/src/location/location.service.ts`: tìm ghim `pending` của store, xóa bản ghi, throw 404 NO_PENDING_FOUND nếu không tìm thấy
- [X] T022 [US1] Tạo `apps/backend/src/location/location.controller.ts` — controller với route prefix `/api/store-owner/location`, guard `JwtAuthGuard` + `RolesGuard('store_owner')`, 3 endpoints: `GET /`, `POST /`, `DELETE /pending`

### Backend — Admin (US2)

- [X] T023 [US2] Tạo `apps/backend/src/admin/dto/approve-location.dto.ts` — DTO với `lat?: number` và `lng?: number` (optional, @IsOptional(), @IsNumber())
- [X] T024 [US2] Tạo `apps/backend/src/admin/dto/reject-location.dto.ts` — DTO với `reason: string` (@IsNotEmpty(), @MaxLength(500))
- [X] T025 [US2] Tạo `apps/backend/src/admin/dto/update-boundary.dto.ts` — DTO với `name?: string` và `coordinates: BoundaryCoordinateDto[]` (@ArrayMinSize(3)), inner class `BoundaryCoordinateDto` có `lat: number`, `lng: number`
- [X] T026 [US2] Tạo `apps/backend/src/admin/admin-location.service.ts` — implement method `listPins(status, page, limit)`: query `location_pins` JOIN `stores`, tính `hasDuplicateWarning` bằng `DuplicateDetectionService`, phân trang
- [X] T027 [US2] Implement method `getPinDetail(pinId: string)` trong `apps/backend/src/admin/admin-location.service.ts`: lấy chi tiết ghim, lấy `currentApproved` của cùng store, gọi `DuplicateDetectionService` để lấy `duplicateWarnings[]`
- [X] T028 [US2] Implement method `approvePin(pinId: string, adminId: string, dto: ApproveLocationDto)` trong `apps/backend/src/admin/admin-location.service.ts`: atomic transaction — (1) UPDATE approved cũ → superseded, (2) UPDATE pending → approved với tọa độ `COALESCE(dto.lat, pin.latitude)`, (3) ghi `reviewed_at`, `reviewed_by`, (4) gửi notification Store Owner
- [X] T029 [US2] Implement method `rejectPin(pinId: string, adminId: string, dto: RejectLocationDto)` trong `apps/backend/src/admin/admin-location.service.ts`: validate pin status=`pending`, UPDATE → rejected với `rejection_reason`, gửi notification Store Owner
- [X] T030 [US2] Implement method `deletePin(pinId: string, adminId: string)` trong `apps/backend/src/admin/admin-location.service.ts`: xóa bản ghi bất kể status, gửi notification Store Owner
- [X] T031 [US2] Implement methods `getBoundary()` và `updateBoundary(adminId, dto)` trong `apps/backend/src/admin/admin-location.service.ts`: `updateBoundary` deactivate boundary cũ, tạo boundary mới, tính `polygon_geom` từ `polygon_coordinates` bằng raw SQL `ST_GeomFromText('POLYGON(...)', 4326)`
- [X] T032 [US2] Tạo `apps/backend/src/admin/admin-location.controller.ts` — route prefix `/api/admin`, guard `JwtAuthGuard` + `RolesGuard('admin')`, 7 endpoints: `GET /location-pins`, `GET /location-pins/:id`, `PATCH /location-pins/:id/approve`, `PATCH /location-pins/:id/reject`, `DELETE /location-pins/:id`, `GET /boundaries`, `PUT /boundaries`

### Frontend — Store Owner Map Component (US1)

- [X] T033 [P] [US1] Tạo `apps/frontend/src/app/(store-owner)/dashboard/location/components/LocationMapPicker.tsx` — Leaflet map component (dynamic import, no SSR), cho phép kéo thả `DraggableMarker`, emit `onCoordinateChange(lat, lng)` khi marker thay đổi vị trí, hiển thị boundary polygon nếu có
- [X] T034 [P] [US1] Tạo `apps/frontend/src/app/(store-owner)/dashboard/location/components/CoordinateForm.tsx` — form nhập `lat`, `lng` thủ công với validation client-side (range check), sync 2 chiều với `LocationMapPicker` qua shared state
- [X] T035 [US1] Tạo `apps/frontend/src/lib/api/location.ts` — các hàm API call: `getMyLocation()`, `submitLocation(lat, lng)`, `revokePending()` dùng `fetch` hoặc `axios` với JWT header
- [X] T036 [US1] Tạo `apps/frontend/src/app/(store-owner)/dashboard/location/page.tsx` — trang quản lý vị trí: hiển thị trạng thái ghim hiện tại (`approved`/`pending`), render `LocationMapPicker` + `CoordinateForm`, nút "Gửi duyệt" gọi `submitLocation()`, nút "Thu hồi" gọi `revokePending()`, hiển thị toast thông báo kết quả, xử lý lỗi PENDING_EXISTS và LOCATION_OUT_OF_BOUNDARY

### Frontend — Admin Pending Pins UI (US2)

- [X] T037 [P] [US2] Tạo `apps/frontend/src/lib/api/admin-location.ts` — các hàm API call Admin: `listPins(params)`, `getPinDetail(id)`, `approvePin(id, body)`, `rejectPin(id, body)`, `deletePin(id)`, `getBoundary()`, `updateBoundary(body)`
- [X] T038 [P] [US2] Tạo `apps/frontend/src/app/(admin)/admin/location-pins/page.tsx` — danh sách ghim pending với filter dropdown (status), phân trang, hiển thị badge "Trùng tọa độ" khi `hasDuplicateWarning=true`, link đến trang chi tiết
- [X] T039 [US2] Tạo `apps/frontend/src/app/(admin)/admin/location-pins/[id]/page.tsx` — trang chi tiết ghim: hiển thị mini Leaflet map với marker vị trí ghim, section "Cảnh báo trùng tọa độ" nếu `duplicateWarnings` không rỗng, form approve (optional lat/lng override), form reject (required reason), nút Delete

---

## Phase 4 — User Story US3

> Customer xem bản đồ, chọn ghim xem thông tin, nhận chỉ đường inline.

### Backend — Public Map Endpoint (US3)

- [X] T040 [US3] Tạo `apps/backend/src/map/map.service.ts` — implement `getPublicPins()`: query `location_pins` JOIN `stores` WHERE `lp.status='approved' AND s.status='active'`, kèm `boundary` polygon từ active boundary; implement `getStorePinDetail(storeId: string)`: query ghim approved của store kèm thông tin store
- [X] T041 [US3] Tạo `apps/backend/src/map/map.controller.ts` — route prefix `/api/map`, không có auth guard (public), 2 endpoints: `GET /pins`, `GET /pins/:storeId`

### Frontend — Customer Map Page (US3)

- [X] T042 [P] [US3] Tạo `apps/frontend/src/lib/api/map.ts` — hàm `getPublicPins()` và `getStorePinDetail(storeId)` (no auth header)
- [X] T043 [P] [US3] Tạo `apps/frontend/src/lib/map/routing.ts` — helper `buildOSRMRouteUrl(fromLat, fromLng, toLat, toLng): string` tạo OSRM API URL; helper `parseOSRMResponse(data)` extract GeoJSON coordinates để vẽ polyline trên Leaflet
- [X] T044 [P] [US3] Tạo `apps/frontend/src/app/(public)/map/components/PinMarker.tsx` — Leaflet `Marker` component với custom icon, click handler emit `onPinSelect(storeId)`
- [X] T045 [P] [US3] Tạo `apps/frontend/src/app/(public)/map/components/StorePopup.tsx` — Leaflet `Popup` hiển thị `storeName`, `storeAvatar` (img tag), nút "Chỉ đường" (emit `onRequestRoute(lat, lng)`), fetch `getStorePinDetail` khi mount
- [X] T046 [P] [US3] Tạo `apps/frontend/src/components/map/BoundaryPolygon.tsx` — Leaflet `Polygon` component nhận `coordinates: {lat, lng}[]`, hiển thị ranh giới phố ẩm thực với stroke màu cam, fill opacity thấp
- [X] T047 [US3] Tạo `apps/frontend/src/app/(public)/map/components/RoutingPanel.tsx` — component xử lý chỉ đường: (1) gọi `navigator.geolocation.getCurrentPosition()` khi user click "Chỉ đường", (2) nếu GPS thành công dùng tọa độ GPS làm điểm xuất phát, (3) nếu GPS bị từ chối hiển thị `<input>` nhập lat/lng thủ công (fallback), (4) gọi OSRM API, (5) vẽ `Polyline` route trên bản đồ Leaflet
- [X] T048 [US3] Tạo `apps/frontend/src/app/(public)/map/components/MapView.tsx` — Leaflet `MapContainer` chính, load `getPublicPins()` khi mount, render `PinMarker[]`, `BoundaryPolygon`, điều phối state `selectedPin` và `routePolyline`, hiển thị message "Chưa có gian hàng nào trên bản đồ" khi `pins` rỗng
- [X] T049 [US3] Tạo `apps/frontend/src/app/(public)/map/page.tsx` — Server Component, gọi `getPublicPins()` (server-side hoặc client-side fetch), render `MapView` qua dynamic import `{ ssr: false }`, loading skeleton khi map chưa tải

---

## Phase 5 — User Story US4

> Customer chia sẻ vị trí GPS hiện tại qua link.

- [X] T050 [US4] Tạo `apps/frontend/src/app/(public)/map/components/ShareLocationBtn.tsx` — nút "Chia sẻ vị trí": click gọi `navigator.geolocation.getCurrentPosition()`, thành công → tạo URL `/map?lat=<lat>&lng=<lng>` và gọi `navigator.clipboard.writeText()`, hiển thị toast "Đã sao chép link"; GPS bị từ chối → toast "Cần bật GPS để sử dụng chức năng này"; GPS timeout/error → toast lỗi kèm gợi ý thử lại
- [X] T051 [US4] Cập nhật `apps/frontend/src/app/(public)/map/page.tsx` — đọc search params `lat` và `lng` từ URL; nếu có, truyền `sharedLocation: {lat, lng}` xuống `MapView` để hiển thị marker đặc biệt (màu khác) tại vị trí được chia sẻ, pan map đến vị trí đó khi tải
- [X] T052 [US4] Cập nhật `apps/frontend/src/app/(public)/map/components/MapView.tsx` — nhận prop `sharedLocation?: {lat: number, lng: number}`, nếu có render `Marker` với icon màu xanh lam tại vị trí đó, gọi `map.flyTo([lat, lng], 17)` khi component mount

---

## Phase N — Polish

> Tối ưu UX, cluster markers, Admin boundary config UI, loading states.

- [X] T053 [P] Thêm Leaflet.markercluster: cài `leaflet.markercluster` + `@types/leaflet.markercluster` vào `apps/frontend/package.json`, wrap `PinMarker[]` trong `MarkerClusterGroup` trong `apps/frontend/src/app/(public)/map/components/MapView.tsx`
- [X] T054 [P] Tạo `apps/frontend/src/app/(admin)/admin/boundaries/page.tsx` — Admin cấu hình boundary: hiển thị polygon hiện tại trên Leaflet map (editable với `Leaflet.Editable` hoặc manual textarea nhập JSON tọa độ), nút "Lưu" gọi `updateBoundary()`, validation ≥3 điểm client-side
- [X] T055 [P] Thêm loading states toàn bộ map pages: skeleton `<div className="animate-pulse">` trong `apps/frontend/src/app/(public)/map/page.tsx` và `apps/frontend/src/app/(store-owner)/dashboard/location/page.tsx` trong khi Leaflet dynamic import đang resolve
- [X] T056 [P] Thêm SSR-safe guard cho tất cả Leaflet imports: kiểm tra `typeof window !== 'undefined'` trước mọi import trực tiếp `leaflet` hoặc `leaflet-routing-machine` trong `apps/frontend/src/lib/map/leaflet-config.ts` và `apps/frontend/src/lib/map/routing.ts`
- [X] T057 [P] Viết unit tests `apps/backend/src/location/boundary-check.service.spec.ts` — test `isWithinBoundary()` với mock PostGIS query: point trong boundary → true, point ngoài boundary → false, không có active boundary → throw
- [X] T058 [P] Viết unit tests `apps/backend/src/admin/admin-location.service.spec.ts` — test `approvePin()` transaction: supersede old approved, set new approved, test `rejectPin()`: reject reason bắt buộc, test `deletePin()`: notification gửi đi
- [X] T059 Viết E2E test `apps/frontend/e2e/map-location.spec.ts` — Playwright test flow US1→US2: Store Owner submit location → verify status pending → Admin approve → verify pin appears on public map

# Research: Bản đồ & Vị trí gian hàng

**Feature**: `003-map-location` | **Date**: 2026-04-05

Tài liệu này ghi lại các quyết định design cho feature bản đồ và vị trí gian hàng, bao gồm
lý do lựa chọn technology và các phương án đã bị loại bỏ.

---

## 1. Map Provider

### Quyết định: Leaflet.js + OpenStreetMap tiles

**Lý do chọn**:

- **Miễn phí, không cần API key**: OpenStreetMap tiles không yêu cầu API key hay billing.
  Google Maps yêu cầu credit card và tính phí sau khi vượt quota miễn phí ($200/tháng).
  Dự án seminar không có ngân sách API.
- **Leaflet.js là thư viện client phổ biến nhất** cho web mapping, bundle size nhỏ (~42KB
  gzipped), React wrapper `react-leaflet` tích hợp tốt với Next.js.
- **Marker clustering**: Plugin `leaflet.markercluster` xử lý edge case nhiều gian hàng tọa
  độ gần nhau (đã đề cập trong spec).
- **Không phụ thuộc vendor**: Dữ liệu bản đồ từ cộng đồng OpenStreetMap, không bị lock-in.

**Phương án bị loại bỏ**:

| Phương án | Lý do loại bỏ |
| --------- | ------------- |
| Google Maps JavaScript API | Yêu cầu billing, tốn chi phí khi scale |
| Mapbox GL JS | Free tier giới hạn; cần API key; license phức tạp hơn OSM |
| MapLibre GL JS | Phù hợp khi cần vector tiles 3D; overkill cho use case này |

**Cấu hình tile server**: Sử dụng tile URL mặc định OpenStreetMap:
`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`

---

## 2. Routing Engine

### Quyết định: OSRM (Open Source Routing Machine) qua Leaflet Routing Machine plugin

**Lý do chọn**:

- **OSRM demo server**: OSRM cung cấp public demo API (`router.project-osrm.org`) miễn phí
  cho development và low-traffic production. Không cần key.
- **Leaflet Routing Machine** (LRM) là plugin chuẩn tích hợp Leaflet + OSRM, render route
  trực tiếp trên bản đồ dưới dạng polyline — đúng yêu cầu "chỉ đường inline, không mở app
  ngoài".
- **Routing hoàn toàn client-side**: Frontend gọi OSRM API trực tiếp, backend không cần xử
  lý routing. Đơn giản hóa kiến trúc.
- **Fallback thủ công**: Khi Customer từ chối GPS, LRM nhận tọa độ xuất phát từ form nhập
  thủ công — cùng code path, không cần logic riêng.

**Phương án bị loại bỏ**:

| Phương án | Lý do loại bỏ |
| --------- | ------------- |
| Google Directions API | Tốn phí; yêu cầu billing |
| Graphhopper (self-hosted) | Cần server riêng + dữ liệu OSM; phức tạp hơn cần thiết |
| Mở app Google Maps / Apple Maps | Vi phạm yêu cầu spec: chỉ đường phải inline trên web |

**Lưu ý production**: Nếu traffic tăng cao, cần tự host OSRM với dữ liệu OSM region Việt Nam
(`vietnam-latest.osm.pbf`) thay vì dùng demo server.

---

## 3. Geospatial Storage

### Quyết định: PostGIS extension trong PostgreSQL

**Lý do chọn**:

- **PostGIS là chuẩn de facto** cho geospatial trong PostgreSQL. Extension đã mature, được hỗ
  trợ rộng rãi trên mọi managed PostgreSQL service (AWS RDS, Supabase, Neon, v.v.).
- **Native SQL functions**: `ST_Contains`, `ST_Distance`, `ST_Within` — không cần ORM phức tạp;
  query địa lý viết trực tiếp trong SQL hoặc TypeORM raw query.
- **Consistency**: Toàn bộ data (accounts, stores, location pins, boundaries) nằm trong một
  database — không cần tích hợp thêm service ngoài (Redis Geo, Elasticsearch, v.v.).
- **Cách lưu trữ**: Tọa độ ghim lưu dưới dạng `NUMERIC(10,8)` và `NUMERIC(11,8)` cho
  latitude/longitude (độ chính xác đến ~1.1mm); đồng thời lưu column `GEOMETRY(POINT, 4326)`
  để dùng PostGIS functions. Boundary polygon lưu dưới dạng `JSONB` array `{lat, lng}` cho
  Admin UI và `GEOMETRY(POLYGON, 4326)` cho spatial queries.

**Phương án bị loại bỏ**:

| Phương án | Lý do loại bỏ |
| --------- | ------------- |
| Redis Geo (GEOADD/GEORADIUS) | Chỉ phù hợp cho proximity search; không hỗ trợ polygon boundary |
| Elasticsearch (geo_shape) | Overkill; thêm service phức tạp; không cần full-text search ở đây |
| Lưu lat/lng thuần túy, tính toán trong code | Chậm khi scale; thiếu indexing; dễ sai với spherical math |

---

## 4. Point-in-Polygon Check (Boundary Validation)

### Quyết định: PostGIS `ST_Contains(boundary_polygon, pin_point)`

**Cách hoạt động**:

```sql
-- Kiểm tra tọa độ ghim có nằm trong ranh giới phố ẩm thực không
SELECT ST_Contains(
  (SELECT polygon_geom FROM food_street_boundaries WHERE is_active = true LIMIT 1),
  ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)
) AS is_within_boundary;
```

- Được thực hiện ở tầng **service backend** khi Store Owner gửi tọa độ (`POST /api/store-owner/location`).
- Frontend hiển thị cảnh báo "Vị trí nằm ngoài phạm vi phố ẩm thực" nếu server trả về lỗi
  `400 LOCATION_OUT_OF_BOUNDARY`.
- **Lưu ý**: Validation này là advisory (cảnh báo + block), không phải hard constraint ở DB
  level — Admin có thể override khi điều chỉnh tọa độ.

---

## 5. Duplicate Detection

### Quyết định: PostGIS `ST_DWithin` so sánh ghim mới với các ghim `approved` hiện tại

**Cách hoạt động**:

```sql
-- Tìm ghim approved của gian hàng KHÁC có khoảng cách < threshold (ví dụ: 5 mét)
SELECT lp.store_id, s.name AS store_name,
       ST_Distance(
         ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
         lp.pin_geom::geography
       ) AS distance_meters
FROM location_pins lp
JOIN stores s ON s.id = lp.store_id
WHERE lp.status = 'approved'
  AND lp.store_id != :submitting_store_id
  AND ST_DWithin(
    ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
    lp.pin_geom::geography,
    5  -- 5 mét
  );
```

- Threshold mặc định: **5 mét** (có thể cấu hình qua environment variable).
- Duplicate detection được thực hiện **ở tầng Admin** khi xem xét ghim pending, không phải
  khi Store Owner gửi. Admin thấy cảnh báo và danh sách gian hàng lân cận — quyết định cuối
  cùng thuộc về Admin (FR-006).
- Dùng `::geography` cast để tính khoảng cách theo mét (spherical earth), tránh sai số với
  phép tính planar geometry.

---

## 6. Location Sharing Link Format

### Quyết định: `/map?lat={lat}&lng={lng}`

**Ví dụ**: `https://pho-am-thuc.example.com/map?lat=10.762622&lng=106.660172`

**Cách hoạt động**:

- Khi Customer chọn "Chia sẻ vị trí", frontend lấy tọa độ GPS từ `navigator.geolocation` rồi
  tạo URL với query params `lat` và `lng`.
- Người nhận link truy cập URL → Next.js page `/map` đọc query params → Leaflet map hiển thị
  marker tại tọa độ đó + tự động center/zoom vào vị trí đó.
- Link tự tham chiếu về hệ thống web nội bộ (không redirect sang Google Maps hay app ngoài).
- Không cần backend API riêng — toàn bộ xử lý ở client-side trong page component `/map`.

**Phân biệt với deep link**:

| Loại | Format | Mục đích |
| ---- | ------ | -------- |
| Share vị trí Customer | `/map?lat={lat}&lng={lng}` | Chia sẻ vị trí hiện tại của Customer |
| Deep link ghim gian hàng | `/map?storeId={id}` | Direct link đến ghim của gian hàng cụ thể (nếu cần trong tương lai) |

---

## 7. State Machine — LocationPin

```
                    Store Owner gửi
                         │
                         ▼
                      [pending]
                     /         \
          Admin duyệt          Admin từ chối
               │                      │
               ▼                      ▼
          [approved]            [rejected]
               │
    Store Owner gửi cập nhật mới
               │
               ▼
         [pending mới]
               │
         Admin duyệt
               │
    ┌──────────┴──────────┐
    ▼                     ▼
[pending mới → approved]  [approved cũ → superseded]
```

**Transition rules** (enforced bằng application logic, không trigger DB):

- `pending` → `approved`: Admin gọi PATCH approve; đồng thời bản `approved` cũ (nếu có) → `superseded`
- `pending` → `rejected`: Admin gọi PATCH reject kèm `reason` bắt buộc
- `approved` → `superseded`: Tự động khi bản `pending` mới được duyệt
- Store Owner thu hồi: DELETE pending → xóa bản ghi (không chuyển trạng thái)
- Admin xóa ghim: DELETE bất kỳ trạng thái (approved, pending) → xóa bản ghi

---

## 8. SSR / Client-side Split cho Leaflet

**Vấn đề**: Leaflet.js sử dụng `window` object — không tương thích với Next.js SSR.

**Giải pháp**: Dynamic import với `ssr: false` cho toàn bộ map components:

```typescript
// app/(public)/map/page.tsx
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('./components/MapView'), { ssr: false });
```

Các component `MapView`, `PinMarker`, `RoutingPanel` đều phải là dynamic import — không thể
render ở server. Page component `/map/page.tsx` vẫn là Server Component, chỉ truyền initial
data xuống.

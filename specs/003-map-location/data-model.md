# Data Model: Bản đồ & Vị trí gian hàng

**Feature**: `003-map-location` | **Date**: 2026-04-05

---

## PostgreSQL Schema (với PostGIS extension)

### Yêu cầu extension

```sql
-- Phải chạy một lần trên database trước khi tạo bảng
CREATE EXTENSION IF NOT EXISTS postgis;
```

---

### Bảng `location_pins`

Lưu lịch sử tất cả các lần Store Owner gửi vị trí ghim. Mỗi lần gửi tạo một bản ghi mới.
Tại một thời điểm, mỗi `store_id` chỉ có tối đa một bản `approved` và một bản `pending`.

```sql
CREATE TYPE location_pin_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'superseded'
);

CREATE TABLE location_pins (
  id               UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id         UUID            NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  latitude         NUMERIC(10, 8)  NOT NULL,  -- Ví dụ: 10.76262200
  longitude        NUMERIC(11, 8)  NOT NULL,  -- Ví dụ: 106.66017200
  pin_geom         GEOMETRY(POINT, 4326) GENERATED ALWAYS AS (
                     ST_SetSRID(ST_MakePoint(longitude::float8, latitude::float8), 4326)
                   ) STORED,                  -- Dùng cho PostGIS spatial queries
  status           location_pin_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT            NULL,       -- Bắt buộc khi status = 'rejected'
  submitted_at     TIMESTAMPTZ     NOT NULL DEFAULT now(),
  reviewed_at      TIMESTAMPTZ     NULL,       -- NULL khi chưa được Admin xét duyệt
  reviewed_by      UUID            NULL REFERENCES admin_accounts(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ     NOT NULL DEFAULT now()
);

-- Index cho spatial queries (point-in-polygon, distance check)
CREATE INDEX idx_location_pins_geom ON location_pins USING GIST (pin_geom);

-- Index cho lookup theo store và status (query thường xuyên)
CREATE INDEX idx_location_pins_store_status ON location_pins (store_id, status);

-- Constraint: mỗi store_id chỉ có tối đa 1 bản 'approved' tại một thời điểm
CREATE UNIQUE INDEX idx_location_pins_one_approved_per_store
  ON location_pins (store_id)
  WHERE status = 'approved';

-- Constraint: mỗi store_id chỉ có tối đa 1 bản 'pending' tại một thời điểm
CREATE UNIQUE INDEX idx_location_pins_one_pending_per_store
  ON location_pins (store_id)
  WHERE status = 'pending';
```

**Ghi chú các cột**:

| Cột | Kiểu | Mô tả |
| --- | ---- | ----- |
| `id` | UUID | Primary key, auto-generated |
| `store_id` | UUID FK | Tham chiếu đến bảng `stores` (spec 002) |
| `latitude` | NUMERIC(10,8) | Vĩ độ; phạm vi hợp lệ: -90 đến +90 |
| `longitude` | NUMERIC(11,8) | Kinh độ; phạm vi hợp lệ: -180 đến +180 |
| `pin_geom` | GEOMETRY(POINT) | Computed column từ lat/lng; dùng cho PostGIS |
| `status` | ENUM | `pending` / `approved` / `rejected` / `superseded` |
| `rejection_reason` | TEXT | Lý do từ chối; `NOT NULL` khi `status = 'rejected'` (enforced bằng application logic) |
| `submitted_at` | TIMESTAMPTZ | Thời điểm Store Owner gửi |
| `reviewed_at` | TIMESTAMPTZ | Thời điểm Admin xét duyệt |
| `reviewed_by` | UUID FK | Admin đã xét duyệt |
| `created_at` | TIMESTAMPTZ | Timestamp tạo bản ghi |

---

### Bảng `food_street_boundaries`

Lưu polygon ranh giới khu vực phố ẩm thực do Admin cấu hình. Hệ thống chỉ có **một boundary
active** tại một thời điểm. Mỗi lần Admin cập nhật, bản ghi cũ bị `is_active = false` hoặc
bị thay thế hoàn toàn.

```sql
CREATE TABLE food_street_boundaries (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 VARCHAR(200) NOT NULL DEFAULT 'Ranh giới phố ẩm thực',
  polygon_coordinates  JSONB        NOT NULL,
  -- Cấu trúc: [{"lat": 10.762, "lng": 106.660}, {"lat": 10.763, "lng": 106.661}, ...]
  -- Tối thiểu 3 điểm; điểm đầu và cuối không cần trùng (hệ thống tự đóng polygon)
  polygon_geom         GEOMETRY(POLYGON, 4326) NULL,
  -- Được tính và lưu khi Admin cập nhật boundary; dùng cho ST_Contains queries
  is_active            BOOLEAN      NOT NULL DEFAULT true,
  created_by           UUID         NULL REFERENCES admin_accounts(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Index spatial cho polygon_geom (dùng trong ST_Contains)
CREATE INDEX idx_food_street_boundaries_geom
  ON food_street_boundaries USING GIST (polygon_geom)
  WHERE is_active = true AND polygon_geom IS NOT NULL;

-- Constraint: chỉ có tối đa 1 boundary active tại một thời điểm
CREATE UNIQUE INDEX idx_food_street_boundaries_one_active
  ON food_street_boundaries (is_active)
  WHERE is_active = true;
```

**Cấu trúc `polygon_coordinates` (JSONB)**:

```json
[
  { "lat": 10.762500, "lng": 106.660100 },
  { "lat": 10.763200, "lng": 106.661500 },
  { "lat": 10.762800, "lng": 106.662300 },
  { "lat": 10.761900, "lng": 106.661200 }
]
```

---

## State Machine — LocationPin

### Các trạng thái

| Trạng thái | Hiển thị công khai | Mô tả |
| ---------- | ------------------ | ----- |
| `pending` | Không | Vừa được Store Owner gửi, đang chờ Admin xét duyệt |
| `approved` | Có (nếu store active) | Admin đã duyệt; ghim hiển thị trên bản đồ |
| `rejected` | Không | Admin từ chối kèm lý do |
| `superseded` | Không | Đã bị thay thế bởi bản `approved` mới hơn |

### Transition hợp lệ

```
[pending]  --Admin approve-->  [approved]
[pending]  --Admin reject-->   [rejected]    (rejection_reason bắt buộc)
[approved] --auto khi pending mới được approve-->  [superseded]
```

### Transition không hợp lệ (bị block ở application layer)

- `rejected` → bất kỳ trạng thái nào (Store Owner phải tạo bản ghi mới)
- `superseded` → bất kỳ trạng thái nào (không thể hoàn nguyên)
- `approved` → `pending` / `rejected` (Admin phải dùng PATCH reject hoặc DELETE)

### Thao tác xóa

- **Store Owner thu hồi pending**: `DELETE /api/store-owner/location/pending` → xóa bản ghi
  `pending` của store đó
- **Admin xóa ghim**: `DELETE /api/admin/location-pins/:id` → xóa bất kỳ bản ghi nào; nếu
  xóa bản `approved`, gian hàng không còn ghim nào hiển thị trên bản đồ

---

## Queries thường dùng

### 1. Lấy ghim công khai (Customer xem bản đồ)

```sql
SELECT
  lp.id,
  lp.store_id,
  lp.latitude,
  lp.longitude,
  s.name         AS store_name,
  s.avatar_url   AS store_avatar
FROM location_pins lp
JOIN stores s ON s.id = lp.store_id
WHERE lp.status = 'approved'
  AND s.status  = 'active'
ORDER BY lp.reviewed_at DESC;
```

### 2. Kiểm tra tọa độ có trong ranh giới phố ẩm thực

```sql
SELECT ST_Contains(
  (SELECT polygon_geom FROM food_street_boundaries WHERE is_active = true LIMIT 1),
  ST_SetSRID(ST_MakePoint($1, $2), 4326)  -- $1 = lng, $2 = lat
) AS is_within_boundary;
```

### 3. Phát hiện ghim trùng (Admin cảnh báo khi xét duyệt)

```sql
SELECT
  lp.store_id,
  s.name AS store_name,
  ST_Distance(
    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
    lp.pin_geom::geography
  ) AS distance_meters
FROM location_pins lp
JOIN stores s ON s.id = lp.store_id
WHERE lp.status = 'approved'
  AND lp.store_id != $3              -- $3 = store_id đang xét duyệt
  AND ST_DWithin(
    ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
    lp.pin_geom::geography,
    5                                -- 5 mét threshold
  )
ORDER BY distance_meters ASC;
```

### 4. Approve ghim pending (transaction — đảm bảo atomic)

```sql
BEGIN;

-- Bước 1: Chuyển bản approved cũ (nếu có) sang superseded
UPDATE location_pins
SET status = 'superseded'
WHERE store_id = $1
  AND status = 'approved';

-- Bước 2: Approve bản pending
UPDATE location_pins
SET status      = 'approved',
    reviewed_at = now(),
    reviewed_by = $2,           -- $2 = admin_id
    latitude    = COALESCE($3, latitude),   -- $3 = lat mới (nếu Admin điều chỉnh)
    longitude   = COALESCE($4, longitude)   -- $4 = lng mới (nếu Admin điều chỉnh)
WHERE id = $5                   -- $5 = pin_id
  AND status = 'pending';

COMMIT;
```

---

## TypeORM Entity Definitions

### `LocationPin` entity

```typescript
// backend/src/location/entities/location-pin.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, CreateDateColumn, Index,
} from 'typeorm';
import { Store } from '../../stores/entities/store.entity';
import { AdminAccount } from '../../admin/entities/admin-account.entity';

export enum LocationPinStatus {
  PENDING    = 'pending',
  APPROVED   = 'approved',
  REJECTED   = 'rejected',
  SUPERSEDED = 'superseded',
}

@Entity('location_pins')
export class LocationPin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'store_id' })
  @Index()
  storeId: string;

  @ManyToOne(() => Store, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({ type: 'numeric', precision: 10, scale: 8 })
  latitude: number;

  @Column({ type: 'numeric', precision: 11, scale: 8 })
  longitude: number;

  @Column({ type: 'enum', enum: LocationPinStatus, default: LocationPinStatus.PENDING })
  status: LocationPinStatus;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string | null;

  @Column({ name: 'submitted_at', type: 'timestamptz', default: () => 'now()' })
  submittedAt: Date;

  @Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
  reviewedAt: Date | null;

  @Column({ name: 'reviewed_by', nullable: true })
  reviewedBy: string | null;

  @ManyToOne(() => AdminAccount, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'reviewed_by' })
  reviewer: AdminAccount | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
```

### `FoodStreetBoundary` entity

```typescript
// backend/src/admin/entities/food-street-boundary.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';

export interface BoundaryCoordinate {
  lat: number;
  lng: number;
}

@Entity('food_street_boundaries')
export class FoodStreetBoundary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 200, default: 'Ranh giới phố ẩm thực' })
  name: string;

  @Column({ name: 'polygon_coordinates', type: 'jsonb' })
  polygonCoordinates: BoundaryCoordinate[];

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
```

---

## Indexes Summary

| Index | Bảng | Columns | Type | Mục đích |
| ----- | ----- | ------- | ---- | --------- |
| `idx_location_pins_geom` | `location_pins` | `pin_geom` | GIST | Spatial queries (ST_Contains, ST_DWithin) |
| `idx_location_pins_store_status` | `location_pins` | `store_id, status` | B-tree | Lookup ghim theo store và trạng thái |
| `idx_location_pins_one_approved_per_store` | `location_pins` | `store_id` WHERE `status='approved'` | Unique partial | Đảm bảo ≤1 approved/store |
| `idx_location_pins_one_pending_per_store` | `location_pins` | `store_id` WHERE `status='pending'` | Unique partial | Đảm bảo ≤1 pending/store |
| `idx_food_street_boundaries_geom` | `food_street_boundaries` | `polygon_geom` WHERE `is_active=true` | GIST | ST_Contains check boundary |
| `idx_food_street_boundaries_one_active` | `food_street_boundaries` | `is_active` WHERE `is_active=true` | Unique partial | Đảm bảo ≤1 boundary active |

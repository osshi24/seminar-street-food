# Data Model: GPS Auto-Play & QR Code

**Spec**: 005-gps-autoplay-qr-code | **Date**: 2026-04-05

---

## 1. PostgreSQL Schema

### Bảng `qr_codes`

```sql
CREATE TABLE qr_codes (
  id             SERIAL        PRIMARY KEY,
  store_id       INTEGER       NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  token          UUID          NOT NULL DEFAULT gen_random_uuid(),
  is_active      BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  created_by     INTEGER       NOT NULL REFERENCES store_owner_accounts(id),

  CONSTRAINT uq_qr_token UNIQUE (token)
);

-- Chỉ 1 QR active được phép tồn tại per gian hàng tại mọi thời điểm.
-- Partial unique index: chỉ enforce uniqueness khi is_active = true.
CREATE UNIQUE INDEX uq_one_active_qr_per_store
  ON qr_codes (store_id)
  WHERE is_active = TRUE;

-- Index hỗ trợ lookup nhanh theo token (public QR scan endpoint)
CREATE INDEX idx_qr_codes_token ON qr_codes (token);

-- Index hỗ trợ Store Owner xem QR của gian hàng mình
CREATE INDEX idx_qr_codes_store_id ON qr_codes (store_id);
```

#### Giải thích các trường

| Trường | Kiểu | Mô tả |
| ------ | ---- | ----- |
| `id` | SERIAL | Primary key tự tăng |
| `store_id` | INTEGER FK | Gian hàng chủ sở hữu QR code này |
| `token` | UUID | Token ngẫu nhiên nhúng vào URL QR; không đoán được |
| `is_active` | BOOLEAN | `true` = QR hiệu lực; `false` = đã bị invalidate |
| `created_at` | TIMESTAMPTZ | Thời điểm tạo QR (có timezone) |
| `created_by` | INTEGER FK | Store Owner đã tạo QR code này |

#### Tại sao dùng partial unique index thay vì constraint

PostgreSQL chỉ hỗ trợ partial unique constraint thông qua partial unique index. Index
`WHERE is_active = TRUE` đảm bảo: tại bất kỳ thời điểm nào, mỗi `store_id` chỉ có tối
đa một row với `is_active = true`. Khi Store Owner tạo QR mới, service layer UPDATE các
row cũ thành `is_active = false` trước khi INSERT row mới — tránh vi phạm index.

---

## 2. ProximitySession — Client-Side State (Không có Database)

`ProximitySession` là pure client-side state. Không có bảng database tương ứng. State
được lưu trong React Context và tự reset khi Customer reload trang.

### TypeScript Type Definition

```typescript
// lib/gps/proximity.ts

export type GPSStatus =
  | 'idle'          // Chưa yêu cầu quyền GPS
  | 'requesting'    // Đang chờ user grant/deny
  | 'granted'       // Đã cấp quyền, watchPosition đang chạy
  | 'denied'        // User từ chối quyền GPS
  | 'unavailable';  // Đã cấp quyền nhưng GPS mất tín hiệu giữa chừng

export interface NearbyStore {
  storeId: number;
  storeName: string;
  distanceMeters: number;
  audioUrl: string;        // URL audio thuyết minh từ spec 002
}

export interface ProximitySessionState {
  gpsStatus: GPSStatus;
  currentPosition: GeolocationCoordinates | null;
  nearestStore: NearbyStore | null;       // Gian hàng gần nhất trong vùng 4m
  playedStores: Map<number, boolean>;     // storeId → true nếu đã phát trong session
  autoPlayBannerVisible: boolean;         // true khi browser chặn autoplay
  watchId: number | null;                 // ID từ watchPosition để cleanup
}
```

### Session Memory — Debounce Logic

```typescript
// Kiểm tra trước khi trigger auto-play
function shouldTriggerAutoPlay(
  state: ProximitySessionState,
  storeId: number,
): boolean {
  if (state.gpsStatus !== 'granted') return false;
  if (state.playedStores.get(storeId) === true) return false; // Đã phát rồi
  return true;
}

// Đánh dấu đã phát
function markAsPlayed(
  setState: Dispatch<SetStateAction<ProximitySessionState>>,
  storeId: number,
): void {
  setState((prev) => ({
    ...prev,
    playedStores: new Map(prev.playedStores).set(storeId, true),
  }));
}
```

---

## 3. State Machine: QRCode

```
                   Store Owner tạo QR mới
                          │
                          ▼
         ┌────────────────────────────────────┐
         │            QR Code (active)        │
         │  is_active = true                  │
         │  token = UUID                      │
         └──────────────┬─────────────────────┘
                        │
           ┌────────────┴────────────────┐
           │                             │
           ▼                             ▼
  Store Owner tạo QR mới      Gian hàng bị set inactive
  (QR cũ bị invalidate)       (QR không bị đổi is_active,
           │                   nhưng logic kiểm tra store.status
           │                   tại thời điểm scan → trả về error)
           ▼
  ┌──────────────────────────────────────┐
  │          QR Code (inactive)          │
  │  is_active = false                   │
  │  (chỉ áp dụng khi tạo QR mới)       │
  └──────────────────────────────────────┘
```

**Lưu ý quan trọng**: QR code không tự động đổi `is_active` khi gian hàng bị inactive.
Thay vào đó, endpoint `GET /api/qr/:token` kiểm tra `store.status` tại runtime:

- `store.status = 'active'` → redirect đến trang chi tiết gian hàng (dù `is_active` là gì)
- `store.status = 'inactive'` → redirect đến `/store-unavailable` (dù `is_active` là gì)

Cơ chế `is_active` trên `qr_codes` chỉ để enforce "chỉ 1 QR active per gian hàng" và
để QR cũ (đã bị thay thế bởi QR mới) trả về error page khi quét.

---

## 4. GPS Auto-Play Flow (Client-Side)

Toàn bộ GPS proximity detection và audio trigger chạy hoàn toàn trên browser. Không có
server endpoint riêng cho GPS logic.

```
Browser startup
    │
    ▼
ProximityProvider.tsx mount
    │
    ├─ Gọi navigator.permissions.query({ name: 'geolocation' })
    │
    ├─ [denied] → set gpsStatus = 'denied' → hiển thị thông báo
    │
    └─ [granted / prompt] → gọi navigator.geolocation.watchPosition(...)
           │
           ▼
       watchPosition callback (mỗi ~1 giây)
           │
           ├─ Nhận GeolocationCoordinates { latitude, longitude, accuracy }
           │
           ├─ Fetch approved pins từ GET /api/map/pins (spec 003)
           │   └─ Cached trong TanStack Query, không refetch mỗi callback
           │
           ├─ Tính Haversine distance từ current position đến từng pin
           │
           ├─ Lọc pins có distance ≤ 4m
           │
           ├─ [Không có pin nào] → nearestStore = null
           │   └─ AutoPlayBanner ẩn nếu đang hiển thị
           │
           └─ [Có ít nhất 1 pin] → chọn pin có distance nhỏ nhất
               │
               ├─ Kiểm tra session memory: playedStores.has(storeId)?
               │   └─ [Đã phát] → bỏ qua, không trigger lại
               │
               └─ [Chưa phát] → fetch audio URL từ GET /api/stores/:id/commentary (spec 002)
                       │
                       ├─ Gọi audio.play()
                       │   ├─ [Success] → audio phát, markAsPlayed(storeId)
                       │   └─ [NotAllowedError] → set autoPlayBannerVisible = true
                       │       └─ Customer tap banner → audio.play() → markAsPlayed(storeId)
                       │
                       └─ AudioPlayer.tsx hiển thị controls (dừng / bỏ qua)
```

### Điều kiện để auto-play kích hoạt

Tất cả điều kiện sau phải đúng cùng lúc:

1. `gpsStatus === 'granted'`
2. `distance <= 4` mét (tính bằng Haversine)
3. Pin status: `approved` (đã được lọc bởi `GET /api/map/pins`)
4. Store status: `active` (đã được lọc bởi `GET /api/map/pins` — chỉ trả về pin của gian hàng active)
5. Commentary status: `approved` (endpoint spec 002 chỉ trả về commentary đã approved)
6. `playedStores.get(storeId) !== true` (chưa phát trong session này)

### Dữ liệu fetch từ API đã có (Spec 002 & 003)

```typescript
// Từ spec 003 — GET /api/map/pins
interface ApprovedPin {
  storeId: number;
  storeName: string;
  lat: number;
  lng: number;
  thumbnailUrl: string;
}

// Từ spec 002 — GET /api/stores/:id/commentary
interface CommentaryResponse {
  storeId: number;
  status: 'approved' | 'pending' | 'processing';
  audioUrl: string;         // URL file audio đã tổng hợp (S3/MinIO)
  textContent: string;      // Text thuyết minh
  language: string;         // Ngôn ngữ hiện tại (theo i18n setting)
}
```

---

## 5. Quan hệ giữa các Entity

```
stores (spec 001/002)
  │
  ├─── location_pins (spec 003)  ─── status: approved → dùng cho GPS proximity
  │
  ├─── commentaries (spec 002)   ─── status: approved, audioUrl → trigger auto-play
  │
  └─── qr_codes (spec 005)
           │ store_id FK
           │ token UUID (unique)
           │ is_active BOOLEAN
           └── created_by → store_owner_accounts
```

**Không có foreign key** giữa `qr_codes` và `location_pins` hay `commentaries`. QR code
chỉ liên kết với `stores` — điều hướng đến trang chi tiết gian hàng, không phụ thuộc
trạng thái pin hay commentary.

---

## 6. TypeORM Entity (Backend)

```typescript
// qr/entities/qr-code.entity.ts
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Store } from '../../stores/entities/store.entity';
import { StoreOwnerAccount } from '../../auth/entities/store-owner-account.entity';

@Entity('qr_codes')
@Index('uq_one_active_qr_per_store', ['storeId'], {
  unique: true,
  where: '"is_active" = TRUE',
})
export class QrCode {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'store_id' })
  storeId: number;

  @ManyToOne(() => Store, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({ type: 'uuid', unique: true, default: () => 'gen_random_uuid()' })
  token: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @Column({ name: 'created_by' })
  createdBy: number;

  @ManyToOne(() => StoreOwnerAccount)
  @JoinColumn({ name: 'created_by' })
  creator: StoreOwnerAccount;
}
```

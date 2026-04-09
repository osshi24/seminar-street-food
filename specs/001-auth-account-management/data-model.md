# Data Model: Xác thực & Quản lý tài khoản

**Spec**: 001-auth-account-management | **Date**: 2026-04-05

---

## 1. State Machine — StoreOwnerAccount

Diagram trạng thái cho vòng đời tài khoản Store Owner:

```
                        ┌─────────────────────────────────────┐
                        │            [ĐĂNG KÝ]                │
                        │  FR-001: Store Owner gửi form       │
                        └──────────────────┬──────────────────┘
                                           │ Tạo account + store
                                           ▼
                                    ┌─────────────┐
                                    │   pending   │ ◄─── Trạng thái khởi tạo
                                    └──────┬──────┘      (FR-002)
                                           │
                     ┌─────────────────────┴──────────────────────┐
                     │ Admin phê duyệt                            │ Admin từ chối
                     │ FR-005                                     │ FR-006 (kèm lý do bắt buộc)
                     ▼                                            ▼
              ┌─────────────┐                            ┌─────────────┐
              │   active    │◄───────────────────────────│  rejected   │
              └──────┬──────┘    KHÔNG có transition     └─────────────┘
                     │           rejected → active                  (trạng thái cuối)
                     │
          ┌──────────┴──────────┐
          │ Admin vô hiệu hóa  │
          │ FR-009              │
          ▼                     │
   ┌─────────────┐              │
   │  inactive   │              │
   └──────┬──────┘              │
          │ Admin kích hoạt lại │
          │ FR-010              │
          └─────────────────────┘
```

### Bảng transition hợp lệ

| Từ trạng thái | Sang trạng thái | Điều kiện | Actor |
| ------------- | --------------- | --------- | ----- |
| `pending` | `active` | Admin phê duyệt | Admin |
| `pending` | `rejected` | Admin từ chối + lý do bắt buộc | Admin |
| `active` | `inactive` | Admin vô hiệu hóa | Admin |
| `inactive` | `active` | Admin kích hoạt lại | Admin |
| `rejected` | (không có) | Trạng thái cuối — không thể chuyển | — |

Store Owner với email đã tồn tại (kể cả `rejected`) không thể đăng ký lại (FR-012).

---

## 2. State Machine — Store

```
                ┌────────────────────────────────────┐
                │        [TẠO KHI ĐĂNG KÝ]          │
                │  FR-002b: tạo cùng lúc với account │
                └─────────────────┬──────────────────┘
                                  │
                                  ▼
                           ┌─────────────┐
                           │  inactive   │ ◄─── Trạng thái khởi tạo
                           └─────────────┘      Không hiển thị công khai
                                  │
                                  │ Admin phê duyệt account (spec 001)
                                  │ Kích hoạt store (spec 002)
                                  ▼
                           ┌─────────────┐
                           │   active    │      Hiển thị công khai
                           └─────────────┘
```

Quản lý trạng thái Store chi tiết thuộc phạm vi spec 002. Spec 001 chỉ tạo Store ở
trạng thái `inactive`.

---

## 3. Database Schema (PostgreSQL)

### 3.1 Enum Types

```sql
CREATE TYPE store_owner_status AS ENUM ('pending', 'active', 'inactive', 'rejected');
CREATE TYPE store_status AS ENUM ('inactive', 'active');
CREATE TYPE notification_recipient_type AS ENUM ('store_owner', 'admin');
```

### 3.2 Bảng `store_owner_accounts`

```sql
CREATE TABLE store_owner_accounts (
  id                    UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name             VARCHAR(255)  NOT NULL,
  email                 VARCHAR(255)  NOT NULL UNIQUE,
  phone                 VARCHAR(20)   NOT NULL,
  password_hash         VARCHAR(255)  NOT NULL,
  registration_reason   TEXT          NOT NULL,
  status                store_owner_status NOT NULL DEFAULT 'pending',

  -- Brute force protection
  failed_login_attempts INTEGER       NOT NULL DEFAULT 0,
  lockout_until         TIMESTAMPTZ   NULL,

  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_store_owner_accounts_email   ON store_owner_accounts (email);
CREATE INDEX idx_store_owner_accounts_status  ON store_owner_accounts (status);
```

**Ghi chú các cột**:

| Cột | Kiểu | Mô tả |
| --- | ---- | ----- |
| `id` | UUID | Primary key, tự sinh |
| `full_name` | VARCHAR(255) | Họ tên đầy đủ của Store Owner |
| `email` | VARCHAR(255) | Email định danh duy nhất, dùng để đăng nhập |
| `phone` | VARCHAR(20) | Số điện thoại (lưu dạng string để hỗ trợ format quốc tế) |
| `password_hash` | VARCHAR(255) | bcrypt hash, cost factor 12 |
| `registration_reason` | TEXT | Lý do đăng ký mở gian hàng (bắt buộc FR-001) |
| `status` | enum | Vòng đời tài khoản: pending/active/inactive/rejected |
| `failed_login_attempts` | INTEGER | Số lần đăng nhập sai liên tiếp (FR-012b) |
| `lockout_until` | TIMESTAMPTZ | Thời điểm hết lockout; NULL nếu không bị khóa |
| `created_at` | TIMESTAMPTZ | Thời điểm tạo tài khoản |
| `updated_at` | TIMESTAMPTZ | Thời điểm cập nhật gần nhất |

### 3.3 Bảng `stores`

> Chỉ chứa các fields thuộc phạm vi spec 001. Spec 002 sẽ thêm address, description,
> category, opening_hours và các fields khác.

```sql
CREATE TABLE stores (
  id          UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID          NOT NULL UNIQUE REFERENCES store_owner_accounts(id)
                            ON DELETE CASCADE,
  name        VARCHAR(255)  NOT NULL,
  status      store_status  NOT NULL DEFAULT 'inactive',

  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_stores_owner_id ON stores (owner_id);
CREATE INDEX idx_stores_status   ON stores (status);
```

**Ghi chú các cột**:

| Cột | Kiểu | Mô tả |
| --- | ---- | ----- |
| `id` | UUID | Primary key |
| `owner_id` | UUID FK | Liên kết 1-1 với `store_owner_accounts.id` |
| `name` | VARCHAR(255) | Tên gian hàng nhập khi đăng ký |
| `status` | enum | `inactive` khi tạo; `active` sau khi Admin kích hoạt (spec 002) |
| `created_at` | TIMESTAMPTZ | Tạo đồng thời với `store_owner_accounts` |
| `updated_at` | TIMESTAMPTZ | Thời điểm cập nhật gần nhất |

Quan hệ: `stores.owner_id` → `store_owner_accounts.id` (UNIQUE = quan hệ 1-1).
`ON DELETE CASCADE`: nếu account bị xóa (không dùng trong MVP nhưng đảm bảo tính
toàn vẹn) thì store cũng bị xóa.

### 3.4 Bảng `admin_accounts`

```sql
CREATE TABLE admin_accounts (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  full_name     VARCHAR(255)  NOT NULL,

  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_accounts_email ON admin_accounts (email);
```

**Ghi chú**: Không có `updated_at` vì Admin account không cập nhật qua API (chỉ qua
script seeding). Không có `status` vì Admin account không có vòng đời phức tạp trong
MVP. Không có `failed_login_attempts` cho Admin ở MVP (có thể thêm sau).

### 3.5 Bảng `notifications`

```sql
CREATE TABLE notifications (
  id              UUID                      PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_type  notification_recipient_type NOT NULL,
  recipient_id    UUID                      NOT NULL,
  event_type      VARCHAR(100)              NOT NULL,
  title           VARCHAR(500)              NOT NULL,
  body            TEXT                      NOT NULL,
  is_read         BOOLEAN                   NOT NULL DEFAULT FALSE,

  created_at      TIMESTAMPTZ               NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_recipient
  ON notifications (recipient_type, recipient_id);
CREATE INDEX idx_notifications_recipient_unread
  ON notifications (recipient_type, recipient_id)
  WHERE is_read = FALSE;
```

**Ghi chú các cột**:

| Cột | Kiểu | Mô tả |
| --- | ---- | ----- |
| `id` | UUID | Primary key |
| `recipient_type` | enum | `store_owner` hoặc `admin` |
| `recipient_id` | UUID | ID của người nhận (trỏ đến `store_owner_accounts.id` hoặc `admin_accounts.id` tùy `recipient_type`) |
| `event_type` | VARCHAR(100) | Mã sự kiện: `REGISTRATION_SUBMITTED`, `ACCOUNT_APPROVED`, `ACCOUNT_REJECTED`, `ACCOUNT_DEACTIVATED`, `ACCOUNT_REACTIVATED` |
| `title` | VARCHAR(500) | Tiêu đề thông báo hiển thị trên UI |
| `body` | TEXT | Nội dung đầy đủ của thông báo |
| `is_read` | BOOLEAN | Đánh dấu đã đọc hay chưa |
| `created_at` | TIMESTAMPTZ | Thời điểm tạo thông báo |

`recipient_id` là polymorphic foreign key (không có FK constraint ở DB level để tránh
phức tạp). Tính toàn vẹn được đảm bảo ở application layer.

**Các giá trị `event_type`**:

| event_type | Người nhận | Mô tả |
| ---------- | ---------- | ----- |
| `REGISTRATION_SUBMITTED` | Admin (tất cả) | Store Owner vừa đăng ký, chờ xét duyệt |
| `ACCOUNT_APPROVED` | Store Owner | Tài khoản vừa được Admin phê duyệt |
| `ACCOUNT_REJECTED` | Store Owner | Tài khoản bị từ chối, kèm lý do trong `body` |
| `ACCOUNT_DEACTIVATED` | Store Owner | Tài khoản bị Admin vô hiệu hóa |
| `ACCOUNT_REACTIVATED` | Store Owner | Tài khoản được Admin kích hoạt lại |

---

## 4. TypeORM Entity Definitions

### 4.1 StoreOwnerAccount Entity

```typescript
// store-owner-account.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToOne, JoinColumn,
} from 'typeorm';

export enum StoreOwnerStatus {
  PENDING  = 'pending',
  ACTIVE   = 'active',
  INACTIVE = 'inactive',
  REJECTED = 'rejected',
}

@Entity('store_owner_accounts')
export class StoreOwnerAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'full_name', length: 255 })
  fullName: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 20 })
  phone: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ name: 'registration_reason', type: 'text' })
  registrationReason: string;

  @Column({
    type: 'enum',
    enum: StoreOwnerStatus,
    default: StoreOwnerStatus.PENDING,
  })
  status: StoreOwnerStatus;

  @Column({ name: 'failed_login_attempts', default: 0 })
  failedLoginAttempts: number;

  @Column({ name: 'lockout_until', type: 'timestamptz', nullable: true })
  lockoutUntil: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToOne(() => Store, (store) => store.owner, { cascade: true })
  store: Store;
}
```

### 4.2 Store Entity

```typescript
// store.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToOne, JoinColumn,
} from 'typeorm';

export enum StoreStatus {
  INACTIVE = 'inactive',
  ACTIVE   = 'active',
}

@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'owner_id' })
  ownerId: string;

  @Column({ length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: StoreStatus,
    default: StoreStatus.INACTIVE,
  })
  status: StoreStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToOne(() => StoreOwnerAccount, (account) => account.store)
  @JoinColumn({ name: 'owner_id' })
  owner: StoreOwnerAccount;
}
```

### 4.3 AdminAccount Entity

```typescript
// admin-account.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('admin_accounts')
export class AdminAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ name: 'full_name', length: 255 })
  fullName: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
```

### 4.4 Notification Entity

```typescript
// notification.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum NotificationRecipientType {
  STORE_OWNER = 'store_owner',
  ADMIN       = 'admin',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'recipient_type',
    type: 'enum',
    enum: NotificationRecipientType,
  })
  recipientType: NotificationRecipientType;

  @Column({ name: 'recipient_id' })
  recipientId: string;

  @Column({ name: 'event_type', length: 100 })
  eventType: string;

  @Column({ length: 500 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
```

---

## 5. Luồng tạo tài khoản (Database Transaction)

Khi Store Owner đăng ký (FR-002, FR-002b), toàn bộ các thao tác sau được thực hiện
trong **một database transaction duy nhất**:

```
BEGIN TRANSACTION
  1. INSERT INTO store_owner_accounts (full_name, email, phone, password_hash,
                                       registration_reason, status='pending')
  2. INSERT INTO stores (owner_id = [account.id], name, status='inactive')
  3. INSERT INTO notifications (recipient_type='admin', recipient_id=[admin.id],
                                event_type='REGISTRATION_SUBMITTED', ...)
     -- lặp cho mỗi Admin account
COMMIT

-- Sau transaction (bất đồng bộ):
  4. Enqueue BullMQ job: gửi email xác nhận đến Store Owner
  5. Enqueue BullMQ job: gửi email thông báo đến Admin
```

Nếu bất kỳ bước 1-3 thất bại, toàn bộ transaction rollback. Email queue (bước 4-5)
chạy bất đồng bộ sau khi transaction commit thành công — nếu email thất bại, thao tác
chính vẫn được coi là hoàn thành (FR-003).

---

## 6. Quan hệ giữa các bảng

```
admin_accounts
    │
    │ (polymorphic via recipient_type='admin')
    ▼
notifications ◄──────── (polymorphic via recipient_type='store_owner')
                                │
store_owner_accounts ───────────┘
    │
    │ 1:1 (owner_id FK)
    ▼
stores
```

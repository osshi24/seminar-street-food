# Data Model: Đánh giá & Kiểm duyệt bình luận

**Spec**: 004-review-comment-moderation | **Date**: 2026-04-05

---

## PostgreSQL Schema

### Bảng `customer_google_accounts`

Lưu thông tin Customer xác thực qua Google OAuth. Tạo tự động lần đầu Customer đăng nhập,
cập nhật `display_name` và `avatar_url` khi đăng nhập lại (upsert).

```sql
CREATE TABLE customer_google_accounts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_id    VARCHAR(255) NOT NULL UNIQUE,    -- Google subject ID (không đổi)
  email        VARCHAR(255) NOT NULL UNIQUE,    -- Lưu nội bộ, không hiển thị công khai
  display_name VARCHAR(255) NOT NULL,           -- Hiển thị công khai cùng đánh giá
  avatar_url   TEXT,                            -- URL ảnh đại diện Google (nullable)
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE INDEX idx_customer_google_accounts_google_id ON customer_google_accounts (google_id);
```

**Ghi chú**:
- `google_id`: String ID từ Google (ví dụ: `"117400306870901234567"`), stable và unique
  per Google account
- `email`: Chỉ dùng để xác định danh tính nội bộ; không trả về trong public API
- `display_name`, `avatar_url`: Hiển thị công khai cùng đánh giá (FR-003 clarification)

---

### Bảng `reviews`

Đánh giá của Customer cho một gian hàng. Không thể sửa sau khi gửi (FR-003).

```sql
CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id    UUID NOT NULL REFERENCES stores (id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customer_google_accounts (id),
  stars       SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  content     VARCHAR(500),                      -- Nullable — nội dung tùy chọn
  is_hidden   BOOLEAN NOT NULL DEFAULT false,    -- Soft delete khi Admin ẩn
  hidden_at   TIMESTAMP WITH TIME ZONE,          -- Thời điểm ẩn (nullable)
  hidden_by   UUID REFERENCES admin_accounts (id), -- Admin đã ẩn (nullable)
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,

  CONSTRAINT uq_reviews_store_customer UNIQUE (store_id, customer_id)
);

CREATE INDEX idx_reviews_store_id ON reviews (store_id);
CREATE INDEX idx_reviews_customer_id ON reviews (customer_id);
CREATE INDEX idx_reviews_store_id_hidden ON reviews (store_id, is_hidden);
CREATE INDEX idx_reviews_created_at_desc ON reviews (created_at DESC);
```

**Constraints**:
- `UNIQUE (store_id, customer_id)`: Enforce 1 review/store/Google account (FR-003)
- `CHECK (stars BETWEEN 1 AND 5)`: Đảm bảo giá trị hợp lệ ở database level
- `ON DELETE CASCADE` với `stores`: Khi xóa gian hàng, xóa toàn bộ reviews liên quan

**Soft delete fields**:
- `is_hidden`: `true` khi Admin ẩn bình luận; review vẫn tồn tại trong DB
- `hidden_at`: Timestamp để audit trail
- `hidden_by`: FK đến Admin account để biết ai đã ẩn

---

### Bảng `report_reasons`

Danh sách lý do báo cáo do Admin cấu hình. Store Owner chọn từ danh sách này.

```sql
CREATE TABLE report_reasons (
  id         SERIAL PRIMARY KEY,
  label_vi   VARCHAR(100) NOT NULL,   -- Nhãn tiếng Việt
  label_en   VARCHAR(100) NOT NULL,   -- Nhãn tiếng Anh (dùng trong code/log)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Seed data ban đầu
INSERT INTO report_reasons (label_vi, label_en) VALUES
  ('Spam hoặc quảng cáo',             'Spam or advertisement'),
  ('Nội dung không phù hợp',          'Inappropriate content'),
  ('Thông tin sai lệch',              'Misleading information'),
  ('Ngôn ngữ thù địch hoặc xúc phạm','Hate speech or offensive language'),
  ('Không liên quan đến gian hàng',   'Not relevant to the store');
```

**Ghi chú**: Dùng lookup table thay vì PostgreSQL enum để Admin có thể thêm lý do mới
mà không cần database migration (xem research.md §4).

---

### Bảng `comment_reports`

Báo cáo của Store Owner về một bình luận vi phạm.

```sql
CREATE TYPE comment_report_status AS ENUM ('pending', 'resolved', 'dismissed');

CREATE TABLE comment_reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id   UUID NOT NULL REFERENCES reviews (id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES store_owner_accounts (id),
  reason_id   INTEGER NOT NULL REFERENCES report_reasons (id),
  status      comment_report_status NOT NULL DEFAULT 'pending',
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  resolved_at TIMESTAMP WITH TIME ZONE,          -- Thời điểm xử lý (nullable)
  resolved_by UUID REFERENCES admin_accounts (id), -- Admin đã xử lý (nullable)

  CONSTRAINT uq_comment_reports_review_reporter UNIQUE (review_id, reporter_id)
);

CREATE INDEX idx_comment_reports_review_id ON comment_reports (review_id);
CREATE INDEX idx_comment_reports_status ON comment_reports (status);
CREATE INDEX idx_comment_reports_reporter_id ON comment_reports (reporter_id);
```

**Constraints**:
- `UNIQUE (review_id, reporter_id)`: Ngăn Store Owner báo cáo cùng 1 bình luận 2 lần
  (FR-012)
- `ON DELETE CASCADE` với `reviews`: Khi review bị xóa vĩnh viễn, xóa reports liên quan

---

### Bảng `stores` — Thêm cached rating fields

Thêm hai fields vào bảng `stores` hiện có (từ spec 002) để lưu rating cached:

```sql
ALTER TABLE stores
  ADD COLUMN avg_rating    DECIMAL(3, 2) NOT NULL DEFAULT 0.00,
  ADD COLUMN review_count  INTEGER       NOT NULL DEFAULT 0;

-- avg_rating: VD 4.20 (3 chữ số, 2 sau dấu thập phân)
-- review_count: Tổng số đánh giá chưa bị ẩn
```

**Cập nhật khi nào**:
- Khi Customer submit review mới: `review_count + 1`, tính lại `avg_rating`
- Khi Admin ẩn review: `review_count - 1`, tính lại `avg_rating`
- Khi Admin bỏ ẩn review: `review_count + 1`, tính lại `avg_rating`
- Khi Admin xóa review vĩnh viễn: `review_count - 1`, tính lại `avg_rating`

---

## Entity Relationships

```text
stores
  ├── reviews (1:N, CASCADE DELETE)
  │     ├── customer_google_accounts (N:1)
  │     ├── admin_accounts (N:1, hidden_by, nullable)
  │     └── comment_reports (1:N, CASCADE DELETE)
  │           ├── store_owner_accounts (N:1, reporter_id)
  │           ├── report_reasons (N:1)
  │           └── admin_accounts (N:1, resolved_by, nullable)
  └── store_owner_accounts (N:1, owner)
```

---

## State Machine: CommentReport

```text
                   ┌─────────────────────────────────────────┐
                   │             CommentReport                │
                   └─────────────────────────────────────────┘

  [Store Owner gửi báo cáo]
          │
          ▼
      ┌─────────┐
      │ pending │  ← Trạng thái ban đầu; Admin nhận notification
      └─────────┘
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
┌──────────┐  ┌───────────┐
│ resolved │  │ dismissed │
└──────────┘  └───────────┘
  Admin ẩn     Admin bác bỏ
  hoặc xóa     báo cáo;
  bình luận    bình luận
               vẫn hiển thị
```

**Transitions**:

| Từ | Sang | Điều kiện | Action đi kèm |
| -- | ---- | --------- | -------------- |
| `pending` | `resolved` | Admin PATCH `/admin/reports/:id/resolve` | `reviews.is_hidden = true` hoặc DELETE review; set `resolved_at`, `resolved_by` |
| `pending` | `dismissed` | Admin PATCH `/admin/reports/:id/dismiss` | Bình luận vẫn hiển thị bình thường; set `resolved_at`, `resolved_by` |
| `resolved` | — | Không cho phép chuyển trạng thái sau khi resolve | — |
| `dismissed` | — | Không cho phép chuyển trạng thái sau khi dismiss | — |

---

## State Machine: Review (is_hidden)

```text
  [Customer submit]
          │
          ▼
   ┌─────────────┐
   │  is_hidden  │
   │   = false   │ ← Hiển thị với Customer
   └─────────────┘
        │    ▲
  Admin │    │ Admin
  ẩn    │    │ bỏ ẩn
        ▼    │
   ┌─────────────┐
   │  is_hidden  │
   │   = true    │ ← Ẩn với Customer, Admin vẫn thấy
   └─────────────┘
        │
  Admin │
  xóa   │
        ▼
   [Deleted permanently]
```

---

## TypeORM Entities

### `customer-google-account.entity.ts`

```typescript
@Entity('customer_google_accounts')
export class CustomerGoogleAccount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'google_id', unique: true })
  googleId: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'display_name' })
  displayName: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Review, (review) => review.customer)
  reviews: Review[];
}
```

### `review.entity.ts`

```typescript
@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'store_id' })
  storeId: string;

  @ManyToOne(() => Store, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({ name: 'customer_id' })
  customerId: string;

  @ManyToOne(() => CustomerGoogleAccount)
  @JoinColumn({ name: 'customer_id' })
  customer: CustomerGoogleAccount;

  @Column({ type: 'smallint' })
  stars: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  content: string | null;

  @Column({ name: 'is_hidden', default: false })
  isHidden: boolean;

  @Column({ name: 'hidden_at', nullable: true })
  hiddenAt: Date | null;

  @Column({ name: 'hidden_by', nullable: true })
  hiddenBy: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => CommentReport, (report) => report.review)
  reports: CommentReport[];
}
```

### `comment-report.entity.ts`

```typescript
export enum CommentReportStatus {
  PENDING = 'pending',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

@Entity('comment_reports')
export class CommentReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'review_id' })
  reviewId: string;

  @ManyToOne(() => Review, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'review_id' })
  review: Review;

  @Column({ name: 'reporter_id' })
  reporterId: string;

  @ManyToOne(() => StoreOwnerAccount)
  @JoinColumn({ name: 'reporter_id' })
  reporter: StoreOwnerAccount;

  @Column({ name: 'reason_id' })
  reasonId: number;

  @ManyToOne(() => ReportReason)
  @JoinColumn({ name: 'reason_id' })
  reason: ReportReason;

  @Column({
    type: 'enum',
    enum: CommentReportStatus,
    default: CommentReportStatus.PENDING,
  })
  status: CommentReportStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'resolved_at', nullable: true })
  resolvedAt: Date | null;

  @Column({ name: 'resolved_by', nullable: true })
  resolvedBy: string | null;
}
```

### `report-reason.entity.ts`

```typescript
@Entity('report_reasons')
export class ReportReason {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'label_vi' })
  labelVi: string;

  @Column({ name: 'label_en' })
  labelEn: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

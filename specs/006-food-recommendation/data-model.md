# Data Model: Gợi ý món ăn theo sở thích

**Spec**: 006-food-recommendation | **Date**: 2026-04-05
**Depends on**: spec 002 (bảng `menu_items`, `stores`)

---

## 1. Quan hệ tổng quan

```
preference_tags
    │
    │ many-to-many (qua join table)
    │
menu_item_tags ────────────── menu_items (spec 002)
                                   │
                                   │ many-to-one
                                   │
                                 stores (spec 002)
```

Spec 006 thêm:
- Bảng mới `preference_tags` — quản lý nhãn sở thích.
- Bảng join mới `menu_item_tags` — liên kết many-to-many giữa `menu_items` và `preference_tags`.
- Không thêm cột mới vào bảng `menu_items` hay `stores`.

---

## 2. Database Schema (PostgreSQL)

### 2.1 Bảng `preference_tags`

```sql
CREATE TABLE preference_tags (
  id          SERIAL        PRIMARY KEY,
  name_vi     VARCHAR(100)  NOT NULL,
  name_en     VARCHAR(100)  NOT NULL,
  group_type  VARCHAR(50)   NOT NULL
                CHECK (group_type IN ('dish_type', 'flavor', 'allergen')),

  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_preference_tags_group_type ON preference_tags (group_type);
```

**Ghi chú các cột**:

| Cột | Kiểu | Mô tả |
| --- | ---- | ----- |
| `id` | SERIAL | Primary key, tự tăng (integer, đơn giản hơn UUID cho lookup table) |
| `name_vi` | VARCHAR(100) | Tên nhãn bằng tiếng Việt (VD: "Cay", "Chay", "Không gluten") |
| `name_en` | VARCHAR(100) | Tên nhãn bằng tiếng Anh (VD: "Spicy", "Vegetarian", "Gluten-free") |
| `group_type` | VARCHAR(50) | Nhóm nhãn: `dish_type` (loại món), `flavor` (khẩu vị), `allergen` (dị ứng) |
| `created_at` | TIMESTAMPTZ | Thời điểm Admin tạo nhãn |
| `updated_at` | TIMESTAMPTZ | Thời điểm Admin cập nhật nhãn gần nhất |

**Các giá trị hợp lệ của `group_type`**:

| Giá trị | Mô tả | Ví dụ nhãn |
| ------- | ----- | ---------- |
| `dish_type` | Loại món ăn theo danh mục | Cơm, Phở, Bánh mì, Lẩu, Bún, Hủ tiếu |
| `flavor` | Khẩu vị hoặc tính chất món | Cay, Ngọt, Mặn, Thanh đạm, Chay, Ít dầu mỡ |
| `allergen` | Dị ứng hoặc hạn chế thực phẩm | Không gluten, Không hải sản, Không đậu phộng, Không sữa |

### 2.2 Bảng `menu_item_tags` (join table)

```sql
CREATE TABLE menu_item_tags (
  menu_item_id  UUID  NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  tag_id        INT   NOT NULL REFERENCES preference_tags(id),

  PRIMARY KEY (menu_item_id, tag_id)
);

CREATE INDEX idx_menu_item_tags_tag_id ON menu_item_tags (tag_id);
```

**Ghi chú**:

| Cột | Kiểu | Mô tả |
| --- | ---- | ----- |
| `menu_item_id` | UUID FK | Trỏ đến `menu_items.id`; ON DELETE CASCADE — khi món bị xóa, associations tự xóa |
| `tag_id` | INT FK | Trỏ đến `preference_tags.id`; **không** ON DELETE CASCADE (xem phần 4) |

**Indexes**:
- `PRIMARY KEY (menu_item_id, tag_id)` — composite PK đảm bảo không trùng lặp, đồng thời
  là index hiệu quả cho query lookup theo `menu_item_id`.
- `idx_menu_item_tags_tag_id` — index phụ cho query lookup theo `tag_id` (dùng khi Admin
  check usage count trước khi xóa tag, và trong recommendation query).

### 2.3 Bảng `menu_items` (extend từ spec 002)

Không thêm cột mới. Quan hệ many-to-many với `preference_tags` được thể hiện hoàn toàn
qua join table `menu_item_tags`.

Tham chiếu columns cần thiết cho recommendation query:

| Cột | Kiểu | Nguồn |
| --- | ---- | ----- |
| `id` | UUID | spec 002 |
| `name` | VARCHAR | spec 002 — tên món ăn hiển thị trong kết quả |
| `price` | NUMERIC | spec 002 — giá hiển thị trong kết quả |
| `store_id` | UUID FK | spec 002 — JOIN với bảng `stores` |

### 2.4 Bảng `stores` (tham chiếu từ spec 002)

Columns cần thiết cho recommendation query:

| Cột | Kiểu | Nguồn |
| --- | ---- | ----- |
| `id` | UUID | spec 002 |
| `name` | VARCHAR | spec 002 — tên gian hàng hiển thị trong kết quả |
| `status` | VARCHAR/ENUM | spec 002 — filter điều kiện `status = 'active'` |

---

## 3. Recommendation Query Logic

### 3.1 Query gợi ý chính

```sql
-- Tham số: :tagIds (integer[]), :limit (integer), :offset (integer)
SELECT
  mi.id           AS menu_item_id,
  mi.name         AS menu_item_name,
  mi.price        AS price,
  s.id            AS store_id,
  s.name          AS store_name,
  COUNT(mit.tag_id) AS match_count
FROM menu_items mi
JOIN stores s
  ON mi.store_id = s.id
JOIN menu_item_tags mit
  ON mi.id = mit.menu_item_id
WHERE mit.tag_id = ANY(:tagIds)
  AND s.status = 'active'
GROUP BY
  mi.id,
  mi.name,
  mi.price,
  s.id,
  s.name
ORDER BY
  match_count DESC,
  mi.id ASC          -- tiebreaker ổn định
LIMIT  :limit        -- luôn là 20
OFFSET :offset;      -- (page - 1) * 20
```

### 3.2 Query đếm tổng kết quả (cho phân trang)

```sql
SELECT COUNT(DISTINCT mi.id) AS total_count
FROM menu_items mi
JOIN stores s
  ON mi.store_id = s.id
JOIN menu_item_tags mit
  ON mi.id = mit.menu_item_id
WHERE mit.tag_id = ANY(:tagIds)
  AND s.status = 'active';
```

Query này chạy song song với query chính để trả về `totalCount` trong response, giúp
frontend tính tổng số trang.

### 3.3 Tính pagination

```
totalPages  = CEIL(totalCount / 20)
hasNextPage = page < totalPages
offset      = (page - 1) * 20
```

### 3.4 Indexes hỗ trợ query

```sql
-- Đã có từ spec 002 (giả định):
CREATE INDEX idx_menu_items_store_id ON menu_items (store_id);
CREATE INDEX idx_stores_status       ON stores (status);

-- Thêm mới ở spec 006:
CREATE INDEX idx_menu_item_tags_tag_id ON menu_item_tags (tag_id);
-- PRIMARY KEY (menu_item_id, tag_id) đã là composite index
```

PostgreSQL query plan dự kiến: index scan trên `menu_item_tags.tag_id` → nested loop JOIN
với `menu_items` → filter `stores.status = 'active'` → GROUP BY + ORDER BY với sort trên
kết quả nhỏ (< vài nghìn rows sau filter).

---

## 4. Constraint: Xóa PreferenceTag

Xóa tag bị **chặn ở application layer** (không phải DB constraint) để có thể trả về thông
báo rõ ràng cho Admin.

```sql
-- Bước 1: Admin gọi DELETE /api/admin/tags/:id
-- Bước 2: Service kiểm tra usage
SELECT COUNT(*) AS usage_count
FROM menu_item_tags
WHERE tag_id = :id;

-- Bước 3a: Nếu usage_count > 0 → reject
-- → HTTP 409 Conflict
-- → { "code": "TAG_IN_USE", "count": <usage_count>, "message": "..." }

-- Bước 3b: Nếu usage_count = 0 → cho phép xóa
DELETE FROM preference_tags WHERE id = :id;
```

Foreign key `menu_item_tags.tag_id → preference_tags.id` **không** có `ON DELETE CASCADE`.
Nếu application layer bị bypass và DELETE preference_tags được thực thi trực tiếp khi còn
associations, PostgreSQL sẽ raise FK violation error — đây là lưới bắt lỗi cuối.

---

## 5. TypeORM Entity Definitions

### 5.1 PreferenceTag Entity

```typescript
// preference-tag.entity.ts
import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToMany,
} from 'typeorm';
import { MenuItem } from './menu-item.entity';

export type TagGroupType = 'dish_type' | 'flavor' | 'allergen';

@Entity('preference_tags')
export class PreferenceTag {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'name_vi', length: 100 })
  nameVi: string;

  @Column({ name: 'name_en', length: 100 })
  nameEn: string;

  @Column({ name: 'group_type', length: 50 })
  groupType: TagGroupType;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @ManyToMany(() => MenuItem, (menuItem) => menuItem.tags)
  menuItems: MenuItem[];
}
```

### 5.2 MenuItem Entity (extension từ spec 002)

```typescript
// menu-item.entity.ts — chỉ hiển thị phần thêm mới so với spec 002
import { ManyToMany, JoinTable } from 'typeorm';
import { PreferenceTag } from './preference-tag.entity';

@Entity('menu_items')
export class MenuItem {
  // ... các fields từ spec 002 ...

  @ManyToMany(() => PreferenceTag, (tag) => tag.menuItems)
  @JoinTable({
    name: 'menu_item_tags',
    joinColumn:        { name: 'menu_item_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id',        referencedColumnName: 'id' },
  })
  tags: PreferenceTag[];
}
```

`@JoinTable` đặt ở phía `MenuItem` (owning side) — theo TypeORM convention, chỉ một
phía của ManyToMany sở hữu join table.

### 5.3 MenuItemTag Entity (tùy chọn — cho raw query)

Join table không cần entity riêng nếu chỉ dùng TypeORM ManyToMany. Tuy nhiên, nếu cần
chạy raw query (recommendation query phức tạp), có thể inject `DataSource` và dùng
`dataSource.query()` trực tiếp thay vì entity:

```typescript
// recommendations.service.ts
@Injectable()
export class RecommendationsService {
  constructor(private readonly dataSource: DataSource) {}

  async getRecommendations(
    tagIds: number[],
    page: number,
  ): Promise<{ items: RecommendationItem[]; totalCount: number }> {
    const offset = (page - 1) * 20;
    const limit = 20;

    const [items, [{ total_count }]] = await Promise.all([
      this.dataSource.query<RecommendationItem[]>(
        `SELECT mi.id AS "menuItemId", mi.name AS "menuItemName",
                mi.price, s.id AS "storeId", s.name AS "storeName",
                COUNT(mit.tag_id)::int AS "matchCount"
         FROM menu_items mi
         JOIN stores s ON mi.store_id = s.id
         JOIN menu_item_tags mit ON mi.id = mit.menu_item_id
         WHERE mit.tag_id = ANY($1) AND s.status = 'active'
         GROUP BY mi.id, mi.name, mi.price, s.id, s.name
         ORDER BY "matchCount" DESC, mi.id ASC
         LIMIT $2 OFFSET $3`,
        [tagIds, limit, offset],
      ),
      this.dataSource.query<[{ total_count: string }]>(
        `SELECT COUNT(DISTINCT mi.id) AS total_count
         FROM menu_items mi
         JOIN stores s ON mi.store_id = s.id
         JOIN menu_item_tags mit ON mi.id = mit.menu_item_id
         WHERE mit.tag_id = ANY($1) AND s.status = 'active'`,
        [tagIds],
      ),
    ]);

    return { items, totalCount: parseInt(total_count, 10) };
  }
}
```

---

## 6. Quan hệ giữa các bảng (ERD text)

```
preference_tags
  id (PK)
  name_vi
  name_en
  group_type
  created_at
  updated_at
       │
       │ (tag_id FK — NO CASCADE)
       │
  menu_item_tags
    menu_item_id (FK → menu_items.id, CASCADE)
    tag_id       (FK → preference_tags.id, NO CASCADE)
    PK(menu_item_id, tag_id)
       │
       │ (menu_item_id FK — ON DELETE CASCADE)
       │
  menu_items (spec 002)
    id (PK)
    name
    price
    store_id (FK → stores.id)
       │
       │ (store_id FK)
       │
  stores (spec 002)
    id (PK)
    name
    status  ← filter: 'active' only
```

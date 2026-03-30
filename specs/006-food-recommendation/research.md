# Research: Gợi ý món ăn theo sở thích

**Spec**: 006-food-recommendation | **Date**: 2026-04-05

Tài liệu này ghi lại các quyết định design kỹ thuật cho feature gợi ý món ăn theo nhãn
sở thích, lý do lựa chọn, và các phương án đã cân nhắc nhưng bị loại bỏ.

---

## 1. Tag Matching Query Strategy

### Quyết định: SQL COUNT(matching_tags) GROUP BY menu_item ORDER BY match_count DESC

Recommendation engine dựa hoàn toàn vào SQL — không có model ML hay scoring phức tạp.

Query cốt lõi:

```sql
SELECT
  mi.id,
  mi.name,
  mi.price,
  s.id   AS store_id,
  s.name AS store_name,
  COUNT(mit.tag_id) AS match_count
FROM menu_items mi
JOIN stores s ON mi.store_id = s.id
JOIN menu_item_tags mit ON mi.id = mit.menu_item_id
WHERE mit.tag_id = ANY(:tagIds)
  AND s.status = 'active'
GROUP BY mi.id, mi.name, mi.price, s.id, s.name
ORDER BY match_count DESC
LIMIT 20 OFFSET :offset;
```

Logic hoạt động:
- `JOIN menu_item_tags mit ON mi.id = mit.menu_item_id` — chỉ lấy các món có ít nhất một
  nhãn khớp (INNER JOIN thay vì LEFT JOIN).
- `WHERE mit.tag_id = ANY(:tagIds)` — lọc các bản ghi join table chỉ giữ tag khớp.
- `COUNT(mit.tag_id)` — đếm số tag khớp cho mỗi menu item (deduplication được xử lý tự
  nhiên bởi GROUP BY; một menu item chỉ xuất hiện một lần dù khớp nhiều tag).
- `ORDER BY match_count DESC` — món khớp nhiều nhãn nhất lên trước. Khi bằng nhau, giữ
  thứ tự tự nhiên của DB (theo `mi.id` — ổn định trong PostgreSQL với B-tree index).
- `AND s.status = 'active'` — tuân thủ FR-004 và Principle I.

### Lý do chọn approach SQL thuần thay vì application-layer scoring

| Tiêu chí | SQL COUNT + GROUP BY (chọn) | Application-layer scoring (loại bỏ) |
| -------- | --------------------------- | ----------------------------------- |
| Deduplication | Tự động qua GROUP BY | Cần xử lý thủ công trong code |
| Performance | Một query duy nhất, PostgreSQL tối ưu với index | Cần load nhiều rows rồi xử lý trong memory |
| Pagination | LIMIT/OFFSET áp dụng trực tiếp trên kết quả đã sort | Phải load toàn bộ rồi slice — không scalable |
| Độ phức tạp | Thấp — SQL dễ đọc và test | Cao — cần unit test cho scoring logic |
| Extensibility | Dễ thêm tiebreaker (VD: ORDER BY match_count DESC, mi.created_at DESC) | Cần refactor scoring function |

---

## 2. Pagination Strategy: Offset-based

### Quyết định: Offset-based pagination với LIMIT 20 OFFSET N

```
Trang 1: LIMIT 20 OFFSET 0
Trang 2: LIMIT 20 OFFSET 20
Trang N: LIMIT 20 OFFSET (N-1)*20
```

Frontend gửi query parameter `?page=1` (mặc định 1). Backend tính `offset = (page - 1) * 20`.

### So sánh với cursor-based pagination

| Tiêu chí | Offset-based (chọn) | Cursor-based (loại bỏ) |
| -------- | ------------------- | ----------------------- |
| Đơn giản | Cao — `page` là số nguyên dễ hiểu | Thấp — cursor là encoded token, UX phức tạp |
| Tính nhất quán khi data thay đổi | Thấp — có thể bị lệch nếu items thêm/xóa giữa các trang | Cao — cursor đảm bảo tính nhất quán |
| Phù hợp với use case | Tốt — recommendation list không cập nhật real-time trong session | Tốt hơn cho infinite scroll với data thay đổi liên tục |
| Index performance | Đủ — OFFSET tốt cho ≤ vài nghìn items | Tốt hơn cho dataset lớn |

Cursor-based bị loại bỏ vì: (1) dataset nhỏ (vài nghìn menu items trong MVP), (2) không
có yêu cầu real-time consistency giữa các trang trong cùng session, (3) đơn giản hóa cả
backend (không cần encode/decode cursor) lẫn frontend (không cần quản lý cursor state).

---

## 3. Tag Group Type: String Field với CHECK Constraint

### Quyết định: `group_type VARCHAR(50) CHECK (group_type IN ('dish_type', 'flavor', 'allergen'))`

Ba giá trị hợp lệ:
- `'dish_type'` — loại món ăn (VD: Cơm, Phở, Bánh mì)
- `'flavor'` — khẩu vị (VD: Cay, Ngọt, Mặn, Chay)
- `'allergen'` — dị ứng thực phẩm (VD: Không gluten, Không hải sản, Không đậu phộng)

### So sánh với PostgreSQL ENUM type

| Tiêu chí | VARCHAR + CHECK (chọn) | PostgreSQL ENUM (loại bỏ) |
| -------- | ---------------------- | ------------------------- |
| Thêm giá trị mới | `ALTER TABLE` thêm vào CHECK constraint | `ALTER TYPE` — không thể dùng trong transaction trong PostgreSQL < 12 |
| Đọc giá trị hợp lệ | Query CHECK constraint — ít trực quan | `pg_enum` — có hàm hỗ trợ |
| TypeORM support | Dễ — dùng `@Column({ type: 'varchar' })` với `@IsIn()` | Cần `type: 'enum'` và enum TypeScript riêng |
| Tính rõ ràng | CHECK constraint documented trong schema | Enum type được enforce ở DB level |
| Migration | Đơn giản | Phức tạp khi cần thêm giá trị |

VARCHAR + CHECK được chọn vì dễ migrate và phù hợp với giai đoạn MVP (khả năng cao sẽ
thêm nhóm tag mới trong tương lai).

Validation ở TypeScript (NestJS DTO):

```typescript
import { IsIn } from 'class-validator';

export type TagGroupType = 'dish_type' | 'flavor' | 'allergen';

export const TAG_GROUP_TYPES: TagGroupType[] = ['dish_type', 'flavor', 'allergen'];

export class CreateTagDto {
  @IsIn(TAG_GROUP_TYPES)
  group_type: TagGroupType;
}
```

---

## 4. Deduplication: GROUP BY trong SQL

### Quyết định: Deduplication xử lý tự nhiên qua GROUP BY, không dùng DISTINCT

Một menu item có thể khớp nhiều tag trong danh sách Customer chọn. GROUP BY `mi.id` đảm
bảo mỗi menu item chỉ xuất hiện một lần trong kết quả, đồng thời `COUNT(mit.tag_id)` đếm
đúng số tag khớp.

Tại sao không dùng `SELECT DISTINCT`:

```sql
-- Cách này SAI: DISTINCT trên toàn bộ row, không tính được match_count
SELECT DISTINCT mi.id, mi.name, ...
FROM menu_items mi
JOIN menu_item_tags mit ON mi.id = mit.menu_item_id
WHERE mit.tag_id = ANY(:tagIds)

-- Cách đúng: GROUP BY để vừa dedup vừa COUNT
SELECT mi.id, mi.name, COUNT(mit.tag_id) AS match_count
FROM menu_items mi
JOIN menu_item_tags mit ON mi.id = mit.menu_item_id
WHERE mit.tag_id = ANY(:tagIds)
GROUP BY mi.id
ORDER BY match_count DESC
```

`SELECT DISTINCT` bị loại bỏ vì không thể kết hợp với aggregate function `COUNT` theo
cách trực tiếp mà vẫn giữ được thông tin match_count để sort.

---

## 5. Hard Limit 5 Tags: Dual Validation

### Quyết định: Validate ở cả frontend và backend

**Frontend** (TagSelector component):
- Khi Customer đã chọn 5 tags, disable tất cả checkbox còn lại.
- Không gọi API nếu không có tag nào được chọn.
- Hiển thị counter "X/5 nhãn đã chọn".

**Backend** (NestJS DTO + Pipe):

```typescript
export class GetRecommendationsDto {
  @IsArray()
  @ArrayMaxSize(5, { message: 'Không thể chọn quá 5 nhãn sở thích' })
  @IsInt({ each: true })
  @Transform(({ value }) => value.split(',').map(Number))
  tags: number[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(value, 10))
  page: number = 1;
}
```

Backend trả về `400 Bad Request` với message rõ ràng nếu `tags.length > 5`. Frontend
validation là UX enhancement — không thay thế backend validation.

---

## 6. Caching: Danh sách Tags

### Quyết định: Không cache ở MVP; thêm sau nếu cần

Danh sách tags (`GET /api/tags`) là dữ liệu ít thay đổi (Admin mới thay đổi), phù hợp
với caching. Tuy nhiên, ở MVP:
- Số lượng tags nhỏ (vài chục).
- Không có requirement về tốc độ đặc biệt nghiêm ngặt cho endpoint này.
- Thêm Redis cache tạo phụ thuộc mới và cần invalidation logic khi Admin sửa/xóa tag.

Cache-aside với Redis (thêm ở iteration sau nếu cần):

```
GET /api/tags
  → Check Redis cache 'tags:all'
  → Cache miss: query PostgreSQL → lưu vào Redis với TTL 5 phút
  → Cache hit: trả về từ Redis
  → Khi Admin CUD tags: invalidate 'tags:all'
```

---

## 7. Xóa PreferenceTag: Block-on-Use Pattern

### Quyết định: Check count trước khi xóa, trả 409 Conflict nếu còn dùng

Service logic (pseudo-code):

```typescript
async deleteTag(id: number): Promise<void> {
  const usageCount = await this.menuItemTagRepo.count({
    where: { tagId: id },
  });

  if (usageCount > 0) {
    throw new ConflictException({
      message: `Không thể xóa nhãn này vì đang được dùng bởi ${usageCount} món ăn`,
      code: 'TAG_IN_USE',
      count: usageCount,
    });
  }

  await this.tagRepo.delete(id);
}
```

Không dùng `ON DELETE CASCADE` cho foreign key `menu_item_tags.tag_id → preference_tags.id`
để tránh vô tình xóa hàng loạt associations khi Admin xóa tag. Block-on-Use là UX tốt
hơn và đảm bảo Admin có ý thức về tác động.

---

## 8. Các vấn đề còn mở (Open Questions)

| Vấn đề | Quyết định tạm thời | Cần xác nhận |
| ------ | ------------------- | ------------ |
| Gắn nhãn cho món ăn (tagging) | Thuộc phạm vi spec 002 — Store Owner gắn tag khi tạo/sửa menu item | Xác nhận spec 002 sẽ thêm UI và API cho tagging |
| Tiebreaker khi match_count bằng nhau | Giữ thứ tự tự nhiên (theo `mi.id`) | Confirm có cần sort thứ cấp (VD: theo giá, hoặc ngẫu nhiên) |
| Số lượng tag tối đa trong hệ thống | Không giới hạn ở MVP | Confirm nếu có giới hạn business (VD: tối đa 100 tags) |
| Hiển thị số tag trong Admin list | Hiện `usage_count` kế bên tên tag | Confirm UX requirement cho admin tag list |

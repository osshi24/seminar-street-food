# Research: Đánh giá & Kiểm duyệt bình luận

**Spec**: 004-review-comment-moderation | **Date**: 2026-04-05

Tài liệu này ghi lại các quyết định design kỹ thuật cho feature đánh giá và kiểm duyệt
bình luận, lý do lựa chọn, và các phương án đã cân nhắc nhưng bị loại bỏ.

---

## 1. Google OAuth cho Customer: Passport.js GoogleStrategy

### Quyết định: `@nestjs/passport` + `passport-google-oauth20`

Sử dụng Passport.js với GoogleStrategy trong NestJS. Luồng xác thực:

```
1. Frontend redirect sang GET /api/auth/google
2. NestJS dùng GoogleStrategy khởi động OAuth flow → redirect sang Google
3. Customer xác thực với Google, Google redirect về GET /api/auth/google/callback
4. NestJS nhận Google profile (id, displayName, photos, emails)
5. AuthService: upsert CustomerGoogleAccount (tạo mới nếu chưa có, cập nhật nếu đã có)
6. AuthService issue JWT nội bộ cho Customer
7. Backend redirect về frontend kèm JWT trong query param hoặc HttpOnly cookie
8. Frontend lưu JWT và hiển thị trạng thái đã đăng nhập
```

Cấu hình GoogleStrategy:

```typescript
// google.strategy.ts
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['profile', 'email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Promise<CustomerGoogleAccount> {
    const { id, displayName, photos, emails } = profile;
    return this.authService.upsertCustomerGoogleAccount({
      googleId: id,
      displayName,
      avatarUrl: photos?.[0]?.value ?? null,
      email: emails?.[0]?.value ?? null,
    });
  }
}
```

### Lý do chọn Passport.js GoogleStrategy

| Tiêu chí | Passport.js (chọn) | Custom OAuth handler (loại bỏ) |
| -------- | ------------------- | ------------------------------ |
| Tích hợp NestJS | Native với `@nestjs/passport` | Cần viết middleware thủ công |
| Maintenance | Ecosystem lớn, được maintain tốt | Rủi ro bảo trì dài hạn |
| Security | Xử lý state, PKCE, token validation đúng chuẩn | Dễ mắc lỗi implementation |
| Thống nhất codebase | Cùng pattern với JWT strategy của spec 001 | Thêm pattern mới vào codebase |

---

## 2. Token Management sau Google OAuth

### Quyết định: Issue JWT nội bộ ngắn hạn cho Customer

Sau khi Google OAuth thành công, backend **không** dùng Google access token trực tiếp
cho các request sau. Thay vào đó, backend issue một JWT nội bộ riêng:

```typescript
// auth.service.ts
async issueCustomerJwt(customer: CustomerGoogleAccount): Promise<string> {
  const payload = {
    sub: customer.id,
    role: 'customer',
    googleId: customer.googleId,
  };
  return this.jwtService.sign(payload, {
    expiresIn: '1h',   // Short-lived — Customer chỉ cần write review
    secret: process.env.JWT_CUSTOMER_SECRET,
  });
}
```

Đặc điểm token Customer:

- **Thời hạn ngắn**: 1 giờ (so với 8 giờ của Store Owner trong spec 001)
- **Scope hạn chế**: Chỉ dùng để POST review và POST report. GET review là public
  (không cần token)
- **Không có refresh token**: Customer không cần session dài hạn. Hết hạn → redirect
  Google OAuth lại (seamless vì Google thường không yêu cầu đăng nhập lại)
- **Lưu phía frontend**: Memory (React state) hoặc sessionStorage. Không dùng
  localStorage (XSS risk). Không dùng HttpOnly cookie để đơn giản hóa flow OAuth
  callback

### Lý do không dùng Google access token trực tiếp

- Google access token có scope rộng hơn cần thiết (có thể đọc Gmail, Drive tùy scope)
- Hết hạn Google token phức tạp hơn JWT nội bộ để handle
- Gắn chặt hệ thống vào Google API — nếu sau này thêm Apple OAuth, luồng JWT nội bộ
  không thay đổi

---

## 3. Average Rating: Cached Fields vs Computed On-the-fly

### Quyết định: Cached fields trong `stores` table (`avg_rating`, `review_count`)

Lưu `avg_rating decimal(3,2)` và `review_count integer` trực tiếp trong `stores` table,
cập nhật trong cùng database transaction khi insert review mới:

```typescript
// reviews.service.ts
async submitReview(dto: CreateReviewDto, customerId: string): Promise<Review> {
  return this.dataSource.transaction(async (manager) => {
    // 1. Insert review
    const review = manager.create(Review, { ...dto, customerId });
    await manager.save(review);

    // 2. Update cached stats trên stores table
    await manager.query(`
      UPDATE stores
      SET
        review_count = review_count + 1,
        avg_rating   = (
          SELECT ROUND(AVG(stars)::numeric, 2)
          FROM reviews
          WHERE store_id = $1 AND is_hidden = false
        )
      WHERE id = $1
    `, [dto.storeId]);

    return review;
  });
}
```

Khi Admin ẩn/bỏ ẩn/xóa review, cũng cập nhật lại `avg_rating` và `review_count`.

### So sánh các phương án

| Phương án | Ưu điểm | Nhược điểm | Quyết định |
| --------- | ------- | ---------- | ---------- |
| **Cached fields** (chọn) | Read cực nhanh — chỉ cần SELECT stores | Write phức tạp hơn, cần transaction | CHỌN |
| Computed column (PostgreSQL GENERATED) | Luôn chính xác, không cần update thủ công | Không hỗ trợ AVG() trong generated column | LOẠI BỎ |
| Materialized View | Luôn chính xác, query dễ | Cần REFRESH định kỳ, có độ trễ | LOẠI BỎ |
| Tính real-time khi GET (AVG query) | Luôn chính xác | N+1 query nếu hiển thị nhiều gian hàng | LOẠI BỎ |

Cached fields được chọn vì trang gian hàng đọc `avg_rating` rất thường xuyên (public,
không cần auth), còn write review ít hơn nhiều. Trade-off hợp lý cho scale MVP.

---

## 4. Report Reasons: Enum vs Lookup Table

### Quyết định: Lookup table `report_reasons`

Lưu lý do báo cáo trong bảng riêng thay vì enum PostgreSQL:

```sql
CREATE TABLE report_reasons (
  id         SERIAL PRIMARY KEY,
  label_vi   VARCHAR(100) NOT NULL,
  label_en   VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Seed data ban đầu
INSERT INTO report_reasons (label_vi, label_en) VALUES
  ('Spam hoặc quảng cáo', 'Spam or advertisement'),
  ('Nội dung không phù hợp', 'Inappropriate content'),
  ('Thông tin sai lệch', 'Misleading information'),
  ('Ngôn ngữ thù địch', 'Hate speech'),
  ('Không liên quan đến gian hàng', 'Not relevant to the store');
```

### Lý do chọn lookup table thay vì enum

| Tiêu chí | Lookup table (chọn) | PostgreSQL enum (loại bỏ) |
| -------- | ------------------- | ------------------------- |
| Thêm lý do mới | INSERT một row — Admin tự làm | Cần ALTER TYPE + migration |
| Đa ngôn ngữ | Có cột `label_vi`, `label_en` | Không hỗ trợ tự nhiên |
| Xóa lý do cũ | Soft delete hoặc mark inactive | Không thể xóa enum value đang dùng |
| API `/report-reasons` | Trả về từ DB, tự cập nhật | Cần hardcode trong code |

---

## 5. Soft Delete cho Ẩn Bình Luận

### Quyết định: `is_hidden boolean` + `hidden_at` + `hidden_by` trong `reviews` table

Khi Admin ẩn bình luận, không xóa row khỏi database. Thay vào đó set:

```sql
UPDATE reviews
SET
  is_hidden  = true,
  hidden_at  = now(),
  hidden_by  = :adminId
WHERE id = :reviewId;
```

Khi truy vấn danh sách review cho Customer (public):

```sql
SELECT * FROM reviews
WHERE store_id = :storeId
  AND is_hidden = false
ORDER BY created_at DESC;
```

Admin thấy tất cả, kể cả bình luận đã ẩn (có filter tùy chọn).

### Lý do chọn soft delete

- **Audit trail**: Biết ai ẩn, ẩn khi nào — cần thiết cho accountability của Admin
- **Reversibility**: Admin có thể bỏ ẩn (FR từ spec US4) — hard delete không làm được
- **Data retention**: Dữ liệu đánh giá có giá trị phân tích dù đã ẩn
- **Xóa vĩnh viễn vẫn có**: Admin vẫn có thể DELETE thật (FR-008, FR-009) khi cần —
  đây là trường hợp đặc biệt, khác với ẩn thông thường

---

## 6. Notification khi có Report mới: Email + In-App

### Quyết định: BullMQ (email) + PostgreSQL notifications (in-app)

Khi Store Owner gửi báo cáo mới, hệ thống:

1. **In-app notification**: Tạo bản ghi trong bảng `notifications` (đồng bộ, cùng
   transaction với insert `comment_reports`)
2. **Email notification**: Enqueue BullMQ job để gửi email đến tất cả Admin

```typescript
// reports.service.ts
async createReport(dto: CreateReportDto, reporterId: string): Promise<CommentReport> {
  return this.dataSource.transaction(async (manager) => {
    // 1. Kiểm tra duplicate report
    const existing = await manager.findOne(CommentReport, {
      where: { reviewId: dto.reviewId, reporterId },
    });
    if (existing) throw new ConflictException('ALREADY_REPORTED');

    // 2. Insert comment_report
    const report = manager.create(CommentReport, { ...dto, reporterId });
    await manager.save(report);

    // 3. Tạo in-app notification cho tất cả Admin
    await this.notificationsService.createAdminNotification(manager, {
      type: 'NEW_COMMENT_REPORT',
      referenceId: report.id,
    });

    return report;
  });
  // 4. Enqueue email (ngoài transaction — không block nếu queue lỗi)
  await this.mailQueue.add('new-comment-report', { reportId: report.id });
}
```

### Lý do tách email ra ngoài transaction

- Email gửi thất bại không nên rollback việc tạo báo cáo
- BullMQ retry tự động nếu SMTP lỗi
- In-app notification đảm bảo Admin luôn nhận thông báo dù email thất bại

---

## 7. Store Ownership Validation cho Report endpoint

### Quyết định: Kiểm tra `store_id` trong guard/interceptor

Endpoint `POST /api/stores/:storeId/reviews/:reviewId/report` yêu cầu Store Owner chỉ
được báo cáo review tại gian hàng của chính mình (FR-005, FR-007):

```typescript
// store-ownership.guard.ts
@Injectable()
export class StoreOwnershipGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const storeOwnerId = request.user.sub;
    const storeId = request.params.storeId;

    const store = await this.storesService.findByOwner(storeId, storeOwnerId);
    if (!store) throw new ForbiddenException('STORE_NOT_OWNED');
    return true;
  }
}
```

Guard này được áp dụng cho cả POST report lẫn các endpoint Store Owner khác liên quan
đến gian hàng. Kiểm tra diễn ra ở application layer, không chỉ dựa vào database
constraint.

---

## 8. Các vấn đề còn mở (Open Questions)

| Vấn đề | Quyết định tạm thời | Cần xác nhận |
| ------ | ------------------- | ------------ |
| Đăng xuất Customer | Xóa JWT khỏi memory frontend; không có server-side blacklist (token short-lived 1h) | Confirm có cần server-side logout không |
| Ảnh Customer thay đổi trên Google | Cập nhật `avatar_url` khi Customer đăng nhập lại (upsert) | Confirm hành vi mong muốn |
| Phân trang reviews | Default: 20 reviews/page, cursor-based hoặc offset | Confirm với team về UI pagination style |
| Admin thêm report reason | Qua database seed hoặc Admin UI | Confirm có cần Admin UI để quản lý report reasons không |
| Xử lý review khi gian hàng bị xóa | CASCADE DELETE hoặc soft delete gian hàng | Phụ thuộc quyết định của spec 002 |

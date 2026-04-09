# Research: Xác thực & Quản lý tài khoản

**Spec**: 001-auth-account-management | **Date**: 2026-04-05

Tài liệu này ghi lại các quyết định design kỹ thuật cho feature xác thực, lý do lựa chọn,
và các phương án đã cân nhắc nhưng bị loại bỏ.

---

## 1. Chiến lược xác thực: JWT vs Session-based

### Quyết định: JWT với Refresh Token Pattern

Sử dụng **JWT stateless** với hai loại token:

- **Access token**: có hiệu lực 8 giờ, chứa payload `{ sub, role, email }`, ký bằng
  HS256 với secret key từ environment variable.
- **Refresh token**: có hiệu lực 24 giờ idle, lưu trong HttpOnly cookie (không thể đọc
  từ JavaScript), dùng để cấp access token mới mà không cần đăng nhập lại.

Luồng refresh:

```
Client gửi POST /api/auth/store-owner/refresh kèm HttpOnly cookie
  → Server xác minh refresh token (kiểm tra database blacklist nếu đã logout)
  → Server trả về access token mới
  → Client lưu access token mới trong memory (không lưu localStorage)
```

Khi đăng xuất: refresh token bị invalidate (xóa khỏi database hoặc thêm vào blacklist Redis).

### Lý do chọn JWT thay vì Session-based

| Tiêu chí | JWT (chọn) | Session-based (loại bỏ) |
| -------- | ---------- | ----------------------- |
| Stateless | Có — không cần lookup database cho mỗi request | Không — mỗi request phải query session store |
| Horizontal scaling | Dễ — không cần shared session store giữa instances | Khó — cần sticky sessions hoặc Redis session store |
| Phù hợp với Next.js | Tốt — Next.js App Router hỗ trợ tốt token-based auth | Cần cấu hình phức tạp hơn với server components |
| Security | Đủ nếu refresh token lưu HttpOnly cookie | Tốt nhưng phức tạp hơn ở layer middleware |

Session-based bị loại bỏ vì tăng độ phức tạp infrastructure mà không mang lại lợi ích
rõ ràng cho scale hiện tại của dự án (hàng nghìn Store Owner, không phải triệu).

### Lưu ý bảo mật

- Access token **không** lưu trong localStorage (XSS vulnerability). Lưu trong memory
  (React state/Zustand store) và tự động refresh khi gần hết hạn.
- Refresh token lưu trong **HttpOnly, Secure, SameSite=Strict cookie**.
- Sử dụng token rotation: mỗi lần refresh sẽ cấp refresh token mới và invalidate
  refresh token cũ.

---

## 2. Password Hashing: bcrypt

### Quyết định: bcrypt với cost factor 12

```typescript
import * as bcrypt from 'bcrypt';

const BCRYPT_SALT_ROUNDS = 12;

async hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

async verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### Lý do chọn bcrypt

- **Cost factor 12**: Cân bằng giữa bảo mật và performance. Trên phần cứng hiện đại,
  cost 12 mất khoảng 250-400ms để hash — đủ chậm để ngăn brute force offline, đủ nhanh
  cho UX chấp nhận được.
- **bcrypt vs Argon2**: Argon2 là thuật toán hiện đại hơn nhưng bcrypt là lựa chọn an
  toàn, được hỗ trợ rộng rãi, có thư viện Node.js ổn định. Với quy mô MVP, bcrypt là
  đủ.
- **bcrypt vs SHA-256/MD5**: Các thuật toán hash chung mục đích bị loại bỏ hoàn toàn —
  chúng không được thiết kế cho password hashing, thiếu salt tự động và quá nhanh.

---

## 3. Brute Force Protection: Exponential Backoff với PostgreSQL

### Quyết định: Lưu trạng thái lockout trong bảng `login_attempts` (PostgreSQL)

Thay vì Redis, sử dụng PostgreSQL để đơn giản hóa infrastructure (Redis vẫn được dùng
cho BullMQ, nhưng brute force state không cần TTL tự động của Redis).

Cơ chế:

```
Lần 1-4 sai: ghi log, không khóa
Lần 5 sai:   lockout 1 phút    (attempt_count = 5)
Lần 10 sai:  lockout 5 phút    (attempt_count = 10)
Lần 15+ sai: lockout 30 phút   (attempt_count >= 15)
```

Khi đăng nhập thành công: reset `attempt_count = 0`, xóa `lockout_until`.

Logic kiểm tra (pseudo-code):

```
1. Tìm bản ghi login_attempts theo email
2. Nếu lockout_until > now() → trả về lỗi kèm thời gian còn lại
3. Xác minh password
4. Nếu sai → tăng attempt_count, tính lockout_until mới, lưu DB
5. Nếu đúng → reset attempt_count, trả về token
```

### Lý do chọn PostgreSQL thay vì Redis cho brute force state

- Redis đã có trong stack (cho BullMQ) nhưng dùng thêm cho brute force state tạo ra
  hai source of truth.
- Brute force state cần durability — nếu Redis restart, lockout bị mất và attacker có
  thể tiếp tục. PostgreSQL đảm bảo durability.
- Số lượng write cho brute force rất thấp (chỉ khi có failed login attempt).

---

## 4. Email Queue: BullMQ + Redis

### Quyết định: BullMQ với Redis backend, retry tối đa 3 lần

Gửi email bất đồng bộ qua queue để:

1. Thao tác chính (đăng ký, phê duyệt, từ chối) hoàn thành ngay lập tức không bị
   block bởi SMTP latency.
2. Tự động retry khi SMTP thất bại (network hiccup, rate limit).

Cấu hình queue:

```typescript
// mail.processor.ts
@Processor('mail')
export class MailProcessor {
  @Process('send-email')
  async handleSendEmail(job: Job<MailJobData>) {
    await this.mailService.sendEmail(job.data);
  }
}

// Khi enqueue job:
await this.mailQueue.add('send-email', payload, {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000,  // 5s, 10s, 20s
  },
  removeOnComplete: true,
  removeOnFail: false,  // Giữ failed jobs để Admin theo dõi
});
```

Các loại email được queue:

| Event | Template | Người nhận |
| ----- | -------- | ---------- |
| Store Owner đăng ký | `registration-confirmation` | Store Owner |
| Store Owner đăng ký | `admin-new-registration` | Tất cả Admin |
| Admin phê duyệt | `account-approved` | Store Owner |
| Admin từ chối | `account-rejected` (kèm lý do) | Store Owner |
| Admin vô hiệu hóa | `account-deactivated` | Store Owner |
| Admin kích hoạt lại | `account-reactivated` | Store Owner |

### Lý do chọn BullMQ thay vì direct SMTP call

- **Reliability**: Nếu SMTP thất bại, job tự động retry. Direct call không có cơ chế retry.
- **Non-blocking**: API response không bị delay bởi SMTP latency (thường 100-500ms).
- **Observability**: BullMQ có dashboard (Bull Board) để Admin theo dõi failed jobs.
- BullMQ là successor của Bull, được maintain tốt, native TypeScript support.

---

## 5. In-App Notifications

### Quyết định: Lưu trong PostgreSQL, polling từ frontend

Thông báo in-app được lưu trong bảng `notifications` (xem data-model.md). Frontend
polling định kỳ mỗi 30 giây để cập nhật badge số thông báo chưa đọc.

Không dùng WebSocket ở giai đoạn MVP để tránh phức tạp infrastructure. WebSocket có
thể thêm sau nếu UX yêu cầu real-time.

### In-app vs Email: quan hệ

In-app notification được tạo đồng bộ (cùng transaction hoặc ngay sau) khi sự kiện
xảy ra. Email được gửi bất đồng bộ qua BullMQ queue. Nếu email thất bại, in-app
notification vẫn tồn tại — người dùng vẫn nhận được thông báo qua kênh in-app.

---

## 6. Admin Account Seeding

### Quyết định: NestJS CLI seed command

Admin accounts không có giao diện đăng ký công khai (FR-013). Được tạo qua script
chạy một lần khi deploy:

```bash
# Chạy khi setup hệ thống
npx ts-node -r tsconfig-paths/register src/database/seeds/admin.seed.ts
```

Script `admin.seed.ts` đọc thông tin Admin từ environment variables hoặc file JSON
riêng (không commit vào git), hash password bằng bcrypt, insert vào `admin_accounts`.

Idempotent: kiểm tra email đã tồn tại trước khi insert, tránh tạo duplicate.

---

## 7. Validation & Error Handling

### Request Validation

Dùng `class-validator` + `ValidationPipe` global trong NestJS:

```typescript
// main.ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,       // Loại bỏ fields không khai báo trong DTO
  forbidNonWhitelisted: true,
  transform: true,
}));
```

### Error Response Format (chuẩn hóa)

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Email này đã được đăng ký",
  "code": "EMAIL_ALREADY_EXISTS"
}
```

`code` field dùng để frontend hiển thị thông báo phù hợp mà không cần parse chuỗi.

---

## 8. Các vấn đề còn mở (Open Questions)

| Vấn đề | Quyết định tạm thời | Cần xác nhận |
| ------ | ------------------- | ------------ |
| Forgot password cho Store Owner | Ngoài phạm vi MVP (ghi rõ trong spec Assumptions) | Xác nhận với team trước sprint 2 |
| Rate limiting cho register endpoint | Chưa quyết định — có thể dùng `@nestjs/throttler` | Confirm có cần giới hạn số lần đăng ký từ một IP không |
| Email template engine | Handlebars (`.hbs`) — NestJS Mailer có built-in support | Confirm với team về design email |
| Số lượng Admin tối đa | Không giới hạn ở MVP | Confirm nếu có yêu cầu giới hạn |

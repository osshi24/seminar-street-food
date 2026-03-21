# Tasks: Xác thực & Quản lý tài khoản

**Spec**: 001-auth-account-management | **Date**: 2026-04-05
**Plan**: [plan.md](./plan.md) | **Data Model**: [data-model.md](./data-model.md) | **API**: [contracts/api.md](./contracts/api.md)

---

## Tổng quan

| Phase | Tên | User Stories | Số tasks |
| ----- | --- | ------------ | -------- |
| 1 | Setup | — | T001–T012 |
| 2 | Foundation | — | T013–T027 |
| 3 | Registration & Approval | US1 + US2 | T028–T057 |
| 4 | Login & Session | US3 | T058–T073 |
| 5 | Account Lifecycle | US4 | T074–T082 |
| N | Polish | — | T083–T090 |

---

## Phase 1 — Setup

**Goal**: Monorepo hoạt động được với NestJS + Next.js + PostgreSQL + Redis. Dev có thể chạy toàn bộ stack locally bằng một lệnh.

**Independent Test**: Chạy `docker compose up` → PostgreSQL port 5432 và Redis port 6379 healthy → NestJS server khởi động tại `localhost:3001` với `/api/health` trả về 200 → Next.js dev server tại `localhost:3000` render trang mặc định.

---

### 1.1 Monorepo & Docker

- [X] T001 Khởi tạo monorepo: tạo `package.json` root với workspaces, cấu hình `turbo.json` hoặc scripts trong `apps/backend/` và `apps/frontend/`
- [X] T002 [P] Tạo `docker-compose.yml` tại root với services: `postgres` (PostgreSQL 15, port 5432), `redis` (Redis 7, port 6379), mount volumes cho data persistence
- [X] T003 [P] Tạo `apps/backend/.env.example` với các biến: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `NODE_ENV`, `PORT`
- [X] T004 [P] Tạo `apps/frontend/.env.example` với các biến: `NEXT_PUBLIC_API_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`

### 1.2 Backend Init (NestJS)

- [X] T005 Scaffold NestJS project tại `apps/backend/` bằng `@nestjs/cli`: cấu hình `apps/backend/src/main.ts` với global prefix `/api`, CORS, cookie-parser, validation pipe
- [X] T006 [P] Cài đặt dependencies backend: `@nestjs/typeorm typeorm pg`, `@nestjs/passport passport passport-jwt`, `@nestjs/jwt`, `bcrypt @types/bcrypt`, `class-validator class-transformer`, `@nestjs/bull bullmq bull`, `nodemailer @types/nodemailer`, `cookie-parser`, `@nestjs/config`, `@nestjs/throttler`, `helmet`
- [X] T007 [P] Cấu hình `apps/backend/src/app.module.ts`: import `ConfigModule.forRoot()`, `TypeOrmModule.forRootAsync()` đọc từ env, `BullModule.forRootAsync()` kết nối Redis
- [X] T008 [P] Tạo health check endpoint tại `apps/backend/src/health/health.controller.ts`: `GET /api/health` trả về `{ status: 'ok' }`

### 1.3 Frontend Init (Next.js)

- [X] T009 Scaffold Next.js 14 project tại `apps/frontend/` với App Router, TypeScript, Tailwind CSS
- [X] T010 [P] Cài đặt dependencies frontend: `axios`, `react-hook-form`, `zod`, `@hookform/resolvers`, `js-cookie`, `@types/js-cookie`
- [X] T011 [P] Cấu hình `apps/frontend/src/lib/api/client.ts`: axios instance với `baseURL` từ env, interceptor tự động gắn `Authorization` header từ localStorage/cookie, interceptor refresh token khi gặp 401
- [X] T012 [P] Tạo `apps/frontend/src/middleware.ts`: Next.js middleware bảo vệ routes `/dashboard/*` (yêu cầu Store Owner token) và `/admin/*` (yêu cầu Admin token), redirect về trang login tương ứng nếu không có token

---

## Phase 2 — Foundation

**Goal**: Database schema tồn tại với đầy đủ tables; guards/middleware auth có thể import và sử dụng; notification service và mail queue có skeleton hoạt động; Admin seed script chạy được.

**Independent Test**: Chạy migration → 4 bảng tồn tại trong PostgreSQL (`store_owner_accounts`, `stores`, `admin_accounts`, `notifications`); `store_owner_accounts` có cột `failed_login_attempts` và `lockout_until` (brute-force lockout dùng cột trong cùng bảng, không có bảng `login_attempts` riêng) → Chạy seed script → có ít nhất 1 Admin account trong DB → Import `StoreOwnerJwtGuard` vào bất kỳ controller nào không gây lỗi compile.

---

### 2.1 Database Migration Framework

- [X] T013 Cấu hình TypeORM migration tại `apps/backend/src/database/data-source.ts`: DataSource riêng cho CLI với `migrations: ['dist/database/migrations/*.js']`, cập nhật `apps/backend/package.json` thêm scripts `migration:generate`, `migration:run`, `migration:revert`
- [X] T014 [P] Tạo migration `apps/backend/src/database/migrations/1743840000000-CreateEnumTypes.ts`: tạo PostgreSQL enum types `store_owner_status`, `store_status`, `notification_recipient_type`

### 2.2 Database Schema

- [X] T015 Tạo migration `apps/backend/src/database/migrations/1743840001000-CreateStoreOwnerAccounts.ts`: bảng `store_owner_accounts` với tất cả cột theo data-model.md §3.2, indexes trên `email` và `status`
- [X] T016 [P] Tạo migration `apps/backend/src/database/migrations/1743840002000-CreateStores.ts`: bảng `stores` với FK `owner_id → store_owner_accounts.id ON DELETE CASCADE`, unique constraint trên `owner_id`, indexes trên `owner_id` và `status`
- [X] T017 [P] Tạo migration `apps/backend/src/database/migrations/1743840003000-CreateAdminAccounts.ts`: bảng `admin_accounts` với index trên `email`
- [X] T018 [P] Tạo migration `apps/backend/src/database/migrations/1743840004000-CreateNotifications.ts`: bảng `notifications` với partial index `WHERE is_read = FALSE` theo data-model.md §3.5

### 2.3 TypeORM Entities

- [X] T019 Tạo `apps/backend/src/entities/store-owner-account.entity.ts`: entity `StoreOwnerAccount` với enum `StoreOwnerStatus`, đầy đủ columns theo data-model.md §4.1, relation `@OneToOne(() => Store)`
- [X] T020 [P] Tạo `apps/backend/src/entities/store.entity.ts`: entity `Store` với enum `StoreStatus`, `@JoinColumn({ name: 'owner_id' })`, relation `@OneToOne(() => StoreOwnerAccount)` theo data-model.md §4.2
- [X] T021 [P] Tạo `apps/backend/src/entities/admin-account.entity.ts`: entity `AdminAccount` theo data-model.md §4.3
- [X] T022 [P] Tạo `apps/backend/src/entities/notification.entity.ts`: entity `Notification` với enum `NotificationRecipientType` theo data-model.md §4.4

### 2.4 Auth Guards & JWT Strategies

- [X] T023 Tạo `apps/backend/src/auth/strategies/jwt-store-owner.strategy.ts`: Passport JWT strategy đọc Bearer token, validate payload `{ sub, role: 'store_owner' }`, trả về `StoreOwnerAccount` từ DB
- [X] T024 [P] Tạo `apps/backend/src/auth/strategies/jwt-admin.strategy.ts`: Passport JWT strategy cho Admin, validate payload `{ sub, role: 'admin' }`, trả về `AdminAccount` từ DB
- [X] T025 [P] Tạo `apps/backend/src/auth/guards/store-owner-jwt.guard.ts` và `apps/backend/src/auth/guards/admin-jwt.guard.ts`: extend `AuthGuard('jwt-store-owner')` và `AuthGuard('jwt-admin')` tương ứng

### 2.5 Notification & Mail Skeleton

- [X] T026 Tạo `apps/backend/src/notifications/notifications.module.ts`, `apps/backend/src/notifications/notifications.service.ts` (skeleton: method `create()` insert vào bảng `notifications`), và `apps/backend/src/mail/mail.module.ts`, `apps/backend/src/mail/mail.service.ts` (skeleton: method `enqueueEmail()` đẩy job vào BullMQ queue `email`), `apps/backend/src/mail/mail.processor.ts` (BullMQ processor xử lý job, log ra console, retry 3 lần)

### 2.6 Admin Seed

- [X] T027 Tạo `apps/backend/src/database/seeds/admin.seed.ts`: NestJS standalone script đọc env `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_FULL_NAME`, hash password bằng bcrypt (cost 12), insert vào `admin_accounts`; thêm script `seed:admin` vào `apps/backend/package.json`

---

## Phase 3 — Registration & Approval [US1 + US2]

**Goal**: Store Owner có thể đăng ký tài khoản, tài khoản xuất hiện ở trạng thái `pending` kèm `Store` ở trạng thái `inactive`, Admin nhận thông báo. Admin có thể phê duyệt hoặc từ chối, Store Owner nhận thông báo kết quả qua email và in-app.

**Independent Test (US1)**: POST `/api/auth/store-owner/register` với payload hợp lệ → 201 response → kiểm tra DB: 1 row trong `store_owner_accounts` với `status='pending'` + 1 row trong `stores` với `status='inactive'` được tạo trong cùng transaction → kiểm tra bảng `notifications`: có notification cho Admin với `event_type='REGISTRATION_SUBMITTED'` → thử POST `/api/auth/store-owner/login` với cùng credential → phải nhận 403 `ACCOUNT_PENDING`.

**Independent Test (US2)**: Từ state trên, Admin login → PATCH `/api/admin/store-owners/:id/approve` → 200 response → DB: `status='active'` → kiểm tra bảng `notifications`: có notification cho Store Owner với `event_type='ACCOUNT_APPROVED'` → POST `/api/auth/store-owner/login` → phải thành công (200).

---

### 3.1 Registration — Backend [US1]

- [X] T028 [US1] Tạo `apps/backend/src/auth/dto/register-store-owner.dto.ts`: DTO với class-validator decorators cho tất cả fields theo api.md §Validation rules (`fullName`, `email`, `phone`, `password`, `storeName`, `registrationReason`)
- [X] T029 [US1] Tạo `apps/backend/src/auth/auth.service.ts`: method `registerStoreOwner(dto)` — hash password bcrypt cost 12, wrap trong TypeORM transaction: INSERT `StoreOwnerAccount` (status=pending) + INSERT `Store` (status=inactive) + INSERT `Notification` cho mọi Admin (event_type=`REGISTRATION_SUBMITTED`); sau transaction enqueue BullMQ email job cho Store Owner và Admin; throw `ConflictException` nếu email trùng
- [X] T030 [US1] Tạo `apps/backend/src/auth/auth.controller.ts`: `POST /auth/store-owner/register` gọi `authService.registerStoreOwner()`, trả về 201 với response shape theo api.md
- [X] T031 [US1] Tạo `apps/backend/src/auth/auth.module.ts`: import `TypeOrmModule.forFeature([StoreOwnerAccount, Store, AdminAccount, Notification])`, `JwtModule`, `PassportModule`, `NotificationsModule`, `MailModule`

### 3.2 Registration — Email Templates [US1]

- [X] T032 [P] [US1] Tạo `apps/backend/src/mail/templates/registration-confirmation.hbs`: email template gửi cho Store Owner sau khi đăng ký, nội dung: xác nhận đã nhận hồ sơ, trạng thái pending, hướng dẫn chờ duyệt
- [X] T033 [P] [US1] Tạo `apps/backend/src/mail/templates/admin-new-registration.hbs`: email template thông báo cho Admin về Store Owner mới đăng ký, kèm link xem chi tiết

### 3.3 Registration — Frontend [US1]

- [X] T034 [US1] Tạo `apps/frontend/src/types/store-owner.ts`: TypeScript types `StoreOwnerStatus`, `StoreOwner`, `Store`, `RegisterStoreOwnerDto`, `RegisterResponse`
- [X] T035 [US1] Tạo `apps/frontend/src/lib/api/auth.ts`: function `registerStoreOwner(data: RegisterStoreOwnerDto): Promise<RegisterResponse>` gọi POST `/api/auth/store-owner/register`, xử lý lỗi 409 `EMAIL_ALREADY_EXISTS` và 400 `VALIDATION_ERROR`
- [X] T036 [US1] Tạo `apps/frontend/src/components/auth/RegisterForm.tsx`: form component với react-hook-form + zod schema validation (client-side), fields: `fullName`, `email`, `phone`, `password`, `storeName`, `registrationReason`; hiển thị lỗi inline cho từng field; submit gọi `registerStoreOwner()`; khi thành công hiển thị success message "Đăng ký thành công. Tài khoản đang chờ Admin phê duyệt."
- [X] T037 [US1] Tạo `apps/frontend/src/app/(auth)/store-owner/register/page.tsx`: page component render `RegisterForm`, layout centered, title "Đăng ký tài khoản Store Owner"

### 3.4 Admin Approval & Rejection — Backend [US2]

- [X] T038 [US2] Tạo `apps/backend/src/store-owners/dto/list-store-owners-query.dto.ts`: DTO với query params `status`, `search`, `page`, `limit`, `sortBy`, `sortOrder` theo api.md §GET /api/admin/store-owners
- [X] T039 [US2] Tạo `apps/backend/src/store-owners/dto/reject-store-owner.dto.ts`: DTO với field `reason` (bắt buộc, `@MinLength(10)`)
- [X] T040 [US2] Tạo `apps/backend/src/store-owners/store-owners.service.ts` với các methods:
  - `findAll(query: ListStoreOwnersQueryDto)`: truy vấn với filter, search (ILIKE), pagination, sort; join với `stores`
  - `findOne(id: string)`: tìm theo UUID, throw `NotFoundException` nếu không có
  - `approve(id: string)`: validate transition `pending → active`; update status; INSERT Notification (`ACCOUNT_APPROVED`); enqueue email `account-approved`
  - `reject(id: string, reason: string)`: validate transition `pending → rejected`; update status; INSERT Notification (`ACCOUNT_REJECTED`) kèm lý do trong `body`; enqueue email `account-rejected`
- [X] T041 [US2] Tạo `apps/backend/src/store-owners/store-owners.controller.ts`: routes `GET /admin/store-owners`, `GET /admin/store-owners/:id`, `PATCH /admin/store-owners/:id/approve`, `PATCH /admin/store-owners/:id/reject`; tất cả bảo vệ bởi `AdminJwtGuard`; response shape theo api.md
- [X] T042 [US2] Tạo `apps/backend/src/store-owners/store-owners.module.ts`: import `TypeOrmModule.forFeature([StoreOwnerAccount, Store, Notification, AdminAccount])`, `NotificationsModule`, `MailModule`; export `StoreOwnersService`

### 3.5 Approval — Email Templates [US2]

- [X] T043 [P] [US2] Tạo `apps/backend/src/mail/templates/account-approved.hbs`: email gửi Store Owner khi được phê duyệt, kèm link đăng nhập
- [X] T044 [P] [US2] Tạo `apps/backend/src/mail/templates/account-rejected.hbs`: email gửi Store Owner khi bị từ chối, kèm lý do từ chối

### 3.6 Admin Approval — Frontend [US2]

- [X] T045 [US2] Tạo `apps/frontend/src/types/admin.ts`: TypeScript types `AdminAccount`, `AdminLoginDto`, `AdminLoginResponse`
- [X] T046 [US2] Tạo `apps/frontend/src/lib/api/store-owners.ts`: functions `listStoreOwners(params)`, `getStoreOwner(id)`, `approveStoreOwner(id)`, `rejectStoreOwner(id, reason)` gọi các endpoints Admin tương ứng
- [X] T047 [US2] Tạo `apps/frontend/src/app/(admin)/store-owners/page.tsx`: server component (hoặc client component với `useEffect`) hiển thị danh sách Store Owner với filter tabs (All / Pending / Active / Inactive / Rejected), search input, bảng có columns: Tên, Email, Gian hàng, Trạng thái, Ngày đăng ký, Hành động; pagination
- [X] T048 [US2] Tạo `apps/frontend/src/app/(admin)/store-owners/[id]/page.tsx`: trang chi tiết Store Owner hiển thị đầy đủ thông tin; với tài khoản `pending` hiển thị 2 buttons "Phê duyệt" và "Từ chối"; click "Từ chối" mở modal nhập lý do bắt buộc (min 10 ký tự); sau action redirect về danh sách

### 3.7 Notifications — Backend Skeleton Completion

- [X] T049 Hoàn thiện `apps/backend/src/notifications/notifications.service.ts`: thêm method `findAllForRecipient(recipientType, recipientId, query)` với filter `isRead`, pagination; method `markAsRead(id, recipientType, recipientId)` throw `NotFoundException` nếu không tìm thấy hoặc không phải của người dùng
- [X] T050 [P] Tạo `apps/backend/src/notifications/notifications.controller.ts`: `GET /notifications` và `PATCH /notifications/:id/read`; guard tùy loại token (Store Owner hoặc Admin); response shape theo api.md

### 3.8 Notifications — Frontend

- [X] T051 Tạo `apps/frontend/src/types/notification.ts`: TypeScript types `Notification`, `NotificationEventType`, `NotificationsResponse`
- [X] T052 [P] Tạo `apps/frontend/src/lib/api/notifications.ts`: functions `getNotifications(params)`, `markNotificationAsRead(id)`
- [X] T053 [P] Tạo `apps/frontend/src/components/notifications/NotificationBell.tsx`: icon bell với badge hiển thị `unreadCount`; click mở dropdown `NotificationList`
- [X] T054 [P] Tạo `apps/frontend/src/components/notifications/NotificationList.tsx`: list thông báo, mỗi item hiển thị `title`, `body` truncated, `createdAt` relative time, trạng thái đọc/chưa đọc; click item → gọi `markNotificationAsRead()` → update UI

### 3.9 Admin Login — Backend & Frontend [US2]

- [X] T055 [US2] Thêm method `loginAdmin(dto)` vào `apps/backend/src/auth/auth.service.ts`: tìm AdminAccount theo email, so sánh bcrypt, throw `UnauthorizedException` nếu sai; trả về access token với payload `{ sub: admin.id, role: 'admin' }`
- [X] T056 [US2] Thêm route `POST /auth/admin/login` vào `apps/backend/src/auth/auth.controller.ts`; response shape theo api.md §Auth — Admin
- [X] T057 [US2] Tạo `apps/frontend/src/app/(auth)/admin/login/page.tsx`: trang đăng nhập Admin riêng biệt; form email + password; khi thành công lưu Admin access token và redirect đến `/admin/store-owners`

---

**Checkpoint Phase 3**: Chạy toàn bộ luồng end-to-end: Register → DB có pending account + inactive store → Admin login → xem danh sách pending → approve → DB active → Store Owner nhận notification → thử login với pending account bị từ chối → 403. Nếu tất cả pass, Phase 3 hoàn thành.

---

## Phase 4 — Login & Session [US3]

**Goal**: Store Owner đã được Admin phê duyệt có thể đăng nhập, nhận JWT, truy cập dashboard; refresh token tự động; đăng xuất sạch; brute-force bị chặn sau 5 lần sai liên tiếp.

**Independent Test**: Dùng tài khoản `active` từ Phase 3 → POST `/api/auth/store-owner/login` → 200 + `accessToken` + cookie `refresh_token` → GET `/api/auth/store-owner/refresh` bằng cookie → 200 + access token mới → POST `/api/auth/store-owner/logout` → 200 + cookie cleared → thử login sai password 5 lần → lần 6 nhận 429 `ACCOUNT_LOCKED` kèm `lockedUntil`.

---

### 4.1 Login Logic — Backend [US3]

- [X] T058 [US3] Tạo `apps/backend/src/auth/dto/login.dto.ts`: DTO với `email` (`@IsEmail()`) và `password` (`@IsString()`, `@IsNotEmpty()`)
- [X] T059 [US3] Thêm method `loginStoreOwner(dto)` vào `apps/backend/src/auth/auth.service.ts`:
  1. Tìm `StoreOwnerAccount` theo email
  2. Kiểm tra `lockoutUntil` — nếu còn hạn throw 429 `ACCOUNT_LOCKED` kèm `lockedUntil`
  3. So sánh bcrypt password
  4. Nếu sai: tăng `failedLoginAttempts`; nếu chia hết 5 thì tính lockout duration (1→5→30 phút theo số lần vượt ngưỡng), set `lockoutUntil`; save; throw 401 `INVALID_CREDENTIALS`
  5. Kiểm tra `status`: throw 403 tương ứng cho `pending`, `inactive`, `rejected`
  6. Nếu đúng: reset `failedLoginAttempts=0`, `lockoutUntil=null`; issue access token (8h) + refresh token (24h); lưu refresh token hash vào Redis với key `refresh:<storeOwnerId>:<tokenId>`; trả về tokens
- [X] T060 [US3] Thêm route `POST /auth/store-owner/login` vào `apps/backend/src/auth/auth.controller.ts`: gọi `loginStoreOwner()`, set HttpOnly cookie `refresh_token`, response shape theo api.md §POST /api/auth/store-owner/login

### 4.2 Refresh Token — Backend [US3]

- [X] T061 [US3] Tạo `apps/backend/src/auth/dto/refresh-token.dto.ts`: không có body fields (token từ cookie)
- [X] T062 [US3] Thêm method `refreshStoreOwnerToken(refreshToken: string)` vào `apps/backend/src/auth/auth.service.ts`: verify JWT refresh token; kiểm tra Redis key còn tồn tại (chưa bị revoke); xóa key cũ; issue access token mới + refresh token mới; lưu key mới vào Redis (token rotation); trả về access token mới
- [X] T063 [US3] Thêm route `POST /auth/store-owner/refresh` vào `apps/backend/src/auth/auth.controller.ts`: đọc cookie `refresh_token`, gọi `refreshStoreOwnerToken()`, set cookie mới, throw 401 `REFRESH_TOKEN_MISSING` nếu không có cookie

### 4.3 Logout — Backend [US3]

- [X] T064 [US3] Thêm method `logoutStoreOwner(refreshToken: string)` vào `apps/backend/src/auth/auth.service.ts`: verify refresh token, xóa Redis key tương ứng để invalidate
- [X] T065 [US3] Thêm route `POST /auth/store-owner/logout` vào `apps/backend/src/auth/auth.controller.ts`: bảo vệ bởi `StoreOwnerJwtGuard`; đọc cookie, gọi `logoutStoreOwner()`; clear cookie `refresh_token` (Max-Age=0); trả về 200

### 4.4 Session Validation — Backend [US3]

- [X] T066 [US3] Hoàn thiện `apps/backend/src/auth/strategies/jwt-store-owner.strategy.ts`: trong `validate()` kiểm tra `StoreOwnerAccount.status === 'active'`, nếu không throw `UnauthorizedException` — đảm bảo token của tài khoản bị deactivate sau khi issue không còn hợp lệ

### 4.5 Login — Frontend [US3]

- [X] T067 [US3] Thêm functions `loginStoreOwner(data: LoginDto)`, `logoutStoreOwner()`, `refreshStoreOwnerToken()` vào `apps/frontend/src/lib/api/auth.ts`
- [X] T068 [US3] Tạo `apps/frontend/src/lib/auth/session.ts`: functions `saveAccessToken(token)`, `getAccessToken()`, `clearAccessToken()` (lưu trong memory/sessionStorage); `isAuthenticated()` kiểm tra token còn hạn; auto-refresh logic khi token gần hết hạn
- [X] T069 [US3] Tạo `apps/frontend/src/components/auth/LoginForm.tsx`: form email + password; hiển thị lỗi theo mã lỗi từ API: `ACCOUNT_PENDING` → "Tài khoản đang chờ Admin phê duyệt", `ACCOUNT_INACTIVE` → "Tài khoản bị vô hiệu hóa. Vui lòng liên hệ Admin.", `ACCOUNT_REJECTED` → "Tài khoản đăng ký đã bị từ chối. Vui lòng xem email để biết lý do.", `ACCOUNT_LOCKED` → "Tài khoản bị khóa tạm thời đến {lockedUntil}"; submit gọi `loginStoreOwner()`; khi thành công save token và redirect đến `/dashboard`
- [X] T070 [US3] Tạo `apps/frontend/src/app/(auth)/store-owner/login/page.tsx`: render `LoginForm`, link đến trang đăng ký

### 4.6 Dashboard & Protected Route — Frontend [US3]

- [X] T071 [US3] Tạo `apps/frontend/src/app/(store-owner)/dashboard/page.tsx`: trang dashboard cơ bản sau khi đăng nhập; hiển thị tên Store Owner, tên gian hàng, thông báo chào mừng, nút Đăng xuất; tích hợp `NotificationBell` component
- [X] T072 [US3] Cập nhật `apps/frontend/src/middleware.ts`: kiểm tra access token hợp lệ cho routes `/(store-owner)/*`; redirect về `/store-owner/login` nếu không có token; redirect về `/dashboard` nếu đã login mà truy cập trang login

### 4.7 Axios Interceptor — Frontend [US3]

- [X] T073 [US3] Hoàn thiện `apps/frontend/src/lib/api/client.ts`: response interceptor bắt lỗi 401; gọi `POST /api/auth/store-owner/refresh` bằng cookie; nếu refresh thành công, retry request gốc với access token mới; nếu refresh thất bại, clear token và redirect về trang login

---

**Checkpoint Phase 4**: End-to-end US3: Active account → Login → redirect dashboard → API call với access token → token hết hạn → tự động refresh → Logout → redirect login → login sai 5 lần → nhận lockout message với thời gian chờ. Nếu tất cả pass, Phase 4 hoàn thành.

---

## Phase 5 — Account Lifecycle [US4]

**Goal**: Admin có thể xem toàn bộ danh sách tài khoản (filter/search/paginate), vô hiệu hóa tài khoản active (kèm cảnh báo nếu có pending content), kích hoạt lại tài khoản inactive; Store Owner nhận thông báo qua cả hai kênh.

**Independent Test**: Admin deactivate tài khoản `active` → DB `status='inactive'` → Store Owner nhận notification `ACCOUNT_DEACTIVATED` → Store Owner thử login → 403 `ACCOUNT_INACTIVE` → Admin reactivate → DB `status='active'` → Store Owner nhận notification `ACCOUNT_REACTIVATED` → Store Owner login thành công.

---

### 5.1 Deactivate & Reactivate — Backend [US4]

- [X] T074 [US4] Thêm method `deactivate(id: string, confirmed: boolean)` vào `apps/backend/src/store-owners/store-owners.service.ts`: validate transition `active → inactive`; kiểm tra pending content (placeholder trả về `false` ở MVP vì spec 002 chưa có); nếu có pending content và `confirmed=false` trả về `{ hasPendingContent: true }` thay vì thực hiện; nếu confirmed: update `status='inactive'`, INSERT Notification `ACCOUNT_DEACTIVATED`, enqueue email `account-deactivated`
- [X] T075 [US4] Thêm method `reactivate(id: string)` vào `apps/backend/src/store-owners/store-owners.service.ts`: validate transition `inactive → active`; update `status='active'`; INSERT Notification `ACCOUNT_REACTIVATED`; enqueue email `account-reactivated`
- [X] T076 [US4] Thêm routes `PATCH /admin/store-owners/:id/deactivate` và `PATCH /admin/store-owners/:id/reactivate` vào `apps/backend/src/store-owners/store-owners.controller.ts`; bảo vệ bởi `AdminJwtGuard`; response shape theo api.md

### 5.2 Deactivate & Reactivate — Email Templates [US4]

- [X] T077 [P] [US4] Tạo `apps/backend/src/mail/templates/account-deactivated.hbs`: email gửi Store Owner khi bị vô hiệu hóa, hướng dẫn liên hệ Admin
- [X] T078 [P] [US4] Tạo `apps/backend/src/mail/templates/account-reactivated.hbs`: email gửi Store Owner khi được kích hoạt lại, kèm link đăng nhập

### 5.3 Account Lifecycle — Frontend [US4]

- [X] T079 [US4] Tạo `apps/frontend/src/components/auth/DeactivateWarningModal.tsx`: modal xác nhận vô hiệu hóa; hiển thị khi API trả về `hasPendingContent: true`; có 2 buttons "Hủy" và "Xác nhận vô hiệu hóa"; khi confirm gọi lại API với `?confirmed=true`
- [X] T080 [US4] Thêm functions `deactivateStoreOwner(id, confirmed?)`, `reactivateStoreOwner(id)` vào `apps/frontend/src/lib/api/store-owners.ts`
- [X] T081 [US4] Cập nhật `apps/frontend/src/app/(admin)/store-owners/[id]/page.tsx`: thêm nút "Vô hiệu hóa" (hiển thị khi status=active) và "Kích hoạt lại" (hiển thị khi status=inactive); tích hợp `DeactivateWarningModal`; sau action thành công: cập nhật UI, hiển thị toast notification

### 5.4 Admin List — Frontend Enhancement [US4]

- [X] T082 [US4] Cập nhật `apps/frontend/src/app/(admin)/store-owners/page.tsx`: hoàn thiện filter tabs với count badge cho mỗi status; search input với debounce 300ms; sort columns (click header); URL query params sync (filter/search/page/sort lưu vào URL để shareable link); hiển thị pagination component

---

**Checkpoint Phase 5**: Admin flow US4 end-to-end: xem list → filter pending → approve → filter active → deactivate (test warning modal nếu có pending content) → Store Owner logout → thử login → 403 → Admin reactivate → Store Owner login OK. Nếu tất cả pass, Phase 5 hoàn thành.

---

## Phase N — Polish

**Goal**: Toàn bộ feature production-ready: error handling chuẩn hóa, rate limiting, structured logging, security headers. Không thêm tính năng mới.

**Independent Test**: Gửi request thiếu field bắt buộc → response có format `{ statusCode, error, message, code }` chuẩn theo api.md → gửi 100 request liên tiếp tới `/api/auth/store-owner/login` → sau ngưỡng nhận 429 từ rate limiter → response headers có `X-Content-Type-Options`, `X-Frame-Options`.

---

- [X] T083 Tạo `apps/backend/src/common/filters/http-exception.filter.ts`: global exception filter chuẩn hóa toàn bộ response lỗi theo format `{ statusCode, error, message, code }` trong api.md §Error codes; đăng ký trong `apps/backend/src/main.ts` bằng `app.useGlobalFilters()`
- [X] T084 [P] Tạo `apps/backend/src/common/interceptors/transform.interceptor.ts`: global response interceptor wrap response thành công vào `{ data: ... }` hoặc pass-through nếu đã có `data` key; đăng ký trong `apps/backend/src/main.ts`
- [X] T085 [P] Cấu hình rate limiting tại `apps/backend/src/main.ts` hoặc `apps/backend/src/app.module.ts`: dùng `@nestjs/throttler`, áp dụng global guard `ThrottlerGuard`; cấu hình: 60 requests/minute cho API chung, 10 requests/minute cho auth endpoints (`/auth/*`)
- [X] T086 [P] Cấu hình security headers tại `apps/backend/src/main.ts`: dùng `helmet()` — bật `X-Content-Type-Options`, `X-Frame-Options: DENY`, `X-XSS-Protection`, `Strict-Transport-Security`
- [X] T087 [P] Thêm structured logging tại `apps/backend/src/main.ts` và các services: dùng NestJS built-in Logger hoặc `nestjs-pino`; log các sự kiện quan trọng: registration, approval/rejection, login (thành công/thất bại), deactivation, email queue errors; tuyệt đối không log `password` hoặc `passwordHash`
- [X] T088 [P] Cập nhật `apps/backend/src/mail/mail.processor.ts`: implement đầy đủ retry logic — BullMQ `attempts: 3`, `backoff: { type: 'exponential', delay: 5000 }`; log lỗi email với `Logger.error()` khi hết retry; không throw exception ra ngoài (email failure không ảnh hưởng main flow)
- [X] T089 [P] Tạo `apps/frontend/src/lib/auth/middleware.ts`: cập nhật Next.js middleware với error boundary — nếu access token hết hạn và refresh cũng thất bại, redirect về login và xóa cookie; xử lý edge case token malformed
- [X] T090 [P] Cập nhật `apps/frontend/src/components/auth/LoginForm.tsx` và `apps/frontend/src/components/auth/RegisterForm.tsx`: thêm loading state cho submit button; disable button khi đang submit để tránh double-submit; hiển thị generic error message cho các lỗi 500 server

---

**Checkpoint Phase N (Final)**: Chạy toàn bộ luồng end-to-end từ US1 đến US4 một lần nữa. Kiểm tra: format lỗi nhất quán, không có console.log nhạy cảm, rate limiting hoạt động, security headers có mặt. Feature sẵn sàng merge vào `main`.

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 — Setup (T001–T012)
  └─► Phase 2 — Foundation (T013–T027)   [BLOCKS tất cả user story phases]
        ├─► Phase 3 — US1+US2 (T028–T057) [Registration & Approval]
        │     └─► Phase 4 — US3 (T058–T073) [Login & Session — phụ thuộc US1+US2]
        │           └─► Phase 5 — US4 (T074–T082) [Account Lifecycle — phụ thuộc US3]
        └─► Phase N — Polish (T083–T090)   [Có thể làm song song với Phase 5]
```

### User Story Dependencies

| Story | Depends on | Ghi chú |
| ----- | ---------- | ------- |
| US1 (Registration) | Phase 2 | Độc lập; không phụ thuộc US khác |
| US2 (Admin Approval) | US1 | Admin phê duyệt account được tạo bởi US1 |
| US3 (Login) | US1 + US2 | Yêu cầu account đã được approve |
| US4 (Lifecycle) | US3 | Vô hiệu hóa/kích hoạt lại account đã active |

### Within Each Phase

- DTOs trước Services; Services trước Controllers
- Email templates có thể làm song song với backend logic [P]
- Frontend types trước API functions; API functions trước UI components

---

## Parallel Opportunities per User Story

### US1 — Registration (Phase 3.1–3.3)

```bash
# Có thể làm song song:
T032 [P] registration-confirmation.hbs
T033 [P] admin-new-registration.hbs

# Có thể làm song song sau T029:
T034 [P] frontend types
T035 [P] frontend api/auth.ts
```

### US2 — Admin Approval (Phase 3.4–3.9)

```bash
# Có thể làm song song:
T038 [P] ListStoreOwnersQueryDto
T039 [P] RejectStoreOwnerDto
T043 [P] account-approved.hbs
T044 [P] account-rejected.hbs
T045 [P] frontend types/admin.ts
T050 [P] NotificationsController
T052 [P] frontend api/notifications.ts
T053 [P] NotificationBell.tsx
T054 [P] NotificationList.tsx
```

### US3 — Login (Phase 4)

```bash
# Có thể làm song song sau Foundation:
T061 [P] RefreshTokenDto
T064 [P] logoutStoreOwner service + route
T066 [P] JWT strategy validation update
T067 [P] frontend auth API functions
T068 [P] frontend session manager
```

### US4 — Lifecycle (Phase 5)

```bash
# Có thể làm song song:
T077 [P] account-deactivated.hbs
T078 [P] account-reactivated.hbs
T080 [P] frontend API functions
```

### Polish (Phase N)

```bash
# Tất cả có thể song song:
T084 [P] transform interceptor
T085 [P] rate limiting config
T086 [P] security headers (helmet)
T087 [P] structured logging
T088 [P] email retry hardening
T089 [P] frontend middleware error boundary
T090 [P] loading state + double-submit prevention
```

---

## Implementation Strategy

### MVP Scope (User Story 1 + 2 only)

1. Hoàn thành Phase 1 — Setup
2. Hoàn thành Phase 2 — Foundation (**bắt buộc**)
3. Hoàn thành Phase 3 — US1 + US2 (Registration & Admin Approval)
4. **DỪNG và KIỂM TRA**: end-to-end Register → approve → email notification
5. Demo/deploy nếu sẵn sàng

### Incremental Delivery

| Milestone | Phases | Deliverable |
| --------- | ------ | ----------- |
| M1 — MVP | 1 + 2 + 3 | Store Owner đăng ký + Admin phê duyệt/từ chối |
| M2 | + 4 | Store Owner đăng nhập, JWT, refresh, logout |
| M3 | + 5 | Admin quản lý vòng đời tài khoản |
| M4 | + N | Hardening bảo mật, rate limit, logs |

### Notes

- `[P]` = tasks trong cùng phase không có dependency vào nhau — có thể chạy song song
- `[USx]` = task thuộc user story cụ thể để traceability
- Mỗi phase có Independent Test và Checkpoint — validate trước khi qua phase tiếp theo
- Không commit `password` hoặc `passwordHash` trong logs
- Admin token không có refresh mechanism (by design per spec Clarifications)

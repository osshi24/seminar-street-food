# Hướng dẫn cài đặt dự án Phố Ẩm Thực (seminar-v2)

## Yêu cầu hệ thống

| Phần mềm     | Phiên bản tối thiểu |
| ------------- | -------------------- |
| Node.js       | >= 20.0.0            |
| npm           | >= 11.x              |
| Docker        | >= 24.x              |
| Docker Compose| >= 2.x               |
| Git           | >= 2.x               |

## Kiến trúc dự án

```
seminar-v2/
├── apps/
│   ├── backend/        # NestJS 10+ API (TypeORM, PostgreSQL, Redis, BullMQ)
│   └── frontend/       # Next.js 14 App Router (React 18, Tailwind CSS, Leaflet)
├── packages/
│   └── types/          # Shared TypeScript types
├── docker-compose.yml  # PostgreSQL 15 + PostGIS, Redis 7
├── turbo.json          # Turborepo config
└── package.json        # npm workspaces root
```

## Bước 1: Clone dự án

```bash
git clone <repo-url> seminar-v2
cd seminar-v2
```

## Bước 2: Cài đặt dependencies

```bash
npm install
```

> Lệnh này sẽ tự động cài đặt dependencies cho cả backend, frontend và packages nhờ npm workspaces.

## Bước 3: Khởi chạy Docker services

Dự án cần **PostgreSQL** (với PostGIS) và **Redis**:

```bash
docker compose up -d
```

Kiểm tra services đã chạy:

```bash
docker compose ps
```

Kết quả mong đợi:

| Container          | Port       | Mô tả                       |
| ------------------ | ---------- | --------------------------- |
| `seminar_postgres` | 5432       | PostgreSQL 15 + PostGIS 3.4 |
| `seminar_redis`    | 6379       | Redis 7                     |
| `seminar_minio`    | 9000, 9001 | MinIO (S3 storage) + Console|

## Bước 4: Cấu hình biến môi trường

### Backend

```bash
cp apps/backend/.env.example apps/backend/.env
```

File `.env` đã có sẵn giá trị mặc định phù hợp cho môi trường dev. Các biến **bắt buộc phải thay đổi** nếu cần dùng đầy đủ tính năng:

| Biến                             | Mô tả                              | Bắt buộc? |
| -------------------------------- | ----------------------------------- | ---------- |
| `DATABASE_URL`                   | Connection string PostgreSQL        | Có (mặc định OK cho dev) |
| `REDIS_URL`                      | Connection string Redis             | Có (mặc định OK cho dev) |
| `JWT_SECRET`                     | Secret cho JWT Store Owner          | Có (đổi khi deploy) |
| `JWT_ADMIN_SECRET`               | Secret cho JWT Admin                | Có (đổi khi deploy) |
| `CUSTOMER_JWT_SECRET`            | Secret cho JWT Customer             | Có (đổi khi deploy) |
| `SMTP_USER` / `SMTP_PASS`       | Thông tin SMTP gửi email            | Không (cần cho tính năng email) |
| `MINIO_*`                        | Cấu hình MinIO/S3 lưu trữ file     | Không (cần cho upload ảnh) |
| `GOOGLE_CLIENT_ID/SECRET`        | Google OAuth cho Customer login     | Không (cần cho Google login) |
| `GOOGLE_CLOUD_PROJECT_ID`        | Google Cloud (TTS, Translation, AI) | Không (cần cho tính năng AI) |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path tới service account JSON       | Không (cần cho Google Cloud) |

### Frontend

```bash
cp apps/frontend/.env.example apps/frontend/.env
```

Các biến mặc định đã trỏ đến `localhost:3001` (backend) và `localhost:3000` (frontend), phù hợp cho dev.

## Bước 5: Chạy database migrations

```bash
npm run db:migrate
```

## Bước 6: Seed dữ liệu mẫu

Seed tài khoản admin:

```bash
npm run db:seed:admin
```

Hoặc seed toàn bộ dữ liệu mẫu (bao gồm stores, menu items, v.v.):

```bash
npm run seed:all --workspace=apps/backend
```

## Bước 7: Khởi chạy ứng dụng

```bash
npm run dev
```

Lệnh này sẽ chạy đồng thời cả backend và frontend thông qua Turborepo.

| Service  | URL                         |
| -------- | --------------------------- |
| Frontend | http://localhost:3000       |
| Backend API | http://localhost:3001/api |

## Tài khoản mặc định

### Admin

| Email              | Mật khẩu      |
| ------------------ | -------------- |
| admin@phoamthuc.vn | Admin@123456   |

### Store Owner (sau khi seed:all)

| Email                   | Mật khẩu       | Trạng thái |
| ----------------------- | --------------- | ---------- |
| owner1@phoamthuc.vn     | Owner@123456    | Active     |
| owner2@phoamthuc.vn     | Owner@123456    | Active     |
| owner3@phoamthuc.vn     | Owner@123456    | Active     |
| pending@phoamthuc.vn    | Owner@123456    | Pending    |
| rejected@phoamthuc.vn   | Owner@123456    | Rejected   |

## Các lệnh hữu ích

```bash
# Chạy dev (cả backend + frontend)
npm run dev

# Build production
npm run build

# Lint code
npm run lint

# Chạy tests
npm run test

# Tạo migration mới (sau khi thay đổi entity)
npm run migration:generate --workspace=apps/backend -- src/database/migrations/TenMigration

# Chạy migrations
npm run db:migrate

# Revert migration gần nhất
npm run migration:revert --workspace=apps/backend

# Dừng Docker services
docker compose down

# Xóa toàn bộ dữ liệu Docker volumes
docker compose down -v
```

## Cài đặt thêm (tuỳ chọn)

### MinIO (S3 storage cho upload ảnh)

MinIO đã có sẵn trong `docker-compose.yml`. Khi chạy `docker compose up -d`:

- **API**: <http://localhost:9000>
- **Console**: <http://localhost:9001> (user: `minioadmin` / pass: `minioadmin`)
- Bucket `seminar-media` được tự động tạo bởi container `minio-init`.

### Google OAuth

1. Tạo project trên [Google Cloud Console](https://console.cloud.google.com)
2. Bật **Google+ API** hoặc **People API**
3. Tạo OAuth 2.0 Client ID (Web application)
4. Thêm Authorized redirect URI: `http://localhost:3001/api/auth/google/callback`
5. Cập nhật `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` trong `apps/backend/.env`

## Xử lý lỗi thường gặp

| Lỗi | Nguyên nhân | Cách khắc phục |
| --- | ----------- | -------------- |
| `ECONNREFUSED :5432` | PostgreSQL chưa chạy | `docker compose up -d postgres` |
| `ECONNREFUSED :6379` | Redis chưa chạy | `docker compose up -d redis` |
| `relation "xxx" does not exist` | Chưa chạy migrations | `npm run db:migrate` |
| `npm install` lỗi trên macOS ARM | Image postgres không hỗ trợ ARM | Docker compose đã set `platform: linux/amd64` |
| Port 3000/3001 đã bị chiếm | App khác đang dùng port | Tắt app đó hoặc đổi PORT trong `.env` |

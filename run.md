# Khởi động hệ thống

## Lần đầu (hoặc sau khi reset DB)

```bash
# 1. Cài deps
npm install

# 2. Khởi động Docker (PostgreSQL + Redis)
docker compose up -d

# 3. Chạy migration
npm run migration:run -w @seminar/backend

# 4. Seed toàn bộ data
npm run seed:all -w @seminar/backend

# 5. Start dev server
npm run dev
```

## Các lần sau

```bash
docker compose up -d
npm run dev
```

---

## Tài khoản mặc định

| Role | Email | Password |
|---|---|---|
| Admin | admin@phoamthuc.vn | Admin@123456 |
| Store Owner (active) | owner1@phoamthuc.vn | Owner@123456 |
| Store Owner (active) | owner2@phoamthuc.vn | Owner@123456 |
| Store Owner (active) | owner3@phoamthuc.vn | Owner@123456 |
| Store Owner (pending) | pending@phoamthuc.vn | Owner@123456 |
| Store Owner (rejected) | rejected@phoamthuc.vn | Owner@123456 |

## Data được seed

| Spec | Data |
|---|---|
| 001 | 1 admin + 3 active + 1 pending + 1 rejected store owner |
| 002 | 3 stores (Cơm Tấm Bà Ba, Bánh Mì Hương Xưa, Phở Gia Truyền) với menu + ảnh + commentary (AI pipeline tự chạy khi dev start) |
| 003 | Boundary polygon phố ẩm thực + 3 approved pins + 1 pending pin (để test admin duyệt) |

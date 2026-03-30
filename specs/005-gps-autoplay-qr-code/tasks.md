# Tasks: GPS Auto-Play & QR Code

**Spec**: 005-gps-autoplay-qr-code | **Date**: 2026-04-05
**Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)

---

## Phase 1 — Setup

- [X] T001 Cài `qrcode` và `@types/qrcode` vào `apps/backend/package.json`
- [X] T002 Cài `pdfkit` và `@types/pdfkit` vào `apps/backend/package.json`

---

## Phase 2 — Foundation

- [X] T003 Tạo migration `apps/backend/src/database/migrations/YYYYMMDD_create_qr_codes.ts` — tạo bảng `qr_codes` với các cột `id`, `store_id`, `token UUID DEFAULT gen_random_uuid()`, `is_active BOOLEAN DEFAULT TRUE`, `created_at TIMESTAMPTZ`, `created_by`
- [X] T004 Thêm partial unique index `uq_one_active_qr_per_store ON qr_codes (store_id) WHERE is_active = TRUE` vào cùng migration `apps/backend/src/database/migrations/YYYYMMDD_create_qr_codes.ts`
- [X] T005 Thêm index `idx_qr_codes_token ON qr_codes (token)` và `idx_qr_codes_store_id ON qr_codes (store_id)` vào cùng migration `apps/backend/src/database/migrations/YYYYMMDD_create_qr_codes.ts`
- [X] T006 Tạo TypeORM entity `apps/backend/src/qr/entities/qr-code.entity.ts` — ánh xạ bảng `qr_codes`, decorator `@Index('uq_one_active_qr_per_store', ['storeId'], { unique: true, where: '"is_active" = TRUE' })`, các cột `id`, `storeId`, `token`, `isActive`, `createdAt`, `createdBy`, relations `store` và `creator`
- [X] T007 [P] Tạo DTO `apps/backend/src/qr/dto/create-qr.dto.ts` — response DTO gồm `id`, `storeId`, `token`, `isActive`, `createdAt`, `qrImageUrl`, `scanUrl`
- [X] T008 [P] Tạo skeleton `apps/backend/src/qr/qr.service.ts` — class `QrService`, inject `QrCode` repository, khai báo các method signature: `createQr`, `getActivePng`, `getActivePdf`, `resolveToken`
- [X] T009 Tạo `apps/backend/src/qr/qr.module.ts` — import `TypeOrmModule.forFeature([QrCode])`, providers `[QrService]`, exports `[QrService]`
- [X] T010 Đăng ký `QrCode` entity vào `apps/backend/src/app.module.ts` (hoặc `database.module.ts` tùy cấu trúc hiện tại)

---

## Phase 3 — US1: GPS Auto-Play

- [X] T011 [US1] Tạo hook `apps/frontend/src/hooks/useGeolocation.ts` — dùng `navigator.geolocation.watchPosition`, xử lý permission request, trả về `{ position, gpsStatus, error }`; cleanup `clearWatch` khi unmount; các trạng thái `idle | requesting | granted | denied | unavailable`
- [X] T012 [P] [US1] Tạo utility `apps/frontend/src/lib/gps/haversine.ts` — hàm `haversineMeters(lat1, lng1, lat2, lng2): number` tính khoảng cách bằng mét theo công thức Haversine
- [X] T013 [P] [US1] Tạo module `apps/frontend/src/lib/gps/proximitySession.ts` — export `createProximitySession(): Map<number, boolean>`, hàm `hasPlayed(session, storeId): boolean`, hàm `markPlayed(session, storeId): Map<number, boolean>`; dùng in-memory Map reset khi reload
- [X] T014 [US1] Tạo hook `apps/frontend/src/hooks/useProximityDetection.ts` — nhận `position` từ `useGeolocation` và danh sách pins từ `GET /api/map/pins` (spec 003, TanStack Query cached), tính Haversine distance đến từng pin, lọc `distance <= 4`, trả về `nearestStore: NearbyStore | null` (gian hàng có `distance` nhỏ nhất); áp dụng debounce 500ms trên `position` trước khi tính để tránh phát/dừng liên tục khi Customer đứng ở ranh giới 4m (FR-007)
- [X] T015 [US1] Tạo component `apps/frontend/src/components/gps/GpsPermissionBanner.tsx` — hiển thị khi `gpsStatus === 'denied' | 'unavailable'`, nội dung "Vui lòng bật GPS để nghe thuyết minh tự động", nút hướng dẫn cấp quyền
- [X] T016 [US1] Tạo hook `apps/frontend/src/hooks/useAutoPlay.ts` — nhận `nearestStore` và `session`, kiểm tra `shouldTriggerAutoPlay`, fetch audio URL từ `GET /api/stores/:id/commentary` (spec 002), gọi `audio.play()`, bắt `NotAllowedError` → set `bannerVisible = true`, gọi `markPlayed(storeId)` sau khi phát thành công; trả về `{ bannerVisible, triggerManualPlay, currentAudio }`
- [X] T017 [US1] Tạo component `apps/frontend/src/components/gps/AutoplayBanner.tsx` — banner nhỏ "Nhấn để nghe thuyết minh", hiển thị khi `bannerVisible === true`, ẩn sau khi Customer tap (gọi `triggerManualPlay`) hoặc khi `nearestStore === null`
- [X] T017b [US1] Tạo component `apps/frontend/src/components/gps/AudioControls.tsx` — thanh điều khiển audio nhỏ hiển thị khi `currentAudio !== null`: tên gian hàng đang phát, nút Dừng (`audio.pause()`) và nút Bỏ qua (`audio.pause(); audio.currentTime = 0; clearCurrentAudio()`); Customer PHẢI có thể dừng hoặc bỏ qua audio bất kỳ lúc nào (FR-005)
- [X] T018 [US1] Tạo component `apps/frontend/src/components/gps/GpsStatusBar.tsx` — thanh trạng thái GPS nhỏ, hiển thị icon + text tương ứng với `gpsStatus` (`idle`, `requesting`, `granted`, `denied`, `unavailable`)
- [X] T019 [US1] Tích hợp `useGeolocation`, `useProximityDetection`, `useAutoPlay` vào trang chính/bản đồ — thêm `<GpsPermissionBanner>`, `<AutoplayBanner>`, `<GpsStatusBar>` vào layout; đảm bảo proximity session reset khi reload

---

## Phase 4 — US2: QR Code Management

- [X] T020 [US2] Implement `QrService.createQr(storeId, ownerId)` trong `apps/backend/src/qr/qr.service.ts` — kiểm tra store tồn tại + thuộc owner + `status === 'active'`; UPDATE các QR cũ `SET is_active = false WHERE store_id = :storeId AND is_active = true`; INSERT QR mới; tạo PNG base64 bằng `qrcode` package với URL `/qr/:token`; trả về response DTO
- [X] T021 [US2] Implement `QrService.getActivePng(storeId, ownerId)` trong `apps/backend/src/qr/qr.service.ts` — kiểm tra ownership; tìm QR active; generate PNG Buffer bằng `qrcode.toBuffer`; trả về Buffer
- [X] T022 [US2] Implement `QrService.getActivePdf(storeId, ownerId)` trong `apps/backend/src/qr/qr.service.ts` — kiểm tra ownership; tìm QR active; tạo PDF A4 portrait bằng `pdfkit` với tên gian hàng (16pt centered), QR image (300×300px centered), dòng hướng dẫn (10pt centered); trả về Buffer
- [X] T023 [US2] Implement `QrService.resolveToken(token)` trong `apps/backend/src/qr/qr.service.ts` — tìm QR theo token; nếu không tìm thấy hoặc `is_active = false` → trả về `'unavailable'`; tìm store theo `store_id`; nếu `store.status = 'inactive'` → trả về `'unavailable'`; nếu `store.status = 'active'` → trả về `storeId`
- [X] T024 [US2] Tạo `apps/backend/src/qr/qr.controller.ts` — `POST /api/store-owner/stores/:storeId/qr` (guard JWT Store Owner, gọi `createQr`, trả về 201); `GET /api/store-owner/stores/:storeId/qr/png` (guard JWT, set header `Content-Type: image/png`, `Content-Disposition: attachment`, stream Buffer); `GET /api/store-owner/stores/:storeId/qr/pdf` (guard JWT, set header `Content-Type: application/pdf`, `Content-Disposition: attachment`, stream Buffer)
- [X] T025 [US2] Tạo `apps/backend/src/qr/qr-public.controller.ts` — `GET /api/qr/:token` (no auth), gọi `resolveToken`, nếu `storeId` → `res.redirect(302, /stores/:storeId)`; nếu `'unavailable'` → `res.redirect(302, /store-unavailable)`
- [X] T026 [US2] Đăng ký `QrController` và `QrPublicController` vào `apps/backend/src/qr/qr.module.ts`
- [X] T027 [P] [US2] Tạo API client `apps/frontend/src/lib/api/qr.ts` — hàm `createQr(storeId): Promise<CreateQrResponse>`, `downloadQrPng(storeId): Promise<Blob>`, `downloadQrPdf(storeId): Promise<Blob>`; dùng `fetch` với JWT header
- [X] T028 [P] [US2] Tạo component `apps/frontend/src/components/qr/QRCodeDisplay.tsx` — nhận `qrImageUrl: string` (base64 data URL), render `<img>` với alt text; hiển thị skeleton khi loading
- [X] T029 [P] [US2] Tạo component `apps/frontend/src/components/qr/QRDownloadButtons.tsx` — nút "Tải PNG" và nút "Tải PDF"; mỗi nút gọi API tương ứng, tạo Blob URL, trigger `<a download>` click; xử lý loading/error state
- [X] T030 [US2] Tạo trang `apps/frontend/src/app/store-owner/qr/page.tsx` — Server Component, hiển thị danh sách gian hàng của Store Owner; mỗi gian hàng có nút "Tạo QR code" (gọi POST endpoint, hiển thị `<QRCodeDisplay>` với kết quả) và `<QRDownloadButtons>`; thông báo lỗi khi gian hàng `inactive` ("Gian hàng cần được Admin kích hoạt trước khi tạo QR code.")
- [X] T031 [US2] Tạo trang lỗi `apps/frontend/src/app/store-unavailable/page.tsx` — trang thông báo "Gian hàng không khả dụng", nội dung giải thích gian hàng có thể đã ngưng hoạt động, link về trang chủ; không lộ thông tin nội bộ

---

## Checklist hoàn thành

- [X] T001–T002: Dependencies đã cài, `package.json` đã cập nhật
- [X] T003–T010: Migration chạy thành công, entity đăng ký đúng, `QrModule` import được
- [X] T011–T019: GPS hook hoạt động trên Chrome/Firefox/Safari; auto-play kích hoạt trong vòng 1 giây khi vào vùng 4m (SC-001); banner "Nhấn để nghe" hiển thị đúng khi browser chặn autoplay; mỗi gian hàng chỉ phát 1 lần/session
- [X] T020–T031: POST QR trả về 201 + base64 PNG; PNG/PDF download hoạt động; `GET /api/qr/:token` redirect đúng theo trạng thái store; gian hàng inactive không tạo được QR (FR-011); QR cũ bị invalidate khi tạo QR mới (SC-002)

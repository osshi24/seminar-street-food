# Research: GPS Auto-Play & QR Code

**Spec**: 005-gps-autoplay-qr-code | **Date**: 2026-04-05

Tài liệu này ghi lại các quyết định design kỹ thuật cho feature GPS proximity auto-play và
QR code generation, lý do lựa chọn, và các phương án đã cân nhắc nhưng bị loại bỏ.

---

## 1. GPS Tracking: Browser Geolocation API watchPosition

### Quyết định: `navigator.geolocation.watchPosition` với high accuracy options

```typescript
// lib/gps/proximity.ts
const WATCH_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,  // Dùng GPS chip thay vì WiFi/cell triangulation
  timeout: 5000,             // Timeout mỗi lần lấy position: 5 giây
  maximumAge: 0,             // Không dùng cached position — luôn lấy tươi
};

function startWatching(
  onPosition: (pos: GeolocationPosition) => void,
  onError: (err: GeolocationPositionError) => void,
): number {
  return navigator.geolocation.watchPosition(onPosition, onError, WATCH_OPTIONS);
}

function stopWatching(watchId: number): void {
  navigator.geolocation.clearWatch(watchId);
}
```

Callback `onPosition` được gọi mỗi khi thiết bị phát hiện vị trí thay đổi đủ ngưỡng.
Với `enableHighAccuracy: true` và `maximumAge: 0`, frequency cập nhật thực tế khoảng
0.5–2 giây trên thiết bị di động — đủ để đạt yêu cầu ≤1 giây từ SC-001.

### Lý do chọn watchPosition thay vì polling getCurrentPosition

| Tiêu chí | watchPosition (chọn) | Polling getCurrentPosition (loại bỏ) |
| -------- | -------------------- | ------------------------------------- |
| Latency | Callback ngay khi có update từ GPS chip | Phụ thuộc interval polling (có thể trễ hơn 1s) |
| Battery | OS tối ưu — chỉ wake CPU khi cần | Constant polling tốn pin hơn |
| Accuracy | Tận dụng motion sensors nếu có | Không có sự khác biệt về accuracy |
| Code complexity | Đơn giản — 1 callback liên tục | Cần quản lý interval + cleanup |

Polling `getCurrentPosition` mỗi 500ms bị loại bỏ vì watchPosition đã cho phản hồi
nhanh hơn mà không cần tự quản lý timer.

### Xử lý Permission

```typescript
// Yêu cầu quyền explicit trước khi gọi watchPosition
async function requestGPSPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  if (!navigator.geolocation) return 'denied';
  
  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state;
  } catch {
    // Fallback: thử gọi trực tiếp, error handler xử lý denial
    return 'prompt';
  }
}
```

Nếu quyền bị từ chối (`PERMISSION_DENIED`, error code 1): tắt auto-play hoàn toàn +
hiển thị hướng dẫn bật lại trong cài đặt trình duyệt. Nếu GPS mất kết nối giữa chừng
(`POSITION_UNAVAILABLE`, error code 2) hoặc timeout (error code 3): tắt auto-play tạm
thời + hiển thị banner "GPS không khả dụng — Nhấn để thử lại".

---

## 2. Distance Calculation: Haversine Formula (Client-Side JavaScript)

### Quyết định: Tính toán hoàn toàn client-side bằng Haversine formula

Không cần server round-trip để tính khoảng cách. Frontend fetch danh sách ghim approved
một lần từ `/api/map/pins` (spec 003), lưu vào state, rồi tính distance locally mỗi khi
có GPS update.

```typescript
// lib/gps/haversine.ts
const EARTH_RADIUS_METERS = 6371000;

/**
 * Tính khoảng cách theo đường chim bay giữa hai điểm GPS (tính bằng mét).
 * Haversine formula — chính xác cho khoảng cách ngắn (<100km).
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c; // Kết quả tính bằng mét
}
```

Ngưỡng kích hoạt: **4 mét** (yêu cầu kinh doanh cố định theo spec). Không có cấu hình
linh hoạt theo gian hàng trong phạm vi MVP.

### Lý do chọn client-side thay vì server-side proximity check

- **Latency**: Server round-trip thêm 50–200ms network delay, khó đạt SC-001 (≤1 giây).
- **Cost**: Mỗi GPS update gửi request đến server → tốn bandwidth và tăng tải server
  không cần thiết với ~500 Customer concurrent.
- **Data size**: Danh sách ~100 ghim approved là payload nhỏ (vài KB), fetch một lần
  và reuse. Không cần real-time sync vì dữ liệu ghim ít thay đổi.
- **Privacy**: Tọa độ chính xác của Customer không cần gửi lên server liên tục.

Server endpoint `GET /api/stores/:storeId/proximity-check?lat=&lng=` được liệt kê trong
API contract nhưng là **optional** — chỉ dùng nếu cần debug hoặc server-side logging
trong tương lai.

---

## 3. Audio Playback: HTML5 Audio API + Autoplay Policy Fallback

### Quyết định: HTML5 Audio API với banner fallback khi browser chặn autoplay

```typescript
// components/gps/AudioPlayer.tsx (simplified logic)

async function tryAutoplay(audioUrl: string): Promise<'playing' | 'blocked'> {
  const audio = new Audio(audioUrl);
  try {
    await audio.play();
    return 'playing';
  } catch (error) {
    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      // Browser policy chặn autoplay — cần user gesture
      return 'blocked';
    }
    throw error; // Lỗi khác (network, codec) → propagate
  }
}
```

Luồng xử lý autoplay:

```
watchPosition callback → Customer vào vùng 4m
  → Kiểm tra session memory: đã phát chưa?
    → Đã phát → bỏ qua (FR-007)
    → Chưa phát → gọi tryAutoplay(audioUrl)
      → 'playing' → audio phát, đánh dấu đã phát trong session
      → 'blocked' → hiển thị AutoPlayBanner
        → Customer tap banner → audio.play() (user gesture → thành công)
        → Audio phát, banner ẩn, đánh dấu đã phát
```

Banner "Nhấn để nghe thuyết minh" tự ẩn khi Customer tap hoặc rời vùng 4m (state reset).

### Không tự dừng audio khi rời vùng 4m

Theo clarification đã xác nhận: audio tiếp tục phát sau khi Customer rời vùng. Customer
tự dừng bằng nút điều khiển (`AudioPlayer` component). Hệ thống không theo dõi "rời
vùng" để dừng — chỉ theo dõi "vào vùng" để kích hoạt.

---

## 4. Session Tracking: In-Memory Map (Không cần Database)

### Quyết định: `Map<storeId, boolean>` trong React Context

```typescript
// components/gps/ProximityProvider.tsx
interface ProximitySessionState {
  playedStores: Map<number, boolean>; // storeId → hasPlayed
  gpsStatus: 'idle' | 'granted' | 'denied' | 'unavailable';
  nearestStore: Store | null;
  watchId: number | null;
}
```

Session reset tự nhiên khi Customer reload trang (memory bị xóa). Không cần localStorage
hay database — đây là quyết định thiết kế phù hợp với clarification: "mỗi gian hàng chỉ
auto-play 1 lần cho đến khi reload".

### Lý do không dùng localStorage

- Spec yêu cầu reset khi reload → localStorage sẽ persist qua sessions, cần cleanup logic
  phức tạp (TTL, cleanup on mount).
- In-memory Map đơn giản hơn và đúng semantics với yêu cầu.

---

## 5. QR Code Generation: `qrcode` npm Package (Server-Side)

### Quyết định: `qrcode` package cho PNG, `pdfkit` cho PDF

```typescript
// qr/qr.service.ts
import * as QRCode from 'qrcode';
import PDFDocument from 'pdfkit';

async generatePNG(token: string): Promise<string> {
  const url = `${this.configService.get('APP_BASE_URL')}/qr/${token}`;
  // Trả về base64 data URL để stream trực tiếp hoặc lưu file
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'H',  // Cao nhất — QR vẫn đọc được dù bị che một phần
    margin: 2,
    width: 512,                 // 512×512 px — đủ chất lượng cho in ấn
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });
}

async generatePDF(token: string, storeName: string): Promise<Buffer> {
  const pngDataUrl = await this.generatePNG(token);
  const base64Data = pngDataUrl.replace(/^data:image\/png;base64,/, '');
  const pngBuffer = Buffer.from(base64Data, 'base64');

  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    doc.fontSize(16).text(storeName, { align: 'center' });
    doc.moveDown();
    doc.image(pngBuffer, { fit: [300, 300], align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text('Quét mã QR để xem chi tiết gian hàng', { align: 'center' });

    doc.end();
  });
}
```

### Lý do chọn `qrcode` package thay vì các lựa chọn khác

| Thư viện | Pros | Cons | Quyết định |
| -------- | ---- | ---- | ---------- |
| `qrcode` (chọn) | Pure JS, no native deps, hỗ trợ PNG/SVG/terminal, active maintenance | — | Chọn |
| `node-qrcode` | Alias của `qrcode` | — | Cùng package |
| `jsbarcode` | Đa dạng barcode types | Không focus QR, API phức tạp hơn | Loại bỏ |
| External QR API | Không cần install | Phụ thuộc third-party, latency, privacy | Loại bỏ |

### Lý do chọn `pdfkit` thay vì Puppeteer cho PDF export

- **Puppeteer**: Render HTML → PDF — cần cài Chromium (~300MB), phức tạp infrastructure.
  Phù hợp khi PDF cần layout phức tạp từ HTML.
- **pdfkit**: Programmatic PDF generation — nhẹ, không cần browser, phù hợp cho PDF đơn
  giản (logo + QR + text). Đúng với use case: PDF một trang, nội dung đơn giản.

---

## 6. QR Token: UUID Random trong Database

### Quyết định: UUID v4, lưu trong bảng `qr_codes`, invalidate khi tạo mới

```typescript
import { v4 as uuidv4 } from 'uuid';

async createQR(storeId: number, ownerId: number): Promise<QrCode> {
  // Kiểm tra gian hàng active
  const store = await this.storeRepository.findOne({ where: { id: storeId } });
  if (!store || store.status !== 'active') {
    throw new ForbiddenException('Gian hàng cần đang active để tạo QR code.');
  }

  // Invalidate tất cả QR cũ của gian hàng này
  await this.qrCodeRepository.update(
    { storeId, isActive: true },
    { isActive: false },
  );

  // Tạo QR mới
  const token = uuidv4();
  const qrCode = this.qrCodeRepository.create({
    storeId,
    token,
    isActive: true,
    createdBy: ownerId,
  });

  return this.qrCodeRepository.save(qrCode);
}
```

### QR URL Format

```
/qr/{token}
```

Ví dụ: `https://phoamthuc.vn/qr/550e8400-e29b-41d4-a716-446655440000`

URL này được nhúng vào QR code. Khi quét, browser mở trang `/qr/[token]` (Next.js route)
hoặc gọi API `/api/qr/:token` → server kiểm tra `store.status` tại thời điểm quét:

- `active` → `302 redirect` đến `/stores/:storeId`
- `inactive` → `302 redirect` đến `/store-unavailable`

---

## 7. Dependency Chain với Spec 002 và Spec 003

### GPS Auto-Play phụ thuộc

- **Spec 003** `/api/map/pins` → Fetch danh sách ghim `approved` (tọa độ lat/lng) kèm
  `storeId` để tính Haversine distance.
- **Spec 002** `/api/stores/:id/commentary` → Fetch URL audio thuyết minh khi trigger
  auto-play. Commentary phải có status `approved` — điều kiện này được enforce ở spec 002,
  feature này chỉ consume endpoint đã có.

### Không cần API mới cho GPS logic

Toàn bộ GPS auto-play logic chạy client-side. Các API đã có từ spec 002 và 003 là đủ.
Không tạo thêm server endpoint cho proximity detection — tránh unnecessary complexity.

---

## 8. Các vấn đề còn mở (Open Questions)

| Vấn đề | Quyết định tạm thời | Cần xác nhận |
| ------ | ------------------- | ------------ |
| GPS accuracy ở môi trường thực địa | `enableHighAccuracy: true` + chấp nhận sai số ±3m | Test thực địa tại phố ẩm thực để xác minh |
| Debounce khi Customer đứng ranh giới 4m | Chỉ check "vào vùng" (entry event), không check "rời vùng"; session memory ngăn phát lại | Confirm với team — có cần thêm time debounce không (vd: 2 giây liên tục trong vùng mới trigger)? |
| QR PDF branding | Logo gian hàng hoặc logo phố ẩthực? | Confirm với design team |
| Số lượng QR có thể tạo | Không giới hạn số lần tạo (chỉ 1 active tại 1 thời điểm) | Confirm nếu cần rate limit tạo QR |

# Research & Design Decisions: Quản lý gian hàng & Thuyết minh AI

**Feature**: `002-store-management-ai-commentary`
**Date**: 2026-04-05
**Phase**: Phase 0 — Research

---

## 1. Image Storage

### Quyết định: S3-compatible storage (MinIO self-hosted)

**Lý do chọn MinIO thay vì AWS S3**:

- Môi trường phát triển và staging có thể chạy hoàn toàn local (Docker Compose) — không phụ
  thuộc cloud credentials khi dev.
- API hoàn toàn tương thích S3; chuyển sang AWS S3 thật chỉ cần đổi endpoint và credentials,
  không cần sửa code.
- Chi phí: không mất tiền storage khi self-hosted cho môi trường seminar/demo.

**Upload strategy: Presigned URL**

Store Owner không upload ảnh qua NestJS API. Luồng:

1. Frontend gọi `POST /api/store-owner/store/images` → backend tạo presigned PUT URL (TTL 5 phút).
2. Frontend dùng presigned URL upload thẳng lên MinIO — NestJS không đứng giữa luồng bytes.
3. Sau khi upload thành công, frontend xác nhận với backend để backend ghi record vào DB.

**Lý do dùng presigned URL thay vì upload qua NestJS**:

- NestJS không trở thành bottleneck khi file ≤10MB × 10 ảnh = 100MB/request tiềm năng.
- Giảm memory pressure trên API pod.
- Pattern chuẩn của S3-compatible workflow.

**Giới hạn được enforce ở cả hai lớp**:

- Frontend: validate trước khi gọi API (file type MIME, size ≤10MB, số lượng ≤10).
- Backend: validate count trước khi cấp presigned URL; MinIO policy chặn file >10MB ở server.

---

## 2. Audio Storage

**Bucket layout**:

```
s3://phoamthuc-media/
├── images/
│   └── {store_id}/
│       └── {image_id}.{ext}
└── audio/
    └── {store_id}/
        └── {commentary_id}/
            └── {language_code}.mp3
```

**Lý do tách theo `commentary_id`**: Khi Admin phê duyệt bản mới, pipeline tạo thư mục
`commentary_id` mới — file audio cũ (commentary_id cũ) vẫn còn trong storage và có thể xóa
async sau khi bản mới hoàn thành. Tránh race condition ghi đè file đang được stream.

**Audio URL**: Là public read URL (presigned GET với TTL dài, hoặc public bucket policy cho
audio). Frontend dùng URL này trực tiếp trong thẻ `<audio>` — không proxy qua API.

---

## 3. AI Translation

### Quyết định: Google Cloud Translation API (v2 Basic / v3 Advanced)

**So sánh các lựa chọn**:

| Tiêu chí | Google Cloud Translation | OpenAI GPT-4o | DeepL API |
| -------- | ------------------------ | ------------- | --------- |
| Số ngôn ngữ hỗ trợ | 130+ | Không cố định, phụ thuộc training | 31 ngôn ngữ |
| Độ ổn định / SLA | 99.9% SLA, production-grade | Không có SLA dịch thuật cụ thể | 99.5% SLA |
| Latency | ~200–500ms / request | ~1–5s / request | ~200–400ms |
| Tích hợp cùng vendor TTS | Có (Google Cloud) | Không | Không |
| Pricing | $20/1M ký tự | ~$5–15/1M token (đắt hơn nhiều) | $25/1M ký tự |
| SDK TypeScript | `@google-cloud/translate` | `openai` | `deepl-node` |

**Kết luận**: Google Cloud Translation API — hỗ trợ nhiều ngôn ngữ nhất, stable, cùng vendor
với TTS giảm số integration point, pricing hợp lý cho ~1000 ký tự/gian hàng × 5–10 ngôn ngữ.

**Cấu hình**:

- Dùng v2 Basic Translation cho text thuần (không cần glossary phức tạp).
- Target languages được cấu hình qua biến môi trường `SUPPORTED_LANGUAGES` (comma-separated
  BCP-47 codes: `en,fr,zh,ja,ko,th`).
- Mỗi job dịch toàn bộ danh sách ngôn ngữ trong một lần enqueue — không tạo sub-job theo ngôn ngữ.

---

## 4. Text-to-Speech (TTS)

### Quyết định: Google Cloud Text-to-Speech API

**Lý do chọn Google TTS thay vì ElevenLabs**:

| Tiêu chí | Google Cloud TTS | ElevenLabs |
| -------- | ---------------- | ---------- |
| Cùng vendor với Translation | Có | Không |
| Số ngôn ngữ / giọng | 220+ giọng / 40+ ngôn ngữ | ~30 ngôn ngữ |
| Chất lượng audio | WaveNet/Neural2 — tự nhiên | Rất tự nhiên (text-to-emotion) |
| Pricing | $16/1M ký tự (WaveNet) | $0.30/1000 ký tự (~$300/1M) — đắt hơn 18× |
| SLA | 99.9% | Không có SLA public rõ ràng |
| SDK TypeScript | `@google-cloud/text-to-speech` | REST-only hoặc SDK beta |

**Kết luận**: Google TTS đủ chất lượng cho thuyết minh du lịch/ẩm thực, giá hợp lý, cùng
vendor → chỉ cần một bộ credentials Google Cloud cho toàn bộ AI pipeline.

**Output format**: MP3, 24kHz, 1 channel (mono) — đủ chất lượng cho audio thuyết minh, file
nhỏ hơn stereo ~50%.

**Voice selection**: `vi-VN-Neural2-A` cho tiếng Việt gốc; các ngôn ngữ khác dùng Neural2 hoặc
WaveNet voice mặc định theo `language_code`. Voice ID có thể override qua config.

---

## 5. Async Queue: BullMQ + Redis

### Quyết định: BullMQ với Redis 7

**Lý do chọn BullMQ thay vì các alternative**:

- BullMQ là successor của Bull, hỗ trợ TypeScript tốt, tích hợp sẵn với NestJS qua `@nestjs/bull`.
- Redis là dependency đã có (session, cache) — không thêm infrastructure mới.
- Có Bull Board UI để monitor queue trong development.

**Job payload**:

```typescript
interface CommentaryPipelineJobData {
  storeId: string;          // UUID
  commentaryId: string;     // UUID — bản Commentary mới được tạo sau phê duyệt
  sourceText: string;       // Mô tả tiếng Việt đã duyệt (≤1000 ký tự)
  targetLanguages: string[]; // ['en', 'fr', 'zh', 'ja', 'ko', 'th']
}
```

**Queue configuration**:

```typescript
const queueOptions = {
  attempts: 3,                    // Retry tối đa 3 lần
  backoff: {
    type: 'exponential',
    delay: 5000,                  // 5s, 10s, 20s
  },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 50 },
};
```

**Job processor flow** (trong `commentary.processor.ts`):

1. Cập nhật `pipeline_status = 'running'` trên bảng `commentaries`.
2. Gọi Google Translation API cho toàn bộ `targetLanguages` (parallel `Promise.all`).
3. Với mỗi bản dịch thành công → gọi Google TTS → upload MP3 lên MinIO.
4. Lưu `CommentaryTranslation` record với `translated_text` và `audio_url`.
5. Sau khi xử lý xong toàn bộ → cập nhật `pipeline_status = 'completed'`.
6. Emit WebSocket event `commentary.pipeline.completed` để frontend cập nhật UI.
7. Nếu translation thất bại → `pipeline_status = 'failed'`; nếu chỉ TTS thất bại → lưu
   `translated_text` nhưng `audio_url = null`.

**Partial failure handling**: Job không throw lỗi khi chỉ một ngôn ngữ thất bại — ghi log,
lưu partial kết quả, tiếp tục các ngôn ngữ còn lại. Job chỉ fail (trigger retry) khi Google
Translation API trả về 5xx hoặc network error toàn bộ.

---

## 6. Language Detection

### Quyết định: Browser `Accept-Language` header + localStorage persistence

**Luồng detection**:

1. **Lần đầu truy cập**: Next.js middleware đọc `Accept-Language` header → parse BCP-47 code
   → so khớp với danh sách `SUPPORTED_LANGUAGES` → nếu không khớp fallback về `vi`.
2. **Persist**: Ngôn ngữ được detect lưu vào `localStorage['preferred_language']` và cookie
   `lang` (httpOnly: false, SameSite: Lax) để Next.js server component đọc được.
3. **Chủ động chuyển ngôn ngữ**: User chọn từ language picker → cập nhật `localStorage` +
   cookie → invalidate TanStack Query cache cho commentary → fetch lại từ API với `?lang=xx`.

**Lý do dùng cả localStorage và cookie**:

- Cookie: Next.js Server Component và middleware đọc được → render đúng ngôn ngữ ở SSR lần đầu.
- localStorage: Client-side state management nhanh, không cần cookie round-trip.

---

## 7. Pipeline Status & Real-time Update

### Quyết định: `pipeline_status` field + WebSocket (Socket.io)

**`pipeline_status` enum trên bảng `commentaries`**:

```
pending   → Job chưa được enqueue (thường chỉ tồn tại trong giây đầu)
running   → Job đang được processor xử lý
completed → Toàn bộ ngôn ngữ đã dịch + TTS xong (có thể partial audio)
failed    → Translation thất bại hoàn toàn; chỉ fallback tiếng Việt
```

**Real-time update strategy**:

- Backend dùng Socket.io (qua `@nestjs/websockets`) emit event `commentary:updated` vào room
  `store:{storeId}` khi `pipeline_status` thay đổi.
- Frontend subscribe vào room khi render trang chi tiết gian hàng.
- Khi nhận event `commentary:updated` với `pipeline_status = 'completed'` → TanStack Query
  invalidate cache → re-fetch commentary → audio player hiển thị tự động.
- **Fallback polling**: Nếu WebSocket không kết nối được → poll `GET /api/stores/:id/commentary`
  mỗi 10 giây, dừng khi status !== 'running'.

**Customer UX trong khi pipeline chạy**:

- Hiển thị `source_text` (tiếng Việt gốc) ngay lập tức — không cần đợi pipeline.
- Banner `PipelineBanner` component: "Audio đang được tổng hợp..." với spinner.
- Khi pipeline `completed` → banner ẩn, audio player xuất hiện (animation fade-in).
- Khi pipeline `failed` → banner đổi thành "Thuyết minh tạm thời chỉ có tiếng Việt".

---

## 8. Các quyết định nhỏ khác

### Draft locking strategy

Khi bản `pending` tồn tại, backend trả về HTTP 409 Conflict cho mọi `PUT /api/store-owner/store`
request. Frontend hiển thị banner cảnh báo và disable form chỉnh sửa. Store Owner thấy nút
"Thu hồi bản chờ duyệt" thay vì nút "Lưu thay đổi".

### Menu items trong draft

`menu_items` và `store_images` có field `is_in_draft: boolean`. Khi Store Owner chỉnh sửa:

- Thêm món mới → tạo record với `is_in_draft = true`.
- Xóa món hiện tại → đánh dấu `is_in_draft = false` (soft delete trong context draft).
- Khi Admin phê duyệt → `is_in_draft` rows được commit (false items xóa, true items giữ).
- Khi Store Owner thu hồi hoặc Admin từ chối → revert: xóa `is_in_draft = true`, restore `false`.

Cách này tránh cần bảng `draft_menu_items` riêng, đơn giản hơn cho scope hiện tại.

### Image validation

Validate ở hai lớp:

- **Frontend**: File picker filter MIME type (`image/jpeg`, `image/png`, `image/webp`), kiểm tra
  size trước khi gọi API.
- **Backend**: Trước khi cấp presigned URL, đếm số ảnh hiện tại của gian hàng (kể cả draft);
  nếu ≥10 → trả về HTTP 422 với error message cụ thể.

# Research & Design Decisions: 009-admin-stores-notify

**Date**: 2026-04-10

## Decision 1 — Lưu lịch sử & nháp thông báo Admin

**Decision**: Thêm bảng `admin_announcements` (hoặc tên tương đương) với các cột: admin gửi, title, body, `recipient_mode` (single | multi | all), `store_ids` (JSONB hoặc bảng con), `status` (`draft` | `sent`), `sent_at`, `failed_email_details` (JSONB, nullable).

**Rationale**: UC-A07 yêu cầu lịch sử gửi và lưu nháp; không nên chỉ dựa vào bảng `notifications` vì khó tái hiện một “chiến dịch” gửi và danh sách lỗi email tổng hợp.

## Decision 2 — Thông báo nội bộ (in-app)

**Decision**: Với mỗi Store Owner nhận, insert một bản ghi vào bảng `notifications` hiện có với `recipient_type = store_owner`, `event_type` cố định ví dụ `ADMIN_ANNOUNCEMENT`, `title`/`body` khớp nội dung Admin soạn.

**Rationale**: Tái sử dụng `NotificationBell` và API notifications đã có; tránh thêm kênh song song.

## Decision 3 — Email async & partial failure

**Decision**: Mỗi email gửi qua BullMQ job (pattern giống `MailModule` hiện tại). HTTP response của API “send” trả về tổng số enqueue thành công và (sau khi worker chạy xong hoặc qua bảng campaign) có thể bổ sung endpoint hoặc field `failedRecipients` — MVP: lưu JSON kết quả vào `admin_announcements.failed_email_details` sau khi processor gom lỗi.

**Rationale**: Tránh timeout khi broadcast nhiều recipient; đúng UC-A07 (in-app vẫn OK khi email fail một phần).

## Decision 4 — Dedupe Store Owner

**Decision**: Khi nhiều gian hàng được chọn thuộc cùng một `owner_id` (phòng trường hợp mở rộng 1-N), hệ thống gửi **một** thông báo in-app và **một** email cho owner đó cho mỗi lần “Gửi”.

**Rationale**: Giảm spam; hành vi có thể test rõ ràng.

## Decision 5 — “Tất cả gian hàng”

**Decision**: Phạm vi “all” = tất cả bản ghi trong bảng `stores` (mọi trạng thái) trừ khi product yêu cầu chỉ `active` — **MVP chọn: tất cả stores** để đơn giản; Admin có thể lọc trước khi gửi bằng chế độ multi-select trong tương lai. Nếu team muốn chỉ active, đổi trong implementation và cập nhật `contracts/api.md`.

**Rationale**: UC nói “tất cả gian hàng”; inactive vẫn có thể cần thông báo vận hành.

## Decision 6 — Xóa Store

**Decision**: Ưu tiên **soft confirmation API**: `GET` hoặc `DELETE` dry-run trả `hasRelatedData` + counts (reviews, reports, drafts, pins…) trước khi `DELETE` thực với `?confirmed=true`. Xóa thực hiện cascade theo FK hiện có hoặc service orchestration có thứ tự.

**Rationale**: Khớp UC-A02 (cảnh báo khi còn bình luận/đánh giá).

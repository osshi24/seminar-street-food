👤 NGƯỜI SỐ 1: Phụ trách "Giao diện, Frontend, Triển khai & Cấu trúc chung"
Người này sẽ tập trung vào phần bề nổi, những thứ liên quan đến người dùng, UI/UX, triển khai thực tế và lo phần Mở đầu/Kết luận.

🔴 HIGH (5 Tasks):

 F1: [X] Viết nội dung Chương 5 — Triển khai (screenshots + demo) (Nhiệm vụ nặng: cần chụp nhiều ảnh màn hình)
 E1: Bổ sung 4.2 — Thiết kế Frontend chi tiết
 G1: [X] Viết nội dung Chương 6 — Kết luận
 A1: Sửa mâu thuẫn cấu trúc chương (1.6 vs thực tế)
 J1: Sửa tên seminar-v2/ → seminar-street-food/
🟡 MEDIUM (10 Tasks):

 C2: Mô tả TTS chi tiết (Web Speech API)
 C4: Mô tả i18next / đa ngôn ngữ
 A3: Viết "Lời mở đầu"
 A6: Xóa ghi chú thô + fix format cấu trúc thư mục
 H1: Xử lý Chương 7 (gộp hoặc tách rõ với Ch6)
 E8: Fix ASCII art sơ đồ hạ tầng
 J2: Sửa mô tả "AI tạo audio" thành Web Speech API
 D1: Bổ sung Activity/Sequence diagram cho UC-C06 (Chuyển đổi ngôn ngữ)
 I3: Bổ sung quy trình Presigned URL upload flow (cho phần upload ảnh)
 I6: Thêm danh sách tài liệu tham khảo
🟢 LOW (4 Tasks):

 B1: Thêm công trình liên quan ở Chương 1
 D3: Thêm Use Case Specification (viết bảng cho 1-2 UC chính của Customer)
 I5: Đề cập DevFakeGps
 A4: Sửa lỗi chính tả "Custome" → "Customer"
👤 NGƯỜI SỐ 2: Phụ trách "Backend, Database, API, Hệ thống & Sơ đồ"
Người này sẽ tập trung vào "nội công" của hệ thống: dữ liệu, luồng xử lý ngầm, API, và các sơ đồ logic nghiệp vụ (Admin/Store Owner).

🔴 HIGH (4 Tasks):

 E2: Bổ sung mô tả chi tiết 22 database entities (Nhiệm vụ rất nặng: kẻ bảng và mô tả cho 22 bảng)
 E3: Viết nội dung 4.4 — API endpoints (Nhiệm vụ nặng: thống kê các API)
 C1: Thêm mục công nghệ phát triển (2.9)
 I1: Bổ sung Content Draft workflow (Luồng duyệt bài viết)
🟡 MEDIUM (10 Tasks):

 E4: Bổ sung thiết kế Commentary Pipeline (Luồng dịch thuyết minh)
 E5: Bổ sung thiết kế Store Translation Pipeline (Luồng dịch gian hàng)
 E6: Bổ sung thiết kế Email/Notification
 E7: Bổ sung thiết kế Recommendation (Gợi ý món ăn)
 C3: Mô tả Google Gemini AI (cách tích hợp để dịch thuật)
 A2: Sửa heading level Chương 4 (# 4.1 thành ## 4.1)
 A7: Bổ sung 3 hình Sequence Diagram Admin
 A8: Bổ sung hình Activity Diagram UC-C03
 I2: Bổ sung Store Owner lockout mechanism (Cơ chế khóa tài khoản)
 I4: Bổ sung PostGIS boundary checking (Cách dùng bản đồ)
🟢 LOW (5 Tasks):

 D2: Bổ sung Diagram UC-SO07 (Xem thông báo)
 D4: [X] Bổ sung Sequence Diagram UC-A08
 J3: Bổ sung hình SD Admin
 J4: Cập nhật số lượng Activity Diagram thành 22
 A5: Sửa lỗi chính tả "Xem thôn tin" → "Xem thông tin


 Gợi ý phối hợp với AI
Với cách chia này, công việc khá đều nhau (Mỗi người gánh 1-2 task Rất Nặng và một số task vừa phải). Để làm nhanh hơn, 2 bạn có thể chia ra như sau:

Người 1 lo đi chụp ảnh màn hình cho phần F1, còn lại kêu tôi (AI) tự động viết các mục lý thuyết (A3, C2, C4, G1, H1).
Người 2 lo đi vẽ hoặc kiếm lại các hình ảnh Sơ đồ bị thiếu (A7, A8, D2, D4), phần lập bảng 22 thực thể Database (E2) và bảng danh sách API (E3) hãy giao cho tôi (AI) tự động sinh ra vì tôi đọc được cấu trúc code.
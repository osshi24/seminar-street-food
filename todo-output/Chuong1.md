# Chương 1 — Nội dung cần sửa/bổ sung

> **Tasks:** A1 (sửa mục 1.6), B1 (thêm công trình liên quan)
> **Người phụ trách:** Người 1

---

## A1. Thay thế mục 1.6 Cấu trúc báo cáo

> **Vị trí:** Dòng 268-281 Seminar.md — thay toàn bộ nội dung mục 1.6

## **1.6 Cấu trúc báo cáo** {#1.6-cấu-trúc-báo-cáo}

Báo cáo được tổ chức thành các chương như sau:

* **Chương 1: Giới thiệu**
   Trình bày lý do chọn đề tài, mục tiêu, đối tượng, phạm vi và phương pháp nghiên cứu.
* **Chương 2: Cơ sở lý thuyết**
   Trình bày các công nghệ liên quan như GPS, QR Code, AI, hệ thống thuyết minh tự động, mô hình Use Case, Business Rules và các công nghệ phát triển.
* **Chương 3: Phân tích và thiết kế hệ thống**
   Mô tả chi tiết yêu cầu hệ thống thông qua Use Case Diagram, Activity Diagram, Sequence Diagram và System Flow Summary.
* **Chương 4: Thiết kế hệ thống**
   Trình bày kiến trúc tổng thể, thiết kế frontend, cơ sở dữ liệu, API và các luồng xử lý bất đồng bộ.
* **Chương 5: Triển khai**
   Mô tả môi trường phát triển, giao diện hệ thống và demo các luồng nghiệp vụ chính.
* **Chương 6: Kết luận**
   Tổng kết kết quả đạt được, hạn chế và hướng phát triển trong tương lai.
* **Chương 7: Tổng kết và đánh giá**
   Đánh giá tổng thể, phân công công việc nhóm và bài học kinh nghiệm.

---

## B1. Bổ sung mục 1.7 — Tổng quan tình hình nghiên cứu

> **Vị trí:** Chèn sau mục 1.6, trước Chương 2

## **1.7 Tổng quan tình hình nghiên cứu** {#1.7-tổng-quan-tình-hình-nghiên-cứu}

Trong lĩnh vực du lịch và ẩm thực, nhiều hệ thống hỗ trợ trải nghiệm đã được phát triển và ứng dụng trên thế giới:

* **Hệ thống audio guide trong bảo tàng:** Các bảo tàng lớn (Louvre, British Museum) sử dụng thiết bị cầm tay hoặc ứng dụng mobile cung cấp thuyết minh tự động theo vị trí. Tuy nhiên, các hệ thống này chủ yếu dùng beacon/NFC trong không gian kín, không phù hợp với môi trường ngoài trời như phố ẩm thực.

* **Ứng dụng food tour (Yelp, Foody, TripAdvisor):** Cung cấp thông tin nhà hàng, đánh giá và gợi ý. Hạn chế: không có chức năng thuyết minh tự động theo vị trí, không hỗ trợ quản lý gian hàng trong mô hình phố ẩm thực tập trung.

* **Hệ thống QR-based tourism:** Một số điểm du lịch tại Nhật Bản, Hàn Quốc triển khai QR Code tại các địa điểm tham quan để cung cấp thông tin đa ngôn ngữ. Tuy nhiên, các hệ thống này thường là trang thông tin tĩnh, thiếu tính năng tương tác như GPS proximity, gợi ý cá nhân hóa hay đánh giá.

**Điểm khác biệt của đề tài:** Hệ thống kết hợp đồng thời GPS proximity detection (phát thuyết minh tự động trong bán kính 4m), QR Code, AI đa ngôn ngữ (7 ngôn ngữ) và gợi ý món ăn theo sở thích — tất cả trong một nền tảng web duy nhất, phục vụ cả 3 đối tượng (Customer, Store Owner, Admin). Đây là sự kết hợp mà các hệ thống hiện tại chưa đáp ứng đầy đủ.

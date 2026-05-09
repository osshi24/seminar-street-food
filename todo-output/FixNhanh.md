# Fix nhanh — Typo, Format, Heading, Hình ảnh

> **Tasks:** A2, A4, A5, A6, A7, A8, E8, J1, J2, J3, J4
> **Phân công:** Xem chi tiết bên dưới
> **Hướng dẫn:** Tìm dòng trong Seminar.md → thay thế text

---

## A2. Sửa heading level Chương 4 [Người 2]

**Tìm (dòng 789):**
```
# **4.1  Kiến trúc tổng thể** {#4.1-kiến-trúc-tổng-thể}
```
**Thay bằng:**
```
## **4.1 Kiến trúc tổng thể** {#4.1-kiến-trúc-tổng-thể}
```

**Tìm (dòng 871):**
```
**4.3 Database**
```
**Thay bằng:**
```
## **4.3 Database** {#4.3-database}
```

**Tìm (dòng 881):**
```
**4.4 API**
```
**Thay bằng:**
```
## **4.4 Thiết kế API** {#4.4-thiết-kế-api}
```

---

## A4. Sửa "Custome" → "Customer" [Người 1]

**Tìm (dòng 505):**
```
### **3.2.2 Use Case Diagram – Custome** {#3.2.2-use-case-diagram-–-custome}
```
**Thay bằng:**
```
### **3.2.2 Use Case Diagram – Customer** {#3.2.2-use-case-diagram-–-customer}
```

Cập nhật cả MỤC LỤC (dòng 115):
```
[3.2.2 Use Case Diagram – Customer	13](#3.2.2-use-case-diagram-–-customer)
```

---

## A5. Sửa "Xem thôn tin" → "Xem thông tin" [Người 2]

**Tìm (dòng 752):**
```
* UC-C01: Xem thôn tin gian hàng
```
**Thay bằng:**
```
* UC-C01: Xem thông tin gian hàng
```

---

## A6. Xóa ghi chú thô [Người 1]

**Xóa dòng 298:**
```
PHÂN NÀY PHÂN TÍCH VỀ CẤU TRÚC THƯ MỤC
```

**Xóa dòng 816:**
```
XEM LẠI CẤU TRÚC THƯ MỤC
```

---

## E8. Fix sơ đồ hạ tầng (4.1.4) [Người 1]

**Tìm (dòng 825-826):** Bảng table bị vỡ format

**Thay toàn bộ bảng bằng:**

```
┌─────────────────────────────────────────────┐
│         Trình duyệt (Client)               │
│  Next.js Frontend                           │
│  (React, Tailwind, Leaflet, i18n)           │
│  Port: 3000                                 │
└────────────┬──────────────────┬─────────────┘
             │ REST API (Axios) │ WebSocket
┌────────────▼──────────────────▼─────────────┐
│         NestJS Backend API                  │
│         Port: 3001, Prefix: /api            │
│  Auth   Stores   Map   Commentary           │
│  Module Module  Module  Module              │
│         TypeORM (Data Access Layer)         │
└──────┬──────────────┬─────────────┬─────────┘
       │              │             │
  PostgreSQL 15   Redis 7      MinIO (S3)
  + PostGIS 3.4   Port: 6379   Port: 9000
  Port: 5432      BullMQ       Console: 9001
```

---

## J1. Sửa tên dự án [Người 2]

**Tìm (dòng 818):**
```
seminar-v2/
```
**Thay bằng:**
```
seminar-street-food/
```

---

## J2. Sửa mô tả "AI tạo audio" [Người 1]

**Tìm (dòng 391):**
```
* **Tổng hợp giọng nói *(Text-to-Speech)*** để tạo audio thuyết minh
```
**Thay bằng:**
```
* **Tổng hợp giọng nói *(Text-to-Speech)*** — hệ thống sử dụng Web Speech API của trình duyệt để đọc nội dung thuyết minh thành giọng nói, hỗ trợ 7 ngôn ngữ
```

**Tìm (dòng 394):**
```
Theo nghiệp vụ hệ thống, Store Owner nhập nội dung thuyết minh bằng tiếng Việt, sau đó AI sẽ tự động dịch và tạo audio tương ứng với ngôn ngữ của khách hàng .
```
**Thay bằng:**
```
Store Owner nhập nội dung thuyết minh bằng tiếng Việt, sau đó AI (Google Gemini) tự động dịch sang 6 ngôn ngữ. Phần phát audio do Web Speech API của trình duyệt xử lý phía client.
```

**Tìm (dòng 414):**
```
* AI → tạo audio
```
**Thay bằng:**
```
* AI → dịch nội dung sang đa ngôn ngữ
* Web Speech API → phát audio phía trình duyệt
```

---

## A7 + J3. Bổ sung hình Sequence Diagram Admin [Người 2]

**Vị trí cần chèn hình (dòng 719-723):**

Sau caption `***Hình 3.25:** Sequence Diagram – Quy trình duyệt tài khoản Store Owner (UC-A01).*` → chèn hình

Sau caption `***Hình 3.26:** ...` → chèn hình

Sau caption `***Hình 3.27:** ...` → chèn hình

*Cần vẽ 3 Sequence Diagram này rồi chèn ảnh vào.*

---

## A8. Bổ sung hình Activity Diagram UC-C03 [Người 2]

**Vị trí (dòng 682):**
```
***Hình 3.20:** Activity Diagram – Quy trình nhận gợi ý món ăn (UC-C03).*
```

Hiện chỉ có caption, thiếu `![][imageXX]` trước caption.

*Cần vẽ Activity Diagram cho UC-C03 rồi chèn ảnh.*

---

## J4. Cập nhật số lượng Activity Diagram [Người 2]

Nếu thêm UC-C06 (Chuyển đổi ngôn ngữ):

**Tìm (dòng 487):**
```
| Activity Diagram | 21 | Mô tả luồng xử lý chi tiết |
```
**Thay bằng:**
```
| Activity Diagram | 22 | Mô tả luồng xử lý chi tiết |
```

**Tìm (dòng 659):**
```
Bao gồm 7 sơ đồ:
```
**Thay bằng:**
```
Bao gồm 8 sơ đồ:
```

Và thêm vào danh sách:
```
* UC-C06: Chuyển đổi ngôn ngữ
```

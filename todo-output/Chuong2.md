# Chương 2 — Nội dung cần bổ sung

> **Tasks:** C1 (công nghệ phát triển), C2 (TTS), C3 (Gemini AI), C4 (i18next), I4 (PostGIS)
> **Người phụ trách:** C1, C3, I4 → Người 2 | C2, C4 → Người 1

---

## C1. Bổ sung mục 2.9 — Công nghệ phát triển

> **Vị trí:** Chèn sau mục 2.8 (Tổng kết chương), trước Chương 3.
> Cập nhật lại 2.8 để bao gồm mục 2.9.

## **2.9 Công nghệ phát triển** {#2.9-công-nghệ-phát-triển}

Hệ thống sử dụng nhiều công nghệ hiện đại, được lựa chọn dựa trên yêu cầu về hiệu suất, khả năng mở rộng và tính phù hợp với bài toán. Bảng dưới đây tổng hợp các công nghệ chính:

| Công nghệ | Vai trò | Phiên bản |
| :--- | :--- | :--- |
| NestJS | Backend framework, xây dựng REST API theo kiến trúc module | 10.x |
| Next.js | Frontend framework, hỗ trợ Server-Side Rendering (SSR) và App Router | 14.x |
| TypeScript | Ngôn ngữ lập trình chính cho toàn bộ dự án (backend + frontend) | 5.x |
| TypeORM | ORM cho PostgreSQL, quản lý entity và database migrations | — |
| PostgreSQL + PostGIS | Cơ sở dữ liệu quan hệ, mở rộng PostGIS cho dữ liệu không gian địa lý | 15 + 3.4 |
| Redis | Hàng đợi công việc bất đồng bộ thông qua BullMQ | 7 |
| MinIO | Lưu trữ file tĩnh (ảnh, audio), tương thích giao thức S3 | — |
| Docker | Container hóa hạ tầng phát triển (PostgreSQL, Redis, MinIO) | — |
| Turborepo | Quản lý và chạy đồng thời nhiều dự án trong monorepo | — |
| Socket.IO | Giao tiếp thời gian thực qua WebSocket | — |
| BullMQ | Job queue bất đồng bộ cho pipeline dịch thuật và gửi email | — |
| Leaflet | Thư viện bản đồ tương tác cho frontend | — |
| Tailwind CSS | Utility-first CSS framework cho giao diện | — |
| i18next + react-i18next | Framework đa ngôn ngữ cho frontend | — |
| TanStack React Query | Quản lý server state, caching và đồng bộ dữ liệu API | v5 |
| Google Gemini AI | Dịch nội dung thuyết minh đa ngôn ngữ (primary provider) | gemini-flash |
| Web Speech API | Tổng hợp giọng nói phía trình duyệt (Text-to-Speech) | — |

**NestJS** được chọn làm backend framework vì kiến trúc module rõ ràng, hỗ trợ dependency injection và tích hợp tốt với TypeORM, BullMQ, Socket.IO. Mỗi nghiệp vụ được tổ chức thành một module riêng biệt, giúp dễ dàng mở rộng và bảo trì.

**Next.js 14 App Router** cung cấp khả năng rendering linh hoạt (SSR cho SEO, CSR cho tương tác), route grouping cho phân quyền, và middleware bảo vệ route tự động.

**Turborepo** kết hợp **npm workspaces** cho phép quản lý backend, frontend và gói shared types trong một repository duy nhất, đảm bảo đồng bộ API contract giữa các thành phần.

---

## C2. Bổ sung nội dung TTS vào mục 2.4

> **Vị trí:** Thay thế nội dung mục 2.4.2 (dòng 386-394 Seminar.md)

### **2.4.2 Ứng dụng trong hệ thống** {#2.4.2-ứng-dụng-trong-hệ-thống}

AI được sử dụng trong hệ thống cho hai nhiệm vụ chính:

**a) Dịch nội dung đa ngôn ngữ:**

Hệ thống sử dụng **Google Gemini AI** (model `gemini-flash-latest`) làm dịch vụ dịch thuật chính. Store Owner nhập nội dung thuyết minh bằng tiếng Việt, sau đó hệ thống tự động dịch sang 6 ngôn ngữ: Anh, Pháp, Trung, Nhật, Hàn, Thái. Trong trường hợp Gemini API gặp sự cố, hệ thống chuyển sang **MyMemory API** làm dịch vụ dự phòng.

**b) Tổng hợp giọng nói (Text-to-Speech):**

Hệ thống sử dụng **Web Speech API** — một API tích hợp sẵn trong trình duyệt hiện đại — để đọc nội dung thuyết minh thành giọng nói. Cơ chế hoạt động thông qua đối tượng `SpeechSynthesisUtterance`, cho phép cấu hình ngôn ngữ, tốc độ đọc và cao độ giọng nói.

Chiến lược audio của hệ thống theo mô hình **dual audio**:
1. Ưu tiên phát file audio từ server (nếu có) — đảm bảo chất lượng cao
2. Nếu không có file audio → fallback sang Web Speech API của trình duyệt

**Ưu điểm Web Speech API:** Miễn phí, không cần API key, hỗ trợ nhiều ngôn ngữ.

**Hạn chế:** Chất lượng giọng nói phụ thuộc vào trình duyệt và hệ điều hành, một số ngôn ngữ có thể không khả dụng trên mọi thiết bị.

---

## C3. Bổ sung mô tả Google Gemini AI

> **Vị trí:** Thêm mục 2.4.4 sau mục 2.4.3

### **2.4.4 Google Gemini AI trong dịch thuật** {#2.4.4-google-gemini-ai-trong-dịch-thuật}

**Google Gemini** là mô hình ngôn ngữ lớn (Large Language Model) do Google phát triển, có khả năng hiểu và sinh văn bản đa ngôn ngữ với chất lượng cao. Trong hệ thống, Gemini được sử dụng qua thư viện `@google/generative-ai` với model `gemini-flash-latest` — phiên bản tối ưu cho tốc độ phản hồi.

**Cơ chế dịch thuật:**

Hệ thống gửi prompt dạng: *"Translate the following Vietnamese text to [tên ngôn ngữ đích]. Return ONLY the translated text, no explanations, no quotes."* kèm nội dung cần dịch. Prompt được thiết kế để nhận kết quả thuần văn bản dịch, tránh các giải thích hoặc ký tự thừa.

**Chiến lược dual provider:**

| Vai trò | Dịch vụ | Ghi chú |
| :--- | :--- | :--- |
| Primary | Google Gemini AI | Chất lượng cao, cần API key (`GEMINI_API_KEY`) |
| Fallback | MyMemory API | Miễn phí, không cần API key, dùng khi Gemini lỗi |

Khi Gemini API trả về lỗi (rate limit, network timeout), hệ thống tự động chuyển sang MyMemory API. Nếu cả hai đều thất bại cho một ngôn ngữ, hệ thống bỏ qua ngôn ngữ đó và tiếp tục xử lý các ngôn ngữ còn lại.

---

## C4. Bổ sung mục 2.4.5 — Đa ngôn ngữ frontend (i18next)

> **Vị trí:** Thêm mục 2.4.5 sau mục 2.4.4

### **2.4.5 Hệ thống đa ngôn ngữ frontend** {#2.4.5-hệ-thống-đa-ngôn-ngữ-frontend}

Giao diện phía người dùng (Customer) hỗ trợ **7 ngôn ngữ** thông qua thư viện **i18next** kết hợp **react-i18next**:

| Mã | Ngôn ngữ | Speech Code (TTS) |
| :--- | :--- | :--- |
| vi | Tiếng Việt (mặc định) | vi-VN |
| en | English | en-US |
| fr | Français | fr-FR |
| zh | 中文 | zh-CN |
| ja | 日本語 | ja-JP |
| ko | 한국어 | ko-KR |
| th | ภาษาไทย | th-TH |

**Kiến trúc:**

Hệ thống sử dụng **Provider pattern** — `LanguageProvider` bọc toàn bộ ứng dụng, cung cấp `useLang()` hook cho mọi component con.

**Thứ tự phát hiện ngôn ngữ:**
1. Kiểm tra `localStorage` (key: `phat-lang`)
2. Nếu không có → đọc `navigator.language` của trình duyệt
3. Nếu không hợp lệ → mặc định `vi` (tiếng Việt)

**Chiến lược tải file locale:**
* Tiếng Việt + ngôn ngữ phát hiện ban đầu: tải sẵn (eager load)
* Các ngôn ngữ khác: tải theo yêu cầu (lazy load) khi người dùng chuyển đổi
* Fallback: nếu thiếu key dịch → hiển thị tiếng Việt

Ngôn ngữ được lưu vào cả `localStorage` và cookie (`phat_lang`, thời hạn 365 ngày) để server-side có thể đọc khi cần.

---

## I4. Bổ sung nội dung PostGIS vào mục 2.2

> **Vị trí:** Thêm mục 2.2.4 sau mục 2.2.3

### **2.2.4 PostGIS — Mở rộng dữ liệu không gian cho PostgreSQL** {#2.2.4-postgis}

**PostGIS** là extension của PostgreSQL, bổ sung các kiểu dữ liệu và hàm xử lý không gian địa lý (geospatial). Trong hệ thống, PostGIS được sử dụng cho các mục đích:

* **Lưu trữ tọa độ gian hàng:** Mỗi location pin có cột `pin_geom` kiểu `GEOMETRY(Point, 4326)`, được tự động tạo từ cặp tọa độ `lat/lng`.

* **Kiểm tra ranh giới phố ẩm thực:** Sử dụng hàm `ST_Within(pin_geom, boundary_geom)` để xác minh ghim vị trí nằm trong vùng ranh giới phố ẩm thực đã định nghĩa. Nếu ngoài ranh giới, hệ thống từ chối ghim.

* **Phát hiện ghim trùng lặp:** Sử dụng hàm `ST_DWithin(pin1_geom, pin2_geom, distance)` để tìm các ghim gần nhau trong bán kính cho phép, tránh việc nhiều gian hàng ghim cùng một vị trí.

* **Ranh giới phố ẩm thực:** Bảng `food_street_boundaries` lưu polygon dạng `GEOMETRY(Polygon, 4326)`, được Admin quản lý và hiển thị trên bản đồ frontend dưới dạng vùng tô màu.

---

## Cập nhật mục 2.8 — Tổng kết chương

> **Vị trí:** Thay thế nội dung mục 2.8 (dòng 472-474 Seminar.md)

## **2.8 Tổng kết chương** {#2.8-tổng-kết-chương}

Chương này đã trình bày các cơ sở lý thuyết liên quan đến hệ thống, bao gồm: hệ thống web, công nghệ GPS và PostGIS, QR Code, AI (Google Gemini AI, Web Speech API), hệ thống đa ngôn ngữ (i18next), hệ thống thuyết minh tự động, mô hình Use Case, Business Rules và các công nghệ phát triển chính. Đây là nền tảng để tiến hành phân tích và thiết kế hệ thống trong các chương tiếp theo.

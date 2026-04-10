Store owner tạo commentary (tiếng Việt)
        ↓
BullMQ job → CommentaryProcessor
        ↓
[vi] Lưu sourceText trực tiếp (không dịch)
[en,fr,zh,ja,ko,th] Gọi Gemini API (gemini-flash-latest) → dịch → lưu DB
        ↓ (delay 1.5s giữa mỗi ngôn ngữ, skip nếu đã có)
pipeline_status = completed
        ↓
Frontend: CommentaryPlayer đọc lang từ LanguageContext
        → fetch /stores/{id}/commentary?lang={lang}
        → Backend trả translatedText theo ngôn ngữ (fallback về vi nếu chưa có)
        → Web Speech API đọc text với speechCode đúng (vi-VN, en-US, zh-CN...)

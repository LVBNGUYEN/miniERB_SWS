# Báo cáo Chi tiết Thay đổi & Tính năng (DocxChange.md)
**Cập nhật lần 2: Nhánh Nguyen** (So với nhánh `main`)

Báo cáo này liệt kê chi tiết các hiện thực hóa kỹ thuật và trải nghiệm người dùng đã được phát triển trong nhánh **Nguyen**.

---

## 1. AMIT AI Copilot: Hệ thống Trợ lý Chiến lược
Hệ thống này đã được hiện thực hóa từ giao diện tĩnh thành một bộ máy phân tích dữ liệu động:

### 🔹 Backend AI Engine (`src/modules/ai-engine`)
- **Controller & Service**: Tạo API Endpoint `/ai-engine/chat` được bảo vệ bởi **JwtAuthGuard** và phân quyền **RolesGuard**.
- **Mocked Intelligent Engine**: AI có khả năng phân tích chuỗi văn bản và trả về thông tin chuyên sâu:
    - **Tài chính**: Trả về dữ liệu dòng tiền (3.2 tỷ VND), tăng trưởng (8.1%) và rủi ro chi phí R&D.
    - **Tiến độ Dự án**: Tự động tính toán ngày hoàn thành dựa trên khối lượng công việc (hiện tại là 72.5%).
    - **Nhật Bản & Nguồn lực**: Đề xuất luân chuyển 3 kỹ sư từ VN sang Tokyo cho quy trình Go-live.
    - **Nhân sự**: Cảnh báo tình trạng "Overclock" (quá tải) của đội kỹ thuật (vượt 15%).

### 🔹 Frontend Interface (`AICopilotDashboard.tsx`)
- **Chat Interactivity**: Người dùng có thể nhập lệnh chat hoặc nhấn vào các nút gợi ý có sẵn.
- **Scrolling logic**: Sử dụng `useRef` và `useEffect` để màn hình tự động trượt xuống khi AI trả lời.
- **Typing Indicator**: Hiển thị trạng thái phân tích dữ liệu thực tế giúp tăng trải nghiệm người dùng.

---

## 2. Luồng Khởi tạo Dự án theo Vai trò (Role-Based Project Creation)
Điều chỉnh quy trình từ phía Sale đến PM để đảm bảo tính nhất quán của dữ liệu:

- **Sale & Admin (CEO)**: 
    - Giữ quyền tạo mới dự án từ đầu (Project creation source). 
    - Modal hiển thị đầy đủ các trường: Tên dự án, Khách hàng, Xác suất, Chủ nhiệm dự án và Giờ dự kiến.
- **Project Manager (PM)**:
    - **Nút bấm**: Chuyển nhãn nút từ "Dự án mới" thành **"Khởi tạo thông số"**.
    - **Quy trình**: PM chỉ được phép chọn các dự án đã được Sale khởi tạo (Dropdown chọn dự án có sẵn).
    - **Giới hạn trường**: Ẩn các trường không thuộc trách nhiệm của PM như **Xác suất (%)** và **Chọn PM** (vì họ chính là PM). 
    - **Trọng tâm**: Chỉ tập trung vào việc ước lượng **Giờ dự kiến**.

---

## 3. Hệ thống Cảnh báo Ngân sách Nhân sự
Tích hợp quy trình giám sát chi phí nhân sự thông minh:

- **Cơ chế Tự động (80% threshold)**:
    - Backend tự động tính toán tỷ lệ `Giờ chấm công / Giờ dự kiến`.
    - Khi đạt ngưỡng 80%, hệ thống tự tạo một bản ghi `SysAlert` và gỡ tag `isAlerted80` trong database để thông báo cho PM.
- **Cơ chế Thủ công (Manual Alert)**:
    - **Executive Dashboard**: Sale/CEO khi xem danh sách dự án, nếu di chuột qua tên dự án sẽ hiện nút **"Cảnh báo PM"** (Triangle Icon).
    - Khi nhấn nút, hệ thống sẽ gọi API `/alerts/:projectId/manual-alert` để gửi thông báo trực tiếp đến PM của dự án đó.
- **Giao diện**: Dự án có rủi ro sẽ hiển thị label **"Auto: Ngân sách > 80%"** màu đỏ ngay cạnh tên dự án.

---

## 4. Tùy biến Dashboard Chấm công cho PM
Đáp ứng yêu cầu nghiêm ngặt về thuật ngữ và quyền quản trị:

- **Loại bỏ "Rà soát ngay"**: Trong Dashboard Chấm công của PM, nút nút "Rà soát ngay" màu trắng đã được gỡ bỏ hoàn toàn.
- **Softened Message**: Thay đổi câu văn cảnh báo đỏ từ "Cần rà soát ngay..." thành **"Cần theo dõi sát sao các hoạt động chấm công..."** để phù hợp hơn với vị thế của PM khi xem dữ liệu riêng tư.

---

## 5. Chính sách Toàn vẹn Dữ liệu (Soft Delete)
Đảm bảo an toàn dữ liệu tập đoàn:

- **Cấm Hard Delete**: Toàn bộ codebase đã được kiểm duyệt, không có lệnh `DELETE`.
- **AbstractBase**: Sử dụng `AbstractEntity` làm gốc cho 100% Entities, tích hợp sẵn `@DeleteDateColumn` (deletedAt).
- **Query Filter**: Hệ thống tự động lọc bỏ các dữ liệu có `deletedAt` khi truy vấn (nhờ cơ chế Soft Delete của TypeORM).

---

## 6. Git & Cấu trúc Mã nguồn
- **Ngăn chặn rò rỉ mã nguồn**: Loại bỏ thư mục `test/` (E2E tests) khỏi remote repository nhánh `Nguyen`.
- **Gitignore tối ưu**: Bổ sung chặn các thư mục build (`dist`), thư viện (`node_modules`) ở mọi cấp độ thư mục.
- **Build Clean**: Đã sửa lỗi logic trong spec file để hệ thống backend có thể biên dịch 100% không lỗi.

---
**Nhóm phát triển:** Antigravity AI Engine  
**Cập nhật lần cuối:** 23/03/2026

# Báo cáo Phân tích Kỹ thuật & Luồng Dữ liệu (DocxChange.md)
**Cập nhật lần 3: Nhánh Nguyen** (So với nhánh `main`)

Báo cáo này tập trung vào cấu trúc API, Logic nghiệp vụ và Luồng dữ liệu xuyên suốt từ Database lên giao diện người dùng (UI/UX).

---

## 1. Luồng Dữ liệu Hệ thống (End-to-End Data Flow)
Toàn bộ dữ liệu trong nhánh **Nguyen** được thiết kế để đi theo luồng khép kín:

### 🔄 Luồng truy xuất:
1.  **Database Layer (SQLite/PostgreSQL)**: Dữ liệu thực thể (User, Project, Task, Timesheet) được lưu trữ bền vững.
2.  **Entity Layer (TypeORM)**: Định nghĩa cấu trúc bảng thông qua `AbstractEntity`. Cơ chế **Soft Delete** tự động ẩn các bản ghi có `deletedAt != null`.
3.  **Repository Layer**: Sử dụng `TypeORM Repository` để thực hiện các truy vấn SQL phức tạp (Join, Filter, Order).
4.  **Service Layer (Business Logic)**: Xử lý nghiệp vụ (ví dụ: Tính toán % ngân sách vượt ngưỡng, lọc PM cho dự án).
5.  **Controller Layer (REST API)**: Xuất dữ liệu qua JSON. Bảo mật bằng `@UseGuards(JwtAuthGuard, RolesGuard)`.
6.  **Frontend API Utils (`api/index.ts`)**: Sử dụng `fetch` bọc trong các hàm `post`, `get`, `patch` để đính kèm Token bảo mật tự động.
7.  **React State (UI Layer)**: Dữ liệu được `fetch` và lưu vào `useState`. Các Component (`FinanceDashboard`, `ProjectDashboard`) sẽ Mapping dữ liệu này lên UI.

---

## 2. API Logic & Hiện thực hóa Kỹ thuật
Bổ sung các logic xử lý thông minh tại Backend:

### 🧠 Logic AI Engine API (`/ai-engine/chat`)
- **Input Phân tích**: Nhận `query` từ người dùng.
- **Logic Phân loại**: Service sử dụng Regex mapping để phân loại yêu cầu (Finance, Project, Resource).
- **Trích xuất dữ liệu**: Mẫu dữ liệu trả về không chỉ là văn bản mà còn là **Layout định dạng** (ví dụ: `finance` layout để hiển thị bảng số liệu tài chính chuyên sâu).

### 🔔 Manual Alert API (`/alerts/:projectId/manual-alert`)
- **Nghiệp vụ**: Khi Sale/CEO nhấn nút "Cảnh báo", Controller sẽ nhận `projectId`, ghi nhận vào bảng `sys_alerts` và đánh dấu dự án đó đang trong tình trạng cần chú ý.
- **Push Notification**: Trạng thái này được đồng bộ để khi PM đăng nhập, họ sẽ thấy cảnh báo đỏ ngay trên Dashboard cá nhân.

---

## 3. Thay đổi UI/UX & Tương tác Người dùng
Các cải tiến giúp giao diện trở nên "sống" và chuyên nghiệp hơn:

### 🎨 Chuyển đổi từ Tĩnh sang Động
- **Dashboard Tài chính/Dự án**: Thay thế dữ liệu Mock cứng bằng việc gọi `api.post('/projects/list', {})`. Dữ liệu về `totalAmount`, `estimatedHours` được lấy trực tiếp từ bảng `prj_projects`.
- **Dynamic Project Creation Modal**: 
    - **Logic hiển thị**: Sử dụng `role = getCookie('user_role')` để ẩn các field nhạy cảm (`probability`, `assignPM`).
    - **Logic Mapping**: Danh sách Dự án trong Dropdown được lấy từ `API listProjects` thay vì nhập tay.

### ⚡ React Interaction
- **Auto-scroll Logic**: Trong AI Copilot, khi tin nhắn mới được thêm vào mảng `messages`, `useEffect` sẽ kích hoạt `scrollIntoView({ behavior: 'smooth' })` để trải nghiệm mượt mà.
- **Role-based Styling**: Sử dụng màu sắc và icon khác nhau cho từng loại tin nhắn (User vs AI) và từng loại Cảnh báo (Auto vs Manual).

---

## 4. Bảo mật & Tính toàn vẹn
- **JWT Encryption**: Toàn bộ API đều yêu cầu Access Token hợp lệ.
- **Soft Delete Enforcement**:
    - **Logic**: Khi "xóa", hệ thống thực hiện `repository.softDelete(id)`. 
    - **Kết quả**: Bản ghi vẫn tồn tại trong DB cho mục đích đối soát nhưng biến mất hoàn toàn trên UI người dùng.
- **Vite Proxy Tunneling**: Đồng bộ hóa cổng `5173` (Vite) và `3000` (NestJS) để giải quyết lỗi CORS (Cross-Origin Resource Sharing).

---
**Chịu trách nhiệm:** Antigravity AI Engine (Google Deepmind Team)  
**Phiên bản Báo cáo:** 1.2 (Chi tiết Kỹ thuật)

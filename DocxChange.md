# Báo cáo Thay đổi Dự án (DocxChange.md)
**Nhánh: Nguyen** (So với nhánh `main`)

Báo cáo này liệt kê các thay đổi quan trọng và tính năng mới đã được hiện thực hóa trong nhánh **Nguyen**.

## 1. Hệ thống AI Copilot & AI Engine
- **Backend AI Engine**: Xây dựng module `ai-engine` hoàn chỉnh với `Controller`, `Service` và `Module`.
- **Cơ chế suy luận**: Hiện thực hóa bộ máy phân tích dữ liệu giả lập cho phép AI hiểu về sức khỏe tài chính tập đoàn, tiến độ dự án SkyLine ERP và đề xuất nguồn lực Nhật Bản.
- **Giao diện Chat**: Hoàn thiện UI/UX của AMIT AI Copilot với tính năng chat tương tác thời gian thực, tự động cuộn (auto-scroll) và trạng thái đang phân tích (typing state).
- **Vite Proxy**: Cấu hình proxy cho phép Frontend kết nối thông suốt với Backend AI Engine (`/ai-engine/chat`).

## 2. Quản lý Dự án & Phân quyền (Role-Based Access)
- **Luồng khởi tạo dự án**: 
    - Giới hạn quyền tạo dự án mới cho **Sale và Admin (CEO)**.
    - **Project Manager (PM)**: Chỉ được phép chọn dự án có sẵn và khởi tạo thông số (Giờ dự kiến), không được thay đổi xác suất hay tạo dự án mới từ đầu.
- **Tùy biến Modal**: Tự động thay đổi các trường dữ liệu hiển thị dựa trên vai trò người dùng (PM vs Sale/Admin).

## 3. Hệ thống Cảnh báo Ngân sách (Budget Alerting)
- **Cảnh báo tự động**: Hệ thống tự động đẩy thông báo PM khi dự án vượt ngưỡng 80% ngân sách nhân sự.
- **Cảnh báo thủ công**: Cung cấp tính năng cho Sale/CEO nhấn nút "Cảnh báo PM" thủ công trực tiếp từ Executive Dashboard.
- **Cập nhật Dashboard**: Hiển thị nhãn "Auto: Ngân sách > 80%" trên danh sách dự án khi có rủi ro trượt ngân sách.

## 4. Cải tiến UI/UX Timesheet
- **PM Interface**: Loại bỏ nút "Rà soát ngay" đối với vai trò PM trong Dashboard Chấm công theo yêu cầu (nghiêm cấm chữ rà soát ngay xuất hiện ở PM).
- **Thông điệp thông minh**: Chuyển nội dung cảnh báo từ dạng "nhắc nhở rà soát" sang dạng "theo dõi sát sao" đối với PM.

## 5. Kiến trúc & Bảo mật
- **Soft Delete Policy**: Đảm bảo toàn bộ dự án tuân thủ nghiêm ngặt chính sách xóa mềm. Không sử dụng `hard delete`, sử dụng `@DeleteDateColumn` thông qua `AbstractEntity`.
- **Git & GitHub**: 
    - Cấu hình `.gitignore` chuẩn hóa để loại bỏ `node_modules`, `dist` và các file rác.
    - Gỡ bỏ hoàn toàn thư mục `test/` khỏi bộ chỉ mục Git (`git rm --cached`) để bảo mật mã nguồn kiểm thử nội bộ.

## 6. Sửa lỗi & Đảm bảo Ổn định
- **Fix Build**: Sửa các lỗi Lint liên quan đến `Role.USER` trong file `iam.controller.spec.ts` để dự án có thể build thành công.
- **Proxy Sync**: Cập nhật `vite.config.ts` để đồng bộ toàn bộ các cổng API.

---
**Người thực hiện:** Antigravity (Google Assistant)  
**Ngày cập nhật:** 23/03/2026

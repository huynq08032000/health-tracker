<!-- # VAI TRÒ & NHIỆM VỤ
Bạn là một Kiến trúc sư Phần mềm (Software Architect) cao cấp. Nhiệm vụ của bạn là phân tích toàn bộ cấu trúc thư mục và mã nguồn hiện tại của dự án này, sau đó lập ra một tài liệu hướng dẫn (Architecture Guideline) dưới dạng Markdown (.md). 

Tài liệu này phải cực kỳ chi tiết, đóng vai trò như một "bản đồ quy chuẩn" để khi tôi muốn thêm bất kỳ một tính năng (feature) mới nào, tôi chỉ cần nhìn vào tài liệu này là biết chính xác phải tạo file ở đâu, viết code theo pattern nào.

# BỐI CẢNH DỰ ÁN
- Ngôn ngữ & Framework chính: [Ví dụ: React + TypeScript + Vite / NestJS / Flutter]
- State Management / Database (nếu có): [Ví dụ: Redux Toolkit / Prisma]
- Mô hình kiến trúc đang áp dụng: [Ví dụ: Clean Architecture, MVC, Feature-based folder structure, Layered Architecture...]

# YÊU CẦU ĐẦU RA (Tạo file `ARCHITECTURE_GUIDE.md`)
Hãy phân tích code hiện tại và viết ra file `ARCHITECTURE_GUIDE.md` theo cấu trúc chính xác sau:

## 1. Tổng Quan Cấu Trúc Thư Mục (Folder Structure)
- Vẽ sơ đồ cây thư mục rút gọn của các thư mục quan trọng (như `src/`, `components/`, `services/`, `modules/`, etc.).
- Giải thích ngắn gọn nhiệm vụ của từng thư mục/file core.

## 2. Luồng Đi Của Dữ Liệu (Data Flow & Pattern)
- Giải thích một request/data đi từ đâu đến đâu. (Ví dụ: UI Component -> Action -> Reducer/API -> Store -> UI).
- Chỉ ra các Design Pattern hoặc Coding Convention nổi bật đang được viết trong dự án hiện tại (ví dụ: Dependency Injection, Repository Pattern, Custom Hooks...).

## 3. Quy Trình 5 Bước Để Thêm 1 Tính Năng Mới (Feature Implementation Flow)
Đây là phần quan trọng nhất. Hãy chỉ ra từng bước cụ thể mà tôi cần làm khi có một Feature mới tên là `[NewFeature]`. Hãy viết dưới dạng "Step-by-Step":
- **Bước 1 (Định nghĩa kiểu dữ liệu/Model):** Cần tạo/sửa file nào? Ở đâu? (Ví dụ: `src/types/[new-feature].types.ts`)
- **Bước 2 (Xử lý Logic/API):** Viết service/api gọi dữ liệu ở đâu? File mẫu trông ra sao?
- **Bước 3 (Quản lý trạng thái - State/Store - nếu có):** Thêm action/reducer ở file nào?
- **Bước 4 (Giao diện - UI Component):** Đặt component ở đâu? Chia component cha/con thế nào để đúng cấu trúc dự án?
- **Bước 5 (Khai báo/Routing):** Đăng ký route hoặc export tính năng này ra bên ngoài ở file index/routing nào?

## 4. Code Template Mẫu (Boilerplate)
Cung cấp các đoạn code mẫu (skeleton code) trống nhưng đúng chuẩn import/export của dự án này cho:
- 1 file Component mẫu.
- 1 file Service/API mẫu.
- 1 file Type/Interface mẫu.

## 5. Các Quy Tắc Bắt Buộc (Do's and Don'ts)
- Những điều BẮT BUỘC phải làm (ví dụ: Luôn dùng TypeScript strict, luôn viết unit test bên cạnh file code, luôn import bằng absolute path `@/...`).
- Những điều CẤM làm (ví dụ: Không viết inline style, không gọi API trực tiếp trong Component...). -->
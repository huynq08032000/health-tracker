# Backend Rules (Express + TypeScript + SQLite)

## Kiến trúc theo module (giống trên `00-project-overview.md`)
Mỗi domain/module gồm các layer tách biệt, luồng gọi 1 chiều:

```
routes → controller → service → repository → database
```

- **routes:** chỉ khai báo path + middleware + gọi controller, không chứa logic.
- **controller:** nhận request, validate input (qua middleware/schema), gọi service, trả response. Không chứa business logic hay truy vấn DB trực tiếp.
- **service:** chứa toàn bộ business logic, gọi repository để lấy/ghi dữ liệu.
- **repository:** duy nhất nơi thao tác trực tiếp với SQLite (qua Prisma hoặc better-sqlite3). Không import repository của module khác trực tiếp — nếu cần dữ liệu module khác, gọi qua service của module đó.

## Database (SQLite)
- Mọi thay đổi schema phải đi qua migration, không sửa tay file `.sqlite` hoặc chỉnh schema production trực tiếp.
- Đặt tên bảng: snake_case, số nhiều (`users`, `order_items`).
- Đặt tên cột: snake_case.
- Luôn có `id`, `created_at`, `updated_at` cho các bảng chính.
- Query phức tạp/lặp lại nhiều nơi nên viết thành hàm riêng trong repository, không copy câu query.
- SQLite không mạnh về concurrent write — tránh thiết kế tính năng cần ghi đồng thời khối lượng lớn; nếu cần, dùng transaction rõ ràng.

## API design
- REST theo chuẩn: `GET /users`, `GET /users/:id`, `POST /users`, `PATCH /users/:id`, `DELETE /users/:id`.
- Response format thống nhất, ví dụ:
```json
{ "success": true, "data": {}, "message": "" }
```
và khi lỗi:
```json
{ "success": false, "message": "", "errors": [] }
```
- Validate toàn bộ input (body/query/params) bằng zod (hoặc thư viện đã chọn) trước khi vào controller/service — schema đặt ở `packages/shared` nếu FE cũng cần dùng lại.
- Versioning API nếu cần thay đổi breaking: `/api/v1/...`.

## Bảo mật
- Không log thông tin nhạy cảm (password, token) ra console/log file.
- Luôn hash password (bcrypt/argon2), không lưu plaintext.
- Dùng middleware `helmet`, giới hạn CORS theo domain FE thực tế, rate-limit cho các route nhạy cảm (login, register).
- Input luôn được coi là không tin cậy — validate/sanitize trước khi dùng trong query.

## Xử lý lỗi & logging
- Middleware xử lý lỗi tập trung ở cuối chain, mọi lỗi (kể cả lỗi bất ngờ) đều đi qua đây để trả response nhất quán.
- Dùng logger có cấu trúc (pino/winston) thay vì `console.log` trong code production.

## Environment
- Toàn bộ config nhạy cảm/biến môi trường qua `.env`, có file `.env.example` liệt kê đầy đủ key (không kèm giá trị thật).
- Không commit file `.env` thật.

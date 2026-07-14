# Coding Conventions (chung cho FE & BE)

## TypeScript
- Bật `strict: true`. Không dùng `any` trừ khi bất khả kháng — nếu bắt buộc dùng, phải comment giải thích lý do.
- Luôn khai báo type cho tham số hàm và giá trị trả về của function public/export.
- Ưu tiên `type` cho object shape đơn giản, `interface` khi cần extend/merge.
- Không dùng `enum` của TS trừ khi thực sự cần — ưu tiên `as const` + union type.
- Import type riêng bằng `import type { Foo } from '...'` để tách biệt type-only import.

## Đặt tên
- **File:** kebab-case (`user-profile.service.ts`), Component React: PascalCase (`UserProfile.tsx`)
- **Biến, hàm:** camelCase
- **Class, Type, Interface, Component:** PascalCase
- **Hằng số toàn cục:** UPPER_SNAKE_CASE
- **Boolean:** tiền tố `is`, `has`, `should` (`isLoading`, `hasError`)

## Cấu trúc code
- Mỗi file chỉ nên export 1 concept chính (1 component, 1 service, 1 hook...).
- Hàm nên ngắn, làm 1 việc; nếu function > ~40 dòng, cân nhắc tách nhỏ.
- Không để logic nghiệp vụ trong component/controller — đẩy xuống service/hook riêng.
- Không hardcode magic number/string — đưa vào file `constants`.

## Xử lý lỗi
- Không nuốt lỗi bằng `catch {}` rỗng.
- BE: dùng error class riêng (`AppError`, `NotFoundError`...) và middleware xử lý lỗi tập trung, không throw string.
- FE: hiển thị lỗi cho người dùng qua UI (toast/inline message), không chỉ `console.log`.

## Comment & tài liệu
- Comment giải thích **lý do** (why), không lặp lại thứ code đã nói (what).
- Function/service phức tạp nên có JSDoc ngắn gọn nêu mục đích, tham số, giá trị trả về.

## Linting & format
- Tuân thủ ESLint + Prettier config có sẵn trong repo; không tự ý sửa rule lint để né lỗi.
- Chạy lint/format trước khi coi task là hoàn thành.

## Testing
- Logic nghiệp vụ quan trọng (service, util, hook xử lý dữ liệu) nên có unit test đi kèm.
- Đặt test cạnh file gốc: `user.service.ts` → `user.service.test.ts`.

## Git & commit
- Message theo Conventional Commits: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`
- Mỗi commit là 1 thay đổi trọn vẹn, không gộp nhiều việc không liên quan.
- Không commit file `.env`, `node_modules`, file build (`dist/`, `build/`).

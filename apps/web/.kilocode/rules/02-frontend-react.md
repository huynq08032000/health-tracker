# Frontend Rules (React + Vite + TypeScript)

## Component
- Chỉ dùng function component + hooks, không dùng class component.
- Component trong `components/` phải "dumb" (chỉ nhận props, không gọi API trực tiếp); component trong `features/<feature>/components` có thể chứa logic gắn với feature đó.
- Props luôn định nghĩa qua `type XxxProps = {...}`, không dùng inline object type lặp lại nhiều nơi.
- Tách UI thuần và logic: logic phức tạp (gọi API, xử lý state) đưa vào custom hook riêng (`useXxx`), component chỉ gọi hook và render.

## State management
- State cục bộ: `useState`/`useReducer`.
- State dùng chung nhiều nơi: dùng store đã chọn cho project (zustand/redux) — đặt trong `store/`, chia theo domain (slice/store riêng cho từng feature).
- Server state (data từ API): ưu tiên dùng React Query / TanStack Query thay vì tự quản lý loading/error bằng `useState` thủ công.
- Không lưu trực tiếp dữ liệu server vào global store nếu có thể dùng React Query cache.

## Gọi API
- Tập trung config axios/fetch instance trong `lib/api-client.ts` (base URL, interceptor xử lý lỗi/token).
- Mỗi feature có file `api.ts` riêng chứa các hàm gọi API của feature đó, không gọi `fetch`/`axios` trực tiếp trong component.
- Request/response type lấy từ `packages/shared`, không định nghĩa lại type trùng lặp ở FE.

## Routing
- Định nghĩa route tập trung 1 chỗ (ví dụ `routes.tsx`), không rải `<Route>` khắp nơi.
- Lazy load các page lớn bằng `React.lazy` + `Suspense`.

## Styling
- Theo convention styling đã có sẵn trong repo (Tailwind / CSS Modules / styled-components) — không trộn nhiều cách styling khác nhau trong cùng 1 component nếu chưa được thống nhất.
- Không dùng inline style trừ style động phụ thuộc runtime value.
- Ant Design cho component phức tạp: Table, Form, Modal, DatePicker...

## Performance
- Dùng `React.memo`, `useMemo`, `useCallback` khi có bằng chứng re-render thừa gây vấn đề — không lạm dụng "tối ưu sớm" khi không cần thiết.
- List dài (> vài chục item) cân nhắc virtualization.

## Form & validation
- Dùng 1 thư viện form thống nhất (ví dụ react-hook-form) + schema validation (zod) — schema zod nên định nghĩa ở `packages/shared` nếu BE cũng cần validate cùng shape dữ liệu.

## Environment & config
- Biến môi trường FE phải có tiền tố `VITE_` và khai báo trong `.env.example`.
- Không hardcode URL API — lấy từ `import.meta.env`.

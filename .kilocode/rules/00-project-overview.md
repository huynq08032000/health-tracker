# Project Overview & Structure

## Tech stack
- **Ngôn ngữ:** TypeScript (dùng cho cả frontend lẫn backend, strict mode bật)
- **Frontend:** React 18 + Vite
- **Backend:** Express (TypeScript)
- **Database:** SQLite (qua Prisma ORM hoặc better-sqlite3 — chọn 1, không trộn lẫn 2 driver trong cùng project)
- **Cấu trúc:** Monorepo — client và server nằm chung 1 repo, quản lý bằng npm workspaces

## Cấu trúc thư mục gốc

```
project-root/
├── apps/
│   ├── web/                # React + Vite app
│   │   ├── src/
│   │   │   ├── assets/
│   │   │   ├── components/    # component dùng chung, không gắn logic nghiệp vụ
│   │   │   ├── features/      # mỗi feature 1 folder: components, hooks, api, types riêng
│   │   │   ├── hooks/         # custom hooks dùng chung toàn app
│   │   │   ├── layouts/
│   │   │   ├── lib/           # helper, config client (axios instance, query client...)
│   │   │   ├── pages/         # hoặc routes/ nếu dùng file-based routing
│   │   │   ├── store/         # state management (zustand/redux...)
│   │   │   ├── types/         # type dùng chung toàn app
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   │
│   └── api/                # Express app
│       ├── src/
│       │   ├── config/        # config env, db, logger...
│       │   ├── modules/       # mỗi module 1 domain: controller, service, route, dto, repository
│       │   │   └── <module>/
│       │   │       ├── <module>.controller.ts
│       │   │       ├── <module>.service.ts
│       │   │       ├── <module>.routes.ts
│       │   │       ├── <module>.repository.ts
│       │   │       └── <module>.types.ts
│       │   ├── middlewares/
│       │   ├── database/
│       │   │   ├── migrations/
│       │   │   ├── seeds/
│       │   │   └── schema.prisma  # nếu dùng Prisma
│       │   ├── utils/
│       │   ├── app.ts
│       │   └── server.ts
│       ├── tsconfig.json
│       └── .env.example
│
├── packages/
│   └── shared/                 # type, constant, schema validation dùng chung FE-BE
│       ├── src/
│       │   ├── types/
│       │   └── constants/
│       └── package.json
│
├── .kilocode/
│   └── rules/                  # các file rule này
├── package.json                 # root, khai báo workspaces
├── tsconfig.base.json
└── README.md
```

## Nguyên tắc chung khi Kilo code trong dự án này

1. Luôn đặt code vào đúng thư mục theo cấu trúc trên — **không** tạo file rải rác ở root.
2. Type/interface dùng chung giữa FE và BE phải đặt trong `packages/shared`, import qua alias `@shared/*`, không copy-paste type giữa 2 app.
3. Mỗi thay đổi về API (endpoint, request/response shape) phải đồng bộ cập nhật type trong `packages/shared`.
4. Không tự ý đổi cấu trúc thư mục gốc nếu không được yêu cầu; nếu thấy cấu trúc hiện tại của project khác với rule này, ưu tiên theo cấu trúc thực tế đã có sẵn trong repo.
5. Trước khi tạo file/module mới, kiểm tra xem đã có module/feature tương tự chưa để tái sử dụng thay vì tạo trùng.

# Architecture Guide - Health Tracker

> Tài liệu quy chuẩn phát triển dự án Health Tracker. Đọc kỹ trước khi thêm feature mới.

---

## 1. Tổng Quan Cấu Trúc Thư Mục

```
health-tracker/
├── apps/
│   ├── api/                     # Backend: Express + TypeScript + PostgreSQL (pg)
│   │   ├── src/
│   │   │   ├── app.ts           # Khởi tạo Express app, register middleware + routes
│   │   │   ├── index.ts         # Entrypoint: tạo app + listen port
│   │   │   ├── config/          # Cấu hình env, constants
│   │   │   ├── db/              # Database layer
│   │   │   │   ├── pg.ts        # Connection pool + query helpers (query/getOne/run/transaction)
│   │   │   │   ├── schema.sql   # SQL schema + seed
│   │   │   │   └── migrate.ts   # Migration runner
│   │   │   ├── middleware/      # Express middleware
│   │   │   │   ├── asyncHandler.ts   # Wrap async route handlers → catch errors
│   │   │   │   ├── auth.ts           # JWT/session auth middleware + helpers
│   │   │   │   ├── errorHandler.ts   # Centralized error formatting
│   │   │   │   ├── validate.ts       # Zod validation middleware
│   │   │   │   └── notFoundHandler.ts# 404 handler
│   │   │   ├── modules/         # Feature modules (MVC pattern)
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth.route.ts      # Route definitions
│   │   │   │   │   ├── auth.controller.ts # Request handlers
│   │   │   │   │   └── auth.service.ts    # Business logic + DB queries
│   │   │   │   ├── foodLogs/
│   │   │   │   │   ├── foodLogs.route.ts
│   │   │   │   │   ├── foodLogs.controller.ts
│   │   │   │   │   └── foodLogs.service.ts
│   │   │   │   ├── dailyLogs/
│   │   │   │   ├── foods/
│   │   │   │   ├── strava/
│   │   │   │   └── users/
│   │   │   └── utils/           # Shared backend utilities
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── .env.example
│   │
│   └── web/                     # Frontend: React + TypeScript + Vite
│       ├── src/
│       │   ├── main.tsx         # React entrypoint
│       │   ├── App.tsx          # Routing + Layout wrapping
│       │   ├── api/
│       │   │   └── client.ts    # Axios-like wrapper cho REST API (get/post/put/delete)
│       │   ├── pages/           # Page-level components (1 page = 1 file)
│       │   │   ├── DashboardPage.tsx
│       │   │   ├── FoodLogPage.tsx
│       │   │   ├── DailyLogPage.tsx
│       │   │   ├── TrendsPage.tsx
│       │   │   ├── ProfilePage.tsx
│       │   │   ├── LoginPage.tsx
│       │   │   └── RegisterPage.tsx
│       │   ├── components/      # Shared UI components
│       │   │   ├── Layout.tsx       # App shell: Header + Drawer + Content
│       │   │   ├── GlobalLoading.tsx
│       │   │   ├── ui.tsx           # Atomic design: Button, Card, Field
│       │   │   └── PortionChatBot.tsx
│       │   ├── hooks/           # Custom React hooks
│       │   │   ├── useCurrentUser.ts
│       │   │   ├── useAppLoading.ts
│       │   │   ├── useFoodLogs.ts
│       │   │   ├── useDailyLogs.ts
│       │   │   ├── useFoods.ts
│       │   │   ├── useStrava.ts
│       │   │   ├── useUsers.ts
│       │   │   ├── useGeminiNutrition.ts
│       │   │   └── useServiceWorker.ts
│       │   ├── lib/             # Pure helpers
│       │   │   └── format.ts
│       │   ├── utils/           # External integrations
│       │   │   └── gemini.ts
│       │   ├── theme/           # Ant Design theme config
│       │   │   └── antd-theme.ts
│       │   └── index.css        # Global styles + Tailwind directives
│       ├── public/
│       ├── vite.config.ts
│       ├── tailwind.config.js
│       ├── package.json
│       └── vercel.json
│
├── packages/
│   └── shared/                  # Monorepo shared package (types + schemas)
│       ├── src/
│       │   ├── index.ts
│       │   └── schemas.ts       # Zod schemas + TypeScript types + calcTdee()
│       ├── package.json
│       └── tsconfig.json
│
├── data/                        # Local backup/data files
├── package.json                 # Root monorepo workspace config
├── tsconfig.base.json
├── DEPLOY.md
└── render.yaml
```

### Giải thích nhiệm vụ từng thư mục/file core

| Thư mục/file | Nhiệm vụ |
|---|---|
| `apps/api/src/modules/[feature]/` | Mỗi feature có 3 file: route (định nghĩa URL), controller (handle request), service (business logic + DB). Đây là **MVC pattern**. |
| `apps/api/src/db/pg.ts` | Single source of truth cho DB access. Export: `query`, `getOne`, `run`, `transaction`. Tất cả queries đều đi qua đây. |
| `apps/api/src/middleware/` | Cross-cutting concerns: auth, validation, error handling, async wrapping. |
| `packages/shared/src/schemas.ts` | **Single source of truth** cho types, validation schemas, và business formulas (TDEE, etc.). Dùng bởi cả API và Web. |
| `apps/web/src/hooks/` | **Data fetching layer**. Mỗi hook bọc 1 hay nhiều API call bằng React Query (useQuery/useMutation). |
| `apps/web/src/api/client.ts` | HTTP client đơn giản với auto-auth header. |
| `apps/web/src/components/ui.tsx` | Atomic components: `Button`, `Card`, `Field`. Mọi component khác đều là composition của các component này + Ant Design. |
| `apps/web/src/pages/` | Page-level components. Mỗi file đại diện cho 1 route. Chứa logic + UI của cả trang. |

---

## 2. Luồng Đi Của Dữ Liệu (Data Flow & Pattern)

### 2.1 Backend Request Flow

```
Client Request
    │
    ▼
app.ts (register routes + middleware)
    │
    ▼
Middleware stack:
  helmet → cors → express.json → authMiddleware → validateBody → asyncHandler
    │
    ▼
Controller (auth.controller.ts, foodLogs.controller.ts, ...)
    │  - Parse params/body
    │  - Call service
    │  - Return JSON response
    ▼
Service (auth.service.ts, foodLogs.service.ts, ...)
    │  - Business logic
    │  - DB queries qua pg.ts helpers
    │  - Transaction khi cần atomicity
    ▼
pg.ts (query / getOne / run / transaction)
    │
    ▼
PostgreSQL
```

### 2.2 Frontend Request Flow

```
User Action (click, submit, ...)
    │
    ▼
Page Component (DashboardPage.tsx, FoodLogPage.tsx, ...)
    │
    ├── Read data: Custom Hook (useFoodLogs, useDailyLogs, ...)
    │       │
    │       ▼
    │   React Query (useQuery)
    │       │
    │       ▼
    │   apiClient.get<T>(url)
    │       │
    │       ▼
    │   fetch() với auto-auth header
    │       │
    │       ▼
    │   Backend API → JSON response
    │
    └── Write data: Custom Hook (useCreateFoodLog, useUpdateFoodLog, ...)
            │
            ▼
        React Query (useMutation)
            │
            ▼
        apiClient.post/put/delete(url, body)
            │
            ▼
        Backend API → invalidate queries → UI re-render
```

### 2.3 Design Patterns đang áp dụng

| Pattern | Nơi áp dụng | Mô tả |
|---|---|---|
| **MVC (Modified)** | Backend modules | `route` = Router, `controller` = View/Handler, `service` = Model/Logic |
| **Repository Pattern** | `pg.ts` | Tất cả DB access thông qua các hàm `query`, `getOne`, `run`, `transaction`. Che giấu chi tiết pool connection. |
| **Transaction Script** | `transaction()` trong services | Các thao tác cần atomicity (create user + token, add food + recompute) được wrap trong transaction. |
| **Custom Hooks** | Frontend `hooks/` | Mỗi feature data flow được encapsulate vào 1 hook (vd: `useFoodLogs`, `useDailyLogs`). |
| **Query Keys Convention** | React Query | `['food-logs', userId, date]`, `['daily-log', userId, date]`, `['user', userId]`. Consistent naming. |
| **Schema-Driven Types** | `packages/shared` | Zod schemas định nghĩa validation + TypeScript types. Dùng chung cả API và Web. |
| **Middleware Pipeline** | Express | `validateBody` → `authMiddleware` → `asyncHandler` → controller. |
| **Single Responsibility** | Services | Mỗi service chỉ lo 1 domain: auth, foodLogs, dailyLogs, foods, strava, users. |

---

## 3. Quy Trình 5 Bước Để Thêm 1 Tính Năng Mới (`[NewFeature]`)

Ví dụ: Thêm feature **Water Intake Reminder** (đã có sẵn, dùng để minh họa pattern).

---

### Bước 1: Định nghĩa kiểu dữ liệu/Model

**Backend + Shared types:**

Mở `packages/shared/src/schemas.ts`:
- Thêm `WaterReminderSchema` (Zod)
- Export type `WaterReminder`
- Nếu cần helper function (vd: `calcWaterRecommendation()`), thêm vào đây

```typescript
// packages/shared/src/schemas.ts
export const WaterReminderSchema = z.object({
  user_id: z.number(),
  log_date: z.string(),
  active: z.boolean(),
  interval_minutes: z.number().int().positive(),
  next_reminder_at: z.string().optional(),
});

export type WaterReminder = z.infer<typeof WaterReminderSchema>;
```

**Tại sao?** Đây là **single source of truth** cho types. Cả API và Web đều import từ `@health-tracker/shared`.

---

### Bước 2: Xử lý Logic/API

**Backend - tạo module mới:**

Tạo `apps/api/src/modules/waterReminders/` với 3 files:

**`waterReminders.service.ts`** - Business logic + DB:
```typescript
import { query, getOne, run, transaction } from '../../db/pg.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { WaterReminder } from '@health-tracker/shared';

export const waterReminderService = {
  async getByUserAndDate(userId: number, logDate: string): Promise<WaterReminder | null> {
    return getOne<WaterReminder>(
      'SELECT * FROM water_reminders WHERE user_id = $1 AND log_date = $2',
      [userId, logDate]
    );
  },

  async upsert(userId: number, input: { active: boolean; interval_minutes: number }): Promise<WaterReminder> {
    // ... INSERT ... ON CONFLICT DO UPDATE ...
    // Use transaction nếu cần kết hợp với daily_logs
  },
};
```

**`waterReminders.controller.ts`** - Request handlers:
```typescript
import type { Request, Response } from 'express';
import { validateBody } from '../../middleware/validate.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { WaterReminderSchema } from '@health-tracker/shared';
import { waterReminderService } from './waterReminders.service.js';

export const waterReminderController = {
  get: asyncHandler(async (req: Request, res: Response) => {
    const userId = Number(req.params.userId);
    const logDate = req.params.date;
    const data = await waterReminderService.getByUserAndDate(userId, logDate);
    if (!data) return res.status(204).end();
    res.json(data);
  }),

  upsert: [
    validateBody(WaterReminderSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const userId = Number(req.params.userId);
      const data = await waterReminderService.upsert(userId, req.body);
      res.json(data);
    }),
  ],
};
```

**`waterReminders.route.ts`** - Route definitions:
```typescript
import { Router } from 'express';
import { waterReminderController } from './waterReminders.controller.js';

const router = Router();

router.get('/:userId/date/:date', waterReminderController.get);
router.post('/:userId', ...(waterReminderController.upsert as any));

export default router;
```

**Đăng ký route** trong `apps/api/src/app.ts`:
```typescript
import waterRemindersRoute from './modules/waterReminders/waterReminders.route.js';

app.use('/api/water-reminders', waterRemindersRoute);
```

**Tạo DB table** nếu cần:
- Thêm vào `apps/api/src/db/schema.sql`
- Chạy migration: `npm run migrate`

---

### Bước 3: Quản lý trạng thái - State/Store

**Frontend - Custom Hook:**

Tạo `apps/web/src/hooks/useWaterReminders.ts`:
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { WaterReminder } from '@health-tracker/shared';

export function useWaterReminder(userId: number | null, logDate: string) {
  return useQuery({
    queryKey: ['water-reminder', userId, logDate],
    queryFn: () => apiClient.get<WaterReminder>(`/api/water-reminders/${userId}/date/${logDate}`),
    enabled: userId != null,
  });
}

export function useUpsertWaterReminder(userId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { active: boolean; interval_minutes: number }) =>
      apiClient.post<WaterReminder>(`/api/water-reminders/${userId}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['water-reminder', userId] });
    },
  });
}
```

**Query Key Convention:**
- Format: `['resource-name', userId, ...params]`
- Ví dụ: `['food-logs', userId, date]`, `['daily-log', userId, date]`, `['water-reminder', userId, logDate]`

---

### Bước 4: Giao diện - UI Component

**Frontend - Page Component:**

Mở `apps/web/src/pages/DailyLogPage.tsx` (vì water reminder thuộc về daily log):
```typescript
import { useWaterReminder, useUpsertWaterReminder } from '../hooks/useWaterReminders';

export function DailyLogPage() {
  const { userId } = useCurrentUser();
  const { data: reminder } = useWaterReminder(userId, date);
  const upsertReminder = useUpsertWaterReminder(userId);

  // Sử dụng trong JSX:
  // <Button onClick={() => upsertReminder.mutate({ active: true, interval_minutes: 20 })}>
  //   Bật nhắc nhở
  // </Button>
}
```

**Component Organization Rules:**
- **Page** (`pages/`): Logic + Layout của cả trang. Không tách nhỏ.
- **Shared Component** (`components/`): Chỉ tạo khi component được dùng ở ≥ 2 pages.
- **Atomic Components** (`components/ui.tsx`): `Button`, `Card`, `Field`. Mở rộng ở đây nếu cần.

---

### Bước 5: Khai báo/Routing

**Frontend - Routing:**

Mở `apps/web/src/App.tsx`:
```typescript
import DailyLogPage from './pages/DailyLogPage';

// Route đã có sẵn, chỉ cần dùng component:
<Route path="/daily" element={
  <ProtectedRoute>
    <Layout>
      <DailyLogPage />  {/* Đã khai báo */}
    </Layout>
  </ProtectedRoute>
} />
```

Nếu là page hoàn toàn mới:
```typescript
import NewFeaturePage from './pages/NewFeaturePage';

<Route path="/new-feature" element={
  <ProtectedRoute>
    <Layout>
      <NewFeaturePage />
    </Layout>
  </ProtectedRoute>
} />
```

---

## 4. Code Template Mẫu (Boilerplate)

### 4.1 Backend Service Template

```typescript
// apps/api/src/modules/[feature]/[feature].service.ts
import { query, getOne, run, transaction } from '../../db/pg.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { NewFeatureSchema, NewFeature } from '@health-tracker/shared';

export const newFeatureService = {
  async list(userId: number): Promise<NewFeature[]> {
    const { rows } = await query<NewFeature>(
      'SELECT * FROM new_features WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return rows;
  },

  async getById(id: number): Promise<NewFeature> {
    const row = await getOne<NewFeature>('SELECT * FROM new_features WHERE id = $1', [id]);
    if (!row) throw new HttpError(404, 'Not found');
    return row;
  },

  async create(userId: number, input: NewFeatureSchema): Promise<NewFeature> {
    return transaction(async (client) => {
      const { rows } = await client.query<NewFeature>(
        `INSERT INTO new_features (user_id, ...) VALUES ($1, ...) RETURNING *`,
        [userId, /* ... */]
      );
      return rows[0];
    });
  },

  async update(id: number, userId: number, input: Partial<NewFeatureSchema>): Promise<NewFeature> {
    // ... UPDATE ... RETURNING *
  },

  async remove(id: number): Promise<void> {
    await run('DELETE FROM new_features WHERE id = $1', [id]);
  },
};
```

### 4.2 Backend Controller Template

```typescript
// apps/api/src/modules/[feature]/[feature].controller.ts
import type { Request, Response } from 'express';
import { validateBody } from '../../middleware/validate.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { NewFeatureSchema } from '@health-tracker/shared';
import { newFeatureService } from './[feature].service.js';

export const newFeatureController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const userId = Number(req.params.userId);
    const data = await newFeatureService.list(userId);
    res.json(data);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const data = await newFeatureService.getById(id);
    res.json(data);
  }),

  create: [
    validateBody(NewFeatureSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const userId = Number(req.params.userId);
      const data = await newFeatureService.create(userId, req.body);
      res.status(201).json(data);
    }),
  ],

  update: [
    validateBody(NewFeatureSchema.partial()),
    asyncHandler(async (req: Request, res: Response) => {
      const id = Number(req.params.id);
      const userId = Number(req.params.userId);
      const data = await newFeatureService.update(id, userId, req.body);
      res.json(data);
    }),
  ],

  remove: asyncHandler(async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    await newFeatureService.remove(id);
    res.status(204).end();
  }),
};
```

### 4.3 Backend Route Template

```typescript
// apps/api/src/modules/[feature]/[feature].route.ts
import { Router } from 'express';
import { newFeatureController } from './[feature].controller.js';

const router = Router();

router.get('/:userId', newFeatureController.list);
router.get('/:id', newFeatureController.getById);
router.post('/:userId', ...(newFeatureController.create as any));
router.put('/:id', ...(newFeatureController.update as any));
router.delete('/:id', newFeatureController.remove);

export default router;
```

### 4.4 Frontend Hook Template

```typescript
// apps/web/src/hooks/useNewFeature.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import type { NewFeature, CreateNewFeatureInput } from '@health-tracker/shared';

export function useNewFeatures(userId: number | null) {
  return useQuery({
    queryKey: ['new-features', userId],
    queryFn: () => apiClient.get<NewFeature[]>(`/api/new-features/${userId}`),
    enabled: userId != null,
  });
}

export function useCreateNewFeature(userId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateNewFeatureInput) =>
      apiClient.post<NewFeature>(`/api/new-features/${userId}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['new-features', userId] });
    },
  });
}

export function useUpdateNewFeature(userId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<CreateNewFeatureInput> }) =>
      apiClient.put<NewFeature>(`/api/new-features/${id}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['new-features', userId] });
    },
  });
}

export function useDeleteNewFeature(userId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/api/new-features/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['new-features', userId] });
    },
  });
}
```

### 4.5 Frontend Page Template

```typescript
// apps/web/src/pages/NewFeaturePage.tsx
import { useState } from 'react';
import { Card, Typography, Button } from 'antd';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useNewFeatures, useCreateNewFeature } from '../hooks/useNewFeature';

const { Title, Text } = Typography;

export function NewFeaturePage() {
  const { userId } = useCurrentUser();
  const { data: items, isLoading } = useNewFeatures(userId);
  const create = useCreateNewFeature(userId);

  if (userId == null) return <Card>Vui lòng đăng nhập.</Card>;

  return (
    <div className="space-y-6">
      <Title level={3}>New Feature</Title>
      <Card>
        {isLoading ? (
          <Text>Đang tải...</Text>
        ) : (
          <div>
            {/* Render list */}
            <Button type="primary" onClick={() => create.mutate({ ... })}>
              Thêm mới
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
```

---

## 5. Quy Tắc & Convention Quan Trọng

### 5.1 Backend

| Rule | Mô tả |
|---|---|
| **Không query trực tiếp từ controller** | Controller chỉ gọi service. Tất cả DB queries nằm trong service. |
| **Transaction bắt buộc cho multi-step** | Nếu có ≥ 2 thao tác DB liên quan (vd: INSERT food_logs + UPDATE daily_logs), phải wrap trong `transaction()`. |
| **Không throw HttpError trong controller** | Throw trong service, controller chỉ handle response. |
| **Auth check ở middleware** | Không check auth thủ công trong controller/service. Dùng `authMiddleware`. |
| **Validation ở controller** | Dùng `validateBody(Schema)` trước `asyncHandler`. |
| **Password không được log/return** | Dùng `omitPassword()` trước khi trả về user data. |
| **Sử dụng `run`, `query`, `getOne` từ `pg.ts`** | Không import `Pool` trực tiếp. |

### 5.2 Frontend

| Rule | Mô tả |
|---|---|
| **Mỗi feature = 1 custom hook** | Không gọi `apiClient` trực tiếp từ page component. Luôn qua hook. |
| **Query keys phải có userId** | `['resource', userId, ...params]` để đảm bảo cache đúng per-user. |
| **Invalidate queries sau mutation** | `onSuccess` phải gọi `qc.invalidateQueries()` cho tất cả queries bị ảnh hưởng. |
| **Không dùng any** | TypeScript strict mode. Import types từ `@health-tracker/shared`. |
| **Page component chứa cả logic + UI** | Không tách thành containers/presentational. Page là single source of truth. |
| **Dùng atomic components từ `ui.tsx`** | `Button`, `Card`, `Field` thay vì Ant Design trực tiếp (trừ khi cần custom). |
| **Error handling trong mutation** | Dùng `onError` callback để hiển thị `message.error()`. |

### 5.3 Shared Package

| Rule | Mô tả |
|---|---|
| **Chỉ chứa types, schemas, pure functions** | Không chứa logic UI hay DB queries. |
| **Mỗi schema = 1 domain concept** | `FoodSchema`, `DailyLogSchema`, `UserSchema`, ... |
| **Business formulas ở đây** | `calcTdee()`, `calcMaintenanceTdee()`, ... |
| **Phải build trước khi deploy** | Vercel cần `dist/` của shared package. |

---

## 6. Tech Stack Summary

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 18 + TypeScript |
| **Build Tool** | Vite 6 |
| **UI Library** | Ant Design 6 + Tailwind CSS |
| **State Management** | React Query (TanStack Query v5) |
| **Routing** | React Router v6 |
| **API Client** | Custom fetch wrapper (`apiClient`) |
| **Backend** | Express + TypeScript |
| **Database** | PostgreSQL (via `pg` library) |
| **Validation** | Zod (shared package) |
| **Auth** | Bearer token (JWT-like, stored in localStorage) |
| **AI Integration** | Google Generative AI (Gemini) |
| **Monorepo** | npm workspaces |
| **Deploy** | Vercel (frontend) + Render (backend) |

---

## 7. Troubleshooting Deploy

### Vercel build fails với `Failed to resolve entry for package "@health-tracker/shared"`

**Nguyên nhân:** Vercel chạy `npm install` + `npm run build` trong `apps/web` mà không build `packages/shared` trước.

**Fix:** Cập nhật `apps/web/vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "installCommand": "cd ../.. && npm install",
  "buildCommand": "cd ../.. && npm run build -w @health-tracker/shared && npm run build -w @health-tracker/web"
}
```

---

*Tài liệu này được tạo tự động dựa trên phân tích codebase. Cập nhật khi có thay đổi kiến trúc.*

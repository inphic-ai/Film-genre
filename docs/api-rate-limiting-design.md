# API 速率限制設計文件

## 📋 文件資訊

- **建立時間**：2025-12-08 19:30 GMT+8
- **目標**：實作 API 速率限制，防止濫用與 DDoS 攻擊
- **符合規範**：《INPHIC × Manus 生產環境合作規範 1.0》

---

## 🎯 設計目標

### 1. 防止 API 濫用
- 限制每個 IP/使用者的請求頻率
- 防止惡意爬蟲與 DDoS 攻擊
- 保護資料庫與伺服器資源

### 2. 公平資源分配
- 不同角色有不同的速率限制
- Admin 使用者有更高的限制
- 特殊端點有獨立的限制

### 3. 友善的使用者體驗
- 提供清楚的錯誤訊息
- 返回剩餘請求次數（`X-RateLimit-*` headers）
- 提供重試時間（`Retry-After` header）

---

## 📊 速率限制策略

### 1. 全域速率限制（所有端點）

| 使用者類型 | 限制 | 時間窗口 | 備註 |
|-----------|------|---------|------|
| 未認證（IP） | 60 次 | 1 分鐘 | 基於 IP 地址 |
| 已認證（Staff/Viewer） | 120 次 | 1 分鐘 | 基於使用者 ID |
| Admin | 300 次 | 1 分鐘 | 管理員特權 |

### 2. 特殊端點速率限制

| 端點 | 限制 | 時間窗口 | 原因 |
|------|------|---------|------|
| `/api/trpc/aiSearch.*` | 10 次 | 1 分鐘 | LLM API 成本高 |
| `/api/trpc/videos.uploadThumbnail` | 20 次 | 1 小時 | 防止儲存空間濫用 |
| `/api/trpc/videos.batchImport` | 5 次 | 1 小時 | 資料庫寫入密集 |
| `/api/trpc/auth.login` | 5 次 | 5 分鐘 | 防止暴力破解 |
| `/api/trpc/auth.register` | 3 次 | 1 小時 | 防止批次註冊 |

### 3. 豁免端點（無速率限制）

- `/api/oauth/callback`（OAuth 回調）
- `/api/health`（健康檢查）
- `/api/trpc/auth.me`（認證狀態查詢）

---

## 🏗️ 技術架構

### 1. 速率限制儲存方案

#### **方案 A：記憶體儲存（開發環境）**

**優點**：
- ✅ 簡單快速，無需額外服務
- ✅ 適合單一伺服器環境

**缺點**：
- ❌ 伺服器重啟後重置
- ❌ 不支援多伺服器（水平擴展）

**實作**：
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 分鐘
  max: 60, // 60 次請求
  standardHeaders: true, // 返回 RateLimit-* headers
  legacyHeaders: false, // 禁用 X-RateLimit-* headers
});
```

---

#### **方案 B：Redis 儲存（生產環境，推薦）**

**優點**：
- ✅ 支援多伺服器（水平擴展）
- ✅ 持久化儲存（伺服器重啟不影響）
- ✅ 高效能（記憶體資料庫）

**缺點**：
- ⚠️ 需要額外的 Redis 服務（Railway 提供）

**實作**：
```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL,
});

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:', // rate limit prefix
  }),
});
```

---

### 2. 速率限制中介軟體架構

```
HTTP Request
    ↓
全域速率限制（基於 IP/使用者 ID）
    ↓
路由匹配
    ↓
特殊端點速率限制（如果適用）
    ↓
tRPC Procedure
    ↓
HTTP Response（包含 RateLimit headers）
```

---

## 💻 實作方案

### 1. 安裝依賴

```bash
pnpm add express-rate-limit rate-limit-redis redis
pnpm add -D @types/express-rate-limit
```

### 2. 建立速率限制配置檔案

**檔案位置**：`server/_core/rateLimit.ts`

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';
import type { Request } from 'express';

// Redis 客戶端（生產環境）
let redisClient: ReturnType<typeof createClient> | null = null;

if (process.env.REDIS_URL) {
  redisClient = createClient({
    url: process.env.REDIS_URL,
  });
  redisClient.connect().catch(console.error);
}

// 速率限制鍵生成函數（基於使用者 ID 或 IP）
const keyGenerator = (req: Request): string => {
  // 優先使用使用者 ID（已認證）
  const userId = (req as any).user?.id;
  if (userId) {
    return `user:${userId}`;
  }
  // 否則使用 IP 地址
  return `ip:${req.ip}`;
};

// 全域速率限制（60 次/分鐘）
export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 分鐘
  max: async (req: Request) => {
    // 根據使用者角色動態調整限制
    const user = (req as any).user;
    if (user?.role === 'admin') {
      return 300; // Admin: 300 次/分鐘
    }
    if (user) {
      return 120; // 已認證: 120 次/分鐘
    }
    return 60; // 未認證: 60 次/分鐘
  },
  keyGenerator,
  store: redisClient
    ? new RedisStore({
        client: redisClient,
        prefix: 'rl:global:',
      })
    : undefined, // 開發環境使用記憶體儲存
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests, please try again later.',
    retryAfter: 60,
  },
});

// AI 搜尋速率限制（10 次/分鐘）
export const aiSearchRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator,
  store: redisClient
    ? new RedisStore({
        client: redisClient,
        prefix: 'rl:ai:',
      })
    : undefined,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'AI search rate limit exceeded. Please try again later.',
    retryAfter: 60,
  },
});

// 圖片上傳速率限制（20 次/小時）
export const uploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 小時
  max: 20,
  keyGenerator,
  store: redisClient
    ? new RedisStore({
        client: redisClient,
        prefix: 'rl:upload:',
      })
    : undefined,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Upload rate limit exceeded. Please try again later.',
    retryAfter: 3600,
  },
});

// 批次匯入速率限制（5 次/小時）
export const batchImportRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  keyGenerator,
  store: redisClient
    ? new RedisStore({
        client: redisClient,
        prefix: 'rl:batch:',
      })
    : undefined,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Batch import rate limit exceeded. Please try again later.',
    retryAfter: 3600,
  },
});

// 登入速率限制（5 次/5 分鐘）
export const loginRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 分鐘
  max: 5,
  keyGenerator: (req: Request) => `ip:${req.ip}`, // 僅基於 IP（防止暴力破解）
  store: redisClient
    ? new RedisStore({
        client: redisClient,
        prefix: 'rl:login:',
      })
    : undefined,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many login attempts. Please try again later.',
    retryAfter: 300,
  },
});
```

---

### 3. 整合到 Express 應用程式

**檔案位置**：`server/index.ts`

```typescript
import express from 'express';
import { globalRateLimiter } from './server/_core/rateLimit';

const app = express();

// 套用全域速率限制（所有端點）
app.use('/api', globalRateLimiter);

// 豁免特定端點
app.use('/api/oauth/callback', (req, res, next) => {
  // 跳過速率限制
  next();
});

app.use('/api/health', (req, res, next) => {
  // 跳過速率限制
  next();
});

// tRPC 路由
app.use('/api/trpc', trpcMiddleware);

// ... 其他路由
```

---

### 4. 整合到 tRPC Procedures

**方案 A：使用 tRPC Context（推薦）**

在 tRPC Context 中檢查速率限制，拋出 `TRPCError`。

**檔案位置**：`server/_core/context.ts`

```typescript
import { TRPCError } from '@trpc/server';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';

export const createContext = async ({ req, res }: CreateExpressContextOptions) => {
  // 檢查速率限制（已在 Express 中介軟體處理）
  // 如果超過限制，Express 會自動返回 429 錯誤

  // 認證邏輯
  const user = await getUserFromRequest(req);

  return {
    req,
    res,
    user,
  };
};
```

---

**方案 B：使用 tRPC Middleware（進階）**

建立自訂 tRPC Middleware，針對特定 Procedures 套用速率限制。

**檔案位置**：`server/trpc/middleware/rateLimit.ts`

```typescript
import { TRPCError } from '@trpc/server';
import { middleware } from '../trpc';

// AI 搜尋速率限制 Middleware
export const aiSearchRateLimitMiddleware = middleware(async ({ ctx, next }) => {
  // 檢查速率限制（從 Redis 或記憶體）
  const key = ctx.user ? `user:${ctx.user.id}` : `ip:${ctx.req.ip}`;
  const count = await getRateLimitCount(key, 'ai');

  if (count > 10) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'AI search rate limit exceeded. Please try again later.',
    });
  }

  // 增加計數
  await incrementRateLimitCount(key, 'ai');

  return next();
});
```

**使用方式**：

```typescript
// server/routers.ts
export const appRouter = router({
  aiSearch: router({
    parseQuery: protectedProcedure
      .use(aiSearchRateLimitMiddleware) // 套用速率限制
      .input(z.object({ query: z.string() }))
      .mutation(async ({ input, ctx }) => {
        // AI 搜尋邏輯
      }),
  }),
});
```

---

## 📊 速率限制 Headers

### 標準 Headers（RFC 6585）

```
RateLimit-Limit: 60           # 時間窗口內的最大請求數
RateLimit-Remaining: 45       # 剩餘請求數
RateLimit-Reset: 1733654400   # 重置時間（Unix timestamp）
```

### 超過限制時的回應

```
HTTP/1.1 429 Too Many Requests
RateLimit-Limit: 60
RateLimit-Remaining: 0
RateLimit-Reset: 1733654400
Retry-After: 60

{
  "error": "Too many requests, please try again later.",
  "retryAfter": 60
}
```

---

## 🧪 測試計畫

### 1. 單元測試

**檔案位置**：`server/rateLimit.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { globalRateLimiter } from './server/_core/rateLimit';

describe('Rate Limiting', () => {
  it('should allow requests within limit', async () => {
    // 測試 60 次請求（未超過限制）
  });

  it('should block requests exceeding limit', async () => {
    // 測試 61 次請求（超過限制）
  });

  it('should reset after time window', async () => {
    // 測試時間窗口重置
  });

  it('should apply different limits for different roles', async () => {
    // 測試 Admin vs Staff vs 未認證
  });
});
```

---

### 2. 整合測試

**測試項目**：
1. ✅ 全域速率限制（60 次/分鐘）
2. ✅ 已認證使用者限制（120 次/分鐘）
3. ✅ Admin 限制（300 次/分鐘）
4. ✅ AI 搜尋限制（10 次/分鐘）
5. ✅ 圖片上傳限制（20 次/小時）
6. ✅ 批次匯入限制（5 次/小時）
7. ✅ 登入限制（5 次/5 分鐘）
8. ✅ 豁免端點（無限制）

---

## 📋 前端整合

### 1. 錯誤處理

**檔案位置**：`client/src/lib/trpc.ts`

```typescript
import { httpBatchLink } from '@trpc/client';
import { toast } from 'sonner';

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: '/api/trpc',
      fetch: async (url, options) => {
        const res = await fetch(url, options);

        // 處理速率限制錯誤
        if (res.status === 429) {
          const retryAfter = res.headers.get('Retry-After');
          toast.error(`Too many requests. Please try again in ${retryAfter} seconds.`);
        }

        return res;
      },
    }),
  ],
});
```

---

### 2. 顯示剩餘請求數（可選）

**檔案位置**：`client/src/components/RateLimitIndicator.tsx`

```typescript
import { useEffect, useState } from 'react';

export function RateLimitIndicator() {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [limit, setLimit] = useState<number | null>(null);

  useEffect(() => {
    // 從最近的 API 回應中讀取 RateLimit headers
    // 顯示剩餘請求數
  }, []);

  if (!remaining || !limit) return null;

  return (
    <div className="text-sm text-muted-foreground">
      API Requests: {remaining}/{limit}
    </div>
  );
}
```

---

## 🚀 部署計畫

### Step 1：本地測試

```bash
# 1. 安裝依賴
pnpm add express-rate-limit rate-limit-redis redis

# 2. 建立速率限制配置
# 見 server/_core/rateLimit.ts

# 3. 整合到 Express
# 見 server/index.ts

# 4. 測試速率限制
pnpm test
```

---

### Step 2：Railway 環境變數設定

**新增環境變數**：
- `REDIS_URL`：Railway Redis 連線 URL

**取得 Redis URL**：
1. 登入 Railway Dashboard
2. 新增 Redis 服務（Add Service → Redis）
3. 複製 `REDIS_URL` 環境變數
4. 貼到專案環境變數中

---

### Step 3：部署到 Railway

```bash
# 1. 推送到 GitHub
git add .
git commit -m "feat: add API rate limiting"
git push

# 2. Railway 自動部署
# 等待部署完成

# 3. 驗證速率限制
curl -I https://film-genre-production.up.railway.app/api/trpc/videos.list
# 檢查 RateLimit-* headers
```

---

## 📊 監控與日誌

### 1. 速率限制日誌

**檔案位置**：`server/_core/rateLimit.ts`

```typescript
export const globalRateLimiter = rateLimit({
  // ... 其他配置
  handler: (req, res) => {
    // 記錄速率限制事件
    console.warn(`[Rate Limit] ${req.ip} exceeded limit on ${req.path}`);

    // 記錄到 audit logs（可選）
    auditLog({
      action: 'RATE_LIMIT_EXCEEDED',
      userId: (req as any).user?.id,
      ip: req.ip,
      path: req.path,
    });

    res.status(429).json({
      error: 'Too many requests, please try again later.',
    });
  },
});
```

---

### 2. 效能監控整合

將速率限制統計整合到效能監控儀表板（Phase 5）：

- 速率限制觸發次數（按端點）
- 被封鎖的 IP 列表
- 最活躍的使用者（請求數排行）
- 速率限制趨勢圖表

---

## 📄 參考文件

- express-rate-limit 文件：https://github.com/express-rate-limit/express-rate-limit
- rate-limit-redis 文件：https://github.com/wyattjoh/rate-limit-redis
- RFC 6585（429 Too Many Requests）：https://tools.ietf.org/html/rfc6585
- Railway Redis 文件：https://docs.railway.app/databases/redis

---

**文件版本**：1.0  
**最後更新**：2025-12-08 19:30 GMT+8

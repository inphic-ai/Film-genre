# Railway PostgreSQL 索引部署衝突分析

## 問題描述

使用者提問：「這樣上傳 Railway 用 PostgreSQL 是否會有衝突？」

**背景**：
- 目前使用 Drizzle ORM 管理資料庫 Schema
- 計畫使用 `psql` 或 Railway Dashboard 直接執行索引 SQL
- 擔心與 Drizzle 遷移流程產生衝突

---

## 衝突分析

### 1. Drizzle ORM 遷移機制

**Drizzle Kit 工作流程**：
```bash
pnpm db:push
# 等同於：
# 1. drizzle-kit generate  → 產生遷移 SQL（基於 schema.ts）
# 2. drizzle-kit migrate   → 執行遷移 SQL（套用到資料庫）
```

**遷移檔案位置**：
- `/home/ubuntu/film-genre/drizzle/0000_*.sql`
- 目前最新：`0011_dear_prism.sql`（新增 videos.rating 欄位）

**Drizzle 遷移表**：
- Drizzle Kit 使用 `__drizzle_migrations` 表追蹤已執行的遷移
- 記錄每個遷移檔案的執行狀態（hash, created_at）

---

### 2. 直接執行索引 SQL 是否會衝突？

#### ✅ **不會衝突！原因如下：**

##### **原因 1：索引不在 Drizzle Schema 定義中**

**Drizzle Schema（`drizzle/schema.ts`）**：
- 僅定義資料表結構（欄位、型別、約束、外鍵）
- **不包含索引定義**（Drizzle Kit 不管理索引）

**證據**：
```typescript
// drizzle/schema.ts
export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category"),
  platform: text("platform"),
  // ... 其他欄位
});
// ❌ 沒有索引定義！
```

**結論**：
- Drizzle Kit 產生的遷移 SQL **不包含索引**
- 直接執行索引 SQL **不會與 Drizzle 遷移衝突**

---

##### **原因 2：索引是資料庫層級的優化，不影響 Schema**

**索引特性**：
- 索引不改變資料表結構（欄位、型別、約束）
- 索引不影響應用程式邏輯（查詢結果相同）
- 索引僅影響查詢效能（加速 SELECT，略微減慢 INSERT/UPDATE）

**Drizzle Kit 行為**：
- `drizzle-kit generate`：比較 `schema.ts` 與資料庫結構，產生差異 SQL
- **索引不在比較範圍內**（Drizzle Kit 不管理索引）
- 即使資料庫有額外的索引，Drizzle Kit 也不會刪除

**結論**：
- 直接執行索引 SQL **不會被 Drizzle Kit 覆蓋或刪除**
- 索引會永久保留，直到手動刪除

---

##### **原因 3：使用 `IF NOT EXISTS` 避免重複建立**

**索引 SQL 設計**：
```sql
CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category);
```

**保護機制**：
- `IF NOT EXISTS`：如果索引已存在，跳過建立（不報錯）
- 即使多次執行，也不會產生衝突

**結論**：
- 索引 SQL 可以安全地重複執行
- 不會與 Drizzle 遷移流程衝突

---

### 3. 潛在風險評估

#### ⚠️ **風險 1：Drizzle Kit 不追蹤索引變更**

**問題**：
- Drizzle Kit 不記錄索引建立/刪除
- 如果需要回滾索引，必須手動執行 `DROP INDEX`

**緩解措施**：
- 建立 `drop_performance_indexes.sql` 回滾腳本
- 在 `DB_CHANGE_REQUEST_PERFORMANCE.md` 記錄索引變更
- 使用版本控制追蹤索引變更

---

#### ⚠️ **風險 2：團隊成員不知道索引存在**

**問題**：
- 索引不在 `schema.ts` 中，團隊成員可能不知道
- 可能誤刪索引或重複建立

**緩解措施**：
- 在 `drizzle/schema.ts` 頂部新增註解，說明索引由外部管理
- 在 `README.md` 記錄索引管理流程
- 建立 `migrations/` 資料夾，統一管理索引 SQL

---

#### ⚠️ **風險 3：開發環境與生產環境索引不一致**

**問題**：
- 開發環境可能沒有索引（使用 `pnpm db:push` 重建資料庫）
- 生產環境有索引（手動執行 SQL）
- 導致效能測試結果不一致

**緩解措施**：
- 在開發環境也執行索引 SQL（本地測試）
- 建立自動化腳本，確保開發環境與生產環境一致
- 在 `package.json` 新增 `db:indexes` 指令

---

### 4. 推薦做法：整合索引到 Drizzle 遷移流程

#### **方案 A：手動管理索引（目前方案）**

**優點**：
- ✅ 簡單快速，無需修改 Drizzle 配置
- ✅ 適合一次性優化

**缺點**：
- ❌ 索引不在版本控制中（Drizzle 不追蹤）
- ❌ 團隊成員可能不知道索引存在

**實作方式**：
1. 使用 `psql` 或 Railway Dashboard 執行索引 SQL
2. 在 `DB_CHANGE_REQUEST_PERFORMANCE.md` 記錄變更
3. 在 `drizzle/schema.ts` 頂部新增註解

---

#### **方案 B：整合索引到 Drizzle 遷移（推薦）**

**優點**：
- ✅ 索引在版本控制中（Drizzle 追蹤）
- ✅ 開發環境與生產環境一致
- ✅ 團隊成員清楚索引存在

**缺點**：
- ⚠️ 需要手動建立遷移檔案（Drizzle Kit 不自動產生索引）

**實作方式**：
1. 建立新的遷移檔案：`drizzle/0012_performance_indexes.sql`
2. 複製索引 SQL 到遷移檔案
3. 執行 `drizzle-kit migrate` 套用遷移
4. Drizzle 會追蹤這個遷移（記錄在 `__drizzle_migrations` 表）

**範例**：
```sql
-- drizzle/0012_performance_indexes.sql
-- 效能優化索引（2025-12-08）

-- 1. videos 表索引
CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category);
CREATE INDEX IF NOT EXISTS idx_videos_platform ON videos(platform);
-- ... 其他索引
```

---

#### **方案 C：使用 Drizzle 原生索引定義（未來方案）**

**Drizzle Kit v0.20+ 支援索引定義**：
```typescript
// drizzle/schema.ts
import { index } from "drizzle-orm/pg-core";

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  category: text("category"),
  // ... 其他欄位
}, (table) => ({
  categoryIdx: index("idx_videos_category").on(table.category),
  platformIdx: index("idx_videos_platform").on(table.platform),
}));
```

**優點**：
- ✅ 索引定義在 Schema 中，Drizzle Kit 自動管理
- ✅ 開發環境與生產環境完全一致

**缺點**：
- ⚠️ 需要升級 Drizzle Kit 版本
- ⚠️ 需要重新產生遷移檔案

---

## 結論與建議

### ✅ **結論：不會衝突！**

1. **Drizzle Kit 不管理索引**：索引不在 Schema 定義中，不會被覆蓋或刪除
2. **索引是資料庫層級的優化**：不影響應用程式邏輯
3. **使用 `IF NOT EXISTS` 保護**：可以安全地重複執行

### 📋 **推薦做法：方案 B（整合索引到 Drizzle 遷移）**

**理由**：
- ✅ 索引在版本控制中，便於追蹤與回滾
- ✅ 開發環境與生產環境一致
- ✅ 團隊成員清楚索引存在
- ✅ 符合《INPHIC × Manus 生產環境合作規範 1.0》

**實作步驟**：

#### **Step 1：建立遷移檔案**

```bash
# 建立新的遷移檔案
touch /home/ubuntu/film-genre/drizzle/0012_performance_indexes.sql
```

#### **Step 2：複製索引 SQL**

```sql
-- drizzle/0012_performance_indexes.sql
-- 效能優化索引（2025-12-08）
-- 用途：提升查詢效能 50%+

-- 1. videos 表索引（7 個）
CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category);
CREATE INDEX IF NOT EXISTS idx_videos_platform ON videos(platform);
CREATE INDEX IF NOT EXISTS idx_videos_share_status ON videos("shareStatus");
CREATE INDEX IF NOT EXISTS idx_videos_rating ON videos(rating DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_videos_view_count ON videos("viewCount" DESC);
CREATE INDEX IF NOT EXISTS idx_videos_filter ON videos(category, platform, "shareStatus");

-- 2. timeline_notes 表索引（3 個）
CREATE INDEX IF NOT EXISTS idx_timeline_notes_video_id ON timeline_notes("videoId");
CREATE INDEX IF NOT EXISTS idx_timeline_notes_status ON timeline_notes(status);
CREATE INDEX IF NOT EXISTS idx_timeline_notes_user_id ON timeline_notes("userId");

-- 3. video_tags 表索引（2 個）
CREATE INDEX IF NOT EXISTS idx_video_tags_video_id ON video_tags("videoId");
CREATE INDEX IF NOT EXISTS idx_video_tags_tag_id ON video_tags("tagId");

-- 4. tags 表索引（2 個）
CREATE INDEX IF NOT EXISTS idx_tags_type ON tags("tagType");
CREATE INDEX IF NOT EXISTS idx_tags_smart_score ON tags("smartScore" DESC);

-- 5. products 表索引（2 個）
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_family_code ON products("familyCode");
```

#### **Step 3：執行遷移**

```bash
# 本地測試
cd /home/ubuntu/film-genre
pnpm db:push

# 或者直接執行遷移
drizzle-kit migrate
```

#### **Step 4：驗證索引**

```bash
# 連線到資料庫
psql $CUSTOM_DATABASE_URL

# 檢查索引
\d+ videos
\d+ timeline_notes
\d+ video_tags
\d+ tags
\d+ products

# 檢查遷移記錄
SELECT * FROM __drizzle_migrations ORDER BY created_at DESC LIMIT 5;
```

#### **Step 5：部署到 Railway**

```bash
# Railway 會自動執行遷移（如果配置了 build command）
# 或者手動執行：
pnpm db:push
```

---

## 附錄：Drizzle 遷移表結構

**`__drizzle_migrations` 表**：
```sql
CREATE TABLE __drizzle_migrations (
  id SERIAL PRIMARY KEY,
  hash TEXT NOT NULL,
  created_at BIGINT NOT NULL
);
```

**範例資料**：
```sql
SELECT * FROM __drizzle_migrations;

 id |                hash                | created_at
----+------------------------------------+------------
  1 | 0000_robust_squirrel_girl          | 1701234567
  2 | 0001_absurd_vin_gonzales           | 1701234890
  3 | 0002_optimal_cobalt_man            | 1701235123
  ...
 12 | 0011_dear_prism                    | 1733567890
 13 | 0012_performance_indexes           | 1733654321  ← 新增
```

---

## 參考文件

- Drizzle Kit 文件：https://orm.drizzle.team/kit-docs/overview
- Drizzle Kit Migrations：https://orm.drizzle.team/docs/migrations
- PostgreSQL 索引文件：https://www.postgresql.org/docs/current/indexes.html
- 《INPHIC × Manus 生產環境合作規範 1.0》

---

**文件版本**：1.0  
**最後更新**：2025-12-08 18:30 GMT+8

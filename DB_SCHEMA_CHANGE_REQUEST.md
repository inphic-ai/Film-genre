# 📌 資料庫 / Schema 變更申請

**申請日期**：2025-01-08
**申請人**：Manus AI
**專案**：INPHIC 影片知識庫與維修協作系統
**GitHub Repo**：https://github.com/inphic-ai/Film-genre

---

## A. 受影響資料表

1. **新增資料表**：
   - `categories`（影片分類表）
   - `knowledge_entries`（知識庫條目表）

2. **修改資料表**：
   - `videos`（新增 `category_id` 欄位）

---

## B. 欄位變更細節

### 1. 新增 `categories` 表

```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,  -- product / vendor / repair / teaching / internal / misc
  description TEXT,
  color VARCHAR(7),  -- 分類顏色 (#RRGGBB)
  icon VARCHAR(50),  -- 分類圖示 (lucide icon 名稱)
  sort_order INTEGER DEFAULT 0,  -- 排序順序
  is_active BOOLEAN DEFAULT true,  -- 是否啟用
  created_at TIMESTAMP DEFAULT NOW()
);
```

**預設資料**：
```sql
INSERT INTO categories (name, type, description, color, sort_order) VALUES
('產品介紹', 'product', '產品功能介紹影片', '#3b82f6', 1),
('供應商影片', 'vendor', '供應商提供的影片', '#10b981', 2),
('維修教學', 'repair', '產品維修指導影片', '#f59e0b', 3),
('使用教學', 'teaching', '產品使用教學影片', '#8b5cf6', 4),
('內部培訓', 'internal', '內部員工培訓影片', '#ef4444', 5),
('其他', 'misc', '其他類型影片', '#6b7280', 6);
```

---

### 2. 新增 `knowledge_entries` 表

```sql
CREATE TABLE knowledge_entries (
  id SERIAL PRIMARY KEY,
  video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
  entry_type VARCHAR(50) NOT NULL,  -- text / image / note / highlight
  timestamp INTEGER,  -- 時間軸位置（秒數）
  content TEXT,  -- 文字內容
  image_urls JSON,  -- 圖片 URL 陣列
  tags JSON,  -- 標籤陣列
  created_at TIMESTAMP DEFAULT NOW()
);
```

**用途**：統一存放影片時間軸內容（文字、圖片、筆記、重點標記），形成可索引的智慧內容層。

---

### 3. `videos` 表新增 `category_id` 欄位

```sql
ALTER TABLE videos
ADD COLUMN category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL;
```

**欄位說明**：
- 型別：`INTEGER`
- 外鍵：`REFERENCES categories(id)`
- 刪除行為：`ON DELETE SET NULL`（刪除分類時，影片的 `category_id` 設為 `NULL`）
- 預設值：`NULL`

---

## C. 相容性評估

### 1. 是否影響現有資料？

**✅ 不影響現有資料**

- `categories` 與 `knowledge_entries` 是全新資料表，不影響現有資料
- `videos.category_id` 新增欄位預設值為 `NULL`，現有影片資料不受影響
- 現有的 `product_code` 欄位與邏輯**完全不變**

---

### 2. 是否造成部署中斷？

**✅ 不造成部署中斷**

- 新增欄位預設值為 `NULL`，不會導致現有 API 失效
- 前端 UI 會逐步更新，舊版 UI 仍可正常運作
- 使用 Drizzle ORM migration，確保資料庫變更安全

---

### 3. 是否可能造成孤兒資料？

**✅ 已設定防護機制**

- `knowledge_entries.video_id`：`ON DELETE CASCADE`（刪除影片時自動刪除相關條目）
- `videos.category_id`：`ON DELETE SET NULL`（刪除分類時，影片的 `category_id` 設為 `NULL`，不會造成孤兒資料）

---

## D. 分類運作邏輯（務必遵守）

```
IF video.product_code != null:
    分類 = 產品影片（優先權最高）
ELSE IF video.category_id != null:
    分類 = category 分類
ELSE:
    分類 = 未分類（需在 UI 明顯標示）
```

**驗證規則**：
- 非產品影片（`product_code == null`）必須選擇分類（`category_id` 必填）
- 產品影片（`product_code != null`）自動忽略 `category_id`

---

## E. 回滾策略

若需要回滾，執行以下 SQL：

```sql
-- 1. 刪除 videos.category_id 欄位
ALTER TABLE videos DROP COLUMN category_id;

-- 2. 刪除 knowledge_entries 表
DROP TABLE knowledge_entries;

-- 3. 刪除 categories 表
DROP TABLE categories;
```

**資料備份**：
- 執行 migration 前自動備份資料庫
- 備份保留 30 天

---

## F. 測試計劃

1. **本地開發環境測試**：
   - 執行 `pnpm db:push` 建立資料表
   - 測試 Category CRUD API
   - 測試影片新增/編輯時的分類邏輯

2. **單元測試**：
   - 建立 vitest 測試檔案
   - 測試分類邏輯（product_code 優先 → category_id → 未分類）
   - 測試批次修改分類功能

3. **部署前測試**：
   - 在 Railway Staging 環境測試
   - 確認 migration 執行成功
   - 確認現有影片資料不受影響

---

## G. 部署計劃

1. **Phase 1**：資料庫 Schema 建立（migration）
2. **Phase 2**：後端 API 開發與測試
3. **Phase 3**：前端 UI 開發與測試
4. **Phase 4**：進階功能開發（批次修改、統計圖表）
5. **Phase 5**：部署到 Railway Production

---

## H. 風險評估

| 風險項目 | 風險等級 | 緩解措施 |
|---------|---------|---------|
| Migration 失敗 | 低 | 使用 Drizzle ORM，自動處理 migration |
| 現有資料損壞 | 極低 | 新增欄位預設值為 NULL，不影響現有資料 |
| API 不相容 | 低 | 逐步更新 API，舊版 API 仍可運作 |
| 部署中斷 | 極低 | 使用 Railway 自動部署，支援快速回滾 |

---

## I. 審核檢查清單

- [ ] Schema 變更符合 PostgreSQL 規範
- [ ] 外鍵關聯正確設定（ON DELETE CASCADE / SET NULL）
- [ ] 預設值設定合理
- [ ] 不影響現有資料
- [ ] 不造成部署中斷
- [ ] 已設定回滾策略
- [ ] 已建立測試計劃
- [ ] 已評估風險並提出緩解措施

---

**申請狀態**：⏳ 等待審核

**審核人**：_____________

**審核日期**：_____________

**審核結果**：[ ] 通過 / [ ] 需修改 / [ ] 拒絕

**審核意見**：

---

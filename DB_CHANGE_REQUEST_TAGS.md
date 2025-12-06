# 資料庫變更申請 - 標籤系統功能

**申請日期**：2025-12-06  
**申請人**：Manus AI Assistant  
**專案**：影片知識庫系統（Film-genre）  
**資料庫**：Railway PostgreSQL

---

## A. 受影響資料表

### 新增資料表：

1. **tags** - 標籤主表
2. **video_tags** - 影片與標籤的多對多關聯表

---

## B. 欄位變更細節

### 1. 新增資料表：`tags`

```sql
CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  color VARCHAR(7),  -- 標籤顏色（hex color code，例如 #FF5733）
  usage_count INTEGER DEFAULT 0 NOT NULL,  -- 被使用次數（冗餘欄位，用於快速查詢）
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_tags_usage_count ON tags(usage_count DESC);
```

**欄位說明**：
- `id`: 主鍵，自動遞增
- `name`: 標籤名稱，唯一索引
- `description`: 標籤描述（選填）
- `color`: 標籤顏色，用於前端顯示
- `usage_count`: 被使用次數，用於排行榜與熱門標籤
- `created_at`: 建立時間
- `updated_at`: 更新時間

### 2. 新增資料表：`video_tags`

```sql
CREATE TABLE video_tags (
  id SERIAL PRIMARY KEY,
  video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  weight INTEGER DEFAULT 1 NOT NULL,  -- 關聯權重（1-10，用於排序相關影片）
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(video_id, tag_id)
);

CREATE INDEX idx_video_tags_video_id ON video_tags(video_id);
CREATE INDEX idx_video_tags_tag_id ON video_tags(tag_id);
CREATE INDEX idx_video_tags_weight ON video_tags(weight DESC);
```

**欄位說明**：
- `id`: 主鍵，自動遞增
- `video_id`: 影片 ID，外鍵關聯 `videos.id`，CASCADE 刪除
- `tag_id`: 標籤 ID，外鍵關聯 `tags.id`，CASCADE 刪除
- `weight`: 關聯權重（1-10），用於排序相關影片的重要性
- `created_at`: 建立時間
- `UNIQUE(video_id, tag_id)`: 確保同一影片不會重複關聯同一標籤

### 3. 現有資料表無變更

**不修改現有資料表**：
- `videos` - 保持不變
- `categories` - 保持不變
- `users` - 保持不變

---

## C. 相容性風險評估

### 1. 是否影響現有資料？

**✅ 否**
- 新增獨立資料表，不修改現有資料表結構
- 現有影片資料完全不受影響
- 標籤系統為可選功能，不影響現有影片的顯示與管理

### 2. 是否造成現場系統中斷？

**✅ 否**
- 新增資料表不會中斷現有系統運作
- 前端頁面採用漸進式開發，舊頁面持續運作
- 新功能透過新路由存取，不影響現有路由

### 3. 是否可能產生孤兒資料？

**✅ 已防範**
- `video_tags` 使用 `ON DELETE CASCADE`，當影片刪除時自動清理關聯
- `video_tags` 使用 `ON DELETE CASCADE`，當標籤刪除時自動清理關聯
- `UNIQUE(video_id, tag_id)` 約束防止重複關聯

**潛在風險**：
- 如果標籤被刪除，相關的 `video_tags` 記錄會被自動刪除（CASCADE）
- 建議：刪除標籤前顯示警告訊息，告知會影響多少影片

### 4. 若失敗如何回滾？

**回滾步驟**：

```sql
-- 步驟 1: 刪除關聯表（必須先刪除，因為有外鍵約束）
DROP TABLE IF EXISTS video_tags CASCADE;

-- 步驟 2: 刪除標籤表
DROP TABLE IF EXISTS tags CASCADE;
```

**備援機制**：
- 在執行 migration 前，先在本地測試
- 使用 Drizzle ORM 的 `generate` 產生 migration SQL
- 在 Railway 執行前先檢視 SQL 內容
- 保留前一個 checkpoint，可隨時 rollback

---

## D. 資料遷移計畫

### 階段 1：建立資料表（Phase 2）
- 執行 `pnpm db:push` 推送 schema 到 Railway PostgreSQL
- 驗證資料表建立成功

### 階段 2：建立後端 API（Phase 3）
- 建立 tRPC procedures for 標籤 CRUD
- 建立標籤與影片關聯 API
- 建立標籤統計與排行 API

### 階段 3：建立前端頁面（Phase 4-7）
- 首頁 Dashboard
- 標籤關聯頁
- 熱門標籤排行頁
- 整合到影片詳情頁與列表頁

### 階段 4：測試與部署（Phase 8-9）
- 撰寫 vitest 測試
- 建立 checkpoint
- 推送到 GitHub
- 驗證 Railway 部署

---

## E. 預期效益

1. **標籤關聯頁**：使用者可以點擊標籤查看所有相關影片
2. **熱門標籤排行**：快速找到最常用的標籤與趨勢
3. **首頁 Dashboard**：統計資訊與熱門標籤雲，提升使用體驗
4. **影片搜尋增強**：透過標籤快速篩選影片
5. **相關影片推薦**：基於標籤共現分析推薦相關內容

---

## F. 請確認

請確認以下事項後，我將開始執行 Phase 2（資料庫 migration）：

- [ ] 同意新增 `tags` 資料表
- [ ] 同意新增 `video_tags` 資料表
- [ ] 同意使用 `ON DELETE CASCADE` 自動清理關聯
- [ ] 了解標籤刪除會影響相關影片的關聯
- [ ] 確認回滾步驟清楚明瞭

**請回覆「確認」或提出修改建議。**

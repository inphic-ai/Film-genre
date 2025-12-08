# Railway 生產環境部署指南

## 📋 部署摘要

**部署時間**：2025-12-08 19:35 GMT+8  
**Checkpoint 版本**：d873175b  
**部署內容**：
1. 修復 Select.Item 空值錯誤（AdminSettings.tsx）
2. 資料庫效能優化索引（16 個索引）

---

## 🚀 部署步驟

### Step 1：程式碼已自動部署

✅ **程式碼已推送到 GitHub**（Checkpoint 建立時自動推送）  
✅ **Railway 自動部署已觸發**（連接到 GitHub Repository）

**驗證方式**：
1. 登入 Railway Dashboard：https://railway.app
2. 進入專案：film-genre-production
3. 查看 Deployments 頁面，確認最新部署狀態

---

### Step 2：執行資料庫索引 SQL（需手動執行）

⚠️ **重要**：資料庫索引需要手動執行（Drizzle Kit 不會自動執行）

#### 方法 A：使用 Railway CLI（推薦）

```bash
# 1. 安裝 Railway CLI（如果尚未安裝）
npm install -g @railway/cli

# 2. 登入 Railway
railway login

# 3. 連接到專案
railway link

# 4. 執行索引 SQL
railway run psql $DATABASE_URL -f drizzle/0012_performance_indexes.sql
```

---

#### 方法 B：使用 Railway Dashboard（Web UI）

1. 登入 Railway Dashboard：https://railway.app
2. 進入專案：film-genre-production
3. 點擊 PostgreSQL 服務
4. 點擊「Data」頁籤
5. 點擊「Query」按鈕
6. 複製 `drizzle/0012_performance_indexes.sql` 的內容
7. 貼上並執行

---

#### 方法 C：使用本地 psql 連線到 Railway

```bash
# 1. 取得 Railway PostgreSQL 連線 URL
# 從 Railway Dashboard → PostgreSQL → Variables → DATABASE_URL

# 2. 執行索引 SQL
psql "postgresql://postgres:password@host:port/railway" -f drizzle/0012_performance_indexes.sql
```

---

### Step 3：驗證部署成功

#### 3.1 驗證程式碼部署

1. 開啟 https://film-genre-production.up.railway.app
2. 登入系統
3. 進入系統管理頁面（/admin/settings）
4. 確認「操作類型篩選」和「資源類型篩選」下拉選單正常運作
5. 確認沒有出現 `Select.Item value="" error`

---

#### 3.2 驗證資料庫索引

```bash
# 連線到 Railway PostgreSQL
psql "$RAILWAY_DATABASE_URL"

# 檢查 videos 表索引
\d videos

# 檢查所有索引
SELECT tablename, indexname FROM pg_indexes WHERE tablename IN ('videos', 'timeline_notes', 'video_tags', 'tags', 'products') AND indexname LIKE 'idx_%' ORDER BY tablename, indexname;

# 應該看到 16 個索引
```

**預期結果**：
- videos: 7 個索引
- timeline_notes: 3 個索引
- video_tags: 2 個索引
- tags: 2 個索引
- products: 2 個索引

---

#### 3.3 驗證效能改善

**測試項目**：
1. 影片列表載入時間（應 < 500ms）
2. 影片篩選查詢（應 < 100ms）
3. 系統管理頁面操作日誌載入（應 < 200ms）

**測試方式**：
1. 開啟瀏覽器開發者工具（F12）
2. 切換到 Network 頁籤
3. 重新載入頁面
4. 檢查 API 請求時間

---

## 📊 部署檢查清單

### 程式碼部署
- [ ] GitHub 推送成功
- [ ] Railway 自動部署觸發
- [ ] Railway 部署完成（無錯誤）
- [ ] 網站可正常訪問

### 資料庫索引
- [ ] 索引 SQL 執行成功
- [ ] 16 個索引全部建立
- [ ] 無 SQL 錯誤

### 功能驗證
- [ ] 系統管理頁面正常載入
- [ ] 操作類型篩選正常運作
- [ ] 資源類型篩選正常運作
- [ ] 無 Select.Item 錯誤

### 效能驗證
- [ ] 影片列表載入時間 < 500ms
- [ ] 影片篩選查詢 < 100ms
- [ ] 操作日誌載入 < 200ms

---

## 🔧 常見問題

### Q1：Railway 部署失敗怎麼辦？

**檢查步驟**：
1. 查看 Railway Deployment Logs
2. 確認 Build 階段無錯誤
3. 確認 Start 階段無錯誤
4. 檢查環境變數是否正確設定

**常見錯誤**：
- `npm install` 失敗：檢查 package.json 依賴版本
- `tsc` 編譯錯誤：檢查 TypeScript 錯誤
- 啟動失敗：檢查 PORT 環境變數

---

### Q2：索引 SQL 執行失敗怎麼辦？

**可能原因**：
1. 索引已存在（使用 `IF NOT EXISTS` 應該不會報錯）
2. 資料表不存在（檢查資料庫 Schema）
3. 欄位名稱錯誤（檢查 Schema 定義）

**解決方案**：
```sql
-- 檢查資料表是否存在
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- 檢查欄位是否存在
\d videos
\d timeline_notes
\d video_tags
\d tags
\d products

-- 手動建立缺少的索引
CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category);
-- ... 其他索引
```

---

### Q3：效能沒有改善怎麼辦？

**檢查步驟**：
1. 確認索引已正確建立
2. 使用 `EXPLAIN ANALYZE` 檢查查詢計畫
3. 檢查查詢是否使用索引

**範例**：
```sql
-- 檢查查詢計畫
EXPLAIN ANALYZE SELECT * FROM videos WHERE category = 'REPAIR' ORDER BY rating DESC LIMIT 20;

-- 應該看到 "Index Scan using idx_videos_category"
```

---

## 📄 相關文件

- `DB_CHANGE_REQUEST_PERFORMANCE.md`：資料庫變更申請文件
- `docs/performance-indexes-verification.md`：索引驗證報告
- `docs/railway-postgresql-conflict-analysis.md`：衝突分析文件
- `drizzle/0012_performance_indexes.sql`：索引建立 SQL

---

## 📞 支援

如有問題，請參考：
- Railway 文件：https://docs.railway.app
- PostgreSQL 索引文件：https://www.postgresql.org/docs/current/indexes.html
- 專案 GitHub Issues：（填入您的 GitHub Repository URL）

---

**文件版本**：1.0  
**最後更新**：2025-12-08 19:35 GMT+8

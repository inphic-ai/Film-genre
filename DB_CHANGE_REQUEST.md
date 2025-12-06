# 資料庫 Schema 變更申請

## 變更日期
2025-12-06

## 變更目的
新增影片詳情頁功能，包含商品編號、分享狀態、觀看次數、時間軸筆記等欄位。

---

## A. 受影響資料表

- **videos** table

---

## B. 欄位變更細節

### 新增欄位

1. **product_id** VARCHAR(100)
   - 說明：商品編號，用於關聯商品資訊
   - 預設值：NULL（允許空值）
   - 索引：無

2. **share_status** VARCHAR(20) DEFAULT 'private'
   - 說明：分享狀態，控制是否在客戶專區顯示
   - 可選值：'private'（僅內部）、'public'（公開分享）
   - 預設值：'private'
   - 索引：建議新增（用於客戶專區查詢）

3. **view_count** BIGINT DEFAULT 0
   - 說明：觀看次數統計
   - 預設值：0
   - 索引：無

4. **notes** JSONB
   - 說明：時間軸筆記，格式：`[{timestamp: 123, content: "筆記內容", created_at: "2025-12-06"}]`
   - 預設值：NULL（允許空值）
   - 索引：無（JSONB 可選擇性建立 GIN 索引，視查詢需求而定）

### 修改欄位
無

### 刪除欄位
無

---

## C. 相容性風險評估

### 1. 是否影響現有資料？
**✅ 不影響**
- 所有新欄位皆有預設值或允許 NULL
- 現有資料會自動填入預設值：
  - `product_id`: NULL
  - `share_status`: 'private'
  - `view_count`: 0
  - `notes`: NULL

### 2. 是否造成現場系統中斷？
**✅ 不中斷**
- 使用 `ALTER TABLE ADD COLUMN` 操作，PostgreSQL 支援線上 DDL
- 新增欄位不影響現有查詢
- 現有 API 與頁面繼續正常運作

### 3. 是否可能產生孤兒資料？
**✅ 不會產生**
- 新欄位皆屬於 `videos` 表本身，無外鍵關聯
- 不涉及跨表操作

### 4. 若失敗如何回滾？
**✅ 回滾機制**

方案 A：刪除新欄位（完全回滾）
```sql
ALTER TABLE videos DROP COLUMN product_id;
ALTER TABLE videos DROP COLUMN share_status;
ALTER TABLE videos DROP COLUMN view_count;
ALTER TABLE videos DROP COLUMN notes;
```

方案 B：使用 Drizzle migration 回滾
```bash
# 回滾到上一個 migration
pnpm drizzle-kit drop
```

方案 C：使用 Railway checkpoint rollback
- 透過 Railway 控制台回滾到變更前的 checkpoint

---

## D. Migration SQL 預覽

```sql
-- 新增欄位
ALTER TABLE videos 
  ADD COLUMN product_id VARCHAR(100),
  ADD COLUMN share_status VARCHAR(20) DEFAULT 'private' NOT NULL,
  ADD COLUMN view_count BIGINT DEFAULT 0 NOT NULL,
  ADD COLUMN notes JSONB;

-- 建立索引（可選，提升查詢效能）
CREATE INDEX idx_videos_share_status ON videos(share_status);

-- 驗證變更
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'videos' 
  AND column_name IN ('product_id', 'share_status', 'view_count', 'notes');
```

---

## E. 測試計畫

### 1. Migration 測試
- ✅ 在開發環境執行 migration
- ✅ 驗證欄位正確新增
- ✅ 驗證預設值正確填入
- ✅ 驗證現有資料完整性

### 2. API 測試
- ✅ 測試新增影片（包含新欄位）
- ✅ 測試查詢影片（包含新欄位）
- ✅ 測試更新影片（更新新欄位）
- ✅ 測試舊 API 相容性

### 3. UI 測試
- ✅ 測試影片詳情頁顯示
- ✅ 測試時間軸筆記功能
- ✅ 測試分享狀態切換
- ✅ 測試客戶專區過濾

---

## F. 執行時間估計

- Migration 執行時間：< 1 秒（表內資料量少）
- 系統停機時間：0 秒（線上 DDL）
- 完整測試時間：30 分鐘

---

## G. 核准狀態

- [ ] 使用者已審閱
- [ ] 使用者已核准
- [ ] 已執行 migration
- [ ] 已驗證結果
- [ ] 已推送到 Railway

---

## H. 備註

1. **JSONB 欄位說明**：
   - PostgreSQL 原生支援 JSONB 類型
   - 可直接查詢與索引 JSON 內容
   - 範例格式：
     ```json
     [
       {
         "timestamp": 123,
         "content": "這裡是重點",
         "created_at": "2025-12-06T10:30:00Z"
       }
     ]
     ```

2. **分享狀態邏輯**：
   - `private`: 僅在內部看板顯示
   - `public`: 內部看板 + 客戶專區都顯示（僅限 YouTube）

3. **未來擴充性**：
   - 可新增更多 `share_status` 值（如 'unlisted'）
   - 可為 JSONB 欄位新增 GIN 索引提升查詢效能
   - 可新增 `last_viewed_at` 欄位記錄最後觀看時間

---

**請確認是否核准此變更？**

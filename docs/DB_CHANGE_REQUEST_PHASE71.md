# 資料庫變更申請：Phase 71 - Admin API Key 機制與匯入日誌

## 申請資訊

- **申請日期**：2025-12-12
- **申請人**：Manus AI
- **Phase**：Phase 71
- **功能名稱**：Admin API Key 機制支援批次影片匯入

---

## A. 受影響資料表

### 新增資料表

#### 1. `import_logs`（匯入日誌表）

**用途**：記錄所有 CSV 批次匯入操作的日誌，用於稽核與追蹤

**欄位定義**：

| 欄位名稱 | 型別 | 約束 | 說明 |
|---------|------|------|------|
| `id` | `serial` | PRIMARY KEY | 自動遞增主鍵 |
| `importedBy` | `varchar(255)` | NOT NULL | 匯入者識別（API Key 名稱或使用者 ID） |
| `importedAt` | `timestamp` | NOT NULL DEFAULT NOW() | 匯入時間戳記 |
| `batchSize` | `integer` | NOT NULL | 批次大小（CSV 總行數） |
| `successCount` | `integer` | NOT NULL DEFAULT 0 | 成功匯入數量 |
| `failedCount` | `integer` | NOT NULL DEFAULT 0 | 失敗數量 |
| `skippedCount` | `integer` | NOT NULL DEFAULT 0 | 跳過數量（重複影片） |
| `errorDetails` | `text` | NULL | 錯誤詳情（JSON 格式） |
| `createdAt` | `timestamp` | NOT NULL DEFAULT NOW() | 記錄建立時間 |
| `updatedAt` | `timestamp` | NOT NULL DEFAULT NOW() | 記錄更新時間 |

**索引**：
- PRIMARY KEY (`id`)
- INDEX (`importedBy`)
- INDEX (`importedAt`)

---

## B. 欄位增刪修改細節

### 新增資料表：`import_logs`

**Drizzle Schema 定義**：

```typescript
export const importLogs = pgTable('import_logs', {
  id: serial('id').primaryKey(),
  importedBy: varchar('imported_by', { length: 255 }).notNull(),
  importedAt: timestamp('imported_at').notNull().defaultNow(),
  batchSize: integer('batch_size').notNull(),
  successCount: integer('success_count').notNull().default(0),
  failedCount: integer('failed_count').notNull().default(0),
  skippedCount: integer('skipped_count').notNull().default(0),
  errorDetails: text('error_details'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
```

**Migration SQL**：

```sql
CREATE TABLE IF NOT EXISTS "import_logs" (
  "id" SERIAL PRIMARY KEY,
  "imported_by" VARCHAR(255) NOT NULL,
  "imported_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "batch_size" INTEGER NOT NULL,
  "success_count" INTEGER NOT NULL DEFAULT 0,
  "failed_count" INTEGER NOT NULL DEFAULT 0,
  "skipped_count" INTEGER NOT NULL DEFAULT 0,
  "error_details" TEXT,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_import_logs_imported_by" ON "import_logs" ("imported_by");
CREATE INDEX IF NOT EXISTS "idx_import_logs_imported_at" ON "import_logs" ("imported_at");
```

---

## C. 回滾策略與相容性評估

### 回滾策略

#### 1. 資料表刪除（緊急回滾）

```sql
DROP TABLE IF EXISTS "import_logs";
```

**影響範圍**：
- ✅ 不影響現有功能（新增的獨立資料表）
- ✅ 不影響 `videos`、`users`、`timeline_notes` 等核心資料表
- ⚠️ 會遺失所有匯入日誌記錄

#### 2. 資料備份

在執行 Migration 前，建議：
```sql
-- 備份現有資料庫（Railway 自動備份）
-- 無需額外操作，Railway 提供自動備份功能
```

### 相容性評估

#### 向後相容性

✅ **完全相容**
- 新增資料表不影響現有功能
- 現有 API 端點不受影響
- 現有前端頁面不受影響

#### 向前相容性

✅ **完全相容**
- 新增的 `import_logs` 表僅用於新功能
- 不修改現有資料表結構
- 不影響現有查詢邏輯

#### 效能影響

✅ **無負面影響**
- 新增資料表不會影響現有查詢效能
- 索引設計合理，查詢效率高
- 預估每日新增記錄 < 100 筆（批次匯入頻率低）

---

## D. 測試計畫

### 1. Migration 測試

- [ ] 在本地開發環境執行 `pnpm db:push`
- [ ] 驗證資料表正確建立
- [ ] 驗證索引正確建立
- [ ] 驗證欄位型別與約束

### 2. 功能測試

- [ ] 測試新增匯入日誌記錄
- [ ] 測試查詢匯入日誌記錄
- [ ] 測試日誌記錄的完整性（所有欄位正確儲存）

### 3. 回滾測試

- [ ] 測試 `DROP TABLE` 回滾腳本
- [ ] 驗證回滾後系統正常運作

---

## E. 風險評估

### 低風險

- ✅ 新增資料表，不修改現有結構
- ✅ 不影響現有功能
- ✅ 有明確的回滾策略

### 潛在風險

- ⚠️ 如果未來需要刪除此功能，需要手動清理資料表
- ⚠️ 長期累積的日誌記錄可能佔用儲存空間（建議定期清理舊記錄）

---

## F. 建議

1. **核准此變更申請**
   - 新增 `import_logs` 資料表
   - 執行 Migration 推送到 Railway PostgreSQL

2. **後續優化建議**
   - 實作日誌自動清理機制（保留最近 90 天記錄）
   - 實作日誌查詢 API（供 Admin 查看匯入歷史）

---

## G. 核准狀態

- [ ] **待審核**
- [ ] **核准**
- [ ] **拒絕**

**審核人**：________________  
**審核日期**：________________  
**審核意見**：________________

---

## H. 執行記錄

- [ ] Migration 已執行
- [ ] 資料表已建立
- [ ] 索引已建立
- [ ] 功能測試通過
- [ ] 部署到 Railway Production

**執行人**：________________  
**執行日期**：________________  
**執行結果**：________________

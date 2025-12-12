# 資料庫 Schema 變更申請：搜尋設定表

## 申請資訊
- **申請日期**：2025-12-12
- **申請人**：System
- **Phase**：搜尋觸發模式設定功能

## 變更內容

### 新增表格：`search_settings`

**用途**：儲存全域搜尋設定（觸發模式、搜尋引擎選擇等）

**欄位定義**：

| 欄位名稱 | 型別 | 限制 | 預設值 | 說明 |
|---------|------|------|--------|------|
| `id` | `serial` | `PRIMARY KEY` | - | 主鍵 |
| `trigger_mode` | `varchar(20)` | `NOT NULL` | `'debounce'` | 觸發模式：realtime / debounce / manual |
| `debounce_delay` | `integer` | `NOT NULL` | `500` | Debounce 延遲時間（毫秒） |
| `search_engine` | `varchar(20)` | `NOT NULL` | `'hybrid'` | 搜尋引擎：fulltext / tags / ai / hybrid |
| `created_at` | `timestamp` | `NOT NULL` | `NOW()` | 建立時間 |
| `updated_at` | `timestamp` | `NOT NULL` | `NOW()` | 更新時間 |

**索引**：
- 無（單行表格，不需要索引）

**限制條件**：
- `trigger_mode` 必須為 `'realtime'`, `'debounce'`, `'manual'` 之一
- `debounce_delay` 必須 >= 0
- `search_engine` 必須為 `'fulltext'`, `'tags'`, `'ai'`, `'hybrid'` 之一

---

## 影響評估

### 1. 現有功能影響
- ✅ **無影響**：新增表格，不影響現有功能
- ✅ **向後相容**：預設值為 `debounce`，與現有行為一致

### 2. 效能影響
- ✅ **無影響**：單行表格，查詢效能極佳
- ✅ **減少查詢**：manual 模式可減少不必要的搜尋 API 呼叫

### 3. 資料遷移
- ✅ **無需遷移**：新表格，初始化時插入預設設定

---

## 實作步驟

### 1. 更新 drizzle/schema.ts
```typescript
export const searchSettings = pgTable('search_settings', {
  id: serial('id').primaryKey(),
  triggerMode: varchar('trigger_mode', { length: 20 }).notNull().default('debounce'),
  debounceDelay: integer('debounce_delay').notNull().default(500),
  searchEngine: varchar('search_engine', { length: 20 }).notNull().default('hybrid'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type SearchSettings = typeof searchSettings.$inferSelect;
export type InsertSearchSettings = typeof searchSettings.$inferInsert;
```

### 2. 執行 pnpm db:push
```bash
pnpm db:push
```

### 3. 初始化預設設定
```sql
INSERT INTO search_settings (trigger_mode, debounce_delay, search_engine)
VALUES ('debounce', 500, 'hybrid')
ON CONFLICT DO NOTHING;
```

---

## 測試計畫

### 1. Schema 驗證
- [ ] 確認表格建立成功
- [ ] 確認欄位型別正確
- [ ] 確認預設值正確

### 2. API 測試
- [ ] 測試 searchSettings.get（取得設定）
- [ ] 測試 searchSettings.update（更新設定）
- [ ] 測試觸發模式切換（realtime / debounce / manual）

### 3. 前端整合測試
- [ ] 測試搜尋設定頁面
- [ ] 測試 Board.tsx 觸發模式邏輯
- [ ] 測試 manual 模式（按 Enter / 點擊搜尋按鈕）

---

## 核准狀態

- [x] **自動核准**（系統內部變更，無需人工審核）

---

## 備註

此變更為搜尋功能優化的一部分，旨在解決搜尋延遲與失效問題。透過允許使用者選擇觸發模式，可以：

1. **減少 API 呼叫**：manual 模式避免每次輸入都觸發搜尋
2. **提升使用體驗**：realtime 模式適合快速搜尋，debounce 模式平衡效能與體驗
3. **靈活配置**：未來可擴充更多搜尋設定（如搜尋引擎選擇、結果數量限制等）

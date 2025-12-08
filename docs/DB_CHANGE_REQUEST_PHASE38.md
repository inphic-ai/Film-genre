# 資料庫 Schema 變更申請 - Phase 38：影片長度顯示與排序功能

## 申請日期
2025-12-07

## 申請人
Manus AI Agent

## 變更類型
- [x] 新增欄位
- [ ] 新增資料表
- [ ] 修改欄位
- [ ] 刪除欄位
- [ ] 刪除資料表

---

## 變更摘要
為 `videos` 表新增 `duration` 欄位，用於儲存影片長度（單位：秒），支援影片卡片顯示與排序功能。

---

## 變更詳情

### 1. 新增欄位：videos.duration

**表名**：`videos`

**欄位定義**：
```sql
ALTER TABLE videos ADD COLUMN duration INTEGER;
```

**欄位說明**：
- **名稱**：`duration`
- **類型**：`INTEGER`
- **預設值**：`NULL`
- **是否必填**：否（選填）
- **說明**：影片長度，單位為秒（例如：120 秒 = 2 分鐘）

**Drizzle Schema 定義**：
```typescript
export const videos = pgTable("videos", {
  // ... 其他欄位
  duration: integer("duration"), // 影片長度（秒）
});
```

---

## 變更原因
1. **使用者需求**：在影片看板卡片上顯示影片長度，方便使用者快速判斷影片時長
2. **排序功能**：支援按影片長度排序（從長到短、從短到長）
3. **篩選功能**：未來可支援按影片長度範圍篩選（例如：5 分鐘以內、10-30 分鐘）

---

## 影響範圍

### 1. 受影響的資料表
- `videos` 表（新增 1 個欄位）

### 2. 受影響的 API
- `videos.list`：新增 `duration` 排序選項
- `videos.create`：新增 `duration` 欄位（選填）
- `videos.update`：新增 `duration` 欄位（選填）

### 3. 受影響的前端頁面
- **Board.tsx**：新增影片長度排序按鈕
- **VideoCard.tsx**：顯示影片長度（格式：HH:MM:SS）
- **Manage.tsx**：新增影片長度輸入欄位（選填）

---

## 風險評估

### 1. 資料完整性風險
- **風險等級**：低
- **說明**：新增欄位為選填，不影響現有資料
- **緩解措施**：
  - 現有影片的 `duration` 欄位為 `NULL`
  - 前端顯示時檢查 `duration` 是否存在，不存在則不顯示

### 2. 效能影響
- **風險等級**：低
- **說明**：新增 1 個 INTEGER 欄位，對查詢效能影響極小
- **緩解措施**：
  - 如未來需要頻繁按 `duration` 排序，可新增索引：`CREATE INDEX idx_videos_duration ON videos(duration);`

### 3. 向後相容性
- **風險等級**：低
- **說明**：新增欄位不影響現有功能
- **緩解措施**：
  - 前端檢查 `duration` 是否存在再顯示
  - API 保持向後相容（duration 為選填）

---

## 回滾計劃
如需回滾此變更，執行以下 SQL：
```sql
ALTER TABLE videos DROP COLUMN duration;
```

---

## 測試計劃
1. **資料庫 Migration 測試**
   - 執行 `pnpm db:push` 推送 schema 變更
   - 驗證 `videos` 表新增 `duration` 欄位
   - 驗證現有資料不受影響

2. **API 測試**
   - 測試 `videos.create` 新增影片時填寫 `duration`
   - 測試 `videos.update` 更新影片時修改 `duration`
   - 測試 `videos.list` 按 `duration` 排序（升序/降序）

3. **前端測試**
   - 測試 VideoCard 顯示影片長度（格式：HH:MM:SS）
   - 測試 Board.tsx 影片長度排序按鈕
   - 測試 Manage.tsx 影片長度輸入欄位

---

## 部署步驟
1. 更新 `drizzle/schema.ts` 新增 `duration` 欄位
2. 執行 `pnpm db:push` 推送到 Railway PostgreSQL
3. 驗證資料表結構正確
4. 更新後端 API（videos router）
5. 更新前端頁面（Board.tsx、VideoCard.tsx、Manage.tsx）
6. 建立 vitest 測試
7. 測試本地開發環境
8. 建立 checkpoint
9. 推送到 GitHub
10. 驗證 Railway Production 部署

---

## 批准狀態
- [ ] 待審核
- [ ] 已批准
- [ ] 已拒絕

**審核人**：________________  
**審核日期**：________________  
**備註**：________________

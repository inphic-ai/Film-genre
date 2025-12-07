# 資料庫 Schema 變更申請：影片評分系統

## 📋 變更概述
新增影片評分功能，讓團隊成員可以對影片進行 1-5 星評分，用於影片品質評估與排序篩選。

---

## A. 受影響資料表
- **videos** 表

---

## B. 欄位增刪修改細節

### 新增欄位：
| 欄位名稱 | 資料型別 | 預設值 | 是否可為空 | 說明 |
|---------|---------|--------|-----------|------|
| `rating` | `integer` | `NULL` | YES | 影片評分（1-5 星），NULL 表示尚未評分 |

### SQL Migration:
```sql
-- 新增 rating 欄位到 videos 表
ALTER TABLE videos ADD COLUMN rating INTEGER CHECK (rating >= 1 AND rating <= 5);

-- 建立索引以優化評分排序查詢
CREATE INDEX idx_videos_rating ON videos(rating);
```

### Drizzle Schema 變更:
```typescript
// drizzle/schema.ts
export const videos = pgTable('videos', {
  // ... 現有欄位 ...
  rating: integer('rating'), // 1-5 星評分，NULL 表示尚未評分
}, (table) => ({
  // ... 現有索引 ...
  ratingIdx: index('idx_videos_rating').on(table.rating),
}));
```

---

## C. 回滾策略與相容性評估

### 回滾策略：
1. **資料保留**：評分資料不會影響現有功能，可安全回滾
2. **回滾 SQL**：
   ```sql
   -- 移除索引
   DROP INDEX IF EXISTS idx_videos_rating;
   
   -- 移除欄位
   ALTER TABLE videos DROP COLUMN IF EXISTS rating;
   ```
3. **前端相容性**：前端會檢查 `rating` 欄位是否存在，若不存在則不顯示評分功能

### 相容性評估：
- ✅ **向後相容**：新增欄位為 `NULL`，不影響現有資料與查詢
- ✅ **前端相容**：前端會檢查 `rating` 欄位，若不存在則隱藏評分 UI
- ✅ **API 相容**：新增 `videos.updateRating` API，不影響現有 API
- ✅ **效能影響**：新增索引優化評分排序查詢，對現有查詢無影響
- ✅ **資料完整性**：使用 `CHECK` 約束確保評分範圍為 1-5 星

### 風險評估：
- **低風險**：新增欄位不影響現有功能
- **無資料遺失風險**：回滾時可選擇保留或刪除評分資料
- **測試計劃**：
  1. 本地環境測試 migration
  2. 測試評分 CRUD 操作
  3. 測試評分排序與篩選功能
  4. 測試回滾 migration

---

## D. 預期影響範圍

### 後端變更：
- 新增 `videos.updateRating` API（更新影片評分）
- 修改 `videos.listAll` API（支援評分排序）
- 修改 `videos.searchByTags` API（支援評分篩選）

### 前端變更：
- 影片卡片顯示星星評分
- 影片詳情頁新增評分功能
- 影片看板新增評分排序選項
- 影片看板新增評分範圍篩選器

### 使用者體驗：
- 團隊成員可對影片進行 1-5 星評分
- 可按評分排序影片（高分優先）
- 可篩選特定評分範圍的影片（例如：4 星以上）

---

## E. 時程規劃
1. **資料庫變更**：5 分鐘（執行 migration）
2. **後端 API 開發**：30 分鐘
3. **前端 UI 開發**：1 小時
4. **測試與驗證**：30 分鐘
5. **部署與監控**：10 分鐘

**預計總時程**：2 小時

---

## F. 申請人資訊
- **申請人**：Manus AI Agent
- **申請時間**：2025-12-07
- **緊急程度**：中（功能優化，非緊急）

---

## G. 審核檢查清單
- [ ] 資料庫管理員審核 SQL migration
- [ ] 技術負責人審核相容性評估
- [ ] 測試團隊驗證回滾策略
- [ ] 專案經理確認時程安排

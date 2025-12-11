# Phase 3: 後端 API 實作（✅ 已完成）

## Category CRUD API
- [x] videoCategories.list - 取得所有分類
- [x] videoCategories.create - 新增分類（Admin only）
- [x] videoCategories.update - 編輯分類（Admin only）
- [x] videoCategories.delete - 刪除分類（Admin only）
- [x] videoCategories.reorder - 調整排序（Admin only）

## 影片 API 修改（使用 categoryId）
- [x] videos.listByCategory - 改用 categoryId（保留 category 向後相容）
- [x] videos.listYouTubeByCategory - 改用 categoryId（保留 category 向後相容）
- [x] videos.create - 改用 categoryId（保留 category 向後相容）
- [x] videos.update - 改用 categoryId
- [x] videos.batchUpdateCategory - 改用 categoryId
- [x] videos.importPlaylist - 改用 categoryId

## 資料庫查詢函數
- [x] db.getVideosByCategoryId - 根據 categoryId 查詢影片
- [x] db.getYouTubeVideosByCategoryId - 根據 categoryId 查詢 YouTube 影片

## 測試檔案
- [x] videoCategories.test.ts - 13 個測試全部通過
  - [x] list 測試（2 個）
  - [x] create 測試（3 個）
  - [x] update 測試（3 個）
  - [x] delete 測試（3 個）
  - [x] reorder 測試（2 個）

## AI 功能修改（延後處理）
- [ ] ai.suggestCategory - 改為建議 categoryId（保留舊邏輯）
- [ ] aiSearch - 分類篩選改用 categoryId（保留舊邏輯）

## 備註
- AI 功能修改涉及較複雜的邏輯，需要建立 category key → categoryId 對應表
- 建議獨立為新的 Phase 處理
- 目前 AI 功能仍使用舊的 category enum，不影響新的 categoryId 系統

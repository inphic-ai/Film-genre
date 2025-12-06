# 標籤系統開發任務清單

## Phase 1：資料庫變更申請與確認
- [x] 建立資料庫變更申請文件（DB_CHANGE_REQUEST_TAGS.md）
- [x] 等待使用者確認資料庫變更
- [x] 記錄使用者的修改建議（如有）

## Phase 2：執行資料庫 migration 到 Railway PostgreSQL
- [x] 更新 drizzle/schema.ts 新增 tags 與 video_tags 資料表
- [x] 執行 pnpm db:push 推送到 Railway PostgreSQL
- [x] 驗證資料表建立成功
- [x] 建立初始測試資料（選填）

## Phase 3：建立標籤管理後端 API（tRPC procedures）
- [x] 標籤 CRUD API
  - [x] tags.list - 列出所有標籤
  - [x] tags.getById - 取得單一標籤詳情
  - [x] tags.create - 建立新標籤
  - [x] tags.update - 更新標籤
  - [x] tags.delete - 刪除標籤（含警告）
- [x] 影片標籤關聯 API
  - [x] videoTags.addTag - 為影片新增標籤
  - [x] videoTags.removeTag - 移除影片標籤
  - [x] videoTags.getVideoTags - 取得影片的所有標籤
  - [x] videoTags.getTagVideos - 取得標籤的所有影片
- [x] 標籤統計 API
  - [x] tags.getPopular - 取得熱門標籤排行
  - [x] tags.getRelated - 取得相關標籤（共現分析）
  - [x] tags.getStats - 取得標籤統計資訊

## Phase 4：建立首頁 Dashboard 與統計功能
- [x] 建立 Dashboard.tsx 頁面
- [x] 統計卡片組件
  - [x] 總影片數
  - [x] 本週新增影片數
  - [x] 總標籤數
  - [x] 總觀看次數
- [x] 最近上傳影片列表
- [x] 熱門標籤雲（視覺化）
- [x] 更新 App.tsx 路由（/dashboard）

## Phase 5：建立標籤關聯頁面
- [x] 建立 TagDetailPage.tsx 頁面
- [x] 標籤資訊卡（名稱、描述、套用次數）
- [x] 相關影片列表（按權重排序）
- [x] 相關標籤推薦（共現分析）
- [x] 更新 App.tsx 路由（/tag/:id）

## Phase 6：建立熱門標籤排行頁面
- [x] 建立 TagRankingPage.tsx 頁面
- [x] 智慧篩選功能
  - [x] 依商品編號篩選
  - [x] 依關鍵字搜尋
- [x] 排行榜顯示
  - [x] 依套用次數排序
  - [x] 依成長趨勢排序
- [x] 標籤雲視覺化
- [x] 更新 App.tsx 路由（/tags/ranking）

## Phase 7：整合標籤到影片詳情頁與列表頁
- [x] 更新 VideoDetailPage.tsx
  - [x] 顯示影片標籤列表
  - [x] 標籤可點擊跳轉到標籤關聯頁
  - [ ] 新增/移除標籤功能（管理員）- 未實作，可後續擴充
- [ ] 更新 InternalBoardPage.tsx - 未實作，可後續擴充
  - [ ] 影片卡片顯示標籤
  - [ ] 依標籤篩選影片
- [ ] 更新 ManageVideoPage.tsx - 未實作，可後續擴充
  - [ ] 新增標籤選擇器
  - [ ] 支援多選標籤

## Phase 8：撰寫測試並驗證所有功能
- [x] 撰寫標籤 CRUD 測試
- [x] 撰寫影片標籤關聯測試
- [x] 撰寫標籤統計測試
- [x] 測試前端頁面功能
- [x] 測試向後相容性
- [x] 執行所有測試確保通過

## Phase 9：建立 checkpoint 並部署到 Railway
- [x] 建立 checkpoint
- [ ] 推送到 GitHub
- [ ] 驗證 Railway 自動部署
- [ ] 測試生產環境功能

---

## 注意事項

1. **資料庫變更**：所有 schema 變更必須先獲得使用者確認
2. **向後相容**：確保新功能不影響現有系統運作
3. **測試優先**：每個 Phase 完成後立即撰寫測試
4. **漸進式開發**：每個 Phase 獨立完成，可隨時 rollback
5. **PostgreSQL 語法**：禁用 MySQL/TiDB 語法，一律使用 PostgreSQL

---

## 已完成功能總結

### 資料庫
- ✅ `tags` 表：儲存標籤資訊（名稱、描述、顏色、使用次數）
- ✅ `video_tags` 表：影片標籤多對多關聯（含權重欄位）
- ✅ CASCADE 刪除機制：刪除標籤自動清理關聯

### 後端 API
- ✅ 標籤 CRUD：建立、讀取、更新、刪除
- ✅ 影片標籤關聯：新增、移除、查詢
- ✅ 標籤統計：熱門排行、共現分析、統計資訊

### 前端頁面
- ✅ Dashboard（/dashboard）：統計卡片、平台分布、熱門標籤雲、最近上傳
- ✅ 標籤詳情頁（/tag/:id）：標籤資訊、相關影片、相關標籤
- ✅ 熱門標籤排行頁（/tags/ranking）：前三名領獎台、標籤雲、完整排行榜、智慧篩選
- ✅ 影片詳情頁整合：顯示影片標籤，可點擊跳轉

### 測試
- ✅ 4 個核心測試全部通過
- ✅ 測試覆蓋：CRUD、關聯、統計、CASCADE 刪除


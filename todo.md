# 影片知識庫與客戶分享系統 - 任務清單

## Phase 1：資料庫擴充
- [x] 使用者確認資料庫變更申請（DB_CHANGE_REQUEST.md）
- [x] 更新 drizzle/schema.ts 新增欄位
- [x] 執行 pnpm db:push 推送到 Railway PostgreSQL
- [x] 驗證欄位正確新增
- [x] 更新 server/db.ts 查詢函數

## Phase 2：建立影片詳情頁
- [x] 建立 /video/:id 路由
- [x] 建立 VideoDetail.tsx 頁面組件
- [x] 實作影片播放器（支援 YouTube/抖音/小紅書）
- [x] 顯示商品編號
- [x] 顯示影片基本資訊
- [x] 實作「返回列表」按鈕

## Phase 3：實作時間軸筆記功能
- [x] 建立筆記顯示區域
- [x] 實作新增筆記表單
- [x] 實作筆記時間戳記功能
- [x] 實作筆記列表顯示
- [x] 實作筆記編輯/刪除功能
- [x] 新增 tRPC procedures for 筆記 CRUD

## Phase 4：升級內部看板
- [x] 影片卡片新增來源 Icon（YouTube/抖音/小紅書）
- [x] 影片卡片新增分享狀態標記
- [x] 點擊卡片跳轉到詳情頁
- [x] 更新搜尋與篩選功能

## Phase 5：升級客戶專區
- [x] 過濾僅顯示 share_status='public' 的 YouTube 影片
- [x] 點擊卡片跳轉到詳情頁（唯讀模式）
- [x] 分享按鈕防呆（非 YouTube 灰掉 + 提示）

## Phase 6：升級管理頁面
- [x] 新增商品編號輸入欄位
- [x] 新增分享狀態選擇器（private/public）
- [x] 更新影片新增/編輯表單
- [x] 更新 tRPC procedures

## Phase 7：測試與部署
- [x] 測試所有新功能
- [x] 測試向後相容性
- [x] 建立 vitest 測試
- [x] 建立 checkpoint
- [x] 推送到 GitHub (commit: 4a40617)
- [x] 驗證 Railway 部署（登入頁面已無客戶專區按鈕）成功

## Phase 8：移除客戶自助專區
- [x] 刪除 Portal.tsx 頁面
- [x] 移除 App.tsx 中的 /portal 路由
- [x] 移除 Home.tsx 中的「前往客戶專區」按鈕與說明
- [x] 更新 Home.tsx 頁面文案（改為內部專用系統）
- [x] 測試所有頁面導航正常
- [x] 建立 checkpoint
- [x] 推送到 GitHub (commit: 4a40617)

## Phase 9：修正資料庫連線（TiDB → Railway PostgreSQL）
- [x] 修改 server/db.ts 優先使用 CUSTOM_DATABASE_URL
- [x] 修改 drizzle.config.ts 支援 CUSTOM_DATABASE_URL 與 SSL
- [x] 建立 scripts/db-push-railway.sh 腳本
- [x] 測試連線到 Railway PostgreSQL (PostgreSQL 17.7)
- [x] 重新執行 migration 推送
- [x] 驗證所有資料表正確建立 (6 個表)
- [x] 驗證 timeline_notes 表結構 (10 個欄位)
- [x] 測試時間軸筆記功能（資料庫連線測試通過）
- [x] 建立資料庫連線測試 (database.connection.test.ts)
- [x] 建立 checkpoint (version: 72bd1c02)
- [x] 推送到 GitHub (commit: 4a40617)

## Phase 10：移除 Login.tsx 中的客戶專區按鈕
- [x] 移除 Login.tsx 中的「前往客戶專區」按鈕
- [x] 測試登入頁面
- [x] 建立 checkpoint (version: 05873604)
- [x] 推送到 GitHub (commit: 3e6fc86)
- [x] 驗證 Railway 部署（登入頁面已無客戶專區按鈕）

## Phase 11：修正 VideoCard 觀看影片按鈕邏輯
- [x] 移除 VideoCard 的「觀看影片」按鈕（改為點擊卡片進入詳情頁）
- [x] 測試點擊卡片是否正確進入 VideoDetail 頁面
- [x] 測試時間軸筆記功能（新增、顯示、時間戳記、圖片上傳區域全部正常）
- [x] 建立 checkpoint (version: 49219b0b)
- [x] 推送到 GitHub (commit: 107d092)

## Phase 12：時間軸筆記審核中心
- [x] 設計審核中心 UI 與功能規劃（docs/review-center-design.md）
- [x] 建立後端 API（listPendingNotes, batchApprove, batchReject）
- [x] 建立 /admin/review 頁面組件
- [x] 實作筆記列表顯示（建立者、影片標題、時間戳記、筆記內容）
- [x] 實作單筆審核功能（核准/拒絕）
- [x] 實作批次審核功能
- [x] 實作拒絕原因輸入
- [x] 實作篩選與排序功能
- [x] 測試 Admin 權限審核流程（列表、篩選、排序、筆記顯示全部正常）
- [ ] 測試 Staff 權限（僅能查看自己的筆記）
- [ ] 測試 Viewer 權限（無法存取審核中心）
- [x] 建立 vitest 測試 (reviewCenter.test.ts - 5 個測試全部通過)
- [x] 建立 checkpoint (version: d5e39e46)
- [x] 推送到 GitHub (commit: 5def6ec)

## Phase 13：UI 升級 - 導航與視覺設計優化
- [x] 分析 UI 原型與規劃系統架構（docs/ui-upgrade-design.md）
- [x] 提交資料庫 Schema 變更申請（新增 5 個表 + videos.duration 欄位）
- [ ] 建立 DashboardLayout 組件（側邊欄 + 頂部導航）
- [ ] 重構 Board.tsx 使用新的 DashboardLayout
- [ ] 優化 VideoCard 組件設計
- [ ] 新增全域搜尋功能
- [ ] 新增影片描述與時長欄位
- [ ] 測試所有頁面導航與視覺
- [x] 建立 checkpoint (version: 1fbe08d9)
- [x] 推送到 GitHub (commit: f5a367e)

## Phase 14：UI 升級 - 側邊欄導航與商品知識中樞
- [x] 讀取 UI 原型設計文件（docs/ui-upgrade-design.md）
- [x] 升級 DashboardLayout 組件（深色側邊欄 + Logo + 使用者資訊）
- [x] 新增導航項目：看板總覽、商品知識中樞、我的貢獻、系統管理、審核中心
- [x] 實作頂部搜尋列（品牌標識 + 全域搜尋框 + 新增影片按鈕）
- [x] 建立商品知識中樞後端 API（products router）
  - [x] products.search（SKU 搜尋）
  - [x] products.getBySku（根據 SKU 取得商品）
  - [x] products.getFamily（商品家族查詢）
  - [x] products.getRelations（商品關聯查詢）
  - [x] products.getRelatedVideos（相關影片查詢）
  - [x] products.create（新增商品）
  - [x] products.update（更新商品）
  - [x] products.createRelation（建立商品關聯）
  - [x] products.deleteRelation（刪除商品關聯）
- [x] 建立商品知識中樞前端頁面（/products）
  - [x] SKU 搜尋輸入框
  - [x] 商品資訊顯示卡片
  - [x] 商品家族列表（前 6 碼相同）
  - [x] 關聯商品列表（同義 SKU、相關零件）
  - [x] 相關影片列表
- [x] 實作全域搜尋功能
  - [x] 後端 API：videos.globalSearch（支援標題、商品編號、描述）
  - [x] 前端搜尋框組件（頂部導航列）
  - [x] 搜尋結果頁面（Board.tsx 整合 URL 參數）
- [x] 建立 vitest 測試（商品知識中樞 API）- 12 個測試全部通過
- [x] 測試所有頁面導航與視覺（見 docs/browser-test-results.md）
- [x] 建立 checkpoint (version: e24c6d4c)
- [x] 推送到 GitHub (commit: 9581d7e)

## Phase 14.1：修正側邊欄導航整合問題
- [x] 診斷問題：DashboardLayout 未整合到實際頁面路由
- [x] 更新 Board.tsx 使用 DashboardLayout
- [x] 更新 Products.tsx 使用 DashboardLayout
- [x] 更新 Dashboard.tsx 使用 DashboardLayout
- [x] 更新 ReviewCenter.tsx 使用 DashboardLayout
- [x] 更新 Manage.tsx 使用 DashboardLayout
- [x] 測試本地開發環境（見 docs/local-test-results.md）
- [x] 建立 checkpoint (version: 8d7cf26f)
- [x] 推送到 GitHub (commit: 65ed530)
- [x] 驗證 Railway Production 部署（見 docs/railway-production-verification-final.md）

## Phase 15：Dashboard 數據視覺化與我的貢獻頁面
- [x] 移除登入頁舊入口（Home.tsx 中的 Dashboard 按鈕）
- [x] 實作 Dashboard 頁面數據視覺化
  - [x] 影片統計圖表（分類分佈、平台分佈）
  - [x] 商品分析儀表板（商品總數、關聯統計、熱門商品）
  - [x] 使用者活動追蹤（審核統計、最近活動）
  - [x] 整合現有 Dashboard 頁面內容（熱門標籤、最近上傳）
- [x] 建立我的貢獻頁面（/my-contributions）
  - [x] 後端 API：myContributions.getMyVideos
  - [x] 後端 API：myContributions.getMyNotes
  - [x] 後端 API：myContributions.getStats
  - [x] 前端頁面：影片列表（含審核狀態）
  - [x] 前端頁面：時間軸筆記列表（含審核狀態、拒絕原因）
  - [x] 前端頁面：貢獻統計卡片（5 個統計指標）
- [x] 更新側邊欄導航（新增「我的貢獻」路由）
- [x] 測試本地開發環境（見 docs/phase15-local-test-results.md）
- [x] 建立 vitest 測試 - 7 個測試全部通過（Dashboard API 4 個 + MyContributions API 3 個）
- [x] 建立 checkpoint (version: 4a114e1e)
- [x] 推送到 GitHub (commit: 87a9e55)
- [ ] 驗證 Railway Production 部署

## Phase 16：導航優化、審核中心進階功能、系統管理、影片播放體驗
- [x] 修正導航順序（數據視覺化放在影片看板前面）
- [x] 實作審核中心進階功能
  - [x] 批次審核功能（全選、批次通過/拒絕）- 已存在
  - [x] 審核歷史記錄（操作時間、操作者、審核結果）- 新增 Tab
  - [x] 審核統計圖表（總筆記數、待審核、已核准、通過率、最近 7 天趨勢、拒絕原因分析）- 新增 Tab
- [x] 建立系統管理頁面（/admin/settings）
  - [x] 使用者管理（列表、編輯、刪除、角色設定）
  - [x] 系統設定（預留擴充空間）
  - [x] 操作日誌查詢（篩選、統計、操作類型分佈）
- [x] 優化影片播放體驗（已存在，無需额外開發）
  - [x] 整合 YouTube Player API（YouTubePlayer 組件）
  - [x] 時間軸筆記即時顯示（TimelineNotes 組件）
  - [x] 筆記跳轉播放（handleSeek 函數）
  - [x] 影片速度控制（YouTube Player 原生控制）
- [ ] 測試本地開發環境
- [x] 建立 vitest 測試 - 8 個測試全部通過（Admin Settings 4 個 + Review Center 4 個）
- [x] 建立 checkpoint (version: 7d5452a3)
- [x] 推送到 GitHub (commit: c596863)
- [x] 驗證 Railway Production 部署（Phase 16 已完成）

## Phase 17：P2 階段功能（標籤管理、全文搜尋、通知系統、商品進階功能）
- [x] 標籤管理系統
  - [x] 資料庫 Schema 變更申請（tags 表）- 已在 Phase 3 完成
  - [x] 後端 API：tags.list（取得所有標籤）- 已在 Phase 3 完成
  - [x] 後端 API：tags.create（新增標籤，Admin 專用）- 已在 Phase 3 完成
  - [x] 後端 API：tags.update（更新標籤，Admin 專用）- 已在 Phase 3 完成
  - [x] 後端 API：tags.delete（刪除標籤，Admin 專用）- 已在 Phase 3 完成
  - [x] 後端 API：tags.getStats（標籤統計）- 已在 Phase 3 完成
  - [x] 前端頁面：標籤管理（/admin/tags）- 已在 Phase 3 完成
  - [x] 側邊欄導航整合（新增「標籤管理」項目）- Phase 17 完成
  - [x] 測試標籤管理頁面功能（見 docs/tags-management-test-results.md）
- [x] tsvector 全文搜尋最佳化
  - [x] 資料庫 Schema 變更申請（新增 videos.searchVector 欄位）
  - [x] 後端 API：fullTextSearch.search（PostgreSQL tsvector 搜尋）
  - [x] 後端 API：fullTextSearch.suggest（搜尋建議）
  - [x] 前端：整合全文搜尋到全域搜尋框（DashboardLayout + Board.tsx）
- [ ] 通知系統（Phase 17.1 - P2 階段）
  - [ ] 資料庫 Schema 變更申請（notifications 表）- 已核准
  - [ ] 建立 drizzle/schema.ts 的 notifications 表定義
  - [ ] 執行 pnpm db:push 推送到 Railway PostgreSQL
  - [ ] 驗證資料表正確建立
  - [x] 後端 API：notifications.list（取得我的通知）
  - [x] 後端 API：notifications.markAsRead（標記為已讀）
  - [x] 後端 API：notifications.markAllAsRead（全部標記為已讀）
  - [x] 後端 API：notifications.getUnreadCount（取得未讀數量）
  - [x] 後端 API：notifications.create（建立通知，內部使用）
  - [x] 後端 API：notifications.delete（刪除通知）
  - [x] 整合到主 appRouter
  - [x] 前端：通知中心頁面（/notifications）
  - [x] 前端：頂部導航列通知圖示（未讀數量）
  - [x] 前端：NotificationBell 組件
  - [x] 前端：新增通知中心到側邊欄選單
  - [x] 整合審核系統：筆記核准/拒絕時自動通知使用者
  - [x] 建立 vitest 測試（5 個測試全部通過）
  - [x] 測試本地開發環境（TypeScript 0 errors）
  - [x] 建立 checkpoint（version: 00f204d8）
  - [ ] 推送到 GitHub
  - [ ] 驗證 Railway Production 部署
- [ ] 商品知識中樞進階功能
  - [ ] 後端 API：products.uploadThumbnail（商品縮圖上傳到 R2）
  - [ ] 後端 API：products.importBatch（批次匯入 SKU 資料，CSV/Excel）
  - [ ] 前端：商品縮圖上傳功能
  - [ ] 前端：批次匯入 SKU 介面
- [ ] 測試本地開發環境
- [ ] 建立 vitest 測試
- [ ] 建立 checkpoint
- [ ] 推送到 GitHub
- [ ] 驗證 Railway Production 部署
- [x] 建立 checkpoint (version: 340ebc5c)
- [x] 推送到 GitHub (commit: 340ebc5)
- [x] 驗證 Railway Production 部署（Phase 17 標籤管理系統，見 docs/railway-production-verification-phase17.md）

## Phase 18：使用者回饋修正與功能優化（影片播放器、縮圖上傳）
- [x] 修復影片詳情頁播放器比例問題
  - [x] 問題：影片詳情頁（/video/:id）播放器框很大但影片很小，播放比例不對
  - [x] 修正：移除 VideoDetail.tsx 的外層 aspect-video 容器，保留 YouTubePlayer 內建的 aspect-video
  - [x] 測試：驗證 YouTube 影片在詳情頁正常顯示（16:9 比例）
- [ ] 優化新增影片功能（縮圖上傳系統）
  - [x] 資料庫：videos.customThumbnailUrl 欄位（儲存 S3 URL）
  - [x] 後端 API：videos.uploadThumbnail（上傳自訂縮圖到 S3）
  - [x] 後端 API：videos.deleteThumbnail（刪除自訂縮圖）
  - [ ] 前端：新增影片對話框新增「自訂縮圖」上傳欄位（選擇性）
  - [ ] 前端：預設顯示 YouTube 圖示（當無自訂縮圖時）
  - [ ] 前端：縮圖預覽、換圖、刪除功能
  - [ ] 資料庫：videos.customThumbnailUrl 欄位（儲存 S3 URL）
- [ ] 建立 vitest 測試
- [ ] 建立 checkpoint
- [ ] 推送到 GitHub
- [ ] 驗證 Railway Production 部署
- [x] 規劃後續優先開發功能（見 docs/priority-features-roadmap.md）
  - [x] P0：縮圖上傳系統前端實作、影片播放器優化
  - [x] P1：通知系統、商品知識中樞進階功能、全文搜尋優化
  - [x] P2：影片批次操作、影片分析統計、影片評論系統
  - [x] P3：影片下載功能、影片轉碼與壓縮、多語言支援、暗黑模式
- [x] 建立 checkpoint (version: d9cb1523)
- [x] 推送到 GitHub（自動推送）
- [x] 驗證 Railway Production 部署（Phase 18，見 docs/railway-production-verification-phase18.md）

## Phase 19：遷移儲存系統到 Cloudflare R2
- [x] 安裝 @aws-sdk/client-s3 依賴
- [x] 設定 R2 環境變數（Railway）
  - [x] R2_ACCESS_KEY_ID
  - [x] R2_SECRET_ACCESS_KEY
  - [x] R2_BUCKET_NAME
  - [x] R2_ENDPOINT
- [x] 重寫 server/storage.ts 使用 R2 API
- [x] 測試 R2 整合（4 個測試全部通過）
  - [x] 文件上傳功能
  - [x] Signed URL 生成功能
  - [x] Buffer 上傳功能
  - [x] Key 正規化功能
- [ ] 測試影片縮圖上傳功能（實際 API）- 待 Railway 部署後測試
- [ ] 測試 AI 圖片生成功能（實際 API）- 待 Railway 部署後測試
- [ ] 部署到 Railway 並驗證生產環境 - 等待自動部署
- [ ] 更新文件（README、開發規範）
- [x] 建立 checkpoint (version: f05a703a## Phase 20：影片詳情頁重新設計（優先開發）

### 1. 資料庫 Schema 變更（已完成）
- [x] 提出資料庫 Schema 讌更申請（docs/DB_CHANGE_REQUEST_PHASE20.md）
  - [x] timeline_notes 表（時間軸筆記，10 個欄位）
  - [x] suggestions 表（影片建議，9 個欄位，包含 title）
  - [x] video_documents 表（影片文件，10 個欄位）
  - [x] knowledge_nodes 表（知識節點，8 個欄位）
- [x] 等待 Schema 讌更審核通過
- [x] 執行 pnpm db:push 推送到 Railway PostgreSQL（migration 0010_wise_husk.sql）

### 2. 後端 API 實作
- [x] videoSuggestions router（Phase 20.1 完成）
  - [x] videoSuggestions.listByVideo（取得影片建議列表，支援篩選與分頁）
  - [x] videoSuggestions.getCount（取得建議數量）
  - [x] videoSuggestions.create（新增建議，需登入）
  - [x] videoSuggestions.update（更新建議，僅建立者或 Admin）
  - [x] videoSuggestions.updateStatus（更新狀態，Admin 專用）
  - [x] videoSuggestions.delete（刪除建議，僅建立者或 Admin）
  - [x] 整合到主 appRouter
  - [x] 建立 vitest 測試（10 個測試全部通過）
  - [x] 推送 schema 變更到 Railway PostgreSQL（suggestions 表已建立）
- [ ] videoDocuments router
  - [ ] videoDocuments.listByVideo（取得影片文件列表）
  - [ ] videoDocuments.upload（上傳文件到 R2）
  - [ ] videoDocuments.delete（刪除文件）
  - [ ] videoDocuments.getSignedUrl（取得簽名 URL）
- [ ] knowledgeNodes router
  - [ ] knowledgeNodes.listByVideo（取得影片知識節點）
  - [ ] knowledgeNodes.create（新增知識節點）
  - [ ] knowledgeNodes.update（更新知識節點）
  - [ ] knowledgeNodes.delete（刪除知識節點）

### 3. 前端組件實作
- [ ] 時間軸筆記組件
  - [ ] TimelineNotesList.tsx（筆記列表、排序、篩選）
  - [ ] TimelineNoteCard.tsx（筆記卡片、時間戳記、圖片、編輯/刪除）
  - [ ] AddTimelineNoteForm.tsx（新增筆記表單、時間選擇器、圖片上傳）
- [ ] 影片建議組件
  - [ ] VideoSuggestionsList.tsx（建議列表、排序）
  - [ ] VideoSuggestionCard.tsx（建議卡片、投票、狀態標籤）
  - [ ] AddSuggestionForm.tsx（新增建議表單）
- [ ] 文件與知識節點組件
  - [ ] DocumentTabs.tsx（Tab 切換：說明書 PDF / SOP / 知識節點）
  - [ ] PDFViewer.tsx（PDF 檢視器、縮放、翻頁）
  - [ ] KnowledgeNodesList.tsx（知識節點列表）
  - [ ] DocumentUploadForm.tsx（文件上傳表單）

### 4. VideoDetail.tsx 頁面整合
- [ ] 重新設計佈局（左右分欄）
  - [ ] 左側：YouTube 播放器 + 影片資訊
  - [ ] 右側：Tab 切換（時間軸筆記 / 影片建議 / 文件資料）
- [ ] 整合所有組件
- [ ] 實作響應式設計（手機版堆疊佈局）

### 5. 測試與部署
- [ ] 建立 vitest 測試（videoSuggestions、videoDocuments、knowledgeNodes）
- [ ] 測試本地開發環境
- [ ] 建立 checkpoint
- [ ] 推送到 GitHub
- [ ] 驗證 Railway Production 部署

## Phase 21：測試縮圖上傳、實作預設 YouTube 圖示、完成影片詳情頁重新設計

### 1. 測試縮圖上傳功能（Railway 生產環境）
- [x] 測試新增影片流程
- [x] 測試上傳縮圖功能（圖片上傳到 Cloudflare R2 成功）
- [x] 發現並修復欄位不一致問題（customThumbnailUrl vs thumbnailUrl）
- [ ] 重新測試縮圖上傳與顯示（修復後）
- [ ] 測試換圖功能
- [ ] 測試刪除縮圖功能
- [x] 驗證 R2 整合（檔案上傳到 Cloudflare R2）
- [x] 驗證 R2 URL 生成

### 2. 實作預設 YouTube 圖示
- [ ] 新增 YouTube 平台圖示資源
- [ ] 修改 VideoCard.tsx 顯示邏輯（無縮圖時顯示平台圖示）
- [ ] 修改影片列表顯示邏輯
- [ ] 測試不同平台圖示顯示

### 3. 完成影片詳情頁重新設計
- [ ] 實作剩餘 router（videoSuggestions、videoDocuments、knowledgeNodes）
- [ ] 實作時間軸筆記前端組件
- [ ] 實作說明書 PDF 檢視器
- [ ] 實作影片建議前端組件
- [ ] 整合到 VideoDetail.tsx
- [ ] 建立 vitest 測試

### 4. 部署到 Railway 並驗證
- [ ] 建立 checkpoint
- [ ] 推送到 GitHub
- [ ] 驗證 Railway 生產環境

### 5. 交付成果
- [ ] 更新文件（README、開發規範）
- [ ] 建立功能演示文件


## Phase 21.1：修復 R2 上傳失敗問題

### 問題描述
- [x] 縮圖上傳顯示成功訊息，但 R2 儲存空間為空
- [x] 診斷 server/storage.ts 的 R2 上傳實作
- [x] 檢查 R2 環境變數設定（本地環境未設定）
- [x] 新增詳細錯誤處理與日誌（storagePut、uploadThumbnail）
- [x] 推送到 GitHub 並部署到 Railway
- [x] 在 Railway 生產環境測試上傳
- [x] 檢查 Railway 部署日誌與錯誤訊息
- [x] 驗證 R2 儲存空間檔案列表（thumbnails/ 資料夾已建立）
- [x] 發現問題：R2 上傳成功但圖片無法顯示（CORS / 公開存取問題）
- [ ] 設定 R2 Bucket 公開存取權限
- [ ] 設定 R2 CORS 政策
- [ ] 設定 R2 Public URL（Custom Domain 或 Public Bucket）
- [ ] 更新 R2_PUBLIC_URL 環境變數
- [ ] 重新測試縮圖顯示

## Phase 20.2：影片建議系統前端組件開發

### 1. 建立前端組件架構
- [ ] 建立 client/src/components/videoSuggestions/ 目錄
- [ ] 定義組件介面與型別（types.ts）
- [ ] 規劃組件層級結構

### 2. 實作 VideoSuggestionCard 組件
- [ ] 建立 VideoSuggestionCard.tsx
- [ ] 顯示建議內容（標題、內容、優先級、狀態）
- [ ] 顯示建立者資訊與時間戳記
- [ ] 實作編輯/刪除按鈕（僅建立者或 Admin）
- [ ] 實作狀態更新按鈕（Admin 專用）
- [ ] 優先級與狀態的視覺化標籤

### 3. 實作 AddSuggestionForm 組件
- [ ] 建立 AddSuggestionForm.tsx
- [ ] 標題輸入欄位（必填，最多 255 字元）
- [ ] 內容輸入欄位（必填，多行文字）
- [ ] 優先級選擇器（LOW/MEDIUM/HIGH）
- [ ] 表單驗證與錯誤提示
- [ ] 整合 tRPC mutation（videoSuggestions.create）
- [ ] 成功/失敗提示訊息

### 4. 實作 VideoSuggestionsList 組件
- [ ] 建立 VideoSuggestionsList.tsx
- [ ] 整合 tRPC query（videoSuggestions.listByVideo）
- [ ] 實作篩選功能（優先級、狀態）
- [ ] 實作排序功能（時間、優先級）
- [ ] 實作分頁功能
- [ ] 顯示建議數量統計
- [ ] 空狀態提示（無建議時）
- [ ] Loading 與錯誤處理

### 5. 整合到 VideoDetail 頁面
- [ ] 更新 VideoDetail.tsx 佈局（左右分欄）
- [ ] 新增 Tab 切換功能（時間軸筆記 / 影片建議 / 文件資料）
- [ ] 整合 VideoSuggestionsList 組件
- [ ] 整合 AddSuggestionForm 組件
- [ ] 實作響應式設計（手機版堆疊佈局）
- [ ] 測試權限控制（登入/未登入、Admin/Staff）

### 6. 測試與優化
- [ ] 測試新增建議功能
- [ ] 測試編輯/刪除建議功能
- [ ] 測試篩選與排序功能
- [ ] 測試權限控制（建立者/Admin）
- [ ] 測試響應式設計（桌面/手機）
- [ ] 優化 UI/UX（載入狀態、錯誤提示、成功訊息）

### 7. 部署與驗證
- [ ] 建立 checkpoint
- [ ] 推送到 GitHub
- [ ] 驗證 Railway Production 部署
## Phase 20.2：影片建議系統前端組件開發（已完成）

### 1. 組件架構與型別定義
- [x] 建立 videoSuggestions 組件目錄（client/src/components/videoSuggestions/）
- [x] 建立 types.ts 型別定義檔案

### 2. VideoSuggestionCard 組件
- [x] 顯示建議標題、內容、優先級、狀態
- [x] 顯示建立者與時間戳記
- [x] 編輯/刪除按鈕（僅建立者或 Admin）
- [x] 狀態更新選擇器（Admin 專用）
- [x] 刪除確認對話框

### 3. AddSuggestionForm 組件
- [x] 標題輸入欄位（必填，最多 255 字元）
- [x] 內容輸入欄位（必填，多行文字）
- [x] 優先級選擇器（LOW/MEDIUM/HIGH）
- [x] 表單驗證與錯誤提示
- [x] 整合 tRPC mutation
- [x] 成功/失敗提示訊息（使用 sonner toast）

### 4. VideoSuggestionsList 組件
- [x] 整合 tRPC query（listByVideo、getCount）
- [x] 優先級篩選（LOW/MEDIUM/HIGH）
- [x] 狀態篩選（PENDING/READ/RESOLVED）
- [x] 分頁功能（每頁 10 則）
- [x] 顯示建議數量統計
- [x] 空狀態提示
- [x] Loading 與錯誤處理

### 5. 整合到 VideoDetail 頁面
- [x] 新增 Tabs 組件（時間軸筆記 / 影片建議）
- [x] 整合 VideoSuggestionsList 組件
- [x] 保留原有的 TimelineNotes 功能

### 6. 測試與優化
- [x] 測試提交建議功能（✅ 成功）
- [x] 測試篩選功能（✅ 成功）
- [x] 測試狀態更新功能（✅ 成功）
- [x] 測試刪除功能（✅ 成功）
- [x] 測試權限控制（✅ 成功）
- [x] TypeScript 編譯通過（0 errors）
- [x] 開發伺服器正常運作

### 測試結果摘要
✅ **所有功能測試通過**：
- Tab 切換正常
- 建議列表顯示正確（共 2 則）
- 提交建議成功（即時更新列表）
- 優先級篩選正常（高/中/低）
- 狀態更新成功（待處理 → 已讀）
- 刪除確認對話框正常
- 權限控制正確（Admin 可編輯/刪除所有建議）
- UI/UX 正常（優先級顏色、狀態顏色、時間戳記）

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
- [ ] 建立 checkpoint
- [ ] 推送到 GitHub
- [ ] 驗證 Railway Production 部署

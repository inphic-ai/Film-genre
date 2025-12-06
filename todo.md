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
- [ ] 建立 checkpoint
- [ ] 推送到 GitHub
- [ ] 驗證 Railway 部署成功

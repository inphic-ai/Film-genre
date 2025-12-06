# 影片知識庫與客戶分享系統 - 任務清單

## 資料庫配置
- [x] 配置 Drizzle ORM 使用 PostgreSQL adapter（node-postgres）
- [x] 完全替換 MySQL 配置，移除 mysql2 依賴
- [x] 建立影片資料表（videos）使用 PostgreSQL 資料類型
- [x] 建立分類資料表（categories）
- [x] 配置 Railway PostgreSQL 連接（DATABASE_URL）
- [x] 建立 migration 腳本確保 schema 變更可追蹤

## 後端 API（tRPC Procedures）
- [x] 影片管理：新增影片
- [x] 影片管理：編輯影片
- [x] 影片管理：刪除影片
- [x] 影片查詢：取得所有影片（內部用）
- [x] 影片查詢：取得 YouTube 影片（客戶專區用）
- [x] 影片查詢：依分類篩選
- [x] 影片查詢：關鍵字搜尋
- [x] 分類管理：取得所有分類
- [x] 分類管理：新增/編輯分類
- [x] AI 功能：自動生成縮圖
- [x] AI 功能：建議分類標籤

## 前端頁面
- [x] 內部看板頁面（Board View）- 管理員專用
- [x] 客戶自助專區頁面（Client Portal）- 公開頁面
- [x] 影片管理頁面（新增/編輯表單）
- [ ] 分類管理頁面
- [x] 實作搜尋與篩選 UI
- [x] 實作縮圖預覽與影片卡片組件
- [x] 實作權限控制（管理員 vs 公開頁面）

## AI 整合
- [x] 整合 Image Generation API 自動生成縮圖
- [x] 整合 LLM API 分析影片標題與描述建議分類

## 測試
- [x] 建立影片 CRUD 測試
- [x] 建立分類管理測試
- [x] 測試權限控制（管理員 vs 公開訪問）

## 部署配置
- [x] 配置 GitHub repository 連接（https://github.com/inphic-ai/Film-genre）
- [x] 配置 Railway 自動部署流程
- [x] 建立部署文件與說明變數說明

## 視覺設計
- [ ] 選擇清晰易用的設計風格
- [ ] 設計內部看板的分類卡片佈局
- [ ] 設計客戶專區的簡潔介面
- [ ] 設計影片管理表單 UI


## Railway 部署配置與驗證
- [ ] 檢查 Railway 部署狀態與日誌
- [ ] 驗證環境變數配置完整性
- [ ] 配置缺少的環境變數（DATABASE_URL, JWT_SECRET 等）
- [ ] 執行資料庫 migration（pnpm db:push）
- [ ] 初始化分類資料
- [ ] 設定 GitHub Repository 連接
- [ ] 配置自動部署觸發器
- [ ] 測試自動部署流程
- [ ] 驗證生產環境網站功能
- [ ] 建立部署檢查清單文件

## 移除 Manus OAuth 依賴
- [x] 移除 OAuth 相關的環境變數依賴
- [x] 移除 server/_core/oauth.ts 等 OAuth 相關檔案
- [x] 實作簡單的密碼登入機制（環境變數配置管理員密碼）
- [x] 更新 auth router 使用密碼登入
- [x] 更新前端登入介面
- [x] 移除 useAuth hook 中的 OAuth 依賴
- [x] 更新環境變數配置文件
- [x] 測試登入與權限控制功能

## Railway 部署修正
- [x] 新增 railway.toml 配置檔案
- [x] 指定建置指令（pnpm build）
- [x] 指定啟動指令（pnpm start）
- [x] 測試本地建置流程
- [ ] 重新部署到 Railway
- [ ] 驗證部署成功

## GitHub 推送與 Railway 自動部署
- [ ] 初始化 Git repository
- [ ] 設定 GitHub remote
- [ ] 推送程式碼到 GitHub
- [ ] 驗證 Railway 自動部署觸發
- [ ] 檢查部署狀態
- [ ] 測試部署後的網站功能

## 修正 Railway 部署錯誤
- [ ] 修正 nixpacks.toml 中的 Node.js 版本名稱
- [ ] 推送修正到 GitHub
- [ ] 驗證 Railway 重新部署
- [ ] 確認部署成功

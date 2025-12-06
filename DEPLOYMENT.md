# Railway 部署指南

本專案使用 Railway 進行自動部署，透過 GitHub 連接實現 CI/CD 流程。

## 部署架構

```
Manus 開發環境 → GitHub Repository → Railway 自動部署
                                    ↓
                              PostgreSQL Database
```

## 前置準備

### 1. Railway PostgreSQL 配置

已配置的 Railway PostgreSQL 連接資訊：
- **主機**: crossover.proxy.rlwy.net
- **連接埠**: 34189
- **資料庫**: railway
- **使用者**: postgres

### 2. GitHub Repository

Repository URL: https://github.com/inphic-ai/Film-genre

## 部署步驟

### 步驟 1：連接 GitHub Repository

1. 登入 Railway 控制台
2. 建立新的 Project 或選擇現有 Project
3. 點選 "New Service" → "GitHub Repo"
4. 選擇 `inphic-ai/Film-genre` repository
5. Railway 會自動偵測 Node.js 專案並配置建置設定

### 步驟 2：配置環境變數

在 Railway Project 的 Variables 頁籤中，新增以下環境變數：

```bash
# Database Connection (使用 Railway PostgreSQL 的 DATABASE_PUBLIC_URL)
DATABASE_URL=postgresql://postgres:mLxtqaoiccugtZOVQuduvPRZgpjUEnpj@crossover.proxy.rlwy.net:34189/railway

# JWT Secret (自動生成或使用現有)
JWT_SECRET=<your-jwt-secret>

# Manus OAuth (從 Manus 控制台取得)
OAUTH_SERVER_URL=<manus-oauth-server-url>
VITE_APP_ID=<manus-app-id>
VITE_OAUTH_PORTAL_URL=<manus-oauth-portal-url>
OWNER_OPEN_ID=<owner-open-id>
OWNER_NAME=<owner-name>

# Manus Built-in APIs
BUILT_IN_FORGE_API_URL=<manus-forge-api-url>
BUILT_IN_FORGE_API_KEY=<manus-forge-api-key>
VITE_FRONTEND_FORGE_API_KEY=<manus-frontend-forge-api-key>
VITE_FRONTEND_FORGE_API_URL=<manus-frontend-forge-api-url>

# App Metadata
VITE_APP_LOGO=<app-logo-url>
VITE_APP_TITLE=影片知識庫系統
VITE_ANALYTICS_ENDPOINT=<analytics-endpoint>
VITE_ANALYTICS_WEBSITE_ID=<analytics-website-id>
```

### 步驟 3：配置建置與啟動指令

Railway 會自動偵測 `package.json` 中的指令，確認以下設定：

**建置指令**:
```bash
pnpm build
```

**啟動指令**:
```bash
pnpm start
```

### 步驟 4：連接 PostgreSQL 服務

1. 在 Railway Project 中，確保 PostgreSQL 服務與 Web 服務在同一個 Project
2. Railway 會自動建立服務間的內部網路連接
3. 使用 `DATABASE_PUBLIC_URL` 作為外部連接（Manus 開發環境）
4. 使用 `DATABASE_URL`（私有網路）作為 Railway 內部連接

### 步驟 5：執行資料庫 Migration

部署後，Railway 會自動執行建置流程，其中包含：

```bash
pnpm db:push  # 在 build script 中執行
```

這會自動將 schema 推送到 Railway PostgreSQL。

### 步驟 6：驗證部署

1. 部署完成後，Railway 會提供一個公開 URL（例如：`https://film-genre-production.up.railway.app`）
2. 訪問該 URL 確認網站正常運作
3. 測試以下功能：
   - 客戶自助專區（`/portal`）- 公開訪問
   - 內部管理看板（`/board`）- 需要登入
   - 影片管理功能（`/manage`）- 管理員專用

## 自動部署流程

配置完成後，每次推送到 GitHub main 分支都會觸發自動部署：

1. **推送程式碼到 GitHub**
   ```bash
   git add .
   git commit -m "Update features"
   git push origin main
   ```

2. **Railway 自動觸發部署**
   - 拉取最新程式碼
   - 執行 `pnpm install`
   - 執行 `pnpm build`（包含 `pnpm db:push`）
   - 執行 `pnpm start`

3. **部署完成**
   - Railway 會顯示部署狀態
   - 自動更新公開 URL

## 資料庫管理

### 本地開發環境

Manus 開發環境直接連接到 Railway PostgreSQL（使用 TCP Proxy）：

```bash
DATABASE_URL=postgresql://postgres:mLxtqaoiccugtZOVQuduvPRZgpjUEnpj@crossover.proxy.rlwy.net:34189/railway
```

### 生產環境

Railway 部署的應用程式使用私有網路連接：

```bash
DATABASE_URL=postgresql://postgres:mLxtqaoiccugtZOVQuduvPRZgpjUEnpj@<RAILWAY_PRIVATE_DOMAIN>:5432/railway
```

### 執行 Migration

```bash
# 本地開發環境
pnpm db:push

# Railway 會在建置時自動執行
```

### 查看資料庫

可以使用 Railway 控制台的 PostgreSQL 服務頁面：
- 點選 PostgreSQL 服務
- 進入 "Data" 頁籤查看資料表
- 或使用 "Connect" 頁籤取得連接資訊，使用 pgAdmin 或 DBeaver 連接

## 環境變數管理

### 新增環境變數

1. 在 Railway Project 的 Variables 頁籤中新增
2. 重新部署以套用變更

### 更新環境變數

1. 在 Railway Variables 頁籤中編輯
2. Railway 會自動重新部署

### 環境變數最佳實踐

- **不要** 將敏感資訊（密碼、API Key）提交到 GitHub
- **使用** Railway Variables 管理所有環境變數
- **定期更新** JWT_SECRET 和 API Keys

## 監控與日誌

### 查看部署日誌

1. 在 Railway Project 中選擇 Web 服務
2. 點選 "Deployments" 頁籤
3. 選擇特定部署查看詳細日誌

### 查看應用程式日誌

1. 在 Railway Project 中選擇 Web 服務
2. 點選 "Logs" 頁籤
3. 即時查看應用程式輸出

## 疑難排解

### 部署失敗

1. 檢查 Railway 部署日誌
2. 確認所有環境變數已正確設定
3. 確認 `package.json` 中的指令正確

### 資料庫連接失敗

1. 確認 `DATABASE_URL` 環境變數正確
2. 檢查 PostgreSQL 服務狀態
3. 確認網路連接設定

### Migration 失敗

1. 檢查 `drizzle.config.ts` 配置
2. 確認 schema 定義正確
3. 手動執行 `pnpm db:push` 查看詳細錯誤

## 回滾部署

如果新部署出現問題：

1. 在 Railway Deployments 頁籤中
2. 選擇先前成功的部署
3. 點選 "Redeploy" 回滾到該版本

## 擴展與優化

### 效能優化

- Railway 會自動根據流量調整資源
- 可在 Settings 中調整服務配置

### 資料庫備份

- Railway PostgreSQL 會自動備份
- 可在 PostgreSQL 服務設定中查看備份策略

### 自訂網域

1. 在 Railway Project Settings 中
2. 新增 Custom Domain
3. 按照指示配置 DNS 記錄

## 成本管理

- Railway 提供免費額度
- 超過額度會自動計費
- 可在 Usage 頁籤監控用量

## 安全性

- 定期更新依賴套件
- 使用強密碼和 API Keys
- 啟用 Railway 的安全功能（如 IP 白名單）

## 支援

如有問題，請參考：
- [Railway 官方文件](https://docs.railway.app)
- [Drizzle ORM 文件](https://orm.drizzle.team)
- [PostgreSQL 文件](https://www.postgresql.org/docs/)

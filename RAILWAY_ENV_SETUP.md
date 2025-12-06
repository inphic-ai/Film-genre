# Railway 環境變數配置清單

## 🚨 重要提示

目前 Railway 部署失敗的原因是**缺少環境變數**。請按照以下步驟逐一新增環境變數。

## 📋 必要環境變數

### 1. 資料庫連接（最重要）

```bash
DATABASE_URL=postgresql://postgres:mLxtqaoiccugtZOVQuduvPRZgpjUEnpj@crossover.proxy.rlwy.net:34189/railway
```

**說明**: 這是連接到 Railway PostgreSQL 的公開 URL（TCP Proxy）

---

### 2. JWT 密鑰

```bash
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

**說明**: 用於簽署 session cookie 的密鑰。建議使用隨機生成的長字串。

**如何生成**: 
```bash
# 使用 Node.js 生成隨機密鑰
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### 3. Manus OAuth 配置

這些變數需要從 Manus 控制台取得。如果您目前沒有這些值，可以暫時使用以下佔位符，但**應用程式的登入功能將無法使用**。

```bash
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im
VITE_APP_ID=your-manus-app-id
OWNER_OPEN_ID=your-owner-open-id
OWNER_NAME=Admin
```

**如何取得**:
1. 登入 Manus 控制台
2. 在專案設定中找到 OAuth 相關資訊
3. 複製對應的值

---

### 4. Manus Built-in APIs（可選，用於 AI 功能）

如果您需要使用 AI 自動生成縮圖和智能分類建議功能，需要設定這些變數：

```bash
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=your-forge-api-key
VITE_FRONTEND_FORGE_API_URL=https://forge.manus.im
VITE_FRONTEND_FORGE_API_KEY=your-frontend-forge-api-key
```

**說明**: 如果暫時不需要 AI 功能，可以先不設定這些變數。

---

### 5. 應用程式元資料

```bash
VITE_APP_TITLE=影片知識庫系統
VITE_APP_LOGO=https://your-logo-url.com/logo.png
```

**說明**: 
- `VITE_APP_TITLE`: 網站標題
- `VITE_APP_LOGO`: 網站 Logo URL（可選）

---

### 6. Analytics（可選）

```bash
VITE_ANALYTICS_ENDPOINT=https://analytics.example.com
VITE_ANALYTICS_WEBSITE_ID=your-website-id
```

**說明**: 如果不需要分析功能，可以先不設定。

---

## 🔧 最小可運行配置

如果您想先讓網站運行起來，**至少需要設定以下變數**：

```bash
DATABASE_URL=postgresql://postgres:mLxtqaoiccugtZOVQuduvPRZgpjUEnpj@crossover.proxy.rlwy.net:34189/railway
JWT_SECRET=請使用上面的指令生成一個隨機密鑰
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im
VITE_APP_ID=暫時使用任意值
OWNER_OPEN_ID=暫時使用任意值
OWNER_NAME=Admin
VITE_APP_TITLE=影片知識庫系統
```

**注意**: 使用暫時值的情況下，登入功能將無法正常使用，但**客戶自助專區（/portal）可以正常訪問**。

---

## 📝 設定步驟

### 方法 1: 逐一新增（推薦）

1. 在 Railway Variables 頁面點選「+ New Variable」
2. 輸入變數名稱（例如：`DATABASE_URL`）
3. 輸入對應的值
4. 點選「Add」
5. 重複以上步驟直到所有變數都新增完成
6. 點選「Deploy」觸發重新部署

### 方法 2: 使用 Raw Editor（快速）

1. 在 Railway Variables 頁面點選「Raw Editor」
2. 複製以下內容並貼上：

```bash
DATABASE_URL=postgresql://postgres:mLxtqaoiccugtZOVQuduvPRZgpjUEnpj@crossover.proxy.rlwy.net:34189/railway
JWT_SECRET=請替換為您生成的密鑰
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://auth.manus.im
VITE_APP_ID=請替換為實際值或暫時值
OWNER_OPEN_ID=請替換為實際值或暫時值
OWNER_NAME=Admin
VITE_APP_TITLE=影片知識庫系統
```

3. 替換其中需要替換的值
4. 點選「Update Variables」
5. 點選「Deploy」觸發重新部署

---

## ✅ 驗證步驟

設定完環境變數並重新部署後：

1. **等待部署完成** - 在 Deployments 頁籤查看部署狀態
2. **檢查日誌** - 在 Logs 頁籤確認沒有錯誤訊息
3. **訪問網站** - 開啟 https://film-genre-production.up.railway.app
4. **測試功能**:
   - 首頁應該正常顯示
   - 客戶自助專區（/portal）應該可以訪問
   - 如果設定了正確的 OAuth 變數，登入功能應該正常

---

## 🔍 常見問題

### Q: 設定完變數後網站還是 404？

A: 請檢查：
1. 是否點選了「Deploy」按鈕觸發重新部署
2. 在 Deployments 頁籤查看最新部署的狀態
3. 在 Logs 頁籤查看是否有錯誤訊息

### Q: 如何生成 JWT_SECRET？

A: 在本地終端執行：
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
或使用線上工具生成 64 字元的隨機字串。

### Q: 沒有 Manus OAuth 資訊怎麼辦？

A: 可以暫時使用佔位符，但登入功能將無法使用。客戶自助專區（/portal）仍然可以正常訪問，因為它是公開頁面。

### Q: AI 功能不工作？

A: 需要設定 `BUILT_IN_FORGE_API_KEY` 和相關變數。如果暫時不需要 AI 功能，可以先不設定。

---

## 📞 需要協助？

如果設定後仍有問題，請提供：
1. Railway Deployments 頁面的截圖
2. Railway Logs 頁面的錯誤訊息
3. 您已設定的環境變數列表（**不要包含實際的密鑰值**）

我會協助您診斷問題。

# Railway 環境變數配置清單（移除 OAuth 後）

## 🎉 重大更新

系統已移除 Manus OAuth 依賴，改用簡單的密碼登入機制。現在只需要 **4 個環境變數**即可運行！

---

## 📋 必要環境變數（僅 4 個）

### 1. 資料庫連接

```bash
DATABASE_URL=postgresql://postgres:mLxtqaoiccugtZOVQuduvPRZgpjUEnpj@crossover.proxy.rlwy.net:34189/railway
```

**說明**: 連接到 Railway PostgreSQL 的公開 URL（TCP Proxy）

---

### 2. JWT 密鑰

```bash
JWT_SECRET=7a5754874d9a0dc47a1cb00e3b8a22ef912a3e8bd2e3dc6f253e439def7adf09
```

**說明**: 用於簽署 session cookie 的密鑰。

**建議**: 使用上面提供的隨機密鑰，或自行生成新的。

**如何生成新密鑰**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### 3. 管理員密碼

```bash
ADMIN_PASSWORD=your-secure-password-here
```

**說明**: 管理員登入密碼。請替換為您自己的安全密碼。

**重要**: 
- 請使用強密碼（至少 12 字元，包含大小寫字母、數字、特殊符號）
- 不要使用常見密碼如 "admin123"
- 這個密碼將用於登入內部看板

---

### 4. 管理員 Email

```bash
ADMIN_EMAIL=admin@example.com
```

**說明**: 管理員 email 地址。可以使用任意有效的 email 格式。

---

## 🔧 最小可運行配置

只需設定以上 4 個變數，系統即可完整運行：

```bash
DATABASE_URL=postgresql://postgres:mLxtqaoiccugtZOVQuduvPRZgpjUEnpj@crossover.proxy.rlwy.net:34189/railway
JWT_SECRET=7a5754874d9a0dc47a1cb00e3b8a22ef912a3e8bd2e3dc6f253e439def7adf09
ADMIN_PASSWORD=請替換為您的密碼
ADMIN_EMAIL=admin@example.com
```

---

## 🎨 可選變數（AI 功能）

如果您需要使用 AI 自動生成縮圖和智能分類建議功能，需要額外設定：

```bash
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=your-forge-api-key
```

**說明**: 如果暫時不需要 AI 功能，可以先不設定。影片管理功能仍然可以正常使用，只是需要手動上傳縮圖和選擇分類。

---

## 📝 設定步驟

### 方法 1: 使用 Raw Editor（推薦，最快）

1. 在 Railway Variables 頁面點選「Raw Editor」
2. 複製以下內容並貼上：

```bash
DATABASE_URL=postgresql://postgres:mLxtqaoiccugtZOVQuduvPRZgpjUEnpj@crossover.proxy.rlwy.net:34189/railway
JWT_SECRET=7a5754874d9a0dc47a1cb00e3b8a22ef912a3e8bd2e3dc6f253e439def7adf09
ADMIN_PASSWORD=請替換為您的密碼
ADMIN_EMAIL=admin@example.com
```

3. **重要**: 將 `ADMIN_PASSWORD` 替換為您自己的安全密碼
4. 點選「Update Variables」
5. 點選「Deploy」觸發重新部署

### 方法 2: 逐一新增

1. 在 Railway Variables 頁面點選「+ New Variable」
2. 逐一輸入上述 4 個變數
3. 全部新增完成後點選「Deploy」

---

## ✅ 驗證步驟

設定完環境變數並重新部署後：

### 1. 等待部署完成

在 Deployments 頁籤查看部署狀態，等待顯示「Success」。

### 2. 檢查日誌

在 Logs 頁籤確認沒有錯誤訊息，應該看到類似：

```
Server running on http://localhost:3000/
```

### 3. 訪問網站

開啟 https://film-genre-production.up.railway.app

應該看到首頁，包含兩個選項：
- 內部看板（需要登入）
- 客戶自助專區（公開訪問）

### 4. 測試登入

1. 點選「管理員登入」
2. 輸入您設定的 `ADMIN_PASSWORD`
3. 應該成功登入並進入內部看板

### 5. 測試客戶專區

1. 點選「客戶自助專區」
2. 應該可以直接訪問（無需登入）
3. 僅顯示 YouTube 平台的影片

---

## 🔍 常見問題

### Q: 設定完變數後網站還是 404？

A: 請檢查：
1. 是否點選了「Deploy」按鈕觸發重新部署
2. 在 Deployments 頁籤查看最新部署的狀態是否為「Success」
3. 在 Logs 頁籤查看是否有錯誤訊息

### Q: 登入時顯示「Invalid password」？

A: 請檢查：
1. Railway Variables 中的 `ADMIN_PASSWORD` 是否正確設定
2. 輸入的密碼是否與環境變數中的密碼一致
3. 是否有多餘的空格或換行符號

### Q: 忘記管理員密碼怎麼辦？

A: 
1. 登入 Railway 控制台
2. 進入 Variables 頁籤
3. 修改 `ADMIN_PASSWORD` 為新密碼
4. 點選「Deploy」重新部署
5. 使用新密碼登入

### Q: AI 功能不工作？

A: AI 功能需要額外的環境變數 `BUILT_IN_FORGE_API_KEY`。如果暫時不需要，可以：
- 手動上傳縮圖（而非自動生成）
- 手動選擇分類（而非 AI 建議）

### Q: 客戶專區無法訪問？

A: 客戶專區是公開頁面，無需登入。如果無法訪問：
1. 檢查 Railway 部署狀態
2. 檢查資料庫連接是否正常
3. 查看 Logs 是否有錯誤訊息

---

## 🚀 下一步

設定完成後，您可以：

1. **新增影片**: 登入內部看板 → 點選「新增影片」
2. **管理分類**: 在資料庫中直接修改 categories 表
3. **分享給客戶**: 將客戶專區的 URL 分享給客戶

---

## 📞 需要協助？

如果設定後仍有問題，請提供：
1. Railway Deployments 頁面的截圖
2. Railway Logs 頁面的錯誤訊息
3. 您已設定的環境變數列表（**不要包含實際的密碼值**）

我會協助您診斷問題。

---

## 🎯 與舊版本的差異

### 已移除的環境變數（不再需要）

以下變數在移除 OAuth 後已經不再需要：

- `OAUTH_SERVER_URL`
- `VITE_OAUTH_PORTAL_URL`
- `VITE_APP_ID`
- `OWNER_OPEN_ID`
- `OWNER_NAME`
- `VITE_ANALYTICS_ENDPOINT`
- `VITE_ANALYTICS_WEBSITE_ID`
- `VITE_APP_LOGO`
- `VITE_APP_TITLE`
- `VITE_FRONTEND_FORGE_API_KEY`
- `VITE_FRONTEND_FORGE_API_URL`

### 新增的環境變數

- `ADMIN_PASSWORD`: 管理員登入密碼
- `ADMIN_EMAIL`: 管理員 email 地址

### 保留的環境變數

- `DATABASE_URL`: 資料庫連接（必要）
- `JWT_SECRET`: Session 簽署密鑰（必要）
- `BUILT_IN_FORGE_API_URL`: AI 功能（可選）
- `BUILT_IN_FORGE_API_KEY`: AI 功能（可選）

# Railway 部署完整指南

## 🎯 快速開始

### 步驟 1：配置環境變數

在 Railway Variables 頁面使用 Raw Editor 貼上：

```bash
DATABASE_URL=postgresql://postgres:mLxtqaoiccugtZOVQuduvPRZgpjUEnpj@crossover.proxy.rlwy.net:34189/railway
JWT_SECRET=7a5754874d9a0dc47a1cb00e3b8a22ef912a3e8bd2e3dc6f253e439def7adf09
ADMIN_PASSWORD=your-secure-password-here
ADMIN_EMAIL=admin@example.com
```

**重要**：將 `ADMIN_PASSWORD` 替換為您的安全密碼。

### 步驟 2：連接 GitHub

1. Settings → Source → Connect to GitHub
2. 選擇 repository: `inphic-ai/Film-genre`
3. 選擇 branch: `main`

### 步驟 3：部署

連接後 Railway 會自動部署。等待 2-5 分鐘後訪問：

```
https://film-genre-production.up.railway.app
```

---

## ✅ 驗證部署

1. **首頁**：應顯示「內外分流的影片知識庫」
2. **登入**：點選「管理員登入」，輸入您的密碼
3. **客戶專區**：點選「客戶自助專區」，無需登入即可訪問

---

## 🔧 常見問題

### Q: 部署失敗，顯示「Script start.sh not found」

確認專案根目錄有 `railway.toml` 和 `nixpacks.toml`。

### Q: 網站顯示 404

檢查 Railway Variables 是否包含所有 4 個環境變數。

### Q: 登入失敗

檢查 `ADMIN_PASSWORD` 是否正確設定，重新部署後再試。

---

## 📊 部署檢查清單

- [ ] 已設定 4 個環境變數
- [ ] 已連接 GitHub repository
- [ ] 部署狀態為 Success
- [ ] 可以訪問首頁
- [ ] 可以登入內部看板
- [ ] 可以訪問客戶專區

---

## 🎯 自動部署流程

```
Manus 開發 → git push → GitHub → Railway 自動部署
```

每次推送到 `main` 分支，Railway 會自動建置並部署。

---

**部署成功後，開始新增影片並分享客戶專區 URL 給客戶！** 🎉

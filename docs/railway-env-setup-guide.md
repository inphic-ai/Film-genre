# Railway 環境變數設定指南

## 概述

INPHIC 影片知識庫系統在 Railway 生產環境中需要設定額外的環境變數以啟用 AI 智慧搜尋功能（LLM 整合）。

---

## 必需環境變數

### 1. **BUILT_IN_FORGE_API_KEY**
- **用途**：Manus 內建 LLM API 的認證 Bearer token
- **值類型**：字符串（API Key）
- **獲取方式**：
  - 如果使用 Manus 內建 LLM API：聯絡 Manus 團隊獲取
  - 如果使用 OpenAI API：使用 OpenAI API Key（格式：`sk-...`）
- **範例**：`sk-proj-xxxxxxxxxxxxxxxxxxxxx` 或 `manus-api-key-xxxxx`

### 2. **BUILT_IN_FORGE_API_URL**
- **用途**：Manus 內建 LLM API 的基礎 URL
- **值類型**：URL
- **獲取方式**：
  - Manus 內建：`https://api.manus.im/v1`
  - OpenAI API：`https://api.openai.com/v1`
- **範例**：`https://api.openai.com/v1`

---

## Railway 設定步驟

### 步驟 1：登入 Railway Dashboard
1. 前往 [Railway.app](https://railway.app)
2. 使用您的帳號登入
3. 選擇 `film-genre-production` 專案

### 步驟 2：進入環境變數設定
1. 在專案首頁，點擊 **Settings**（設定）
2. 在左側菜單選擇 **Variables**（環境變數）
3. 或直接在服務列表中選擇應用服務，點擊 **Variables** 標籤

### 步驟 3：新增環境變數
1. 點擊 **+ New Variable**（新增變數）
2. 在 **Variable name** 欄位輸入：`BUILT_IN_FORGE_API_KEY`
3. 在 **Value** 欄位輸入您的 API Key
4. 點擊 **Save**（保存）

### 步驟 4：新增第二個環境變數
1. 再次點擊 **+ New Variable**
2. 在 **Variable name** 欄位輸入：`BUILT_IN_FORGE_API_URL`
3. 在 **Value** 欄位輸入 API URL（例如：`https://api.openai.com/v1`）
4. 點擊 **Save**

### 步驟 5：重新部署應用
1. 環境變數保存後，Railway 會自動觸發重新部署
2. 等待部署完成（通常 2-5 分鐘）
3. 檢查部署日誌確認成功

---

## 驗證設定

### 方法 1：檢查部署日誌
1. 在 Railway Dashboard 中選擇應用服務
2. 點擊 **Logs**（日誌）標籤
3. 搜尋 `BUILT_IN_FORGE_API` 確認環境變數已載入

### 方法 2：測試 AI 搜尋功能
1. 登入應用：https://film-genre-production.up.railway.app
2. 進入影片看板頁面
3. 點擊「✨ AI 搜尋」按鈕
4. 輸入自然語言查詢（例如：「找評分 4 星以上的影片」）
5. 如果搜尋成功，表示 LLM API 已正確配置

---

## 常見問題

### Q1：我應該使用哪個 LLM API？
**A**：
- 如果有 Manus 內建 API 的 credentials，優先使用 Manus API
- 否則，可以使用 OpenAI API（需要 OpenAI 帳號和 API Key）
- 其他相容的 LLM 服務（例如：Claude、Gemini）也可以使用，只需調整 API URL 和 Key 格式

### Q2：API Key 洩露了怎麼辦？
**A**：
1. 立即在 API 提供商的儀表板中撤銷該 Key
2. 生成新的 API Key
3. 在 Railway 中更新環境變數
4. 重新部署應用

### Q3：AI 搜尋功能仍然不工作？
**A**：
1. 檢查環境變數是否正確設定（無拼寫錯誤、無多餘空格）
2. 檢查 API Key 是否有效（未過期、未被撤銷）
3. 檢查 API URL 是否正確
4. 查看應用日誌尋找錯誤訊息
5. 確認網路連接正常（Railway 應用可以訪問 API 端點）

### Q4：我可以在開發環境測試 LLM API 設定嗎？
**A**：可以。在 `.env.local` 檔案中新增相同的環境變數：
```
BUILT_IN_FORGE_API_KEY=your_api_key_here
BUILT_IN_FORGE_API_URL=https://api.openai.com/v1
```
然後重啟開發伺服器。

---

## 相關文件

- [AI 智慧搜尋功能設計文件](./phase25.4-ai-smart-search-design.md)
- [Phase 25.4 測試結果](./phase25.4-ai-smart-search-test-results.md)

---

## 支援

如有問題，請聯絡開發團隊或查閱 Manus 官方文件。

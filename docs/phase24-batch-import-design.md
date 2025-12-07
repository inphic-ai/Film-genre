# Phase 24.2：批次影片匯入技術規劃

## 目標
支援批次匯入 YouTube 播放清單，自動抓取所有影片資訊與縮圖，減少手動新增影片的工作量。

## 技術方案

### 1. YouTube 播放清單 API 選擇

#### 方案 A：YouTube Data API v3（需要 API Key）
**優點**：
- 官方 API，功能完整
- 支援播放清單影片列表、影片詳細資訊、縮圖
- 支援分頁（pageToken）

**缺點**：
- 需要 Google Cloud API Key
- 有配額限制（每日 10,000 units）
- 需要使用者提供 API Key 或系統管理員設定

**API 端點**：
```
GET https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId={playlistId}&key={apiKey}&maxResults=50
```

#### 方案 B：oEmbed API + 手動解析（無需 API Key）
**優點**：
- 無需 API Key
- 無配額限制

**缺點**：
- 無法直接取得播放清單影片列表
- 需要手動解析播放清單頁面 HTML（不穩定）

#### 方案 C：YouTube RSS Feed（無需 API Key，但僅支援頻道）
**優點**：
- 無需 API Key
- 支援頻道最新影片列表

**缺點**：
- 僅支援頻道（channel），不支援播放清單（playlist）
- 最多返回 15 部影片

**RSS 端點**：
```
https://www.youtube.com/feeds/videos.xml?channel_id={channelId}
```

### 2. 推薦方案：YouTube Data API v3（需要使用者提供 API Key）

**理由**：
1. 官方 API，穩定可靠
2. 支援播放清單影片列表
3. 支援分頁，可匯入大型播放清單
4. 使用者可自行申請免費 API Key（每日 10,000 units 足夠一般使用）

**API Key 取得方式**：
1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立專案
3. 啟用 YouTube Data API v3
4. 建立憑證（API Key）
5. 複製 API Key 到系統設定

**配額計算**：
- `playlistItems.list`：1 unit/request
- 每次請求最多返回 50 部影片
- 匯入 500 部影片需要 10 requests = 10 units
- 每日配額 10,000 units 可匯入 50,000 部影片

### 3. 後端 API 設計

#### 3.1 `videos.importPlaylist`

**輸入**：
```typescript
{
  playlistUrl: string; // YouTube 播放清單 URL
  apiKey: string; // YouTube Data API v3 Key（使用者提供）
  category: 'product_intro' | 'maintenance' | 'case_study' | 'faq' | 'other'; // 預設分類
  shareStatus: 'private' | 'public'; // 預設分享狀態
}
```

**輸出**：
```typescript
{
  total: number; // 播放清單總影片數
  imported: number; // 成功匯入數量
  skipped: number; // 跳過數量（已存在）
  failed: number; // 失敗數量
  videos: Array<{
    videoId: string;
    title: string;
    status: 'imported' | 'skipped' | 'failed';
    reason?: string; // 失敗原因
  }>;
}
```

**流程**：
1. 解析播放清單 URL，取得 `playlistId`
2. 呼叫 YouTube Data API v3 取得播放清單影片列表
3. 對每部影片：
   - 檢查是否已存在（videoUrl 重複檢測）
   - 若不存在，抓取影片資訊（title、thumbnailUrl）
   - 建立影片記錄
4. 返回匯入結果

#### 3.2 `videos.validateYouTubeApiKey`

**輸入**：
```typescript
{
  apiKey: string;
}
```

**輸出**：
```typescript
{
  valid: boolean;
  quotaRemaining?: number; // 剩餘配額（若可取得）
}
```

**用途**：
- 驗證使用者提供的 API Key 是否有效
- 前端可在匯入前先驗證 API Key

### 4. 前端 UI 設計

#### 4.1 批次匯入對話框

**位置**：Manage.tsx 頁面（新增影片表單上方）

**UI 元素**：
1. **「批次匯入」按鈕**（Manage 頁面頂部）
2. **批次匯入對話框**：
   - YouTube 播放清單 URL 輸入框
   - YouTube API Key 輸入框（含說明連結）
   - 預設分類選擇器
   - 預設分享狀態選擇器
   - 「開始匯入」按鈕
3. **匯入進度顯示**：
   - 進度條（已匯入 / 總數）
   - 即時狀態更新（正在匯入：影片標題）
   - 匯入結果摘要（成功、跳過、失敗）
4. **匯入結果列表**：
   - 每部影片的匯入狀態（✅ 成功、⏭️ 跳過、❌ 失敗）
   - 失敗原因顯示

#### 4.2 API Key 管理（選配）

**位置**：系統設定頁面（AdminSettings.tsx）

**功能**：
- 儲存 YouTube API Key 到資料庫（加密）
- 使用者無需每次匯入都輸入 API Key

**資料庫 Schema**（選配）**：
```sql
CREATE TABLE system_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  encrypted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 5. 錯誤處理

**常見錯誤**：
1. **API Key 無效**：提示使用者檢查 API Key
2. **配額超限**：提示使用者明日再試或升級配額
3. **播放清單 URL 無效**：提示使用者檢查 URL 格式
4. **影片已存在**：跳過該影片，不視為錯誤
5. **網路錯誤**：重試 3 次後標記為失敗

### 6. 安全性考量

**API Key 保護**：
- 前端：使用 HTTPS 傳輸 API Key
- 後端：不儲存 API Key 到日誌
- 資料庫：若儲存 API Key，需加密（AES-256）

**配額濫用防護**：
- 限制每次匯入最多 100 部影片
- 限制每日匯入次數（例如：10 次/天）

### 7. 實作步驟

**Phase 24.2.1：後端 API 實作**
1. 建立 `server/utils/youtube.ts` 擴充函數：
   - `extractPlaylistId(url: string): string | null`
   - `fetchPlaylistVideos(playlistId: string, apiKey: string): Promise<Array<{ videoId: string; title: string; thumbnailUrl: string }>>`
2. 新增 `videos.importPlaylist` procedure
3. 新增 `videos.validateYouTubeApiKey` procedure
4. 建立 vitest 測試（使用 mock API Key）

**Phase 24.2.2：前端整合**
1. 建立批次匯入對話框組件（`BatchImportDialog.tsx`）
2. 整合到 Manage.tsx 頁面
3. 實作匯入進度顯示
4. 實作匯入結果列表
5. 測試批次匯入功能

### 8. 未來擴充

**支援其他平台**：
- 抖音播放清單（需第三方 API 或爬蟲）
- 小紅書專輯（需第三方 API 或爬蟲）

**進階功能**：
- 自動分類（AI 根據影片標題/描述判斷分類）
- 自動標籤（AI 自動生成標籤）
- 排程匯入（定期同步播放清單新影片）

## 參考資料

- [YouTube Data API v3 - PlaylistItems](https://developers.google.com/youtube/v3/docs/playlistItems/list)
- [YouTube Data API v3 - Quota](https://developers.google.com/youtube/v3/getting-started#quota)
- [Google Cloud Console](https://console.cloud.google.com/)

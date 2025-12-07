# Phase 23.2：自動縮圖抓取機制技術規劃

## 目標

實作自動縮圖抓取機制，支援 YouTube、抖音、小紅書三大平台，減少手動上傳步驟，同時保留手動上傳功能覆蓋預設縮圖。

## 技術方案

### 1. YouTube 縮圖抓取

**方案 A：使用 YouTube oEmbed API（推薦）**
- 端點：`https://www.youtube.com/oembed?url={videoUrl}&format=json`
- 優點：無需 API Key、簡單快速、官方支援
- 返回資料：`thumbnail_url`（縮圖 URL）、`title`（影片標題）、`author_name`（頻道名稱）
- 縮圖尺寸：預設 480x360（中等品質）

**方案 B：使用 YouTube Data API v3**
- 端點：`https://www.googleapis.com/youtube/v3/videos?id={videoId}&part=snippet&key={apiKey}`
- 優點：更多 metadata、多種縮圖尺寸選擇
- 缺點：需要 API Key、有配額限制
- 縮圖尺寸：default (120x90)、medium (320x180)、high (480x360)、standard (640x480)、maxres (1280x720)

**方案 C：使用 YouTube 縮圖 URL 模式（最簡單）**
- URL 模式：`https://img.youtube.com/vi/{videoId}/maxresdefault.jpg`（1280x720）
- 備用：`https://img.youtube.com/vi/{videoId}/hqdefault.jpg`（480x360）
- 優點：無需 API 呼叫、即時可用、無配額限制
- 缺點：無法驗證影片是否存在、某些影片可能無 maxresdefault

**選擇：方案 C（URL 模式）+ 方案 A（oEmbed 備用）**
- 優先使用 URL 模式（快速、無 API 限制）
- 若失敗則使用 oEmbed API（驗證影片存在、取得 metadata）

### 2. 抖音縮圖抓取

**方案：解析分享連結**
- 抖音分享連結格式：`https://v.douyin.com/{shortCode}`（短網址）
- 需要：
  1. 解析短網址取得真實影片 ID
  2. 使用抖音開放平台 API 取得影片資訊（需要 API Key）
- 備用方案：使用第三方 API（如 TikTok API、douyin-downloader）

**注意事項**：
- 抖音 API 需要企業認證與申請
- 可能需要使用第三方服務或爬蟲方案
- 建議先實作 YouTube，抖音與小紅書作為 Phase 2

### 3. 小紅書縮圖抓取

**方案：解析分享連結**
- 小紅書分享連結格式：`https://www.xiaohongshu.com/discovery/item/{noteId}`
- 需要：
  1. 解析 noteId
  2. 使用小紅書開放平台 API 或爬蟲取得封面圖
- 備用方案：使用第三方 API

**注意事項**：
- 小紅書 API 需要企業認證
- 可能需要使用爬蟲方案（需注意法律風險）
- 建議先實作 YouTube，小紅書作為 Phase 2

## 實作計劃

### Phase 23.2.1：後端 API 實作（YouTube 優先）

1. **新增 videos.fetchThumbnail procedure**
   - 輸入：videoUrl（影片連結）
   - 輸出：{ thumbnailUrl, title, platform }
   - 邏輯：
     1. 解析 URL 判斷平台（YouTube/抖音/小紅書）
     2. 根據平台呼叫對應的抓取函數
     3. 返回縮圖 URL 與基本資訊

2. **實作 YouTube 縮圖抓取函數**
   - 函數名稱：`fetchYouTubeThumbnail(videoUrl: string)`
   - 步驟：
     1. 解析 YouTube URL 取得 videoId
     2. 嘗試使用 URL 模式取得縮圖（maxresdefault）
     3. 若失敗則使用 oEmbed API
     4. 返回縮圖 URL

3. **新增輔助函數**
   - `extractYouTubeVideoId(url: string): string | null`（解析 YouTube URL）
   - `validateImageUrl(url: string): Promise<boolean>`（驗證圖片 URL 是否有效）

4. **建立 vitest 測試**
   - 測試 YouTube URL 解析
   - 測試縮圖 URL 生成
   - 測試 oEmbed API 呼叫
   - 測試錯誤處理（無效 URL、影片不存在）

### Phase 23.2.2：前端整合

1. **修改 Manage.tsx 新增影片表單**
   - 在 videoUrl 輸入欄位下方新增「自動抓取縮圖」按鈕
   - 點擊後呼叫 `videos.fetchThumbnail` API
   - 顯示抓取進度（Loading 狀態）
   - 成功後顯示縮圖預覽
   - 失敗後顯示錯誤訊息（提示手動上傳）

2. **自動觸發縮圖抓取**
   - 當 videoUrl 輸入完成後（debounce 1000ms）
   - 自動呼叫 `videos.fetchThumbnail` API
   - 若成功則自動填入縮圖欄位
   - 若失敗則顯示「無法自動抓取，請手動上傳」

3. **保留手動上傳功能**
   - 縮圖欄位顯示「自動抓取」或「手動上傳」兩個選項
   - 手動上傳會覆蓋自動抓取的縮圖
   - 提供「清除縮圖」按鈕

4. **UI/UX 優化**
   - 縮圖預覽區域（150x150）
   - 抓取進度提示（「正在抓取縮圖...」）
   - 成功提示（「縮圖已自動抓取」）
   - 失敗提示（「無法自動抓取，請手動上傳」）

## 資料流程

```
使用者輸入 videoUrl
  ↓
前端 debounce 1000ms
  ↓
呼叫 videos.fetchThumbnail API
  ↓
後端解析 URL 判斷平台
  ↓
呼叫對應平台的抓取函數
  ↓
返回縮圖 URL 與基本資訊
  ↓
前端顯示縮圖預覽
  ↓
使用者可選擇保留或手動上傳覆蓋
  ↓
提交表單時儲存縮圖 URL
```

## 注意事項

1. **不儲存縮圖到 R2**：直接使用 YouTube 的縮圖 URL（節省儲存空間）
2. **手動上傳優先**：若使用者手動上傳縮圖，則使用 R2 URL（customThumbnailUrl）
3. **縮圖顯示邏輯**：優先顯示 customThumbnailUrl，若無則顯示自動抓取的 thumbnailUrl
4. **錯誤處理**：若縮圖抓取失敗，不影響影片新增流程（提示手動上傳）
5. **效能優化**：使用 debounce 避免過於頻繁的 API 呼叫

## 測試計劃

### 後端測試
- ✅ YouTube URL 解析（標準 URL、短網址、嵌入 URL）
- ✅ 縮圖 URL 生成（maxresdefault、hqdefault）
- ✅ oEmbed API 呼叫（成功、失敗）
- ✅ 錯誤處理（無效 URL、影片不存在、網路錯誤）

### 前端測試
- ✅ 自動觸發縮圖抓取（輸入 URL 後自動抓取）
- ✅ 手動觸發縮圖抓取（點擊按鈕）
- ✅ 縮圖預覽顯示（成功、失敗）
- ✅ 手動上傳覆蓋自動抓取
- ✅ 清除縮圖功能
- ✅ Loading 與錯誤提示

### 整合測試
- ✅ YouTube 影片縮圖抓取（標準 URL、短網址）
- ✅ 手動上傳縮圖覆蓋自動抓取
- ✅ 影片卡片顯示縮圖（優先顯示 customThumbnailUrl）
- ✅ 影片詳情頁顯示縮圖

## 時程規劃

- **Phase 23.2.1（後端）**：2-3 小時
  - YouTube URL 解析與縮圖抓取函數
  - videos.fetchThumbnail API
  - vitest 測試

- **Phase 23.2.2（前端）**：2-3 小時
  - Manage.tsx 整合自動抓取功能
  - 縮圖預覽與手動上傳
  - UI/UX 優化

- **測試與部署**：1 小時
  - 本地測試
  - Railway 部署驗證

**總計：5-7 小時**

## 後續擴充（Phase 2）

- 抖音縮圖抓取（需要 API Key 或第三方服務）
- 小紅書縮圖抓取（需要 API Key 或爬蟲）
- 批次縮圖更新（為現有影片自動抓取縮圖）
- 縮圖快取機制（減少重複抓取）

# Phase 23.3: 自動帶入影片資訊與 AI 標籤生成

## 功能目標

1. **自動帶入影片資訊**：輸入 URL 後自動抓取標題、描述等 metadata
2. **AI 自動生成標籤**：根據標題與描述自動生成相關標籤
3. **提升新增影片效率**：減少手動輸入，提升使用者體驗

## 技術方案

### 1. 自動帶入影片資訊

#### YouTube 影片資訊抓取

**方案 A：YouTube oEmbed API**（推薦）
- API Endpoint：`https://www.youtube.com/oembed?url={videoUrl}&format=json`
- 返回資料：
  - `title`：影片標題
  - `author_name`：頻道名稱
  - `thumbnail_url`：縮圖 URL
  - `html`：嵌入 HTML
- 優點：無需 API Key、即時可用、無配額限制
- 缺點：無法取得描述（description）

**方案 B：YouTube Data API v3**（備用）
- API Endpoint：`https://www.googleapis.com/youtube/v3/videos?id={videoId}&part=snippet&key={apiKey}`
- 返回資料：
  - `snippet.title`：影片標題
  - `snippet.description`：影片描述
  - `snippet.channelTitle`：頻道名稱
  - `snippet.thumbnails`：縮圖 URL
  - `snippet.tags`：影片標籤
- 優點：資料完整（包含描述與標籤）
- 缺點：需要 API Key、有配額限制（每日 10,000 quota units）

**選擇策略**：
1. 優先使用 oEmbed API 抓取標題與縮圖（無需 API Key）
2. 若需要描述，則使用 YouTube Data API v3（需要使用者提供 API Key）
3. 本階段實作 oEmbed API，未來可擴充 Data API v3

#### 抖音與小紅書影片資訊抓取

- **抖音**：需要爬蟲或第三方 API（本階段暫不實作）
- **小紅書**：需要爬蟲或第三方 API（本階段暫不實作）
- **未來擴充**：可整合第三方 API（如 RapidAPI）或自建爬蟲服務

### 2. AI 自動生成標籤

#### 技術方案

使用 Manus 內建 LLM API（`invokeLLM`）根據影片標題與描述生成標籤。

**輸入**：
- `title`：影片標題
- `description`：影片描述（選填）
- `existingTags`：現有標籤列表（用於匹配）

**輸出**：
- `suggestedTags`：建議標籤列表（包含 tagId、name、confidence）

**Prompt 設計**：
```
你是一個影片標籤分析專家。根據影片標題與描述，從現有標籤列表中選擇最相關的標籤（最多 5 個）。

影片標題：{title}
影片描述：{description}

現有標籤列表：
{existingTags.map(tag => `- ${tag.name} (${tag.tagType})`).join('\n')}

請返回 JSON 格式的標籤建議：
[
  { "tagId": 1, "name": "標籤名稱", "confidence": 0.95 },
  ...
]

注意：
1. 僅從現有標籤列表中選擇
2. 優先選擇與影片內容高度相關的標籤
3. confidence 範圍：0.0 - 1.0
4. 最多返回 5 個標籤
```

#### API 設計

**Procedure**：`videos.suggestTags`

**Input**：
```typescript
{
  title: string;
  description?: string;
}
```

**Output**：
```typescript
{
  suggestedTags: Array<{
    id: number;
    name: string;
    tagType: string;
    confidence: number;
  }>;
}
```

### 3. 前端整合

#### 自動帶入影片資訊

**觸發時機**：輸入 videoUrl 後（debounce 1.5 秒）

**流程**：
1. 驗證 URL 格式
2. 呼叫 `videos.fetchMetadata` API
3. 自動填入 `title`、`description` 欄位
4. 顯示「✅ 影片資訊已自動帶入」提示
5. 若失敗則顯示「⚠️ 無法自動抓取影片資訊，請手動輸入」

#### AI 自動生成標籤

**觸發時機**：點擊「AI 建議標籤」按鈕

**流程**：
1. 驗證 `title` 欄位已填寫
2. 呼叫 `videos.suggestTags` API
3. 顯示建議標籤列表（包含 confidence）
4. 使用者可選擇接受或拒絕建議標籤
5. 自動加入選中的標籤到 `selectedTags`

## 實作計劃

### Phase 23.3.1：自動帶入影片資訊後端實作

1. ✅ 擴充 `server/utils/youtube.ts`：新增 `fetchYouTubeMetadata` 函數
2. ✅ 新增 `videos.fetchMetadata` procedure（呼叫 oEmbed API）
3. ✅ 撰寫 vitest 測試驗證功能

### Phase 23.3.2：AI 標籤生成後端實作

1. ✅ 新增 `videos.suggestTags` procedure（使用 LLM API）
2. ✅ 撰寫 vitest 測試驗證功能

### Phase 23.3.3：前端整合

1. ✅ 整合自動帶入影片資訊（Manage.tsx）
2. ✅ 新增「AI 建議標籤」按鈕與對話框
3. ✅ 瀏覽器測試驗證功能

## 注意事項

1. **oEmbed API 限制**：無法取得影片描述，若需要描述則需使用 YouTube Data API v3
2. **AI 標籤生成成本**：每次呼叫 LLM API 會消耗 tokens，建議限制呼叫頻率
3. **標籤匹配策略**：僅從現有標籤列表中選擇，避免生成不存在的標籤
4. **使用者體驗**：自動填入的資訊應可手動修改，避免強制覆蓋使用者輸入
5. **錯誤處理**：API 失敗不應阻止影片新增流程，僅顯示提示訊息

## 未來擴充

1. **YouTube Data API v3 整合**：支援抓取影片描述與官方標籤
2. **抖音與小紅書支援**：整合第三方 API 或自建爬蟲服務
3. **AI 標籤生成優化**：根據使用者反饋調整 prompt 與 confidence 閾值
4. **批量處理**：支援批量抓取影片資訊與生成標籤

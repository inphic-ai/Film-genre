# Phase 25.4：AI 智慧搜尋功能設計文件

## 1. 功能概述

整合 Manus LLM API 實作自然語言查詢功能，讓使用者可以用更直覺的方式搜尋影片。

### 1.1 使用案例

**範例查詢**：
- 「找評分 4 星以上的維修影片」
- 「搜尋抖音平台的使用介紹影片」
- 「找有 ABC123456a 商品編號標籤的影片」
- 「搜尋最近上傳的 YouTube 影片」
- 「找評分高且有維修標籤的影片」

**解析結果**：
```json
{
  "rating": { "min": 4, "max": 5 },
  "category": "maintenance",
  "platform": "douyin",
  "tags": ["ABC123456a"],
  "keywords": ["維修", "使用介紹"],
  "sortBy": "createdAt",
  "sortOrder": "desc"
}
```

---

## 2. 後端 API 設計

### 2.1 aiSearch Router

**檔案路徑**：`server/trpc/routers/aiSearch.ts`

#### 2.1.1 parseQuery Procedure

**功能**：使用 LLM 解析自然語言查詢

**輸入**：
```typescript
{
  query: string; // 自然語言查詢（例如：「找評分 4 星以上的維修影片」）
}
```

**輸出**：
```typescript
{
  rating?: { min?: number; max?: number };
  category?: 'product_intro' | 'maintenance' | 'case_study' | 'faq' | 'other';
  platform?: 'youtube' | 'douyin' | 'xiaohongshu';
  shareStatus?: 'private' | 'public';
  tags?: string[];
  keywords?: string[];
  sortBy?: 'rating' | 'viewCount' | 'createdAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}
```

**LLM Prompt**：
```
你是一個影片搜尋查詢解析器。請將使用者的自然語言查詢解析為結構化的搜尋條件。

可用的搜尋條件：
- rating: 評分範圍（1-5 星）
- category: 影片分類（使用介紹、維修、案例、常見問題、其他）
- platform: 平台（YouTube、抖音、小紅書）
- shareStatus: 分享狀態（私人、公開）
- tags: 標籤（商品編號或關鍵字）
- keywords: 關鍵字（用於搜尋標題、描述）
- sortBy: 排序欄位（評分、觀看次數、建立時間、標題）
- sortOrder: 排序方向（升序、降序）

請以 JSON 格式回傳解析結果。如果查詢中沒有提到某個條件，則不要包含該欄位。

使用者查詢：{query}

回傳格式範例：
{
  "rating": { "min": 4, "max": 5 },
  "category": "maintenance",
  "platform": "youtube",
  "keywords": ["維修"],
  "sortBy": "rating",
  "sortOrder": "desc"
}
```

#### 2.1.2 search Procedure

**功能**：根據解析結果執行影片搜尋

**輸入**：
```typescript
{
  parsedQuery: ParsedQuery; // parseQuery 的輸出結果
  limit?: number; // 每頁數量（預設 20）
  offset?: number; // 分頁偏移量（預設 0）
}
```

**輸出**：
```typescript
{
  videos: Video[]; // 影片列表
  total: number; // 總數量
  query: ParsedQuery; // 解析後的查詢條件（用於前端顯示）
}
```

**實作邏輯**：
1. 根據 `parsedQuery` 建立 Drizzle ORM 查詢條件
2. 支援多條件組合（AND 邏輯）
3. 支援標籤搜尋（tags 陣列，OR 邏輯）
4. 支援關鍵字搜尋（標題、描述，ILIKE）
5. 支援排序與分頁

---

## 3. 前端 UI 設計

### 3.1 智慧搜尋輸入框

**位置**：整合到現有的全域搜尋框（DashboardLayout.tsx）

**功能**：
1. 使用者輸入自然語言查詢
2. 按下 Enter 或點擊搜尋按鈕
3. 呼叫 `aiSearch.parseQuery` 解析查詢
4. 呼叫 `aiSearch.search` 執行搜尋
5. 導航到 Board.tsx 並顯示搜尋結果

**UI 元素**：
- 搜尋輸入框（現有）
- 「智慧搜尋」按鈕（新增，與現有搜尋按鈕並列）
- Loading 狀態提示（「正在解析查詢...」）
- 錯誤提示（LLM 解析失敗）

### 3.2 搜尋結果顯示

**位置**：Board.tsx

**功能**：
1. 顯示解析後的查詢條件（卡片形式）
2. 顯示搜尋結果影片列表
3. 支援分頁

**UI 元素**：
- 查詢條件卡片（顯示評分、分類、平台、標籤等）
- 影片列表（使用現有的 VideoCard 組件）
- 分頁控制（使用現有的分頁組件）
- 「清除條件」按鈕（返回預設列表）

**查詢條件卡片範例**：
```
🔍 智慧搜尋結果

查詢條件：
- 評分：4-5 星
- 分類：維修
- 平台：YouTube
- 關鍵字：維修

共找到 12 部影片
```

---

## 4. 資料庫查詢邏輯

### 4.1 查詢條件組合

**範例 1**：「找評分 4 星以上的維修影片」
```typescript
const query = db
  .select()
  .from(videos)
  .where(
    and(
      gte(videos.rating, 4),
      eq(videos.category, 'maintenance')
    )
  )
  .orderBy(desc(videos.rating));
```

**範例 2**：「搜尋抖音平台的使用介紹影片」
```typescript
const query = db
  .select()
  .from(videos)
  .where(
    and(
      eq(videos.platform, 'douyin'),
      eq(videos.category, 'product_intro')
    )
  )
  .orderBy(desc(videos.createdAt));
```

**範例 3**：「找有 ABC123456a 商品編號標籤的影片」
```typescript
// 需要 JOIN tags 表
const query = db
  .select()
  .from(videos)
  .leftJoin(tags, eq(videos.id, tags.videoId))
  .where(eq(tags.name, 'ABC123456a'))
  .orderBy(desc(videos.createdAt));
```

### 4.2 標籤搜尋邏輯

**問題**：tags 是 JSON 陣列，需要使用 PostgreSQL 的 JSON 操作符

**解決方案**：
1. 使用 `@>` 操作符（包含）
2. 或者使用 `jsonb_array_elements_text` 函數

**範例**：
```sql
SELECT * FROM videos
WHERE tags @> '["ABC123456a"]'::jsonb;
```

**Drizzle ORM 實作**：
```typescript
import { sql } from 'drizzle-orm';

const query = db
  .select()
  .from(videos)
  .where(
    sql`${videos.tags} @> ${JSON.stringify(parsedQuery.tags)}::jsonb`
  );
```

---

## 5. 測試計畫

### 5.1 Vitest 測試

**檔案路徑**：`server/trpc/routers/aiSearch.test.ts`

**測試案例**：
1. ✅ 解析評分查詢（「找評分 4 星以上的影片」）
2. ✅ 解析分類查詢（「搜尋維修影片」）
3. ✅ 解析平台查詢（「找抖音平台的影片」）
4. ✅ 解析標籤查詢（「找有 ABC123456a 標籤的影片」）
5. ✅ 解析複合查詢（「找評分高且有維修標籤的 YouTube 影片」）
6. ✅ 執行搜尋（根據解析結果）
7. ✅ 分頁測試（limit、offset）
8. ✅ 排序測試（sortBy、sortOrder）

### 5.2 瀏覽器測試

**測試案例**：
1. ✅ 輸入自然語言查詢並搜尋
2. ✅ 查詢條件卡片正確顯示
3. ✅ 搜尋結果正確顯示
4. ✅ 分頁功能正常
5. ✅ 清除條件返回預設列表
6. ✅ Loading 狀態提示正常
7. ✅ 錯誤提示正常

---

## 6. 技術細節

### 6.1 LLM 整合

**使用 API**：Manus 內建 LLM API（`invokeLLM`）

**優點**：
- 無需額外設定 API Key
- 支援結構化輸出（JSON Schema）
- 高準確度

**範例**：
```typescript
import { invokeLLM } from '../../_core/llm';

const response = await invokeLLM({
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: query }
  ],
  response_format: {
    type: 'json_schema',
    json_schema: {
      name: 'parsed_query',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          rating: {
            type: 'object',
            properties: {
              min: { type: 'number' },
              max: { type: 'number' }
            }
          },
          category: { type: 'string' },
          platform: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          keywords: { type: 'array', items: { type: 'string' } },
          sortBy: { type: 'string' },
          sortOrder: { type: 'string' }
        }
      }
    }
  }
});

const parsedQuery = JSON.parse(response.choices[0].message.content);
```

### 6.2 錯誤處理

**可能的錯誤**：
1. LLM 解析失敗（回傳格式錯誤）
2. 查詢條件無效（例如：評分超出範圍）
3. 資料庫查詢失敗

**處理策略**：
1. 驗證 LLM 回傳的 JSON 格式
2. 驗證查詢條件的有效性
3. 捕獲資料庫錯誤並回傳友善的錯誤訊息
4. 前端顯示錯誤提示並允許使用者重試

---

## 7. 無需資料庫 Schema 變更

✅ **確認**：此功能不涉及資料庫 Schema 變更，僅新增後端 API 與前端 UI。

**原因**：
- 使用現有的 `videos` 表與 `tags` 表
- 不需要新增欄位或資料表
- 符合《INPHIC × Manus 生產環境合作規範 1.0》

---

## 8. 開發順序

1. ✅ 建立設計文件（本文件）
2. ⏳ 實作後端 API（aiSearch router）
3. ⏳ 建立 vitest 測試
4. ⏳ 實作前端 UI（智慧搜尋輸入框、搜尋結果顯示）
5. ⏳ 瀏覽器測試
6. ⏳ 建立 checkpoint
7. ⏳ 推送到 GitHub
8. ⏳ 驗證 Railway Production 部署

---

## 9. 預期成果

**使用者體驗**：
- 使用者可以用自然語言搜尋影片（例如：「找評分 4 星以上的維修影片」）
- 系統自動解析查詢並顯示結果
- 查詢條件清楚顯示（卡片形式）
- 搜尋結果準確且快速

**技術成果**：
- 整合 Manus LLM API
- 支援複雜查詢條件組合
- 前端 UI 優化
- 完整的測試覆蓋

---

## 10. 附件

- LLM Prompt 範例
- 查詢條件 JSON Schema
- 測試案例清單

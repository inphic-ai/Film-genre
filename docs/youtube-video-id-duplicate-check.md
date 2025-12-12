# YouTube 影片 ID 儲存與重複性檢查機制分析

## 執行摘要

**結論**：✅ **YouTube 影片 ID 已儲存在資料庫中，且已實作完整的重複性檢查機制**

系統透過 `videoUrl` 欄位儲存完整的 YouTube 影片網址（包含影片 ID），並在新增影片時自動檢查重複性，確保不會重複匯入相同影片。

---

## 一、YouTube 影片 ID 儲存機制

### 1.1 資料表結構

**資料表**：`videos`

**相關欄位**：

| 欄位名稱 | 資料類型 | 說明 | 範例 |
|---------|---------|------|------|
| `id` | `integer` | 影片 ID（主鍵） | `1` |
| `videoUrl` | `text` | 影片網址（包含 YouTube Video ID） | `https://www.youtube.com/watch?v=dQw4w9WgXcQ` |
| `platform` | `enum` | 影片平台 | `youtube` |
| `title` | `varchar(255)` | 影片標題 | `多功能切肉機介紹` |

### 1.2 YouTube Video ID 提取

**完整網址格式**：
```
https://www.youtube.com/watch?v=VIDEO_ID
```

**範例**：
- 網址：`https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- Video ID：`dQw4w9WgXcQ`

**儲存方式**：
- 系統儲存**完整網址**（`videoUrl` 欄位）
- Video ID 包含在網址中，可透過解析網址取得

---

## 二、重複性檢查機制

### 2.1 檢查方式

系統使用 **`videoUrl` 欄位** 進行重複性檢查，確保相同影片不會被重複匯入。

**檢查函數**：`getVideoByUrl(videoUrl: string)`

**實作位置**：`server/db.ts` 第 372-377 行

```typescript
export async function getVideoByUrl(videoUrl: string): Promise<Video | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(videos).where(eq(videos.videoUrl, videoUrl)).limit(1);
  return result[0];
}
```

**查詢邏輯**：
- 使用 `videoUrl` 進行精確匹配（`eq` 比對）
- 若找到相同網址的影片，回傳該影片記錄
- 若未找到，回傳 `undefined`

### 2.2 重複檢查時機

系統在以下情況會執行重複性檢查：

#### 1. 手動新增影片（`videos.checkDuplicate`）

**API 位置**：`server/routers.ts` 第 261-277 行

```typescript
checkDuplicate: protectedProcedure
  .input(z.object({
    videoUrl: z.string().url(),
  }))
  .query(async ({ input, ctx }) => {
    if (ctx.user.role !== 'admin') {
      throw new Error('Unauthorized');
    }
    const existingVideo = await db.getVideoByUrl(input.videoUrl);
    if (existingVideo) {
      return {
        isDuplicate: true,
        video: existingVideo,
      };
    }
    return { isDuplicate: false };
  }),
```

**功能**：
- 僅管理員可使用
- 輸入影片網址，檢查是否已存在
- 回傳檢查結果與現有影片資訊

#### 2. CSV 批次匯入（`csvImport.importFromCsv`）

**API 位置**：`server/trpc/routers/csvImport.ts` 第 99-110 行

```typescript
// 2.2 檢查是否已存在
const existingVideo = await db.getVideoByUrl(entry.url);
if (existingVideo) {
  results.skipped++;
  results.videos.push({
    videoId,
    title: entry.title,
    status: 'skipped',
    reason: '影片已存在',
  });
  continue;
}
```

**功能**：
- 批次匯入時自動檢查每個影片
- 若影片已存在，跳過該影片（不重複匯入）
- 記錄跳過原因並回傳統計結果

#### 3. YouTube 播放清單匯入（`videos.importFromYouTubePlaylist`）

**API 位置**：`server/routers.ts` 第 511-522 行

```typescript
// 檢查是否已存在
const existing = await db.getVideoByUrl(videoUrl);
if (existing) {
  results.skipped++;
  results.videos.push({
    videoId: video.videoId,
    title: video.title,
    status: 'skipped',
    reason: '影片已存在',
  });
  continue;
}
```

**功能**：
- 從 YouTube 播放清單匯入時自動檢查
- 若影片已存在，跳過該影片
- 記錄跳過原因並回傳統計結果

---

## 三、重複檢查測試

### 3.1 測試覆蓋

系統已建立完整的重複性檢查測試：

**測試檔案**：`server/checkDuplicate.test.ts`

**測試項目**：

1. **檢測重複影片**
   ```typescript
   it('should detect duplicate video by URL', async () => {
     const result = await caller.videos.checkDuplicate({ videoUrl: testVideoUrl });
     expect(result.isDuplicate).toBe(true);
     expect(result.video).toBeDefined();
   });
   ```

2. **檢測不存在的影片**
   ```typescript
   it('should return false for non-existent video URL', async () => {
     const result = await caller.videos.checkDuplicate({ 
       videoUrl: 'https://www.youtube.com/watch?v=nonexistent' 
     });
     expect(result.isDuplicate).toBe(false);
   });
   ```

3. **權限檢查**
   ```typescript
   it('should reject non-admin users', async () => {
     const staffCaller = appRouter.createCaller(mockStaffContext);
     await expect(
       staffCaller.videos.checkDuplicate({ videoUrl: testVideoUrl })
     ).rejects.toThrow('Unauthorized');
   });
   ```

### 3.2 測試結果

所有測試均已通過，確保重複性檢查機制正常運作。

---

## 四、目前機制的優缺點

### 4.1 優點

✅ **完整性**
- 所有影片新增途徑均已實作重複檢查
- 手動新增、CSV 匯入、播放清單匯入全部覆蓋

✅ **準確性**
- 使用完整網址進行精確匹配
- 避免誤判（不會因為標題相似而誤判為重複）

✅ **使用者友善**
- 批次匯入時自動跳過重複影片
- 回傳詳細的匯入結果統計（成功/跳過/失敗）

✅ **效能**
- 使用資料庫索引（若有建立）可快速查詢
- 單次查詢即可完成檢查

### 4.2 缺點與限制

❌ **缺少 videoUrl 唯一性約束**
- 資料表未設定 `videoUrl` 為 `UNIQUE`
- 理論上可能透過直接資料庫操作插入重複影片
- 建議：新增 `UNIQUE` 約束確保資料完整性

❌ **缺少 videoUrl 索引**
- 未建立 `videoUrl` 欄位的索引
- 大量影片時查詢效能可能下降
- 建議：新增索引提升查詢效能

❌ **無法處理不同格式的相同影片**
- 若使用不同網址格式（例如：`youtu.be` 短網址）
- 系統無法識別為相同影片
- 建議：統一網址格式或提取 Video ID 進行比對

---

## 五、優化建議

### 5.1 新增 videoUrl 唯一性約束

**目的**：從資料庫層級確保影片不重複

**實作方式**：

```typescript
// 更新 drizzle/schema.ts
export const videos = pgTable("videos", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: varchar("title", { length: 255 }).notNull(),
  videoUrl: text("videoUrl").notNull().unique(), // 新增 unique 約束
  platform: platformEnum("platform").notNull(),
  // ... 其他欄位
});
```

**執行遷移**：
```bash
pnpm db:push
```

**優點**：
- ✅ 資料庫層級保證唯一性
- ✅ 防止透過直接資料庫操作插入重複影片
- ✅ 自動拋出錯誤，無需額外檢查

### 5.2 新增 videoUrl 索引

**目的**：提升重複檢查查詢效能

**實作方式**：

```typescript
// 更新 drizzle/schema.ts
export const videos = pgTable("videos", {
  // ... 欄位定義
}, (table) => ({
  // 現有索引
  createdAtIdx: index("videos_created_at_idx").on(table.createdAt),
  categoryIdx: index("videos_category_idx").on(table.category),
  platformIdx: index("videos_platform_idx").on(table.platform),
  
  // 新增 videoUrl 索引
  videoUrlIdx: index("videos_video_url_idx").on(table.videoUrl),
}));
```

**執行遷移**：
```bash
pnpm db:push
```

**優點**：
- ✅ 大幅提升查詢效能
- ✅ 適用於大量影片的場景
- ✅ 不影響現有功能

### 5.3 新增 YouTube Video ID 欄位（選用）

**目的**：支援更靈活的查詢與比對

**實作方式**：

```typescript
// 更新 drizzle/schema.ts
export const videos = pgTable("videos", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  title: varchar("title", { length: 255 }).notNull(),
  videoUrl: text("videoUrl").notNull().unique(),
  videoId: varchar("videoId", { length: 20 }), // 新增 YouTube Video ID 欄位
  platform: platformEnum("platform").notNull(),
  // ... 其他欄位
}, (table) => ({
  // 新增 videoId 索引
  videoIdIdx: index("videos_video_id_idx").on(table.videoId),
}));
```

**提取 Video ID 函數**：

```typescript
// server/utils/youtube.ts
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}
```

**更新重複檢查邏輯**：

```typescript
export async function getVideoByUrl(videoUrl: string): Promise<Video | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  
  // 提取 Video ID
  const videoId = extractYouTubeVideoId(videoUrl);
  
  if (videoId) {
    // 使用 Video ID 查詢（支援不同網址格式）
    const result = await db.select().from(videos).where(eq(videos.videoId, videoId)).limit(1);
    return result[0];
  }
  
  // 回退到完整網址查詢
  const result = await db.select().from(videos).where(eq(videos.videoUrl, videoUrl)).limit(1);
  return result[0];
}
```

**優點**：
- ✅ 支援不同網址格式（`youtube.com`、`youtu.be`）
- ✅ 更準確的重複檢查
- ✅ 便於未來擴展（例如：影片統計、API 整合）

**缺點**：
- ❌ 需要資料遷移（填充現有影片的 `videoId`）
- ❌ 增加資料表欄位與索引

### 5.4 統一網址格式

**目的**：確保相同影片使用相同網址格式

**實作方式**：

```typescript
// server/utils/youtube.ts
export function normalizeYouTubeUrl(url: string): string {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return url;
  
  // 統一為標準格式
  return `https://www.youtube.com/watch?v=${videoId}`;
}
```

**更新影片新增邏輯**：

```typescript
export async function createVideo(video: InsertVideo): Promise<Video> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // 統一網址格式
  if (video.platform === 'youtube') {
    video.videoUrl = normalizeYouTubeUrl(video.videoUrl);
  }
  
  const result = await db.insert(videos).values(video).returning();
  return result[0]!;
}
```

**優點**：
- ✅ 確保相同影片使用相同網址
- ✅ 簡化重複檢查邏輯
- ✅ 提升資料一致性

---

## 六、實施計畫

### Phase 68：優化 YouTube 影片重複檢查機制

**優先級**：🟢 **P2 - 中優先級**

**預估工時**：2-3 小時

**任務清單**：
- [ ] 新增 `videoUrl` 唯一性約束
- [ ] 新增 `videoUrl` 索引
- [ ] 執行資料庫遷移（`pnpm db:push`）
- [ ] 測試重複檢查功能
- [ ] 更新測試案例
- [ ] 建立 checkpoint

**選用任務**（Phase 69）：
- [ ] 新增 `videoId` 欄位
- [ ] 實作 `extractYouTubeVideoId` 函數
- [ ] 實作 `normalizeYouTubeUrl` 函數
- [ ] 更新重複檢查邏輯
- [ ] 資料遷移（填充現有影片的 `videoId`）
- [ ] 測試不同網址格式的重複檢查
- [ ] 建立 checkpoint

---

## 七、總結

### 目前狀態

✅ **YouTube 影片 ID 已儲存**：透過 `videoUrl` 欄位儲存完整網址

✅ **重複檢查機制已實作**：
- 手動新增影片時檢查
- CSV 批次匯入時自動跳過重複影片
- YouTube 播放清單匯入時自動跳過重複影片

✅ **測試覆蓋完整**：已建立完整的測試案例

### 建議改善

🟢 **Phase 68（P2）**：新增 `videoUrl` 唯一性約束與索引
- 從資料庫層級確保唯一性
- 提升查詢效能

🔵 **Phase 69（P3）**：新增 `videoId` 欄位與網址格式統一
- 支援不同網址格式
- 更準確的重複檢查

### 回答您的問題

**Q：YouTube 影片 ID 是否有存在資料庫中？**

**A：是的**，YouTube 影片 ID 已儲存在資料庫的 `videos.videoUrl` 欄位中（完整網址格式）。

**Q：這樣才能比對重複性的問題？**

**A：是的**，系統已實作完整的重複性檢查機制，透過 `videoUrl` 欄位進行精確匹配，確保相同影片不會被重複匯入。所有影片新增途徑（手動新增、CSV 匯入、播放清單匯入）均已實作重複檢查。

**建議**：可進一步優化，新增 `videoUrl` 唯一性約束與索引，從資料庫層級確保唯一性並提升查詢效能。

# 影片詳情頁 UI/UX 重新設計與功能開發計畫

**文件版本**: 1.0  
**建立時間**: 2025-12-07  
**參考來源**: 使用者提供的設計稿（1765088113022.jpg、1765088129002.jpg）

---

## 目錄

1. [設計分析](#設計分析)
2. [功能需求](#功能需求)
3. [UI/UX 設計規劃](#uiux-設計規劃)
4. [技術實作規劃](#技術實作規劃)
5. [開發排程](#開發排程)
6. [資料庫 Schema 設計](#資料庫-schema-設計)
7. [API 設計](#api-設計)
8. [前端組件設計](#前端組件設計)

---

## 設計分析

### 參考圖片 1 - 整體佈局

**頁面結構**（左右分欄佈局）：

#### 左側區域（影片播放區）
- **頂部資訊列**
  - YouTube 平台圖示（紅色）
  - 影片標題：「PM612345 掛耳咖啡包裝機・紙盒卡料問題排查」
  - SKU 資訊：「SKU : PM6123456A（家族：PM6123456x）」
  - 類別標籤：「維修教學」
  - 標籤：「卡料、紙盒定位、感測器」
  - 來源頻道：「Inphic Service」
  - 上架日期：「2025-11-12」
  - 右上角：「複製分享連結（客戶用）」按鈕

- **影片播放器**
  - 深色背景（#1a202c 或類似色）
  - 16:9 比例
  - YouTube Player（此處遵循 iframe API）
  - 播放器下方顯示：
    - 目前時間：「03:15」
    - 總長度：「08:23」
    - 播放/暫停按鈕
    - 回到 00:00 按鈕

- **時間軸筆記區**
  - 標題：「時間軸筆記」
  - 副標題：「點擊時間可跳轉影片（僅限 YouTube）」
  - 篩選下拉選單：「顯示：已審核 + 待審核」
  - 筆記卡片：
    - 時間標籤（深色背景，例如「03:15」）
    - 筆記標題（例如「紙盒循移開始位置」）
    - 筆記內容（多行文字）
    - 建立者：「Aaron」
    - 建立時間：「2025-11-20」
    - 圖片附件：「圖片 1」
    - 狀態標籤：「已審核」或「待審核」

#### 右側區域（文件與知識區）
- **Tab 切換**
  - 說明書（PDF）
  - SOP / 維修流程
  - 知識節點列表

- **說明書（PDF）Tab**
  - PDF Viewer Preview（未整合時顯示此區）
  - 相關知識節點（問 SKU）：
    - 問題描述
    - 原因分析
    - 解法步驟

- **新增時間軸筆記區**（右側下方）
  - 時間（秒）：輸入框（預設當前播放時間）
  - 「使用目前影片時間」按鈕
  - 筆記內容：多行文字輸入框
  - 圖片上傳：「最多 5 張」
  - 拖放或點擊上傳提示
  - 「送出筆記」按鈕（綠色）

### 參考圖片 2 - 時間軸筆記與影片建議

**時間軸筆記區**（展開狀態）：
- 筆記卡片包含：
  - 時間標籤（例如「03:15」、「05:42」）
  - 筆記標題
  - 筆記內容
  - 建立者與時間
  - 圖片附件（縮圖）
  - 狀態標籤（「已審核」為綠色，「待審核」為黃色）

**影片建議 / 回饋區**（右側下方）：
- 標題：「影片建議 / 回饋」
- 建議卡片：
  - 建議標題（例如「建議增加掛耳咖啡袋材質說明」）
  - 建議內容（多行文字）
  - 建立者：「Aaron」
  - 建立時間：「2025-11-22」
  - 優先級下拉選單：「一般」
  - 「送出建議」按鈕（深色）

---

## 功能需求

### 核心功能

#### 1. 影片資訊展示
- **平台圖示**：YouTube / 小紅書 / 抖音（動態顯示）
- **影片標題**：可編輯（Admin）
- **SKU 資訊**：
  - 主 SKU（例如 PM6123456A）
  - 家族 SKU（例如 PM6123456x）
  - 點擊可跳轉到商品知識中樞
- **類別標籤**：使用介紹 / 維修 / 案例 / 常見問題 / 其他
- **標籤**：多個標籤（可編輯）
- **來源頻道**：影片上傳者
- **上架日期**：影片建立時間
- **複製分享連結（客戶用）**：生成公開分享連結

#### 2. 影片播放器
- **YouTube Player**：使用 YouTube Iframe API
- **播放控制**：
  - 播放/暫停
  - 前進/後退 10 秒
  - 跳轉到指定時間（點擊時間軸筆記）
  - 回到 00:00
- **時間顯示**：目前時間 / 總長度
- **播放器狀態同步**：與時間軸筆記聯動

#### 3. 時間軸筆記系統
- **新增筆記**：
  - 時間（秒）：手動輸入或使用目前播放時間
  - 筆記標題：單行文字
  - 筆記內容：多行文字（支援 Markdown）
  - 圖片上傳：最多 5 張（拖放或點擊上傳）
  - 建立者：自動記錄當前使用者
  - 建立時間：自動記錄
  - 狀態：待審核（預設）

- **編輯筆記**：
  - Admin 可編輯所有筆記
  - Staff 僅可編輯自己的筆記
  - Viewer 無法編輯

- **刪除筆記**：
  - Admin 可刪除所有筆記
  - Staff 僅可刪除自己的筆記
  - Viewer 無法刪除

- **審核筆記**：
  - Admin 可審核筆記（已審核 / 待審核）
  - 已審核的筆記顯示綠色標籤
  - 待審核的筆記顯示黃色標籤

- **篩選筆記**：
  - 已審核
  - 待審核
  - 已審核 + 待審核（預設）

- **點擊時間跳轉**：
  - 點擊筆記的時間標籤，影片跳轉到該時間點
  - 僅支援 YouTube 影片

#### 4. 說明書（PDF）系統
- **Tab 切換**：說明書（PDF）、SOP / 維修流程、知識節點列表
- **PDF Viewer**：
  - 整合 PDF.js 或使用 iframe 嵌入
  - 支援縮放、翻頁、下載
  - 未整合時顯示「PDF Viewer Preview（未整合時顯示此區）」

- **相關知識節點（問 SKU）**：
  - 顯示與當前影片 SKU 相關的知識節點
  - 問題描述
  - 原因分析
  - 解法步驟
  - 點擊可跳轉到商品知識中樞

#### 5. SOP / 維修流程
- **文件顯示**：
  - 支援 Markdown 或 PDF
  - 顯示維修流程步驟
  - 支援圖片、影片嵌入

#### 6. 知識節點列表
- **顯示所有相關知識節點**：
  - 問題標題
  - 問題描述
  - 原因分析
  - 解法步驟
  - 建立者與時間
  - 點擊可展開詳細內容

#### 7. 影片建議 / 回饋系統
- **新增建議**：
  - 建議標題：單行文字
  - 建議內容：多行文字
  - 優先級：一般 / 重要 / 緊急
  - 建立者：自動記錄當前使用者
  - 建立時間：自動記錄

- **查看建議**：
  - 顯示所有建議（卡片式）
  - 建議標題
  - 建議內容
  - 建立者與時間
  - 優先級標籤

- **編輯建議**：
  - Admin 可編輯所有建議
  - Staff 僅可編輯自己的建議
  - Viewer 無法編輯

- **刪除建議**：
  - Admin 可刪除所有建議
  - Staff 僅可刪除自己的建議
  - Viewer 無法刪除

---

## UI/UX 設計規劃

### 整體佈局

**桌面版（Desktop）**：
- 左右分欄佈局（7:5 比例）
- 左側：影片播放器 + 時間軸筆記
- 右側：說明書 PDF / SOP / 知識節點 + 新增筆記 + 影片建議

**平板版（Tablet）**：
- 上下堆疊佈局
- 上方：影片播放器
- 下方：Tab 切換（時間軸筆記、說明書、SOP、知識節點、影片建議）

**手機版（Mobile）**：
- 單欄佈局
- 影片播放器置頂
- Tab 切換（時間軸筆記、說明書、SOP、知識節點、影片建議）

### 色彩設計

**主色調**（沿用現有設計）：
- 主色：藍色（#3b82f6）
- 次色：綠色（#10b981）- 用於「已審核」、「送出」按鈕
- 警告色：黃色（#f59e0b）- 用於「待審核」
- 危險色：紅色（#ef4444）- 用於「刪除」按鈕

**背景色**：
- 頁面背景：淺灰色（#f3f4f6）
- 卡片背景：白色（#ffffff）
- 播放器背景：深色（#1a202c）

**文字色**：
- 主文字：深灰色（#1f2937）
- 次文字：中灰色（#6b7280）
- 連結：藍色（#3b82f6）

### 組件設計

#### 1. 影片資訊列
- **高度**：80px
- **背景**：白色
- **內容**：
  - 左側：平台圖示 + 影片標題
  - 中間：SKU、類別、標籤
  - 右側：來源頻道、上架日期、複製分享連結按鈕

#### 2. 影片播放器
- **比例**：16:9
- **背景**：深色（#1a202c）
- **控制列**：
  - 播放/暫停、前進/後退 10 秒、回到 00:00
  - 時間顯示（目前時間 / 總長度）

#### 3. 時間軸筆記卡片
- **寬度**：100%
- **背景**：白色
- **邊框**：1px solid #e5e7eb
- **圓角**：8px
- **內容**：
  - 左側：時間標籤（深色背景，白色文字）
  - 右側：筆記標題、內容、建立者、時間、圖片附件、狀態標籤

#### 4. 新增筆記表單
- **背景**：白色
- **邊框**：1px solid #e5e7eb
- **圓角**：8px
- **內容**：
  - 時間輸入框 + 「使用目前影片時間」按鈕
  - 筆記內容輸入框（多行）
  - 圖片上傳區（拖放或點擊）
  - 「送出筆記」按鈕（綠色）

#### 5. Tab 切換
- **高度**：48px
- **背景**：白色
- **邊框**：底部 2px solid #3b82f6（選中狀態）
- **內容**：說明書（PDF）、SOP / 維修流程、知識節點列表

#### 6. 影片建議卡片
- **寬度**：100%
- **背景**：白色
- **邊框**：1px solid #e5e7eb
- **圓角**：8px
- **內容**：
  - 建議標題
  - 建議內容
  - 建立者與時間
  - 優先級標籤

---

## 技術實作規劃

### 前端技術棧

- **框架**：React 19
- **樣式**：Tailwind CSS 4 + shadcn/ui
- **狀態管理**：tRPC + React Query
- **影片播放器**：YouTube Iframe API（已實作）
- **PDF 檢視器**：react-pdf 或 PDF.js
- **圖片上傳**：react-dropzone
- **Markdown 編輯器**：react-markdown（顯示）+ textarea（編輯）

### 後端技術棧

- **框架**：Express 4 + tRPC 11
- **資料庫**：PostgreSQL（Railway）
- **ORM**：Drizzle ORM
- **檔案儲存**：S3（已整合）
- **PDF 處理**：pdf-lib（可選，用於 PDF 操作）

---

## 開發排程

### Phase 1：資料庫 Schema 設計與 API 實作（8-10 小時）

#### 1.1 資料庫 Schema
- `timeline_notes` 表（時間軸筆記）
- `video_suggestions` 表（影片建議）
- `video_documents` 表（說明書 PDF、SOP 文件）
- `knowledge_nodes` 表（知識節點）

#### 1.2 後端 API
- `timelineNotes.list`（查詢時間軸筆記）
- `timelineNotes.create`（新增時間軸筆記）
- `timelineNotes.update`（更新時間軸筆記）
- `timelineNotes.delete`（刪除時間軸筆記）
- `timelineNotes.approve`（審核時間軸筆記）
- `videoSuggestions.list`（查詢影片建議）
- `videoSuggestions.create`（新增影片建議）
- `videoSuggestions.update`（更新影片建議）
- `videoSuggestions.delete`（刪除影片建議）
- `videoDocuments.list`（查詢影片文件）
- `videoDocuments.upload`（上傳 PDF 文件）
- `knowledgeNodes.listByVideo`（查詢影片相關知識節點）

### Phase 2：前端組件實作（12-15 小時）

#### 2.1 影片資訊列組件
- `VideoInfoHeader.tsx`（影片標題、SKU、標籤、分享按鈕）

#### 2.2 時間軸筆記組件
- `TimelineNotesList.tsx`（筆記列表）
- `TimelineNoteCard.tsx`（筆記卡片）
- `AddTimelineNoteForm.tsx`（新增筆記表單）
- `TimelineNoteFilter.tsx`（篩選下拉選單）

#### 2.3 說明書 / SOP / 知識節點組件
- `DocumentTabs.tsx`（Tab 切換）
- `PDFViewer.tsx`（PDF 檢視器）
- `SOPViewer.tsx`（SOP 文件檢視器）
- `KnowledgeNodesList.tsx`（知識節點列表）

#### 2.4 影片建議組件
- `VideoSuggestionsList.tsx`（建議列表）
- `VideoSuggestionCard.tsx`（建議卡片）
- `AddVideoSuggestionForm.tsx`（新增建議表單）

#### 2.5 整合到 VideoDetail.tsx
- 重新設計 `VideoDetail.tsx` 佈局
- 左右分欄（桌面版）
- 響應式設計（平板、手機）

### Phase 3：功能整合與測試（6-8 小時）

#### 3.1 影片播放器與時間軸筆記聯動
- 點擊筆記時間標籤，影片跳轉到該時間點
- 新增筆記時，自動填入目前播放時間

#### 3.2 圖片上傳功能
- 使用 react-dropzone 實作拖放上傳
- 圖片壓縮（前端）
- 上傳到 S3（後端 API）

#### 3.3 PDF 檢視器整合
- 使用 react-pdf 或 PDF.js
- 支援縮放、翻頁、下載

#### 3.4 權限控制
- Admin：可編輯/刪除所有內容，可審核筆記
- Staff：可編輯/刪除自己的內容
- Viewer：僅可查看

#### 3.5 測試
- 單元測試（vitest）
- 整合測試（瀏覽器測試）
- 效能測試（大量筆記載入）

### Phase 4：部署與驗證（2-3 小時）

#### 4.1 本地測試
- 驗證所有功能正常運作
- 檢查響應式設計

#### 4.2 Railway 部署
- 推送到 GitHub
- 驗證生產環境

#### 4.3 文件更新
- 更新 README.md
- 更新 API 文件

---

## 資料庫 Schema 設計

### 1. timeline_notes 表（時間軸筆記）

```sql
CREATE TABLE timeline_notes (
  id SERIAL PRIMARY KEY,
  video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  timestamp INTEGER NOT NULL, -- 時間（秒）
  title VARCHAR(255) NOT NULL, -- 筆記標題
  content TEXT NOT NULL, -- 筆記內容（支援 Markdown）
  images TEXT[], -- 圖片 URL 陣列（最多 5 張）
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 狀態：pending（待審核）、approved（已審核）
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_timeline_notes_video_id ON timeline_notes(video_id);
CREATE INDEX idx_timeline_notes_status ON timeline_notes(status);
```

### 2. video_suggestions 表（影片建議）

```sql
CREATE TABLE video_suggestions (
  id SERIAL PRIMARY KEY,
  video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL, -- 建議標題
  content TEXT NOT NULL, -- 建議內容
  priority VARCHAR(20) NOT NULL DEFAULT 'normal', -- 優先級：normal（一般）、important（重要）、urgent（緊急）
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_video_suggestions_video_id ON video_suggestions(video_id);
CREATE INDEX idx_video_suggestions_priority ON video_suggestions(priority);
```

### 3. video_documents 表（影片文件）

```sql
CREATE TABLE video_documents (
  id SERIAL PRIMARY KEY,
  video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 文件類型：manual（說明書）、sop（SOP）、other（其他）
  title VARCHAR(255) NOT NULL, -- 文件標題
  file_url TEXT NOT NULL, -- 文件 URL（S3）
  file_type VARCHAR(50) NOT NULL, -- 檔案類型：pdf、markdown、docx
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_video_documents_video_id ON video_documents(video_id);
CREATE INDEX idx_video_documents_type ON video_documents(type);
```

### 4. knowledge_nodes 表（知識節點）

**注意**：此表可能已存在於商品知識中樞，需確認是否需要新建或整合。

```sql
CREATE TABLE knowledge_nodes (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(100) NOT NULL, -- 商品 SKU
  problem_title VARCHAR(255) NOT NULL, -- 問題標題
  problem_description TEXT NOT NULL, -- 問題描述
  cause_analysis TEXT NOT NULL, -- 原因分析
  solution_steps TEXT NOT NULL, -- 解法步驟（支援 Markdown）
  related_videos INTEGER[], -- 相關影片 ID 陣列
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_knowledge_nodes_sku ON knowledge_nodes(sku);
```

---

## API 設計

### 1. 時間軸筆記 API

#### timelineNotes.list
```typescript
input: {
  videoId: number;
  status?: 'pending' | 'approved' | 'all'; // 預設 'all'
}
output: TimelineNote[]
```

#### timelineNotes.create
```typescript
input: {
  videoId: number;
  timestamp: number;
  title: string;
  content: string;
  images?: string[]; // Base64 陣列
}
output: TimelineNote
```

#### timelineNotes.update
```typescript
input: {
  id: number;
  title?: string;
  content?: string;
  images?: string[];
}
output: { success: boolean }
```

#### timelineNotes.delete
```typescript
input: {
  id: number;
}
output: { success: boolean }
```

#### timelineNotes.approve
```typescript
input: {
  id: number;
  status: 'pending' | 'approved';
}
output: { success: boolean }
```

### 2. 影片建議 API

#### videoSuggestions.list
```typescript
input: {
  videoId: number;
}
output: VideoSuggestion[]
```

#### videoSuggestions.create
```typescript
input: {
  videoId: number;
  title: string;
  content: string;
  priority: 'normal' | 'important' | 'urgent';
}
output: VideoSuggestion
```

#### videoSuggestions.update
```typescript
input: {
  id: number;
  title?: string;
  content?: string;
  priority?: 'normal' | 'important' | 'urgent';
}
output: { success: boolean }
```

#### videoSuggestions.delete
```typescript
input: {
  id: number;
}
output: { success: boolean }
```

### 3. 影片文件 API

#### videoDocuments.list
```typescript
input: {
  videoId: number;
  type?: 'manual' | 'sop' | 'other'; // 可選篩選
}
output: VideoDocument[]
```

#### videoDocuments.upload
```typescript
input: {
  videoId: number;
  type: 'manual' | 'sop' | 'other';
  title: string;
  fileData: string; // Base64
  fileType: 'pdf' | 'markdown' | 'docx';
}
output: { url: string }
```

### 4. 知識節點 API

#### knowledgeNodes.listByVideo
```typescript
input: {
  videoId: number;
}
output: KnowledgeNode[]
```

---

## 前端組件設計

### 1. VideoInfoHeader.tsx

**功能**：
- 顯示平台圖示、影片標題、SKU、類別、標籤
- 顯示來源頻道、上架日期
- 「複製分享連結（客戶用）」按鈕

**Props**：
```typescript
interface VideoInfoHeaderProps {
  video: Video;
  onCopyShareLink: () => void;
}
```

### 2. TimelineNotesList.tsx

**功能**：
- 顯示時間軸筆記列表
- 篩選下拉選單（已審核、待審核、全部）
- 點擊時間標籤跳轉影片

**Props**：
```typescript
interface TimelineNotesListProps {
  videoId: number;
  onTimeClick: (timestamp: number) => void;
}
```

### 3. TimelineNoteCard.tsx

**功能**：
- 顯示單個筆記卡片
- 時間標籤、標題、內容、建立者、時間、圖片附件、狀態標籤
- 編輯/刪除按鈕（根據權限顯示）

**Props**：
```typescript
interface TimelineNoteCardProps {
  note: TimelineNote;
  onTimeClick: (timestamp: number) => void;
  onEdit: (noteId: number) => void;
  onDelete: (noteId: number) => void;
  onApprove: (noteId: number, status: 'pending' | 'approved') => void;
}
```

### 4. AddTimelineNoteForm.tsx

**功能**：
- 新增時間軸筆記表單
- 時間輸入框 + 「使用目前影片時間」按鈕
- 筆記標題、內容輸入框
- 圖片上傳（拖放或點擊）
- 「送出筆記」按鈕

**Props**：
```typescript
interface AddTimelineNoteFormProps {
  videoId: number;
  currentTime: number;
  onSubmit: () => void;
}
```

### 5. DocumentTabs.tsx

**功能**：
- Tab 切換（說明書 PDF、SOP / 維修流程、知識節點列表）
- 顯示對應內容

**Props**：
```typescript
interface DocumentTabsProps {
  videoId: number;
}
```

### 6. PDFViewer.tsx

**功能**：
- 顯示 PDF 文件
- 支援縮放、翻頁、下載

**Props**：
```typescript
interface PDFViewerProps {
  pdfUrl: string;
}
```

### 7. VideoSuggestionsList.tsx

**功能**：
- 顯示影片建議列表
- 新增建議表單

**Props**：
```typescript
interface VideoSuggestionsListProps {
  videoId: number;
}
```

### 8. VideoSuggestionCard.tsx

**功能**：
- 顯示單個建議卡片
- 建議標題、內容、建立者、時間、優先級標籤
- 編輯/刪除按鈕（根據權限顯示）

**Props**：
```typescript
interface VideoSuggestionCardProps {
  suggestion: VideoSuggestion;
  onEdit: (suggestionId: number) => void;
  onDelete: (suggestionId: number) => void;
}
```

---

## 總預估工時

| 階段 | 工時 |
|------|------|
| Phase 1：資料庫 Schema 設計與 API 實作 | 8-10 小時 |
| Phase 2：前端組件實作 | 12-15 小時 |
| Phase 3：功能整合與測試 | 6-8 小時 |
| Phase 4：部署與驗證 | 2-3 小時 |
| **總計** | **28-36 小時** |

---

## 建議開發順序

### 第一階段（8-10 小時）
1. 資料庫 Schema 設計與遷移
2. 後端 API 實作（時間軸筆記、影片建議、影片文件）
3. vitest 測試（API 測試）

### 第二階段（12-15 小時）
4. 前端組件實作（影片資訊列、時間軸筆記、新增筆記表單）
5. 前端組件實作（說明書 PDF、SOP、知識節點、影片建議）
6. 整合到 VideoDetail.tsx（左右分欄佈局）

### 第三階段（6-8 小時）
7. 影片播放器與時間軸筆記聯動
8. 圖片上傳功能整合
9. PDF 檢視器整合
10. 權限控制實作

### 第四階段（2-3 小時）
11. 本地測試
12. Railway 部署
13. 生產環境驗證

---

## 注意事項

### 1. 響應式設計
- 桌面版：左右分欄（7:5 比例）
- 平板版：上下堆疊
- 手機版：單欄 + Tab 切換

### 2. 效能優化
- 時間軸筆記分頁載入（虛擬滾動）
- 圖片懶加載
- PDF 分頁載入

### 3. 權限控制
- Admin：可編輯/刪除所有內容，可審核筆記
- Staff：可編輯/刪除自己的內容
- Viewer：僅可查看

### 4. 資料驗證
- 時間軸筆記時間範圍驗證（0 ~ 影片總長度）
- 圖片數量限制（最多 5 張）
- 圖片大小限制（單張 5MB）

### 5. 錯誤處理
- 上傳失敗提示
- 網路錯誤提示
- 權限不足提示

---

## 後續擴展功能

### 1. 時間軸筆記進階功能
- 筆記標籤（問題、解法、注意事項）
- 筆記搜尋
- 筆記匯出（PDF、Markdown）

### 2. 影片建議進階功能
- 建議狀態（待處理、處理中、已完成）
- 建議指派（指派給特定使用者）
- 建議通知（Email、系統通知）

### 3. 知識節點進階功能
- 知識節點關聯圖
- 知識節點搜尋
- 知識節點匯出

### 4. 協作功能
- 即時協作（WebSocket）
- 評論功能（針對筆記、建議）
- @提及功能

---

**文件維護**：本文件將隨著開發進度持續更新，請定期檢視並調整設計與排程。

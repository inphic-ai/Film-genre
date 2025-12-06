# 影片知識庫與客戶分享系統

專業的影片管理與分享平台，實現「內外分流」的核心邏輯：內部看板顯示所有平台資源，外部專區僅分享 YouTube 影片。

## 🎯 核心功能

### 內外分流機制

- **內部看板（Board View）**: 管理員專用，顯示所有平台影片（YouTube/抖音/小紅書）
- **客戶自助專區（Client Portal）**: 公開頁面，僅顯示 YouTube 平台影片

### 智能管理

- **AI 自動生成縮圖**: 根據影片標題自動生成吸引人的預覽圖
- **AI 智能分類建議**: 分析影片內容自動建議最適合的分類標籤
- **快速搜尋與篩選**: 支援關鍵字搜尋、平台篩選、分類篩選

### 分類管理

系統預設 5 大分類：
1. **使用介紹** - 產品使用方法、功能介紹等教學影片
2. **維修** - 常見故障排除、維修教學影片
3. **案例** - 實際應用案例、客戶見證等影片
4. **常見問題** - 常見問題解答、疑難排解影片
5. **其他** - 其他類型的影片資源

## 🛠 技術架構

### 前端技術

- **React 19** - 最新的 React 框架
- **Tailwind CSS 4** - 現代化的 CSS 框架
- **shadcn/ui** - 高品質的 UI 組件庫
- **Wouter** - 輕量級路由解決方案
- **tRPC** - 端到端類型安全的 API

### 後端技術

- **Node.js** - JavaScript 執行環境
- **Express 4** - Web 應用框架
- **tRPC 11** - 類型安全的 RPC 框架
- **Drizzle ORM** - 輕量級的 TypeScript ORM

### 資料庫

- **PostgreSQL 17** - 企業級關聯式資料庫
- **Railway PostgreSQL** - 雲端託管的 PostgreSQL 服務

### AI 整合

- **Manus Image Generation** - AI 圖片生成服務
- **Manus LLM** - 大型語言模型服務

### 部署

- **Manus** - 開發環境
- **GitHub** - 版本控制
- **Railway** - 自動部署與託管

## 📦 專案結構

```
film-genre/
├── client/                 # 前端程式碼
│   ├── public/            # 靜態資源
│   └── src/
│       ├── components/    # React 組件
│       │   ├── ui/       # shadcn/ui 組件
│       │   └── VideoCard.tsx
│       ├── pages/        # 頁面組件
│       │   ├── Home.tsx  # 首頁（導航）
│       │   ├── Board.tsx # 內部看板
│       │   ├── Portal.tsx # 客戶專區
│       │   └── Manage.tsx # 影片管理
│       ├── lib/          # 工具函數
│       └── App.tsx       # 應用程式入口
├── server/                # 後端程式碼
│   ├── _core/            # 核心功能（OAuth, tRPC 等）
│   ├── db.ts             # 資料庫查詢函數
│   ├── routers.ts        # tRPC 路由定義
│   ├── ai.ts             # AI 輔助功能
│   └── *.test.ts         # 測試檔案
├── drizzle/              # 資料庫 schema 與 migrations
│   └── schema.ts         # 資料表定義
├── shared/               # 前後端共用程式碼
├── storage/              # S3 儲存功能
├── DEPLOYMENT.md         # 部署指南
└── README.md             # 專案說明
```

## 🚀 快速開始

### 前置需求

- Node.js 22+
- pnpm 10+
- Railway PostgreSQL 資料庫

### 本地開發

1. **安裝依賴**

```bash
pnpm install
```

2. **配置環境變數**

建立 `.env` 檔案（或在 Manus 中配置）：

```bash
DATABASE_URL=postgresql://postgres:password@host:port/database
JWT_SECRET=your-jwt-secret
OAUTH_SERVER_URL=your-oauth-server-url
VITE_APP_ID=your-app-id
# ... 其他環境變數
```

3. **執行資料庫 Migration**

```bash
pnpm db:push
```

4. **啟動開發伺服器**

```bash
pnpm dev
```

5. **訪問應用程式**

- 開發伺服器: http://localhost:3000
- 客戶專區: http://localhost:3000/portal
- 內部看板: http://localhost:3000/board（需登入）

### 執行測試

```bash
pnpm test
```

### 建置生產版本

```bash
pnpm build
pnpm start
```

## 📖 使用指南

### 客服人員使用情境

**情境**: 客戶來電說「滑鼠壞了」

1. 登入內部看板（`/board`）
2. 點選「維修」分類
3. 瀏覽縮圖找到對應的維修影片（不論平台）
4. 觀看影片後口頭指導客戶
5. 如果是 YouTube 影片，可直接傳送連結給客戶

### 客戶自助使用情境

**情境**: 客戶詢問是否有教學資源

1. 提供客戶專區連結（`/portal`）
2. 客戶可瀏覽所有 YouTube 教學影片
3. 支援關鍵字搜尋與分類篩選
4. 直接點選影片觀看

### 管理員操作

#### 新增影片

1. 進入內部看板（`/board`）
2. 點選「新增影片」
3. 填寫影片資訊：
   - 標題（必填）
   - 描述（選填）
   - 平台（YouTube/抖音/小紅書）
   - 影片連結（必填）
   - 分類（必填）
4. 可選擇：
   - 點選「AI 生成縮圖」自動生成預覽圖
   - 點選「AI 建議」自動建議分類
5. 儲存影片

#### 編輯影片

1. 在內部看板中找到影片
2. 點選「編輯」按鈕
3. 修改影片資訊
4. 儲存變更

#### 刪除影片

1. 在內部看板中找到影片
2. 點選「刪除」按鈕
3. 確認刪除

## 🔐 權限控制

### 公開訪問

- 首頁（`/`）
- 客戶自助專區（`/portal`）
- 查看 YouTube 影片列表

### 需要登入

- 內部看板（`/board`）
- 影片管理（`/manage`）

### 管理員專用

- 新增/編輯/刪除影片
- 查看所有平台影片
- 使用 AI 輔助功能

## 🗄 資料庫 Schema

### users 表

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  openId VARCHAR(64) UNIQUE NOT NULL,
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role VARCHAR(10) DEFAULT 'user',
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  lastSignedIn TIMESTAMP DEFAULT NOW()
);
```

### categories 表

```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  key VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

### videos 表

```sql
CREATE TABLE videos (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  platform VARCHAR(20) NOT NULL,  -- 'youtube' | 'tiktok' | 'redbook'
  videoUrl TEXT NOT NULL,
  thumbnailUrl TEXT,
  category VARCHAR(50) NOT NULL,  -- 'product_intro' | 'maintenance' | 'case_study' | 'faq' | 'other'
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  uploadedBy INTEGER REFERENCES users(id)
);
```

## 🧪 測試

專案包含完整的測試套件：

- **影片 CRUD 測試** - 測試影片的新增、查詢、更新、刪除功能
- **分類管理測試** - 測試分類的查詢與管理功能
- **權限控制測試** - 測試管理員與公開訪問的權限控制

執行測試：

```bash
pnpm test
```

## 📝 API 文件

### tRPC Procedures

#### Categories

- `categories.list` - 取得所有分類（公開）
- `categories.update` - 更新分類名稱（管理員）

#### Videos

- `videos.listAll` - 取得所有影片（管理員）
- `videos.listYouTube` - 取得 YouTube 影片（公開）
- `videos.listByCategory` - 依分類取得影片（管理員）
- `videos.listYouTubeByCategory` - 依分類取得 YouTube 影片（公開）
- `videos.search` - 搜尋影片（管理員）
- `videos.getById` - 取得單一影片（管理員）
- `videos.create` - 新增影片（管理員）
- `videos.update` - 更新影片（管理員）
- `videos.delete` - 刪除影片（管理員）

#### AI

- `ai.generateThumbnail` - 生成縮圖（管理員）
- `ai.suggestCategory` - 建議分類（管理員）

## 🚢 部署

詳細的部署指南請參考 [DEPLOYMENT.md](./DEPLOYMENT.md)

### 快速部署到 Railway

1. 連接 GitHub Repository
2. 配置環境變數
3. Railway 自動建置與部署
4. 訪問公開 URL

### 環境變數

必要的環境變數：

```bash
DATABASE_URL=postgresql://...
JWT_SECRET=...
OAUTH_SERVER_URL=...
VITE_APP_ID=...
BUILT_IN_FORGE_API_KEY=...
BUILT_IN_FORGE_API_URL=...
```

## 🤝 貢獻

歡迎提交 Issue 或 Pull Request！

## 📄 授權

MIT License

## 📧 聯絡

如有任何問題，請透過 GitHub Issues 聯繫。

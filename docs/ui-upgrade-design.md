# INPHIC 影片知識庫系統 - UI 升級設計文件

## 📋 專案資訊
- **專案名稱**: INPHIC 影片知識庫與維修協作系統
- **設計日期**: 2025-12-07
- **設計目標**: 根據 INPHIC 提供的 UI 原型，升級導航列、視覺設計與系統架構

---

## 🎨 視覺設計升級

### 配色方案
- **主色調**: Slate 系列（深色側邊欄 + 淺色主區域）
  - 側邊欄背景: `bg-slate-950`
  - 主區域背景: `bg-slate-100`
  - 卡片背景: `bg-white`
  
- **強調色**:
  - 主要操作按鈕: `bg-emerald-500` → `hover:bg-emerald-600`
  - Logo 漸層: `from-emerald-400 to-sky-400`
  - YouTube 標籤: `bg-red-600`
  - 小紅書標籤: `bg-pink-500`
  - 抖音標籤: `bg-slate-800`

### 字體系統
- **主要字體**: Noto Sans TC
- **字重**: 300 (Light), 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)

### 圓角與陰影
- **卡片圓角**: `rounded-2xl` (16px)
- **按鈕圓角**: `rounded-xl` (12px) / `rounded-full` (pill)
- **卡片陰影**: `shadow-sm` + `border border-slate-200/70`

---

## 🧭 導航系統架構

### 側邊欄導航（Sidebar）
**尺寸**: `w-72` (288px)
**背景**: `bg-slate-950 text-slate-50`

#### 導航區塊結構
1. **Logo 區域**
   - INPHIC 品牌標識
   - 系統名稱「影片知識庫系統」

2. **知識庫區塊**（前台功能）
   - 🎬 影片列表（員工端）
   - 🎥 影片詳情 + 時間軸筆記
   - 📦 商品知識中樞（SKU）
   - 📝 我的貢獻紀錄

3. **管理後台區塊**（Admin 專用）
   - 📊 總覽 Dashboard
   - 🎞️ 影片管理
   - ✅ 時間軸筆記審核
   - 🔗 商品編號關聯管理
   - 🏷️ 分類 & 標籤管理
   - 👥 使用者與權限

4. **外部區塊**
   - 🔗 對外分享頁 Demo

5. **底部使用者區域**
   - 使用者頭像與資訊
   - 角色標籤（Admin / Staff / Viewer）
   - 登出按鈕

### 頂部導航列（Top Bar）
**高度**: `h-16` (64px)
**背景**: `bg-white/80 backdrop-blur`

#### 頂部導航元素
1. **左側**: 
   - 品牌標識「INPHIC · FILM KNOWLEDGE OPS」
   - 當前頁面標題

2. **右側**:
   - 全域搜尋框（搜尋影片 / SKU / 客戶症狀...）
   - 新增影片按鈕

---

## 📦 影片卡片優化

### 卡片結構
```
┌─────────────────────────────┐
│  影片縮圖區域 (h-40)          │
│  - 左上角: 平台標籤          │
│  - 右上角: 分享狀態          │
├─────────────────────────────┤
│  標題 + 影片時長             │
│  標籤列（SKU + 症狀 + 維修） │
│  描述文字（2 行截斷）        │
│  ─────────────────────────  │
│  查看詳情  |  複製分享連結   │
└─────────────────────────────┘
```

### 卡片資訊層級
1. **主要資訊**:
   - 影片標題（含 SKU 編號）
   - 影片時長

2. **次要資訊**:
   - SKU 標籤（綠色強調）
   - 症狀標籤
   - 維修類型標籤

3. **輔助資訊**:
   - 影片描述（2 行截斷）
   - 平台來源（YouTube / 小紅書 / 抖音）
   - 分享狀態（可外部分享 / 僅內部瀏覽）

---

## 🗺️ 資訊架構（IA）

### 主要頁面層級

```
INPHIC 影片知識庫系統
│
├── 知識庫（前台）
│   ├── 影片列表（員工端）
│   │   ├── 篩選器（平台 / 分類 / 分享狀態）
│   │   └── 影片卡片網格
│   │
│   ├── 影片詳情 + 時間軸筆記
│   │   ├── YouTube 播放器
│   │   ├── 影片資訊（標題 / SKU / 標籤）
│   │   └── 時間軸筆記列表
│   │
│   ├── 商品知識中樞（SKU 中心頁）
│   │   ├── SKU 資訊卡片
│   │   ├── 商品家族 SKU（前 6 碼相同）
│   │   ├── 同義 SKU（Product_Relations）
│   │   ├── 相關影片列表
│   │   └── 知識節點（問題 → 原因 → 解法）
│   │
│   └── 我的貢獻紀錄
│       ├── 我提交的時間軸筆記
│       ├── 我提交的影片建議
│       └── 審核狀態與結果
│
├── 管理後台（Admin 專用）
│   ├── 總覽 Dashboard
│   │   ├── 本月新增影片統計
│   │   ├── 本月新增知識節點統計
│   │   ├── 待審核筆記數量
│   │   └── 分享連結點擊統計
│   │
│   ├── 影片管理
│   │   ├── 影片列表（含編輯 / 刪除）
│   │   └── 新增影片表單
│   │
│   ├── 時間軸筆記審核
│   │   ├── Pending 筆記列表
│   │   ├── 審核操作（Approve / Reject）
│   │   └── 拒絕原因輸入
│   │
│   ├── 商品編號關聯管理
│   │   ├── Product Family 規則
│   │   ├── Product_Relations 管理
│   │   └── SKU 搜尋工具
│   │
│   ├── 分類 & 標籤管理
│   │   ├── 分類 CRUD
│   │   └── 標籤 CRUD
│   │
│   └── 使用者與權限
│       ├── 使用者列表
│       └── 角色權限設定
│
└── 外部
    └── 對外分享頁 Demo
        ├── YouTube 播放器（唯讀）
        └── 影片資訊（無編輯功能）
```

---

## 🔄 使用者動線（User Flow）

### 員工端（Staff）主要動線
1. **查找影片**:
   - 進入「影片列表」
   - 使用篩選器（平台 / 分類 / SKU）
   - 或使用頂部全域搜尋
   - 點擊影片卡片進入詳情頁

2. **查看影片與筆記**:
   - 觀看 YouTube 影片
   - 瀏覽時間軸筆記
   - 點擊時間戳記跳轉影片

3. **新增時間軸筆記**:
   - 在影片詳情頁點擊「新增筆記」
   - 自動帶入當前播放秒數
   - 輸入筆記內容
   - 上傳圖片（0-5 張）
   - 提交（狀態: PENDING）

4. **查看我的貢獻**:
   - 進入「我的貢獻紀錄」
   - 查看我提交的筆記
   - 查看審核狀態

### Admin 主要動線
1. **審核時間軸筆記**:
   - 進入「時間軸筆記審核」
   - 查看 Pending 筆記列表
   - 點擊「核准」或「拒絕」
   - 若拒絕，輸入拒絕原因

2. **管理商品編號關聯**:
   - 進入「商品編號關聯管理」
   - 建立 Product Family 規則
   - 建立 Product_Relations（A ↔ B 關聯）
   - 使用 SKU 搜尋工具查看所有關聯

3. **查看統計數據**:
   - 進入「總覽 Dashboard」
   - 查看本月新增影片統計
   - 查看待審核筆記數量
   - 查看分享連結點擊統計

---

## 📊 資料庫 Schema 變更需求

### 新增資料表

#### 1. products - 商品主表
```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(50) UNIQUE NOT NULL,  -- PM6123456A
  name VARCHAR(255) NOT NULL,
  family_code VARCHAR(20),  -- 前 6 碼（PM612345）
  variant CHAR(1),  -- 最後一碼（A/B/C）
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. product_relations - 商品關聯表
```sql
CREATE TABLE product_relations (
  id SERIAL PRIMARY KEY,
  product_a_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  product_b_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  relation_type VARCHAR(50),  -- SYNONYM / FAMILY / PART
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_a_id, product_b_id)
);
```

#### 3. suggestions - 影片建議表
```sql
CREATE TABLE suggestions (
  id SERIAL PRIMARY KEY,
  video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  priority VARCHAR(20) DEFAULT 'MEDIUM',  -- LOW / MEDIUM / HIGH
  status VARCHAR(20) DEFAULT 'PENDING',  -- PENDING / READ / RESOLVED
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 4. audit_logs - 操作日誌表
```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,  -- CREATE_VIDEO / APPROVE_NOTE / etc.
  resource_type VARCHAR(50),  -- VIDEO / NOTE / PRODUCT
  resource_id INTEGER,
  details JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 5. share_logs - 分享紀錄表
```sql
CREATE TABLE share_logs (
  id SERIAL PRIMARY KEY,
  video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  shared_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  clicked_at TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(50),
  user_agent TEXT
);
```

### 修改現有資料表

#### videos 表新增欄位
```sql
ALTER TABLE videos
ADD COLUMN product_number VARCHAR(50),  -- SKU 編號
ADD COLUMN description TEXT,  -- 影片描述
ADD COLUMN duration INTEGER;  -- 影片時長（秒）
```

---

## 🎯 開發優先級

### Phase 1: 導航與視覺升級（本次開發）
1. ✅ 實作側邊欄導航（Sidebar）
2. ✅ 實作頂部搜尋列（Top Bar）
3. ✅ 優化影片卡片設計
4. ✅ 優化影片列表頁面

### Phase 2: 商品知識中樞（SKU 中心）
1. ❌ 建立 products 與 product_relations 表
2. ❌ 實作 SKU 中心頁 UI
3. ❌ 實作商品家族與同義 SKU 顯示
4. ❌ 實作相關影片列表

### Phase 3: 我的貢獻紀錄
1. ❌ 建立 suggestions 表
2. ❌ 實作我的貢獻紀錄頁面 UI
3. ❌ 實作筆記與建議列表
4. ❌ 實作審核狀態顯示

### Phase 4: 管理後台完善
1. ❌ 實作總覽 Dashboard
2. ❌ 實作商品編號關聯管理
3. ❌ 實作分類 & 標籤管理
4. ❌ 實作使用者與權限管理

---

## 📝 設計原則

### 1. 一致性（Consistency）
- 統一的配色方案
- 統一的圓角與陰影
- 統一的字體層級

### 2. 層級清晰（Hierarchy）
- 主要操作使用強調色（emerald-500）
- 次要操作使用中性色（slate-700）
- 輔助資訊使用淺色（slate-400/500）

### 3. 可讀性（Readability）
- 適當的行高與字距
- 清晰的對比度
- 適當的留白

### 4. 回饋性（Feedback）
- Hover 狀態變化
- 點擊狀態回饋
- 載入狀態提示

### 5. 無障礙（Accessibility）
- 鍵盤導航支援
- 適當的 ARIA 標籤
- 色盲友善的配色

---

## 🚀 實作計畫

### 本次開發範圍
1. 建立 DashboardLayout 組件（側邊欄 + 頂部導航）
2. 重構 Board.tsx 使用新的 DashboardLayout
3. 優化 VideoCard 組件設計
4. 新增全域搜尋功能
5. 新增影片描述與時長欄位

### 後續開發
1. 商品知識中樞（SKU 中心頁）
2. 我的貢獻紀錄頁面
3. 管理後台 Dashboard
4. 商品編號關聯管理
5. 分類 & 標籤管理
6. 使用者與權限管理

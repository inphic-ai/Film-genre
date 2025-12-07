# INPHIC 影片知識庫系統 - 完整開發規劃

## 📋 系統總覽

**系統名稱**：INPHIC 跨平台影片知識庫與維修協作系統

**核心目標**：
1. 整理多平台教學影片（YouTube / 小紅書 / 抖音）成為「內部維修知識庫」
2. 建立「產品 SKU 關聯」＋「時間軸筆記」＋「圖片補充」＋「審核流程」
3. 對外只分享「YouTube 來源」影片給客戶觀看，其他平台僅供內部使用

**技術棧**：
- 前端：React + Tailwind
- 後端：Node.js + Express + tRPC
- ORM：Drizzle ORM（PostgreSQL）
- DB：Railway PostgreSQL
- 儲存：Cloudflare R2
- 搜尋：PostgreSQL Full Text Search（tsvector + GIN index）

---

## 🎯 目前已完成功能

### ✅ Phase 1-8：基礎系統與標籤系統
- [x] 影片 CRUD（新增/編輯/刪除）
- [x] 平台篩選（YouTube/抖音/小紅書）
- [x] 分類管理（使用介紹/維修/實際案例）
- [x] 商品編號欄位（Internal_ID）
- [x] 分享狀態管理（Is_Shareable）
- [x] 時間軸筆記基礎功能
- [x] 影片詳情頁
- [x] 內外分流架構（內部看板 vs 客戶專區）
- [x] 標籤系統（KEYWORD / PRODUCT_CODE）
- [x] 智慧標籤排序（商品編號權重 × 10000）
- [x] 管理頁面標籤編輯器
- [x] 內部看板標籤篩選
- [x] 影片詳情頁標籤管理

---

## 📊 待開發功能對照表

根據提供的 HTML UI Prototype，以下是尚未實作的功能：

### 🔴 P0 優先級（核心功能）

#### 1. YouTube 播放器整合（F-FRONT-06）
**目前狀態**：❌ 未實作  
**需求**：
- 使用 YouTube Iframe API 控制播放、暫停、seek
- 支援點擊時間軸筆記 → 跳轉秒數
- 顯示播放進度與控制按鈕

**資料庫變更**：無  
**開發工作量**：中（2-3 天）

---

#### 2. 時間軸筆記完整功能（F-FRONT-09 ~ F-FRONT-14）
**目前狀態**：⚠️ 部分實作（僅有基礎結構）  
**需求**：
- 時間軸筆記列表（按時間排序）
- 新增筆記表單（自動帶入當前播放秒數）
- 圖片上傳（0-5 張，前端壓縮 → R2）
- 筆記狀態管理（Pending / Approved / Rejected）
- 點擊時間 → YouTube 播放器跳轉

**資料庫變更**：需新增 `timeline_notes` 表  
**開發工作量**：大（5-7 天）

---

#### 3. Cloudflare R2 圖片上傳（S-SERVICE-01 ~ S-SERVICE-03）
**目前狀態**：❌ 未實作  
**需求**：
- 前端壓縮圖片（尺寸/品質）
- 轉 Base64 → POST 到後端
- 後端解 Base64 → 上傳 R2 → 取得 URL
- 儲存 URL 到資料庫

**資料庫變更**：無（使用現有欄位）  
**開發工作量**：中（3-4 天）

---

#### 4. RBAC 權限系統（1.1 角色定義）
**目前狀態**：⚠️ 部分實作（僅有 Admin/User 區分）  
**需求**：
- Admin：完整管理權限
- Staff：觀看全部影片 + 新增筆記（Pending）
- Viewer：僅透過分享連結觀看 YouTube 影片

**資料庫變更**：需擴充 `users` 表的 `role` enum  
**開發工作量**：小（1-2 天）

---

### 🟡 P1 優先級（重要功能）

#### 5. 商品知識中樞（SKU 中心頁）（F-FRONT-產品頁）
**目前狀態**：❌ 未實作  
**需求**：
- 以 SKU 為中心整合所有資料
- 顯示商品家族 SKU（前 6 碼相同）
- 顯示同義 SKU（Product_Relations）
- 顯示相關影片列表
- 顯示知識節點（問題 → 原因 → 解法）

**資料庫變更**：需新增 `products` 和 `product_relations` 表  
**開發工作量**：大（5-6 天）

---

#### 6. 時間軸筆記審核中心（B-ADMIN-05 ~ B-ADMIN-06）
**目前狀態**：❌ 未實作  
**需求**：
- Pending 筆記列表
- 審核操作（Approve / Reject）
- 拒絕原因輸入
- 審核後通知提交者

**資料庫變更**：無（使用現有 timeline_notes 表）  
**開發工作量**：中（3-4 天）

---

#### 7. 我的貢獻紀錄（F-FRONT-我的貢獻）
**目前狀態**：❌ 未實作  
**需求**：
- 顯示我提交的時間軸筆記
- 顯示我提交的影片建議
- 顯示審核狀態與結果

**資料庫變更**：需新增 `suggestions` 表  
**開發工作量**：小（2-3 天）

---

#### 8. 商品編號關聯管理（B-ADMIN-07 ~ B-ADMIN-09）
**目前狀態**：❌ 未實作  
**需求**：
- Product Family 規則（PM6123456A 格式）
- Product_Relations 管理（A ↔ B 關聯）
- SKU 搜尋工具（顯示所有關聯）

**資料庫變更**：需新增 `products` 和 `product_relations` 表  
**開發工作量**：中（4-5 天）

---

### 🟢 P2 優先級（進階功能）

#### 9. PostgreSQL 全文搜尋（S-SERVICE-06 ~ S-SERVICE-07）
**目前狀態**：❌ 未實作  
**需求**：
- 建立 tsvector 欄位與 GIN index
- 搜尋邏輯（ts_query + @@）
- 相關性分數排序

**資料庫變更**：需新增 tsvector 欄位與索引  
**開發工作量**：中（3-4 天）

---

#### 10. Rate Limiting（S-SERVICE-04 ~ S-SERVICE-05）
**目前狀態**：❌ 未實作  
**需求**：
- 以 IP / 使用者 ID 為 key
- 每分鐘 100 次 API 請求限制
- 超過則回傳 429

**資料庫變更**：無  
**開發工作量**：小（1-2 天）

---

#### 11. 系統日誌（Audit Log）（B-ADMIN-14 ~ B-ADMIN-15）
**目前狀態**：❌ 未實作  
**需求**：
- 操作紀錄（誰在什麼時間做了什麼）
- 分享紀錄（外部分享點擊次數）

**資料庫變更**：需新增 `audit_logs` 和 `share_logs` 表  
**開發工作量**：中（3-4 天）

---

#### 12. 管理後台 Dashboard（B-ADMIN-Dashboard）
**目前狀態**：⚠️ 部分實作（僅有基礎統計）  
**需求**：
- 本月新增影片統計
- 本月新增知識節點統計
- 待審核筆記數量
- 分享連結點擊統計

**資料庫變更**：無  
**開發工作量**：小（2-3 天）

---

## 🗺️ 建議開發路徑

### **階段 1：核心播放與筆記功能（P0）**
**預估時間：2-3 週**

1. **YouTube 播放器整合**
   - 整合 YouTube Iframe API
   - 實作播放控制與 seek 功能
   - 測試播放器與時間軸筆記的互動

2. **時間軸筆記完整功能**
   - 資料庫 Schema 設計與 migration
   - 新增筆記表單（含當前秒數）
   - 筆記列表顯示與排序
   - 筆記狀態管理（Pending / Approved / Rejected）

3. **Cloudflare R2 圖片上傳**
   - 前端圖片壓縮組件
   - Base64 轉換與上傳
   - R2 整合與 URL 儲存
   - 測試完整上傳流程

4. **RBAC 權限系統擴充**
   - 擴充 role enum（Admin / Staff / Viewer）
   - 實作權限中介層
   - 測試不同角色的存取權限

---

### **階段 2：SKU 中心與審核功能（P1）**
**預估時間：2-3 週**

5. **商品知識中樞（SKU 中心頁）**
   - 資料庫 Schema 設計（products, product_relations）
   - SKU 中心頁 UI 實作
   - 商品家族與同義 SKU 顯示
   - 相關影片與知識節點整合

6. **商品編號關聯管理**
   - Product Family 規則實作
   - Product_Relations CRUD
   - SKU 搜尋工具

7. **時間軸筆記審核中心**
   - Pending 筆記列表
   - 審核操作介面
   - 拒絕原因與通知機制

8. **我的貢獻紀錄**
   - 我的筆記列表
   - 我的建議列表
   - 審核狀態顯示

---

### **階段 3：進階功能與優化（P2）**
**預估時間：1-2 週**

9. **PostgreSQL 全文搜尋**
   - tsvector 欄位與 GIN index
   - 搜尋邏輯實作
   - 相關性分數排序

10. **Rate Limiting**
    - Rate limit 中介層
    - IP / 使用者 ID 追蹤
    - 429 錯誤處理

11. **系統日誌（Audit Log）**
    - 操作紀錄表設計
    - 分享紀錄表設計
    - 日誌查詢介面

12. **管理後台 Dashboard 完善**
    - 統計數據 API
    - Dashboard UI 優化
    - 圖表視覺化

---

## 📝 資料庫 Schema 規劃

### 新增資料表需求

#### 1. `timeline_notes` - 時間軸筆記
```sql
CREATE TABLE timeline_notes (
  id SERIAL PRIMARY KEY,
  video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  time_seconds INTEGER NOT NULL,  -- 影片秒數
  content TEXT NOT NULL,
  image_urls TEXT[],  -- R2 圖片 URL 陣列
  status VARCHAR(20) DEFAULT 'PENDING',  -- PENDING / APPROVED / REJECTED
  reject_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. `products` - 商品主表
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

#### 3. `product_relations` - 商品關聯表
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

#### 4. `suggestions` - 影片建議表
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

#### 5. `audit_logs` - 操作日誌表
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

#### 6. `share_logs` - 分享紀錄表
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

---

## ⚠️ 重要注意事項

### 資料庫變更流程
所有資料庫 Schema 變更必須：
1. 提交資料庫變更申請（DB_CHANGE_REQUEST_*.md）
2. 等待審核通過
3. 執行 migration（`pnpm db:push`）
4. 測試驗證
5. 建立 checkpoint

### 開發規範
- ✅ 使用 PostgreSQL 語法（禁止 MySQL / TiDB）
- ✅ 使用 Drizzle ORM
- ✅ 所有變更推送到 GitHub
- ✅ Railway 自動部署
- ✅ 每階段完成後建立 checkpoint

---

## 📞 下一步行動

請確認您希望優先開發哪個階段：

1. **階段 1：核心播放與筆記功能（P0）** - 推薦優先開發
2. **階段 2：SKU 中心與審核功能（P1）**
3. **階段 3：進階功能與優化（P2）**

或者，您有其他優先順序的調整需求？

# 資料庫 Schema 變更申請 - Phase 20

**申請日期**: 2025-12-07  
**申請人**: Manus AI  
**專案**: INPHIC 影片知識庫與維修協作系統  
**目的**: 實作影片詳情頁重新設計（時間軸筆記、說明書 PDF、影片建議、知識節點）

---

## A. 受影響資料表

本次變更將**新增 4 個資料表**，不影響現有資料表：

1. **timeline_notes**（時間軸筆記）- 新增
2. **video_suggestions**（影片建議/回饋）- 新增
3. **video_documents**（影片文件：說明書 PDF、SOP）- 新增
4. **knowledge_nodes**（知識節點：問題/原因/解法）- 新增

**現有資料表**: 無影響，不修改任何現有欄位或資料

---

## B. 欄位增刪修改細節

### 1. timeline_notes（時間軸筆記）

**用途**: 儲存使用者在影片特定時間點新增的筆記，支援圖片上傳、審核狀態、拒絕原因。

| 欄位名稱 | 資料型別 | 約束條件 | 說明 |
|---------|---------|---------|------|
| id | integer | PRIMARY KEY, AUTO_INCREMENT | 筆記 ID |
| video_id | integer | NOT NULL, FOREIGN KEY → videos(id) | 關聯影片 ID |
| user_id | integer | NOT NULL, FOREIGN KEY → user(id) | 建立者 ID |
| timestamp | integer | NOT NULL | 影片時間戳記（秒） |
| title | varchar(255) | NOT NULL | 筆記標題 |
| content | text | NOT NULL | 筆記內容 |
| images | text | NULL | 圖片 URL 陣列（JSON 格式，最多 5 張） |
| status | varchar(20) | NOT NULL, DEFAULT 'pending' | 審核狀態（pending/approved/rejected） |
| rejection_reason | text | NULL | 拒絕原因（status=rejected 時填寫） |
| created_at | timestamp | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 建立時間 |
| updated_at | timestamp | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE | 更新時間 |

**索引**:
- `idx_video_id` ON `video_id`
- `idx_user_id` ON `user_id`
- `idx_status` ON `status`

---

### 2. video_suggestions（影片建議/回饋）

**用途**: 儲存使用者對影片的建議與回饋，支援優先級標籤。

| 欄位名稱 | 資料型別 | 約束條件 | 說明 |
|---------|---------|---------|------|
| id | integer | PRIMARY KEY, AUTO_INCREMENT | 建議 ID |
| video_id | integer | NOT NULL, FOREIGN KEY → videos(id) | 關聯影片 ID |
| user_id | integer | NOT NULL, FOREIGN KEY → user(id) | 建立者 ID |
| title | varchar(255) | NOT NULL | 建議標題 |
| content | text | NOT NULL | 建議內容 |
| priority | varchar(20) | NOT NULL, DEFAULT 'normal' | 優先級（normal/important/urgent） |
| created_at | timestamp | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 建立時間 |
| updated_at | timestamp | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE | 更新時間 |

**索引**:
- `idx_video_id` ON `video_id`
- `idx_user_id` ON `user_id`
- `idx_priority` ON `priority`

---

### 3. video_documents（影片文件）

**用途**: 儲存與影片相關的文件（說明書 PDF、SOP、維修流程等）。

| 欄位名稱 | 資料型別 | 約束條件 | 說明 |
|---------|---------|---------|------|
| id | integer | PRIMARY KEY, AUTO_INCREMENT | 文件 ID |
| video_id | integer | NOT NULL, FOREIGN KEY → videos(id) | 關聯影片 ID |
| type | varchar(50) | NOT NULL | 文件類型（manual/sop/other） |
| title | varchar(255) | NOT NULL | 文件標題 |
| file_url | text | NOT NULL | 文件 URL（Cloudflare R2） |
| file_key | varchar(500) | NOT NULL | R2 檔案 Key |
| file_size | integer | NULL | 檔案大小（bytes） |
| mime_type | varchar(100) | NULL | MIME 類型（application/pdf） |
| uploaded_by | integer | NOT NULL, FOREIGN KEY → user(id) | 上傳者 ID |
| created_at | timestamp | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 建立時間 |

**索引**:
- `idx_video_id` ON `video_id`
- `idx_type` ON `type`

---

### 4. knowledge_nodes（知識節點）

**用途**: 儲存與 SKU 相關的知識節點（問題/原因/解法），整合到影片詳情頁。

| 欄位名稱 | 資料型別 | 約束條件 | 說明 |
|---------|---------|---------|------|
| id | integer | PRIMARY KEY, AUTO_INCREMENT | 知識節點 ID |
| sku | varchar(50) | NOT NULL | 商品編號（SKU） |
| problem | text | NOT NULL | 問題描述 |
| cause | text | NULL | 原因分析 |
| solution | text | NOT NULL | 解決方法 |
| created_by | integer | NOT NULL, FOREIGN KEY → user(id) | 建立者 ID |
| created_at | timestamp | NOT NULL, DEFAULT CURRENT_TIMESTAMP | 建立時間 |
| updated_at | timestamp | NOT NULL, DEFAULT CURRENT_TIMESTAMP ON UPDATE | 更新時間 |

**索引**:
- `idx_sku` ON `sku`

---

## C. 回滾策略與相容性評估

### 回滾策略

1. **資料庫層級**:
   - 所有新增資料表皆為獨立表，不影響現有資料表
   - 如需回滾，執行以下 SQL：
     ```sql
     DROP TABLE IF EXISTS timeline_notes;
     DROP TABLE IF EXISTS video_suggestions;
     DROP TABLE IF EXISTS video_documents;
     DROP TABLE IF EXISTS knowledge_nodes;
     ```

2. **應用程式層級**:
   - 新增的 tRPC procedures 皆為新路由，不影響現有 API
   - 前端新增的組件皆為新頁面，不影響現有頁面
   - 如需回滾，使用 `webdev_rollback_checkpoint` 回到 Phase 19 (version: f05a703a)

3. **資料備份**:
   - Railway PostgreSQL 自動備份機制已啟用
   - 手動備份指令（執行前）：
     ```bash
     pg_dump $DATABASE_URL > backup_phase19_$(date +%Y%m%d_%H%M%S).sql
     ```

### 相容性評估

| 評估項目 | 影響程度 | 說明 |
|---------|---------|------|
| **向後相容性** | ✅ 無影響 | 新增資料表不影響現有功能 |
| **現有 API** | ✅ 無影響 | 現有 tRPC procedures 不受影響 |
| **現有前端** | ✅ 無影響 | 現有頁面與組件不受影響 |
| **資料庫效能** | ⚠️ 輕微影響 | 新增 4 個表 + 索引，預估增加 < 5% 查詢負載 |
| **儲存空間** | ⚠️ 輕微影響 | 預估每月增加 < 100MB（假設 1000 筆筆記 + 100 個文件） |
| **部署風險** | ✅ 低風險 | Migration 僅新增表，不修改現有資料 |

### 風險評估

| 風險項目 | 風險等級 | 緩解措施 |
|---------|---------|---------|
| **Migration 失敗** | 🟡 中 | 1. 在本地環境測試 Migration<br>2. 使用 Drizzle ORM 自動生成 SQL<br>3. 執行前備份資料庫 |
| **外鍵約束錯誤** | 🟢 低 | 所有外鍵皆參照現有資料表（videos, user），已驗證存在 |
| **索引效能影響** | 🟢 低 | 索引欄位皆為查詢熱點，提升查詢效能 |
| **資料一致性** | 🟢 低 | 使用 FOREIGN KEY 約束確保資料一致性 |

---

## D. 預期效益

1. **功能完整性**: 實現影片詳情頁完整功能（時間軸筆記、說明書 PDF、影片建議、知識節點）
2. **使用者體驗**: 提升影片知識管理效率，支援多人協作與審核流程
3. **資料結構化**: 建立結構化的知識節點與文件管理系統
4. **可擴充性**: 為未來功能（例如：知識圖譜、智慧推薦）奠定基礎

---

## E. 測試計畫

### 1. 本地環境測試
- ✅ 執行 `pnpm db:push` 驗證 Migration 成功
- ✅ 檢查資料表結構與索引
- ✅ 執行 vitest 測試（CRUD 操作、外鍵約束、審核流程）

### 2. Railway 生產環境測試
- ✅ 驗證 Migration 自動執行
- ✅ 測試 API 端點（Postman / 前端 UI）
- ✅ 驗證資料一致性與效能

### 3. 回滾測試
- ✅ 在測試環境執行回滾 SQL
- ✅ 驗證現有功能不受影響

---

## F. 審核確認

**請確認以下事項**：

- [ ] 資料表設計符合業務需求
- [ ] 欄位型別與約束條件正確
- [ ] 索引設計合理
- [ ] 回滾策略可行
- [ ] 相容性評估無遺漏
- [ ] 測試計畫完整

**審核通過後，我將執行以下步驟**：
1. 更新 `drizzle/schema.ts`
2. 執行 `pnpm db:push` 推送到 Railway PostgreSQL
3. 驗證資料表結構
4. 開始實作後端 API 與前端組件

---

**申請人**: Manus AI  
**申請日期**: 2025-12-07  
**等待審核**: ⏳ 待 INPHIC 確認

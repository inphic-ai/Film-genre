# 資料庫變更申請：P0 階段核心功能

## 📋 變更摘要

**申請日期**：2025-12-07  
**申請人**：Manus AI  
**變更目的**：實作 P0 階段核心功能（YouTube 播放器 + 時間軸筆記 + R2 圖片上傳 + RBAC 擴充）

---

## A. 受影響資料表

1. **新增資料表**：`timeline_notes`（時間軸筆記）
2. **修改資料表**：`users`（擴充 role enum）

---

## B. 欄位變更細節

### 1. 新增資料表：`timeline_notes`

**用途**：儲存影片的時間軸筆記，支援文字說明、圖片上傳、審核流程

**Schema**：
```sql
CREATE TABLE timeline_notes (
  id SERIAL PRIMARY KEY,
  video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  time_seconds INTEGER NOT NULL,  -- 影片秒數（例如：185 = 03:05）
  content TEXT NOT NULL,  -- 筆記文字內容
  image_urls TEXT[],  -- Cloudflare R2 圖片 URL 陣列（最多 5 張）
  status VARCHAR(20) DEFAULT 'PENDING',  -- PENDING / APPROVED / REJECTED
  reject_reason TEXT,  -- 審核拒絕原因（僅 REJECTED 時填寫）
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_timeline_notes_video_id ON timeline_notes(video_id);
CREATE INDEX idx_timeline_notes_user_id ON timeline_notes(user_id);
CREATE INDEX idx_timeline_notes_status ON timeline_notes(status);
```

**欄位說明**：
- `video_id`：關聯的影片 ID（外鍵，CASCADE 刪除）
- `user_id`：提交筆記的使用者 ID（外鍵，CASCADE 刪除）
- `time_seconds`：影片時間軸位置（秒數）
- `content`：筆記文字內容
- `image_urls`：圖片 URL 陣列（PostgreSQL TEXT[] 型別）
- `status`：審核狀態（PENDING = 待審核、APPROVED = 已通過、REJECTED = 已拒絕）
- `reject_reason`：拒絕原因（僅 REJECTED 時填寫）

---

### 2. 修改資料表：`users`

**變更內容**：擴充 `role` 欄位的 enum 值

**目前狀態**：
```sql
role VARCHAR(20) DEFAULT 'user'
-- 可能的值：'admin', 'user'
```

**變更後**：
```sql
role VARCHAR(20) DEFAULT 'staff'
-- 可能的值：'admin', 'staff', 'viewer'
```

**變更原因**：
- 原有的 `user` 角色改名為 `staff`（員工/維修人員）
- 新增 `viewer` 角色（客戶/外部觀看者）
- 保留 `admin` 角色（管理員）

**Migration SQL**：
```sql
-- 將現有的 'user' 角色改為 'staff'
UPDATE users SET role = 'staff' WHERE role = 'user';

-- 不需要修改 column 定義（已經是 VARCHAR(20)）
```

---

## C. 相容性風險評估

### 1. 是否影響現有資料？

**timeline_notes 表**：
- ❌ 不影響（全新資料表）
- ✅ 使用 `ON DELETE CASCADE`，影片或使用者刪除時自動清理筆記

**users 表**：
- ⚠️ 輕微影響：現有 `role = 'user'` 的使用者會被更新為 `role = 'staff'`
- ✅ 不影響現有功能（僅改名，權限邏輯相同）

---

### 2. 是否造成現場系統中斷？

**風險評估**：❌ 不會中斷

**原因**：
- 新增資料表不影響現有功能
- `users` 表的 role 更新是簡單的字串替換
- Migration 執行時間預估 < 1 秒

---

### 3. 是否可能產生孤兒資料？

**風險評估**：❌ 不會產生孤兒資料

**防範機制**：
- `timeline_notes.video_id` 使用 `ON DELETE CASCADE`
- `timeline_notes.user_id` 使用 `ON DELETE CASCADE`
- 影片或使用者刪除時，相關筆記自動刪除

---

### 4. 若失敗如何回滾？

**回滾 SQL**：
```sql
-- 回滾 timeline_notes 表
DROP TABLE IF EXISTS timeline_notes CASCADE;

-- 回滾 users 表（將 staff 改回 user）
UPDATE users SET role = 'user' WHERE role = 'staff';
```

**回滾步驟**：
1. 停止應用程式
2. 執行回滾 SQL
3. 回滾程式碼到上一個 checkpoint
4. 重啟應用程式

**資料損失風險**：
- ⚠️ 回滾會刪除所有已新增的時間軸筆記
- ✅ 不影響現有影片、使用者、標籤等資料

---

## D. 測試計畫

### 1. 資料表建立測試
```sql
-- 測試 timeline_notes 表建立
SELECT * FROM timeline_notes LIMIT 1;

-- 測試外鍵約束
INSERT INTO timeline_notes (video_id, user_id, time_seconds, content)
VALUES (999999, 999999, 100, 'Test');  -- 應該失敗（外鍵不存在）
```

### 2. CRUD 操作測試
```sql
-- 新增筆記
INSERT INTO timeline_notes (video_id, user_id, time_seconds, content, image_urls, status)
VALUES (1, 1, 185, '測試筆記', ARRAY['https://r2.example.com/image1.jpg'], 'PENDING');

-- 查詢筆記
SELECT * FROM timeline_notes WHERE video_id = 1 ORDER BY time_seconds;

-- 更新筆記狀態
UPDATE timeline_notes SET status = 'APPROVED' WHERE id = 1;

-- 刪除筆記
DELETE FROM timeline_notes WHERE id = 1;
```

### 3. CASCADE 刪除測試
```sql
-- 測試影片刪除時，筆記是否自動刪除
DELETE FROM videos WHERE id = 1;
SELECT * FROM timeline_notes WHERE video_id = 1;  -- 應該返回空結果
```

### 4. Role 更新測試
```sql
-- 測試 role 更新
SELECT role, COUNT(*) FROM users GROUP BY role;
-- 預期結果：admin, staff, viewer
```

---

## E. 部署計畫

### 1. 部署時間
- 預估執行時間：< 1 分鐘
- 建議部署時間：任何時間（不影響現有功能）

### 2. 部署步驟
1. 備份資料庫（Railway 自動備份）
2. 執行 `pnpm db:push`
3. 驗證資料表建立成功
4. 執行測試 SQL
5. 部署應用程式到 Railway
6. 驗證生產環境功能

### 3. 監控指標
- 資料表建立成功率：100%
- Migration 執行時間：< 1 秒
- 應用程式啟動成功率：100%

---

## F. 相依性與前置條件

### 1. Cloudflare R2 設定
- 需要 Cloudflare R2 帳號與 API credentials
- 需要建立 R2 bucket
- 需要設定 CORS 規則

### 2. 環境變數
```bash
# Cloudflare R2
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=inphic-film-images
R2_PUBLIC_URL=https://your-bucket.r2.dev
```

---

## G. 審核檢查清單

- [ ] Schema 設計合理（欄位型別、索引、外鍵）
- [ ] 使用 `ON DELETE CASCADE` 防止孤兒資料
- [ ] 提供完整的回滾 SQL
- [ ] 測試計畫完整（CRUD + CASCADE）
- [ ] 部署計畫清楚（步驟 + 監控）
- [ ] 相依性與前置條件明確
- [ ] 不影響現有系統運作
- [ ] 符合 PostgreSQL 語法規範

---

## H. 批准簽名

**申請人**：Manus AI  
**申請日期**：2025-12-07

**審核人**：________________  
**審核日期**：________________  
**審核結果**：□ 批准　□ 拒絕　□ 需修改

**備註**：

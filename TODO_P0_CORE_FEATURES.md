# P0 階段：核心播放與筆記功能 - 任務清單

## Phase 1：資料庫變更申請
- [ ] 準備 timeline_notes 表 Schema
- [ ] 準備 RBAC 擴充 Schema（Staff / Viewer 角色）
- [ ] 撰寫資料庫變更申請文件
- [ ] 等待審核通過

## Phase 2：執行資料庫 migration
- [ ] 執行 db:push 推送 Schema 到 Railway PostgreSQL
- [ ] 驗證資料表建立成功
- [ ] 測試資料表 CRUD 操作

## Phase 3：實作 Cloudflare R2 圖片上傳服務
- [ ] 設定 Cloudflare R2 credentials
- [ ] 建立前端圖片壓縮組件（ImageUpload.tsx）
- [ ] 實作 Base64 轉換
- [ ] 建立後端 R2 上傳 API
- [ ] 測試完整上傳流程（前端 → Base64 → R2 → URL）

## Phase 4：實作 YouTube 播放器整合
- [ ] 整合 YouTube Iframe API
- [ ] 建立 YouTubePlayer 組件
- [ ] 實作播放控制（播放/暫停/seek）
- [ ] 實作時間跳轉功能
- [ ] 測試播放器與時間軸筆記的互動

## Phase 5：實作時間軸筆記完整功能
- [ ] 建立時間軸筆記後端 API（tRPC procedures）
  - [ ] createNote - 新增筆記
  - [ ] getNotesByVideo - 取得影片的所有筆記
  - [ ] updateNote - 更新筆記
  - [ ] deleteNote - 刪除筆記
- [ ] 建立時間軸筆記前端組件
  - [ ] TimelineNoteList.tsx - 筆記列表
  - [ ] TimelineNoteForm.tsx - 新增筆記表單
  - [ ] TimelineNoteItem.tsx - 單一筆記顯示
- [ ] 實作新增筆記表單
  - [ ] 自動帶入當前播放秒數
  - [ ] 文字內容輸入
  - [ ] 圖片上傳（0-5 張）
- [ ] 實作筆記列表顯示
  - [ ] 按時間排序
  - [ ] 顯示時間戳、文字、圖片、作者
  - [ ] 顯示審核狀態（Pending/Approved/Rejected）
- [ ] 實作點擊時間 → 播放器跳轉
- [ ] 測試筆記 CRUD 操作

## Phase 6：實作 RBAC 權限系統擴充
- [ ] 擴充 users 表的 role enum（Admin / Staff / Viewer）
- [ ] 建立權限中介層（tRPC middleware）
- [ ] 實作 Staff 權限邏輯
  - [ ] 可觀看全部影片
  - [ ] 可新增筆記（狀態 = Pending）
  - [ ] 可編輯/刪除自己的筆記
- [ ] 實作 Viewer 權限邏輯
  - [ ] 僅透過分享連結觀看 YouTube 影片
  - [ ] 不可新增/修改筆記
- [ ] 測試不同角色的存取權限

## Phase 7：測試所有新功能
- [ ] 撰寫 vitest 測試
  - [ ] 測試時間軸筆記 CRUD
  - [ ] 測試圖片上傳流程
  - [ ] 測試 RBAC 權限
- [ ] 手動測試前端功能
  - [ ] 測試 YouTube 播放器
  - [ ] 測試時間軸筆記新增/顯示
  - [ ] 測試圖片上傳與顯示
  - [ ] 測試不同角色的權限
- [ ] 測試向後相容性
  - [ ] 確認現有影片功能正常
  - [ ] 確認現有標籤功能正常

## Phase 8：建立 checkpoint 並部署到 Railway
- [ ] 更新 TODO 標記所有任務完成
- [ ] 建立 checkpoint
- [ ] 推送到 GitHub
- [ ] 驗證 Railway 自動部署
- [ ] 測試生產環境功能

---

## 功能規格總結

### 1. YouTube 播放器整合
- 使用 YouTube Iframe API
- 支援播放控制（播放/暫停/seek）
- 支援時間跳轉（點擊筆記 → 跳轉秒數）

### 2. 時間軸筆記
- 新增筆記表單（自動帶入當前秒數）
- 文字內容輸入
- 圖片上傳（0-5 張，前端壓縮 → R2）
- 筆記列表顯示（按時間排序）
- 筆記狀態管理（Pending / Approved / Rejected）
- 點擊時間 → 播放器跳轉

### 3. Cloudflare R2 圖片上傳
- 前端圖片壓縮（尺寸/品質）
- Base64 轉換
- 後端上傳到 R2
- 取得公開 URL 並儲存到資料庫

### 4. RBAC 權限系統
- Admin：完整管理權限
- Staff：觀看全部影片 + 新增筆記（Pending）
- Viewer：僅透過分享連結觀看 YouTube 影片

---

## 資料庫 Schema

### timeline_notes 表
```sql
CREATE TABLE timeline_notes (
  id SERIAL PRIMARY KEY,
  video_id INTEGER NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  time_seconds INTEGER NOT NULL,
  content TEXT NOT NULL,
  image_urls TEXT[],
  status VARCHAR(20) DEFAULT 'PENDING',
  reject_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### users 表擴充
```sql
ALTER TABLE users
ALTER COLUMN role TYPE VARCHAR(20);

-- 更新 role enum
-- Admin / Staff / Viewer
```

---

## 預估時間

- Phase 1-2：1 天
- Phase 3：3-4 天
- Phase 4：2-3 天
- Phase 5：5-7 天
- Phase 6：1-2 天
- Phase 7：2-3 天
- Phase 8：1 天

**總計：15-23 天（2-3 週）**

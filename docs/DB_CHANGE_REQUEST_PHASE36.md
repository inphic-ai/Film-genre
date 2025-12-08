# 資料庫 Schema 變更申請 - Phase 36：效能監控儀表板

**申請日期**：2025-12-07  
**申請人**：Manus AI Agent  
**專案**：INPHIC 影片知識庫系統  
**Phase**：Phase 36 - 效能監控儀表板（P3）

---

## 📋 變更摘要

新增 2 個資料表用於效能監控與使用者活動追蹤：
1. **performance_logs** - API 回應時間與資料庫查詢效能日誌
2. **user_activity_logs** - 使用者活動統計日誌

---

## 🎯 業務需求

### 1. 效能監控需求
- 追蹤 API 回應時間，識別慢查詢
- 監控資料庫查詢效能，優化瓶頸
- 系統健康狀態即時監控

### 2. 使用者活動追蹤需求
- 記錄使用者操作行為（新增影片、審核筆記、搜尋）
- 分析使用者活動模式
- 提供活動統計報表

---

## 📊 新增資料表

### 1. performance_logs（效能日誌表）

| 欄位名稱 | 資料型別 | 限制 | 說明 |
|---------|---------|------|------|
| id | SERIAL | PRIMARY KEY | 日誌 ID |
| logType | VARCHAR(50) | NOT NULL | 日誌類型（API / DB_QUERY） |
| endpoint | VARCHAR(255) | | API 端點或查詢名稱 |
| method | VARCHAR(10) | | HTTP 方法（GET/POST/PUT/DELETE） |
| responseTime | INTEGER | NOT NULL | 回應時間（毫秒） |
| statusCode | INTEGER | | HTTP 狀態碼 |
| userId | INTEGER | | 使用者 ID（外鍵 → users.id） |
| errorMessage | TEXT | | 錯誤訊息（如有） |
| metadata | JSONB | | 額外資訊（請求參數、查詢 SQL 等） |
| createdAt | TIMESTAMP | NOT NULL DEFAULT NOW() | 建立時間 |

**索引**：
- `idx_performance_logs_log_type` ON (logType)
- `idx_performance_logs_created_at` ON (createdAt)
- `idx_performance_logs_user_id` ON (userId)

**外鍵**：
- `userId` REFERENCES `users(id)` ON DELETE SET NULL

---

### 2. user_activity_logs（使用者活動日誌表）

| 欄位名稱 | 資料型別 | 限制 | 說明 |
|---------|---------|------|------|
| id | SERIAL | PRIMARY KEY | 日誌 ID |
| userId | INTEGER | NOT NULL | 使用者 ID（外鍵 → users.id） |
| action | VARCHAR(100) | NOT NULL | 操作類型（VIDEO_CREATE / NOTE_SUBMIT / SEARCH / REVIEW_APPROVE 等） |
| targetType | VARCHAR(50) | | 目標類型（VIDEO / NOTE / TAG / PRODUCT） |
| targetId | INTEGER | | 目標 ID |
| details | TEXT | | 操作詳細資訊 |
| ipAddress | VARCHAR(45) | | IP 位址 |
| userAgent | VARCHAR(255) | | User Agent |
| createdAt | TIMESTAMP | NOT NULL DEFAULT NOW() | 建立時間 |

**索引**：
- `idx_user_activity_logs_user_id` ON (userId)
- `idx_user_activity_logs_action` ON (action)
- `idx_user_activity_logs_created_at` ON (createdAt)
- `idx_user_activity_logs_target` ON (targetType, targetId)

**外鍵**：
- `userId` REFERENCES `users(id)` ON DELETE CASCADE

---

## 🔄 資料遷移計劃

### 階段 1：建立資料表（無資料遷移）
```sql
-- 1. 建立 performance_logs 表
CREATE TABLE performance_logs (
  id SERIAL PRIMARY KEY,
  log_type VARCHAR(50) NOT NULL,
  endpoint VARCHAR(255),
  method VARCHAR(10),
  response_time INTEGER NOT NULL,
  status_code INTEGER,
  user_id INTEGER,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_performance_logs_log_type ON performance_logs(log_type);
CREATE INDEX idx_performance_logs_created_at ON performance_logs(created_at);
CREATE INDEX idx_performance_logs_user_id ON performance_logs(user_id);

-- 2. 建立 user_activity_logs 表
CREATE TABLE user_activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id INTEGER,
  details TEXT,
  ip_address VARCHAR(45),
  user_agent VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX idx_user_activity_logs_action ON user_activity_logs(action);
CREATE INDEX idx_user_activity_logs_created_at ON user_activity_logs(created_at);
CREATE INDEX idx_user_activity_logs_target ON user_activity_logs(target_type, target_id);
```

### 階段 2：驗證資料表結構
```sql
-- 驗證 performance_logs 表
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'performance_logs';

-- 驗證 user_activity_logs 表
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_activity_logs';

-- 驗證索引
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('performance_logs', 'user_activity_logs');
```

---

## ⚠️ 風險評估

### 1. 效能影響
- **風險等級**：低
- **說明**：新增資料表不影響既有功能，僅新增日誌記錄
- **緩解措施**：
  - 使用非同步日誌寫入，避免阻塞主流程
  - 設定日誌保留期限（例如 30 天），定期清理舊資料
  - 使用批次寫入減少資料庫負載

### 2. 儲存空間
- **風險等級**：中
- **說明**：日誌資料會持續增長，需要定期清理
- **緩解措施**：
  - 設定自動清理任務（保留最近 30 天）
  - 監控資料表大小，超過閾值時觸發警告

### 3. 資料隱私
- **風險等級**：低
- **說明**：記錄使用者活動可能涉及隱私問題
- **緩解措施**：
  - 不記錄敏感資訊（密碼、個人資料）
  - IP 位址與 User Agent 僅用於系統分析，不對外公開
  - 遵守 GDPR 與隱私政策

---

## 📅 實施時程

1. **Schema 變更審核**：2025-12-07（即日）
2. **執行 migration**：審核通過後立即執行
3. **後端 API 開發**：2025-12-07
4. **前端頁面開發**：2025-12-07
5. **測試與部署**：2025-12-07

---

## ✅ 回滾計劃

如需回滾，執行以下 SQL：

```sql
-- 刪除資料表（會同時刪除索引與外鍵）
DROP TABLE IF EXISTS user_activity_logs CASCADE;
DROP TABLE IF EXISTS performance_logs CASCADE;
```

---

## 📝 備註

1. **日誌保留政策**：建議保留最近 30 天的日誌，超過 30 天的自動刪除
2. **效能優化**：使用批次寫入與非同步處理，避免影響主流程效能
3. **隱私保護**：不記錄敏感資訊，遵守隱私政策

---

## 🔍 審核檢查清單

- [ ] Schema 設計符合業務需求
- [ ] 索引設計合理，支援查詢效能
- [ ] 外鍵約束正確設定
- [ ] 資料遷移計劃可行
- [ ] 風險評估完整
- [ ] 回滾計劃明確
- [ ] 符合《INPHIC × Manus 生產環境合作規範 1.0》

---

**申請狀態**：待審核  
**預計執行時間**：審核通過後立即執行

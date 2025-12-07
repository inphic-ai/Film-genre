# 全部程序效能優化檢查清單

## 概述

本文件列出 INPHIC 影片知識庫系統的效能優化檢查項目，涵蓋前端、後端、資料庫、儲存等各個層面。

---

## 前端效能優化

### 1. 代碼分割與懶加載
- [ ] 使用 React.lazy() 實現路由級別代碼分割
- [ ] 實現圖片懶加載（使用 Intersection Observer）
- [ ] 優化 Bundle 大小（檢查 Vite 構建報告）

**檢查方式**：
```bash
pnpm build
# 檢查 dist/ 目錄下的檔案大小
```

### 2. 快取策略
- [ ] 設定 HTTP 快取頭（Cache-Control）
- [ ] 實現瀏覽器快取（localStorage/sessionStorage）
- [ ] 使用 Service Worker 實現離線快取

**檢查方式**：
- 開啟瀏覽器開發者工具 → Network 標籤
- 檢查 Response Headers 中的 Cache-Control

### 3. 渲染效能
- [ ] 避免不必要的 re-render（使用 useMemo、useCallback）
- [ ] 使用虛擬滾動優化大列表（如影片列表）
- [ ] 優化 CSS 選擇器複雜度

**檢查方式**：
```bash
# 使用 React DevTools Profiler
# 檢查組件渲染時間
```

### 4. 資源最佳化
- [ ] 壓縮圖片（使用 WebP 格式）
- [ ] 最小化 CSS 和 JavaScript
- [ ] 移除未使用的依賴

**檢查方式**：
```bash
pnpm audit
pnpm outdated
```

---

## 後端效能優化

### 1. API 效能
- [x] 實現 tRPC 程序分層（publicProcedure、protectedProcedure、adminProcedure）
- [ ] 添加 API 速率限制（Rate Limiting）
- [ ] 實現 API 響應快取

**檢查方式**：
```bash
# 使用 Postman 或 curl 測試 API 響應時間
curl -w "@curl-format.txt" -o /dev/null -s https://film-genre-production.up.railway.app/api/trpc/videos.getAll
```

### 2. 資料庫查詢優化
- [ ] 添加資料庫索引（主鍵、外鍵、常用查詢欄位）
- [ ] 優化 JOIN 查詢（避免 N+1 問題）
- [ ] 實現查詢結果快取

**檢查方式**：
```sql
-- 檢查現有索引
SHOW INDEX FROM videos;
SHOW INDEX FROM timeline_notes;
SHOW INDEX FROM video_tags;

-- 分析查詢效能
EXPLAIN SELECT * FROM videos WHERE platform = 'youtube';
```

### 3. 記憶體管理
- [ ] 監控 Node.js 記憶體使用（使用 clinic.js 或 0x）
- [ ] 實現連接池管理（資料庫連接）
- [ ] 清理過期的快取數據

**檢查方式**：
```bash
node --inspect server.js
# 開啟 Chrome DevTools 進行記憶體分析
```

---

## 資料庫效能優化

### 1. 索引策略
```sql
-- 為常用查詢欄位添加索引
CREATE INDEX idx_videos_platform ON videos(platform);
CREATE INDEX idx_videos_category ON videos(category);
CREATE INDEX idx_videos_uploaded_by ON videos(uploaded_by);
CREATE INDEX idx_timeline_notes_video_id ON timeline_notes(video_id);
CREATE INDEX idx_timeline_notes_user_id ON timeline_notes(user_id);
CREATE INDEX idx_video_tags_video_id ON video_tags(video_id);
CREATE INDEX idx_video_tags_tag_id ON video_tags(tag_id);
```

### 2. 查詢優化
- [ ] 避免 SELECT * 查詢，只選擇必要欄位
- [ ] 使用 LIMIT 限制結果集大小
- [ ] 實現分頁查詢

**範例**：
```typescript
// ❌ 不好：選擇所有欄位
const videos = await db.select().from(videos);

// ✅ 好：只選擇必要欄位
const videos = await db.select({
  id: videos.id,
  title: videos.title,
  platform: videos.platform,
}).from(videos).limit(20);
```

### 3. 分區與歸檔
- [ ] 考慮為大表實現分區（按日期或平台）
- [ ] 實現舊資料歸檔策略

---

## 儲存（R2）效能優化

### 1. 檔案上傳優化
- [ ] 實現分塊上傳（Multipart Upload）
- [ ] 壓縮檔案再上傳
- [ ] 驗證檔案完整性（使用 MD5 或 SHA256）

**檢查方式**：
```bash
# 檢查 R2 儲存桶大小
# 在 Cloudflare Dashboard 中查看
```

### 2. CDN 快取
- [ ] 配置 Cloudflare CDN 快取規則
- [ ] 設定適當的 TTL（Time To Live）
- [ ] 實現圖片最佳化（自動格式轉換、尺寸調整）

### 3. 檔案組織
- [ ] 使用有意義的檔案路徑（避免列舉）
- [ ] 實現檔案版本管理
- [ ] 定期清理過期檔案

---

## 網路效能優化

### 1. 傳輸優化
- [ ] 啟用 GZIP 壓縮
- [ ] 使用 HTTP/2 或 HTTP/3
- [ ] 實現 CDN 分發

**檢查方式**：
```bash
# 檢查 GZIP 壓縮
curl -I -H "Accept-Encoding: gzip" https://film-genre-production.up.railway.app
```

### 2. DNS 優化
- [ ] 使用快速的 DNS 提供商
- [ ] 實現 DNS 預解析（dns-prefetch）
- [ ] 監控 DNS 解析時間

### 3. 連接優化
- [ ] 實現 Keep-Alive 連接
- [ ] 優化 TLS 握手
- [ ] 使用 Connection Pooling

---

## 監控與分析

### 1. 效能監控
- [ ] 設定 Web Vitals 監控（LCP、FID、CLS）
- [ ] 使用 Sentry 監控錯誤
- [ ] 實現自訂指標監控

**工具**：
- Google Analytics
- Sentry
- DataDog
- New Relic

### 2. 日誌分析
- [ ] 收集應用日誌
- [ ] 分析慢查詢日誌
- [ ] 監控 API 響應時間

### 3. 效能基準
- [ ] 建立效能基準（Baseline）
- [ ] 定期進行效能測試
- [ ] 追蹤效能變化趨勢

**工具**：
- Lighthouse
- WebPageTest
- k6（負載測試）
- Apache JMeter

---

## 優化優先級

### 🔴 高優先級（立即執行）
1. 添加資料庫索引（影響查詢效能）
2. 實現 API 速率限制（安全性）
3. 優化大列表渲染（使用虛擬滾動）

### 🟡 中優先級（近期執行）
1. 實現快取策略
2. 優化圖片（壓縮、格式轉換）
3. 添加效能監控

### 🟢 低優先級（持續改進）
1. 代碼分割與懶加載
2. Service Worker 離線快取
3. 高級 CDN 配置

---

## 效能目標

| 指標 | 目標 | 目前狀態 |
|------|------|--------|
| 首頁加載時間 | < 3s | 待測試 |
| API 響應時間 | < 500ms | 待測試 |
| 資料庫查詢時間 | < 100ms | 待測試 |
| 影片列表渲染 | < 1s | 待測試 |
| 圖片加載時間 | < 500ms | 待測試 |

---

## 檢查清單

### 部署前檢查
- [ ] 執行 `pnpm build` 確認構建成功
- [ ] 檢查 Bundle 大小（< 500KB）
- [ ] 執行 `pnpm test` 確認所有測試通過
- [ ] 檢查 TypeScript 編譯錯誤
- [ ] 執行 `pnpm lint` 檢查代碼風格

### 部署後檢查
- [ ] 監控 Railway 應用日誌
- [ ] 測試所有主要功能
- [ ] 檢查 Web Vitals
- [ ] 驗證 API 響應時間
- [ ] 檢查資料庫連接狀態

---

## 參考資源

- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Drizzle ORM 最佳實踐](https://orm.drizzle.team/docs/best-practices)
- [Node.js 效能最佳實踐](https://nodejs.org/en/docs/guides/nodejs-performance/)
- [Cloudflare R2 最佳實踐](https://developers.cloudflare.com/r2/)

---

## 後續行動

1. 執行本清單中的高優先級項目
2. 建立效能監控儀表板
3. 定期進行效能審計
4. 根據監控數據持續優化

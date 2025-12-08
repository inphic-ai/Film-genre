-- 查詢效能測試腳本
-- 使用 EXPLAIN ANALYZE 驗證索引是否生效

-- ============================================
-- 1. 影片分類篩選查詢
-- ============================================
EXPLAIN ANALYZE
SELECT id, title, category, platform, "shareStatus", rating, "viewCount", "createdAt"
FROM videos
WHERE category = '維修'
ORDER BY "createdAt" DESC
LIMIT 20;

-- ============================================
-- 2. 影片平台篩選查詢
-- ============================================
EXPLAIN ANALYZE
SELECT id, title, category, platform, "shareStatus", rating, "viewCount", "createdAt"
FROM videos
WHERE platform = 'YouTube'
ORDER BY "createdAt" DESC
LIMIT 20;

-- ============================================
-- 3. 影片複合篩選查詢（分類 + 平台 + 分享狀態）
-- ============================================
EXPLAIN ANALYZE
SELECT id, title, category, platform, "shareStatus", rating, "viewCount", "createdAt"
FROM videos
WHERE category = '維修'
  AND platform = 'YouTube'
  AND "shareStatus" = 'public'
ORDER BY "createdAt" DESC
LIMIT 20;

-- ============================================
-- 4. 影片評分排序查詢
-- ============================================
EXPLAIN ANALYZE
SELECT id, title, category, platform, rating, "viewCount", "createdAt"
FROM videos
WHERE rating IS NOT NULL
ORDER BY rating DESC, "viewCount" DESC
LIMIT 20;

-- ============================================
-- 5. 時間軸筆記查詢（根據影片 ID）
-- ============================================
EXPLAIN ANALYZE
SELECT id, "videoId", "userId", timestamp, content, status, "createdAt"
FROM timeline_notes
WHERE "videoId" = 1
ORDER BY timestamp ASC;

-- ============================================
-- 6. 時間軸筆記審核查詢（待審核）
-- ============================================
EXPLAIN ANALYZE
SELECT id, "videoId", "userId", timestamp, content, status, "createdAt"
FROM timeline_notes
WHERE status = 'pending'
ORDER BY "createdAt" DESC
LIMIT 20;

-- ============================================
-- 7. 使用者筆記查詢
-- ============================================
EXPLAIN ANALYZE
SELECT id, "videoId", timestamp, content, status, "createdAt"
FROM timeline_notes
WHERE "userId" = 1
ORDER BY "createdAt" DESC
LIMIT 20;

-- ============================================
-- 8. 標籤影片查詢（根據標籤 ID）
-- ============================================
EXPLAIN ANALYZE
SELECT vt."videoId", vt."tagId", v.title, v.category, v.platform
FROM video_tags vt
JOIN videos v ON vt."videoId" = v.id
WHERE vt."tagId" = 1
LIMIT 20;

-- ============================================
-- 9. 影片標籤查詢（根據影片 ID）
-- ============================================
EXPLAIN ANALYZE
SELECT vt."videoId", vt."tagId", t.name, t.color, t."tagType"
FROM video_tags vt
JOIN tags t ON vt."tagId" = t.id
WHERE vt."videoId" = 1;

-- ============================================
-- 10. 標籤使用次數排序查詢
-- ============================================
EXPLAIN ANALYZE
SELECT id, name, "tagType", "usageCount", color
FROM tags
WHERE "tagType" = 'category'
ORDER BY "usageCount" DESC
LIMIT 20;

-- ============================================
-- 11. 商品 SKU 查詢（唯一索引）
-- ============================================
EXPLAIN ANALYZE
SELECT id, sku, name, "familyCode", description
FROM products
WHERE sku = 'PM6123456A';

-- ============================================
-- 12. 商品家族查詢（根據 familyCode）
-- ============================================
EXPLAIN ANALYZE
SELECT id, sku, name, "familyCode", description
FROM products
WHERE "familyCode" = 'PM6123'
ORDER BY sku ASC
LIMIT 20;

-- ============================================
-- 索引使用統計
-- ============================================
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan AS index_scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE tablename IN ('videos', 'timeline_notes', 'video_tags', 'tags', 'products')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

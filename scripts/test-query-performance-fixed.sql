-- 查詢效能測試腳本（修正版）
-- 使用 EXPLAIN ANALYZE 驗證索引是否生效

-- ============================================
-- 1. 影片評分排序查詢（測試 idx_videos_rating）
-- ============================================
\echo '=== 測試 1: 影片評分排序查詢 ==='
EXPLAIN ANALYZE
SELECT id, title, category, platform, rating, "viewCount", "createdAt"
FROM videos
WHERE rating IS NOT NULL
ORDER BY rating DESC, "viewCount" DESC
LIMIT 20;

-- ============================================
-- 2. 影片建立時間排序查詢（測試 idx_videos_created_at）
-- ============================================
\echo '=== 測試 2: 影片建立時間排序查詢 ==='
EXPLAIN ANALYZE
SELECT id, title, category, platform, rating, "createdAt"
FROM videos
ORDER BY "createdAt" DESC
LIMIT 20;

-- ============================================
-- 3. 影片觀看次數排序查詢（測試 idx_videos_view_count）
-- ============================================
\echo '=== 測試 3: 影片觀看次數排序查詢 ==='
EXPLAIN ANALYZE
SELECT id, title, category, platform, "viewCount", "createdAt"
FROM videos
ORDER BY "viewCount" DESC
LIMIT 20;

-- ============================================
-- 4. 時間軸筆記查詢（根據影片 ID，測試 idx_timeline_notes_video_id）
-- ============================================
\echo '=== 測試 4: 時間軸筆記查詢（根據影片 ID） ==='
EXPLAIN ANALYZE
SELECT id, "videoId", "userId", "timeSeconds", content, status, "createdAt"
FROM timeline_notes
WHERE "videoId" = 1
ORDER BY "timeSeconds" ASC;

-- ============================================
-- 5. 時間軸筆記審核查詢（待審核，測試 idx_timeline_notes_status）
-- ============================================
\echo '=== 測試 5: 時間軸筆記審核查詢（待審核） ==='
EXPLAIN ANALYZE
SELECT id, "videoId", "userId", "timeSeconds", content, status, "createdAt"
FROM timeline_notes
WHERE status = 'pending'
ORDER BY "createdAt" DESC
LIMIT 20;

-- ============================================
-- 6. 使用者筆記查詢（測試 idx_timeline_notes_user_id）
-- ============================================
\echo '=== 測試 6: 使用者筆記查詢 ==='
EXPLAIN ANALYZE
SELECT id, "videoId", "timeSeconds", content, status, "createdAt"
FROM timeline_notes
WHERE "userId" = 1
ORDER BY "createdAt" DESC
LIMIT 20;

-- ============================================
-- 7. 標籤影片查詢（根據標籤 ID，測試 idx_video_tags_tag_id）
-- ============================================
\echo '=== 測試 7: 標籤影片查詢（根據標籤 ID） ==='
EXPLAIN ANALYZE
SELECT vt."videoId", vt."tagId", v.title, v.category, v.platform
FROM video_tags vt
JOIN videos v ON vt."videoId" = v.id
WHERE vt."tagId" = 1
LIMIT 20;

-- ============================================
-- 8. 影片標籤查詢（根據影片 ID，測試 idx_video_tags_video_id）
-- ============================================
\echo '=== 測試 8: 影片標籤查詢（根據影片 ID） ==='
EXPLAIN ANALYZE
SELECT vt."videoId", vt."tagId", t.name, t.color, t."tagType"
FROM video_tags vt
JOIN tags t ON vt."tagId" = t.id
WHERE vt."videoId" = 1;

-- ============================================
-- 9. 標籤使用次數排序查詢（測試 idx_tags_usage_count）
-- ============================================
\echo '=== 測試 9: 標籤使用次數排序查詢 ==='
EXPLAIN ANALYZE
SELECT id, name, "tagType", "usageCount", color
FROM tags
WHERE "tagType" = 'KEYWORD'
ORDER BY "usageCount" DESC
LIMIT 20;

-- ============================================
-- 10. 商品 SKU 查詢（唯一索引，測試 idx_products_sku）
-- ============================================
\echo '=== 測試 10: 商品 SKU 查詢（唯一索引） ==='
EXPLAIN ANALYZE
SELECT id, sku, name, "familyCode", description
FROM products
WHERE sku = 'PM6123456A';

-- ============================================
-- 11. 商品家族查詢（根據 familyCode，測試 idx_products_family_code）
-- ============================================
\echo '=== 測試 11: 商品家族查詢（根據 familyCode） ==='
EXPLAIN ANALYZE
SELECT id, sku, name, "familyCode", description
FROM products
WHERE "familyCode" = 'PM6123'
ORDER BY sku ASC
LIMIT 20;

-- ============================================
-- 索引使用統計
-- ============================================
\echo '=== 索引使用統計 ==='
SELECT
    schemaname,
    relname AS tablename,
    indexrelname AS indexname,
    idx_scan AS index_scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE relname IN ('videos', 'timeline_notes', 'video_tags', 'tags', 'products')
  AND indexrelname LIKE 'idx_%'
ORDER BY relname, indexrelname;

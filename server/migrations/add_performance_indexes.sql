-- Phase 59: 資料庫索引優化
-- 目標：優化 Dashboard API 首次查詢速度

-- 1. product_relations 表索引
-- 用於優化 dashboard.getProductStats 查詢
CREATE INDEX IF NOT EXISTS idx_product_relations_productAId 
ON product_relations(productAId);

CREATE INDEX IF NOT EXISTS idx_product_relations_relationType 
ON product_relations(relationType);

-- 2. videos 表索引
-- 用於優化影片查詢與統計
CREATE INDEX IF NOT EXISTS idx_videos_categoryId 
ON videos(categoryId);

CREATE INDEX IF NOT EXISTS idx_videos_createdAt 
ON videos(createdAt DESC);

CREATE INDEX IF NOT EXISTS idx_videos_uploadedBy 
ON videos(uploadedBy);

-- 3. timeline_notes 表索引
-- 用於優化使用者活動查詢
CREATE INDEX IF NOT EXISTS idx_timeline_notes_userId 
ON timeline_notes(userId);

CREATE INDEX IF NOT EXISTS idx_timeline_notes_status 
ON timeline_notes(status);

CREATE INDEX IF NOT EXISTS idx_timeline_notes_createdAt 
ON timeline_notes(createdAt DESC);

-- 4. 複合索引
-- 用於優化多條件查詢
CREATE INDEX IF NOT EXISTS idx_videos_category_created 
ON videos(categoryId, createdAt DESC);

CREATE INDEX IF NOT EXISTS idx_timeline_notes_user_status 
ON timeline_notes(userId, status);

-- 查詢索引建立狀態
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('videos', 'product_relations', 'timeline_notes')
ORDER BY tablename, indexname;

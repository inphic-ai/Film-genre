-- ========================================
-- 效能優化索引建立 SQL
-- 建立日期：2025-12-08
-- 用途：提升查詢效能 50%+
-- 符合《INPHIC × Manus 生產環境合作規範 1.0》
-- ========================================

-- 1. videos 表索引（7 個）
-- 用途：加速影片列表查詢、篩選、排序
CREATE INDEX IF NOT EXISTS idx_videos_category ON videos(category);
CREATE INDEX IF NOT EXISTS idx_videos_platform ON videos(platform);
CREATE INDEX IF NOT EXISTS idx_videos_share_status ON videos("shareStatus");
CREATE INDEX IF NOT EXISTS idx_videos_rating ON videos(rating DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_videos_view_count ON videos("viewCount" DESC);
CREATE INDEX IF NOT EXISTS idx_videos_filter ON videos(category, platform, "shareStatus");

-- 2. timeline_notes 表索引（3 個）
-- 用途：加速時間軸筆記查詢、審核流程
-- 注意：這些索引可能已在 Phase 20 建立，使用 IF NOT EXISTS 避免重複
CREATE INDEX IF NOT EXISTS idx_timeline_notes_video_id ON timeline_notes("videoId");
CREATE INDEX IF NOT EXISTS idx_timeline_notes_status ON timeline_notes(status);
CREATE INDEX IF NOT EXISTS idx_timeline_notes_user_id ON timeline_notes("userId");

-- 3. video_tags 表索引（2 個）
-- 用途：加速影片標籤關聯查詢
CREATE INDEX IF NOT EXISTS idx_video_tags_video_id ON video_tags("videoId");
CREATE INDEX IF NOT EXISTS idx_video_tags_tag_id ON video_tags("tagId");

-- 4. tags 表索引（2 個）
-- 用途：加速標籤管理、智慧排序
CREATE INDEX IF NOT EXISTS idx_tags_type ON tags("tagType");
CREATE INDEX IF NOT EXISTS idx_tags_usage_count ON tags("usageCount" DESC);

-- 5. products 表索引（2 個）
-- 用途：加速商品搜尋、家族查詢
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_family_code ON products("familyCode");

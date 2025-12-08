/**
 * Migration Script: 為現有 YouTube 影片補充創作者資訊
 * 
 * 此腳本會：
 * 1. 查詢所有 platform='youtube' 且 creator IS NULL 的影片
 * 2. 使用 YouTube API 自動取得創作者資訊
 * 3. 更新 videos 表的 creator 欄位
 * 4. 輸出執行結果（成功/失敗數量）
 */

import { Client } from 'pg';
import { google } from 'googleapis';

// YouTube API 函數
async function getYouTubeCreator(videoUrl) {
  try {
    // 提取影片 ID
    const videoIdMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (!videoIdMatch) {
      return null;
    }
    const videoId = videoIdMatch[1];

    // 呼叫 YouTube Data API v3
    const youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY,
    });

    const response = await youtube.videos.list({
      part: ['snippet'],
      id: [videoId],
    });

    if (!response.data.items || response.data.items.length === 0) {
      return null;
    }

    const channelTitle = response.data.items[0].snippet.channelTitle;
    return channelTitle || null;
  } catch (error) {
    console.error('YouTube API 錯誤:', error.message);
    return null;
  }
}

// 從環境變數讀取資料庫連線字串
const DATABASE_URL = process.env.CUSTOM_DATABASE_URL || process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ 錯誤：找不到資料庫連線字串（CUSTOM_DATABASE_URL 或 DATABASE_URL）');
  process.exit(1);
}

const client = new Client({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function main() {
  try {
    console.log('🔌 連線到資料庫...');
    await client.connect();
    console.log('✅ 資料庫連線成功');

    // 查詢所有需要補充創作者資訊的 YouTube 影片
    console.log('\n📊 查詢需要補充創作者資訊的影片...');
    const result = await client.query(`
      SELECT id, title, "videoUrl"
      FROM videos
      WHERE platform = 'youtube'
        AND (creator IS NULL OR creator = '')
      ORDER BY id ASC
    `);

    const videos = result.rows;
    console.log(`✅ 找到 ${videos.length} 部需要補充創作者資訊的影片\n`);

    if (videos.length === 0) {
      console.log('🎉 所有 YouTube 影片都已有創作者資訊，無需執行 migration');
      return;
    }

    // 統計資料
    const stats = {
      total: videos.length,
      success: 0,
      failed: 0,
      skipped: 0,
    };

    // 逐一處理每部影片
    for (const video of videos) {
      console.log(`\n處理影片 #${video.id}: ${video.title}`);
      console.log(`  URL: ${video.videoUrl}`);

      try {
        // 使用 YouTube API 取得創作者資訊
        const creator = await getYouTubeCreator(video.videoUrl);

        if (creator) {
          // 更新資料庫
          await client.query(
            'UPDATE videos SET creator = $1 WHERE id = $2',
            [creator, video.id]
          );
          console.log(`  ✅ 成功：創作者 = ${creator}`);
          stats.success++;
        } else {
          console.log(`  ⚠️  跳過：無法取得創作者資訊`);
          stats.skipped++;
        }
      } catch (error) {
        console.error(`  ❌ 失敗：${error.message}`);
        stats.failed++;
      }

      // 避免 API rate limit，每次請求後等待 500ms
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 輸出執行結果
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration 執行結果：');
    console.log('='.repeat(60));
    console.log(`總計：${stats.total} 部影片`);
    console.log(`✅ 成功：${stats.success} 部`);
    console.log(`⚠️  跳過：${stats.skipped} 部`);
    console.log(`❌ 失敗：${stats.failed} 部`);
    console.log('='.repeat(60));

    if (stats.success > 0) {
      console.log('\n🎉 Migration 完成！請檢查資料庫確認創作者資訊已正確填充。');
    }

  } catch (error) {
    console.error('\n❌ Migration 執行失敗：', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 資料庫連線已關閉');
  }
}

main();

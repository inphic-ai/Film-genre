#!/usr/bin/env node
/**
 * YouTube 影片批次上傳腳本
 * 
 * 功能：
 * 1. 讀取批次 JSON 檔案
 * 2. 透過 tRPC API 上傳影片
 * 3. 自動檢查重複
 * 4. 記錄上傳結果
 */

import { readFile } from 'fs/promises';
import { appRouter } from './server/routers.js';

// Mock context for admin user
const createAdminContext = () => ({
  req: {},
  res: {},
  user: {
    id: 1,
    openId: process.env.OWNER_OPEN_ID || 'admin',
    name: process.env.OWNER_NAME || 'Admin',
    email: process.env.ADMIN_EMAIL || 'admin@example.com',
    role: 'admin',
    createdAt: new Date(),
  },
});

async function uploadBatch(batchFile, categoryId, apiKey) {
  console.log(`\n📦 處理批次：${batchFile}`);
  
  // 讀取批次檔案
  const videos = JSON.parse(await readFile(batchFile, 'utf-8'));
  console.log(`   影片數量：${videos.length}`);
  
  // 建立 tRPC caller
  const caller = appRouter.createCaller(createAdminContext());
  
  // 準備匯入資料
  const importData = videos.map(v => ({
    videoId: v.videoId,
    title: v.title,
    description: '',
  }));
  
  try {
    // 呼叫 importFromYouTubePlaylist API
    const result = await caller.videos.importFromYouTubePlaylist({
      videos: importData,
      categoryId: categoryId,
      apiKey: apiKey,
    });
    
    console.log(`   ✅ 成功：${result.imported} 個`);
    console.log(`   ⏭️  跳過：${result.skipped} 個（已存在）`);
    console.log(`   ❌ 失敗：${result.failed} 個`);
    
    // 顯示失敗的影片
    if (result.failed > 0) {
      const failedVideos = result.videos.filter(v => v.status === 'failed');
      console.log(`\n   失敗影片：`);
      failedVideos.forEach(v => {
        console.log(`     - ${v.videoId}: ${v.reason}`);
      });
    }
    
    return result;
  } catch (error) {
    console.error(`   ❌ 批次上傳失敗：${error.message}`);
    return {
      imported: 0,
      skipped: 0,
      failed: videos.length,
      error: error.message,
    };
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('使用方式：');
    console.log('  node upload_youtube_videos.mjs <batch_file> <category_id>');
    console.log('');
    console.log('範例：');
    console.log('  node upload_youtube_videos.mjs /home/ubuntu/test_batch.json 1');
    console.log('  node upload_youtube_videos.mjs /home/ubuntu/batch_01.json 1');
    process.exit(1);
  }
  
  const batchFile = args[0];
  const categoryId = parseInt(args[1]);
  const apiKey = process.env.YOUTUBE_API_KEY;
  
  if (!apiKey) {
    console.error('❌ 錯誤：未找到 YOUTUBE_API_KEY 環境變數');
    process.exit(1);
  }
  
  console.log('🚀 開始上傳影片');
  console.log(`   批次檔案：${batchFile}`);
  console.log(`   分類 ID：${categoryId}`);
  console.log(`   API Key：${apiKey.substring(0, 10)}...`);
  
  const result = await uploadBatch(batchFile, categoryId, apiKey);
  
  console.log('\n📊 上傳完成');
  console.log(`   成功：${result.imported} 個`);
  console.log(`   跳過：${result.skipped} 個`);
  console.log(`   失敗：${result.failed} 個`);
}

main().catch(error => {
  console.error('❌ 執行失敗：', error);
  process.exit(1);
});

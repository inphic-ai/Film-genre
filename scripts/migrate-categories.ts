import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import { eq } from 'drizzle-orm';
import * as schema from '../drizzle/schema';

const connectionString = process.env.CUSTOM_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL or CUSTOM_DATABASE_URL is required');
  process.exit(1);
}

/**
 * 舊 category enum → 新 videoCategories.type 對應表
 */
const CATEGORY_MAPPING: Record<string, string> = {
  'product_intro': 'product',      // 使用介紹 → 產品介紹
  'maintenance': 'repair',         // 維修 → 維修教學
  'case_study': 'teaching',        // 案例 → 案例分享
  'faq': 'teaching',               // 常見問題 → 常見問題
  'other': 'misc',                 // 其他 → 其他
};

async function main() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  const db = drizzle(client, { schema });

  console.log('✅ Connected to database');
  console.log('\n📊 Starting category migration...\n');

  try {
    // 1. 取得所有 videoCategories
    const categories = await db.select().from(schema.videoCategories);
    console.log(`Found ${categories.length} categories in video_categories table\n`);

    // 2. 建立 type → id 對應表
    const typeToIdMap: Record<string, number> = {};
    categories.forEach(cat => {
      typeToIdMap[cat.type] = cat.id;
      console.log(`  ${cat.type} → ID: ${cat.id} (${cat.name})`);
    });

    console.log('\n📝 Category mapping:');
    Object.entries(CATEGORY_MAPPING).forEach(([oldKey, newType]) => {
      const categoryId = typeToIdMap[newType];
      console.log(`  ${oldKey} → ${newType} (ID: ${categoryId})`);
    });

    // 3. 查詢所有影片（不管 categoryId 是否為 null）
    console.log('\n🔍 Querying all videos...');
    const videosWithOldCategory = await db
      .select()
      .from(schema.videos);

    console.log(`Found ${videosWithOldCategory.length} videos with old category system\n`);

    if (videosWithOldCategory.length === 0) {
      console.log('✅ No videos to migrate');
      await client.end();
      return;
    }

    // 4. 遷移資料
    let successCount = 0;
    let errorCount = 0;

    for (const video of videosWithOldCategory) {
      // 跳過已經有 categoryId 的影片
      if (video.categoryId) {
        continue;
      }

      const oldCategory = video.category;
      if (!oldCategory) {
        console.log(`⚠️  Video ID ${video.id}: No category, skipping`);
        continue;
      }

      const newType = CATEGORY_MAPPING[oldCategory];
      if (!newType) {
        console.log(`❌ Video ID ${video.id}: Unknown category "${oldCategory}", skipping`);
        errorCount++;
        continue;
      }

      const categoryId = typeToIdMap[newType];
      if (!categoryId) {
        console.log(`❌ Video ID ${video.id}: No categoryId found for type "${newType}", skipping`);
        errorCount++;
        continue;
      }

      try {
        await db
          .update(schema.videos)
          .set({ categoryId })
          .where(eq(schema.videos.id, video.id));

        console.log(`✅ Video ID ${video.id}: ${oldCategory} → ${newType} (categoryId: ${categoryId})`);
        successCount++;
      } catch (error: any) {
        console.error(`❌ Video ID ${video.id}: Migration failed - ${error.message}`);
        errorCount++;
      }
    }

    console.log(`\n📊 Migration completed:`);
    console.log(`  ✅ Success: ${successCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);

  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
  }

  await client.end();
}

main();

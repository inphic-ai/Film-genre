/**
 * Category Migration Script
 * 
 * This script migrates the old category system (categoryEnum) to the new flexible category system (video_categories).
 * 
 * Steps:
 * 1. Create 6 default categories in video_categories table (based on old enum + new types)
 * 2. Map old category enum values to new category IDs
 * 3. Update all videos: set categoryId based on their current category value
 * 4. Verify migration success
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { videoCategories, videos } from '../drizzle/schema.ts';
import { eq } from 'drizzle-orm';

// Database connection
const connectionString = process.env.CUSTOM_DATABASE_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('❌ DATABASE_URL or CUSTOM_DATABASE_URL not found');
  process.exit(1);
}

console.log('🔗 Connecting to database...');
const client = postgres(connectionString, {
  ssl: 'require',
  max: 1,
});
const db = drizzle(client);

// Category mapping: old enum -> new category data
const categoryMapping = [
  {
    oldKey: 'product_intro',
    name: '產品介紹',
    type: 'product',
    description: '產品功能介紹影片',
    color: '#3b82f6',
    icon: 'Package',
    sortOrder: 1,
  },
  {
    oldKey: 'maintenance',
    name: '維修教學',
    type: 'repair',
    description: '產品維修指導影片',
    color: '#f59e0b',
    icon: 'Wrench',
    sortOrder: 2,
  },
  {
    oldKey: 'case_study',
    name: '案例分享',
    type: 'teaching',
    description: '實際應用案例分享',
    color: '#8b5cf6',
    icon: 'BookOpen',
    sortOrder: 3,
  },
  {
    oldKey: 'faq',
    name: '常見問題',
    type: 'teaching',
    description: '常見問題解答',
    color: '#10b981',
    icon: 'HelpCircle',
    sortOrder: 4,
  },
  {
    oldKey: 'other',
    name: '其他',
    type: 'misc',
    description: '其他類型影片',
    color: '#6b7280',
    icon: 'MoreHorizontal',
    sortOrder: 5,
  },
];

// Additional new categories (not in old enum)
const newCategories = [
  {
    name: '供應商影片',
    type: 'vendor',
    description: '供應商提供的影片',
    color: '#ec4899',
    icon: 'Building2',
    sortOrder: 6,
  },
  {
    name: '內部培訓',
    type: 'internal',
    description: '內部員工培訓影片',
    color: '#ef4444',
    icon: 'GraduationCap',
    sortOrder: 7,
  },
];

async function migrate() {
  console.log('🚀 Starting category migration...\n');

  try {
    // Step 1: Create default categories
    console.log('📝 Step 1: Creating default categories in video_categories table...');
    
    const createdCategories = [];
    
    for (const cat of categoryMapping) {
      const [created] = await db.insert(videoCategories).values({
        name: cat.name,
        type: cat.type,
        description: cat.description,
        color: cat.color,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
        isActive: true,
      }).returning();
      
      createdCategories.push({
        ...created,
        oldKey: cat.oldKey,
      });
      
      console.log(`  ✅ Created category: ${cat.name} (ID: ${created.id}, old key: ${cat.oldKey})`);
    }

    // Create additional new categories
    for (const cat of newCategories) {
      const [created] = await db.insert(videoCategories).values({
        name: cat.name,
        type: cat.type,
        description: cat.description,
        color: cat.color,
        icon: cat.icon,
        sortOrder: cat.sortOrder,
        isActive: true,
      }).returning();
      
      console.log(`  ✅ Created new category: ${cat.name} (ID: ${created.id})`);
    }

    console.log(`\n✅ Step 1 completed: ${createdCategories.length + newCategories.length} categories created\n`);

    // Step 2: Build mapping: old enum value -> new category ID
    console.log('📝 Step 2: Building category mapping...');
    const enumToCategoryId = {};
    createdCategories.forEach(cat => {
      enumToCategoryId[cat.oldKey] = cat.id;
    });
    console.log('  Mapping:', enumToCategoryId);
    console.log('✅ Step 2 completed\n');

    // Step 3: Update all videos
    console.log('📝 Step 3: Updating videos with new categoryId...');
    
    let totalUpdated = 0;
    
    for (const [oldKey, newId] of Object.entries(enumToCategoryId)) {
      const result = await db.update(videos)
        .set({ categoryId: newId })
        .where(eq(videos.category, oldKey))
        .returning({ id: videos.id });
      
      console.log(`  ✅ Updated ${result.length} videos: ${oldKey} -> categoryId ${newId}`);
      totalUpdated += result.length;
    }

    console.log(`\n✅ Step 3 completed: ${totalUpdated} videos updated\n`);

    // Step 4: Verify migration
    console.log('📝 Step 4: Verifying migration...');
    
    const allVideos = await db.select({
      id: videos.id,
      title: videos.title,
      oldCategory: videos.category,
      newCategoryId: videos.categoryId,
    }).from(videos).limit(10);

    console.log('  Sample videos (first 10):');
    allVideos.forEach(v => {
      console.log(`    - ID ${v.id}: "${v.title}" | old: ${v.oldCategory} | new: ${v.newCategoryId}`);
    });

    // Check for videos without categoryId
    const videosWithoutCategoryId = await db.select({
      count: videos.id,
    }).from(videos).where(eq(videos.categoryId, null));

    if (videosWithoutCategoryId.length > 0) {
      console.warn(`\n⚠️  Warning: ${videosWithoutCategoryId.length} videos still have NULL categoryId`);
    } else {
      console.log('\n✅ All videos have been migrated successfully!');
    }

    console.log('\n🎉 Migration completed successfully!\n');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run migration
migrate();

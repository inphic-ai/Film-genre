import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import * as schema from '../drizzle/schema';

const connectionString = process.env.CUSTOM_DATABASE_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL or CUSTOM_DATABASE_URL is required');
  process.exit(1);
}

async function main() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  const db = drizzle(client, { schema });

  console.log('✅ Connected to database');
  console.log('\n📊 Querying videos table...\n');

  try {
    const videos = await db.select({
      id: schema.videos.id,
      title: schema.videos.title,
      category: schema.videos.category,
      categoryId: schema.videos.categoryId,
    }).from(schema.videos);
    
    if (videos.length === 0) {
      console.log('⚠️  No videos found in videos table');
    } else {
      console.log(`Found ${videos.length} videos:\n`);
      videos.forEach(video => {
        console.log(`ID: ${video.id} | Title: ${video.title}`);
        console.log(`  category: ${video.category || 'NULL'} | categoryId: ${video.categoryId || 'NULL'}\n`);
      });
    }
  } catch (error: any) {
    console.error('❌ Error querying videos:', error.message);
  }

  await client.end();
}

main();

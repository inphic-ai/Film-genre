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
  console.log('\n📊 Querying video_categories table...\n');

  try {
    const categories = await db.select().from(schema.videoCategories).orderBy(schema.videoCategories.sortOrder);
    
    if (categories.length === 0) {
      console.log('⚠️  No categories found in video_categories table');
    } else {
      console.log(`Found ${categories.length} categories:\n`);
      categories.forEach(cat => {
        console.log(`ID: ${cat.id} | Name: ${cat.name} | Type: ${cat.type} | Sort: ${cat.sortOrder} | Active: ${cat.isActive}`);
      });
    }
  } catch (error: any) {
    console.error('❌ Error querying categories:', error.message);
  }

  await client.end();
}

main();

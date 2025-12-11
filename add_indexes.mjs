import { config } from 'dotenv';
import { resolve } from 'path';
import pg from 'pg';

config({ path: resolve(process.cwd(), '.env.local'), override: true });

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

const indexes = [
  'CREATE INDEX IF NOT EXISTS idx_product_relations_productAId ON product_relations("productAId")',
  'CREATE INDEX IF NOT EXISTS idx_product_relations_relationType ON product_relations("relationType")',
  'CREATE INDEX IF NOT EXISTS idx_videos_categoryId ON videos("categoryId")',
  'CREATE INDEX IF NOT EXISTS idx_videos_createdAt ON videos("createdAt" DESC)',
  'CREATE INDEX IF NOT EXISTS idx_timeline_notes_userId ON timeline_notes("userId")',
  'CREATE INDEX IF NOT EXISTS idx_timeline_notes_status ON timeline_notes(status)',
];

try {
  await client.connect();
  console.log('✅ PostgreSQL 連線成功\n');
  
  for (const sql of indexes) {
    const indexName = sql.match(/idx_\w+/)[0];
    console.log(`建立索引: ${indexName}...`);
    await client.query(sql);
    console.log(`  ✅ 完成`);
  }
  
  console.log('\n✅ 所有索引建立完成');
  await client.end();
} catch (error) {
  console.error('❌ 錯誤:', error.message);
  process.exit(1);
}

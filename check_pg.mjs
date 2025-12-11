import pg from 'pg';
const { Client } = pg;

const pgUrl = 'postgresql://postgres:mLxtqaoiccugtZOVQuduvPRZgpjUEnpj@crossover.proxy.rlwy.net:34189/railway';

const client = new Client({ connectionString: pgUrl });

try {
  await client.connect();
  console.log('✅ PostgreSQL 連線成功');
  
  const res = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);
  
  console.log(`\n📊 PostgreSQL 中的表數量: ${res.rows.length}`);
  if (res.rows.length > 0) {
    console.log('\n表名稱:');
    res.rows.forEach(row => console.log(`  - ${row.table_name}`));
  } else {
    console.log('  (無表)');
  }
  
  await client.end();
} catch (error) {
  console.error('❌ PostgreSQL 連線失敗:', error.message);
  process.exit(1);
}

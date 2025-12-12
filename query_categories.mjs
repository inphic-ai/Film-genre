import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

try {
  const result = await pool.query(`
    SELECT id, name, type, sort_order 
    FROM video_categories 
    ORDER BY sort_order
  `);
  
  console.log('影片分類列表:');
  result.rows.forEach(row => {
    console.log(`  ID: ${row.id} | 名稱: ${row.name} | 類型: ${row.type} | 排序: ${row.sort_order}`);
  });
  
  await pool.end();
} catch (e) {
  console.error('查詢失敗:', e.message);
  process.exit(1);
}

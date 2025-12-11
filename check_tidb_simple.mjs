import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);
console.log('✅ TiDB 連線成功\n');

const [tables] = await connection.query(`
  SELECT TABLE_NAME, TABLE_ROWS 
  FROM information_schema.TABLES 
  WHERE TABLE_SCHEMA = DATABASE()
`);

console.log('📊 表清單:');
for (const t of tables) {
  console.log(`  ${t.TABLE_NAME}: ${t.TABLE_ROWS} 筆資料`);
  const [rows] = await connection.query(`SELECT * FROM ${t.TABLE_NAME} LIMIT 3`);
  if (rows.length > 0) {
    console.log('    資料:', JSON.stringify(rows[0], null, 2).substring(0, 200));
  }
}

await connection.end();

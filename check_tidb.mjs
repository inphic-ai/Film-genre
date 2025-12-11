import mysql from 'mysql2/promise';

const mysqlUrl = process.env.DATABASE_URL || 'mysql://2zwSb7aZqxwGG5M.6a2ce670420f:z7blemM5tJ9bKxwGG5M@gateway01.ap-southeast-1.prod.aws.tidbcloud.com:4000/vzskie7tbgmy9wer2tyay4?ssl={"rejectUnauthorized":true}';

try {
  const connection = await mysql.createConnection(mysqlUrl);
  console.log('✅ MySQL/TiDB 連線成功\n');
  
  // 1. 查詢所有表名稱與資料筆數
  const [tables] = await connection.query(`
    SELECT TABLE_NAME, TABLE_ROWS, DATA_LENGTH 
    FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = DATABASE() 
    ORDER BY TABLE_NAME
  `);
  
  console.log('📊 表清單:');
  console.table(tables);
  
  // 2. 查詢每個表的資料
  for (const table of tables) {
    const tableName = table.TABLE_NAME;
    console.log(`\n📋 表: ${tableName}`);
    console.log(`   資料筆數: ${table.TABLE_ROWS}`);
    console.log(`   資料大小: ${table.DATA_LENGTH} bytes`);
    
    // 查詢表結構
    const [columns] = await connection.query(`DESCRIBE ${tableName}`);
    console.log('   欄位:');
    columns.forEach(col => {
      console.log(`     - ${col.Field} (${col.Type})`);
    });
    
    // 查詢前 5 筆資料
    const [rows] = await connection.query(`SELECT * FROM ${tableName} LIMIT 5`);
    if (rows.length > 0) {
      console.log('   資料內容（前 5 筆）:');
      console.table(rows);
    } else {
      console.log('   (無資料)');
    }
  }
  
  await connection.end();
  console.log('\n✅ 檢查完成');
} catch (error) {
  console.error('❌ 錯誤:', error.message);
  process.exit(1);
}

import postgres from 'postgres';

const sql = postgres(process.env.CUSTOM_DATABASE_URL || process.env.DATABASE_URL);

try {
  // 查詢影片總數
  const totalVideos = await sql`SELECT COUNT(*) as count FROM videos`;
  console.log(`總影片數：${totalVideos[0].count}`);
  
  // 查詢最近新增的 10 個影片
  const recentVideos = await sql`
    SELECT id, title, "videoUrl", "categoryId", "createdAt"
    FROM videos
    ORDER BY "createdAt" DESC
    LIMIT 10
  `;
  
  console.log('\n最近新增的 10 個影片：');
  recentVideos.forEach(v => {
    console.log(`ID: ${v.id}, 標題: ${v.title.substring(0, 50)}..., 分類ID: ${v.categoryId}, 時間: ${v.createdAt}`);
  });
  
  // 查詢所有分類
  const categories = await sql`SELECT id, name, type FROM categories ORDER BY id`;
  console.log('\n所有分類：');
  categories.forEach(c => {
    console.log(`ID: ${c.id}, 名稱: ${c.name}, 類型: ${c.type}`);
  });
  
} catch (error) {
  console.error('查詢失敗：', error.message);
} finally {
  await sql.end();
}

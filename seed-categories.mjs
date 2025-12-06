import pg from 'pg';
const { Pool } = pg;

const connectionString = "postgresql://postgres:mLxtqaoiccugtZOVQuduvPRZgpjUEnpj@crossover.proxy.rlwy.net:34189/railway";

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

const categories = [
  {
    key: 'product_intro',
    name: '使用介紹',
    description: '產品使用方法、功能介紹等教學影片'
  },
  {
    key: 'maintenance',
    name: '維修',
    description: '常見故障排除、維修教學影片'
  },
  {
    key: 'case_study',
    name: '案例',
    description: '實際應用案例、客戶見證等影片'
  },
  {
    key: 'faq',
    name: '常見問題',
    description: '常見問題解答、疑難排解影片'
  },
  {
    key: 'other',
    name: '其他',
    description: '其他類型的影片資源'
  }
];

try {
  const client = await pool.connect();
  console.log('✅ Connected to Railway PostgreSQL');

  for (const category of categories) {
    await client.query(
      `INSERT INTO categories (key, name, description) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (key) DO UPDATE 
       SET name = EXCLUDED.name, description = EXCLUDED.description, "updatedAt" = NOW()`,
      [category.key, category.name, category.description]
    );
    console.log(`✅ Seeded category: ${category.name}`);
  }

  client.release();
  await pool.end();
  console.log('🎉 All categories seeded successfully!');
  process.exit(0);
} catch (error) {
  console.error('❌ Failed to seed categories:', error.message);
  process.exit(1);
}

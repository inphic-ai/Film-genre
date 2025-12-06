import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:mLxtqaoiccugtZOVQuduvPRZgpjUEnpj@crossover.proxy.rlwy.net:34189/railway'
});

await client.connect();

const result = await client.query(`
  SELECT column_name, data_type, is_nullable, column_default 
  FROM information_schema.columns 
  WHERE table_name = 'videos' 
    AND column_name IN ('productId', 'shareStatus', 'viewCount', 'notes')
  ORDER BY column_name;
`);

console.log('✅ New columns in videos table:');
console.table(result.rows);

await client.end();

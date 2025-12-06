import pg from 'pg';
const { Pool } = pg;

// Railway provides both private and public URLs
// For external connections (like Manus), we need to use the TCP proxy
// Use Railway TCP Proxy for external connections
const connectionString = "postgresql://postgres:mLxtqaoiccugtZOVQuduvPRZgpjUEnpj@crossover.proxy.rlwy.net:34189/railway";

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

try {
  const client = await pool.connect();
  console.log('✅ Successfully connected to Railway PostgreSQL!');
  
  const result = await client.query('SELECT version()');
  console.log('📊 PostgreSQL version:', result.rows[0].version);
  
  client.release();
  await pool.end();
  process.exit(0);
} catch (error) {
  console.error('❌ Failed to connect to Railway PostgreSQL:', error.message);
  process.exit(1);
}

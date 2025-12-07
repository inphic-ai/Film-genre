#!/bin/bash
# Railway PostgreSQL Migration Script
# 使用 Railway PostgreSQL 執行 Drizzle migration

set -e

echo "🚀 開始推送 migration 到 Railway PostgreSQL..."
echo ""

# Railway PostgreSQL 連線字串
export CUSTOM_DATABASE_URL="postgresql://postgres:mLxtqaoiccugtZOVQuduvPRZgpjUEnpj@crossover.proxy.rlwy.net:34189/railway"

# 檢查連線
echo "📡 測試連線..."
node -e "
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.CUSTOM_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
pool.query('SELECT version()')
  .then(res => { 
    console.log('✅ 連線成功:', res.rows[0].version.split(' ').slice(0, 2).join(' '));
    pool.end(); 
  })
  .catch(err => { 
    console.error('❌ 連線失敗:', err.message); 
    process.exit(1);
  });
" || exit 1

echo ""
echo "📝 執行 Drizzle migration..."
pnpm drizzle-kit generate
pnpm drizzle-kit migrate

echo ""
echo "✅ Migration 完成！"

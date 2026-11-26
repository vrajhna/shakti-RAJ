'use strict';
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://shakti:shakti_strong_pw_2026@127.0.0.1:5433/shakti';
const useSSL = /railway|render|neon|supabase|sslmode=require/i.test(DATABASE_URL) || process.env.PGSSLMODE === 'require';

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: useSSL ? { rejectUnauthorized: false } : undefined,
  max: Number(process.env.PGPOOL_MAX || 10),
});

pool.on('error', (e) => console.error('[db] pool error', e.message));

async function query(text, params) {
  return pool.query(text, params);
}

async function migrate() {
  const dir = path.join(__dirname, '..', '..', 'db', 'migrations');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();
  await query(`CREATE TABLE IF NOT EXISTS schema_migrations(filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ DEFAULT now())`);
  for (const f of files) {
    const done = await query(`SELECT 1 FROM schema_migrations WHERE filename=$1`, [f]);
    if (done.rowCount) continue;
    console.log('[migrate] applying', f);
    const sql = fs.readFileSync(path.join(dir, f), 'utf8');
    await query('BEGIN');
    try {
      await query(sql);
      await query(`INSERT INTO schema_migrations(filename) VALUES($1)`, [f]);
      await query('COMMIT');
    } catch (e) {
      await query('ROLLBACK');
      throw e;
    }
  }
}

async function ping() {
  const r = await query('SELECT 1 AS ok');
  return r.rows[0].ok === 1;
}

module.exports = { pool, query, migrate, ping };

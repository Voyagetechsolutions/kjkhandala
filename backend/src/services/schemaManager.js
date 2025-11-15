const { pool } = require('../config/supabase');
const logger = require('../config/logger');

async function ensurePool() {
  if (!pool) {
    const err = new Error('Database connection is not configured');
    err.code = 'NO_DB_POOL';
    throw err;
  }
}

function toSqlType(def) {
  if (typeof def === 'string') return def;
  return def.type;
}

function defaultColumnsFor(table) {
  if (table === 'passes') {
    return [
      { name: 'id', type: 'uuid', constraints: 'PRIMARY KEY DEFAULT gen_random_uuid()' },
      { name: 'user_id', type: 'uuid' },
      { name: 'pass_type', type: 'text' },
      { name: 'status', type: 'text' },
      { name: 'valid_from', type: 'timestamptz' },
      { name: 'valid_to', type: 'timestamptz' },
      { name: 'metadata', type: 'jsonb', constraints: "DEFAULT '{}'::jsonb" },
      { name: 'created_at', type: 'timestamptz', constraints: 'DEFAULT now()' },
      { name: 'updated_at', type: 'timestamptz', constraints: 'DEFAULT now()' }
    ];
  }
  return [
    { name: 'id', type: 'uuid', constraints: 'PRIMARY KEY DEFAULT gen_random_uuid()' },
    { name: 'created_at', type: 'timestamptz', constraints: 'DEFAULT now()' },
    { name: 'updated_at', type: 'timestamptz', constraints: 'DEFAULT now()' }
  ];
}

async function tableExists(table) {
  await ensurePool();
  const q = `select to_regclass($1) as oid`;
  const r = await pool.query(q, [table]);
  return !!r.rows[0].oid;
}

async function existingColumns(table) {
  await ensurePool();
  const q = `select column_name, data_type from information_schema.columns where table_name = $1`;
  const r = await pool.query(q, [table]);
  const set = new Set(r.rows.map((x) => x.column_name));
  return set;
}

async function createTable(table, columns) {
  await ensurePool();
  // Ensure required extension for gen_random_uuid
  try {
    await pool.query('create extension if not exists pgcrypto');
  } catch (e) {
    logger.warn('Could not ensure pgcrypto extension', { error: e.message });
  }
  const defs = columns.map((c) => {
    const base = `${c.name} ${toSqlType(c)}`;
    return c.constraints ? `${base} ${c.constraints}` : base;
  });
  const sql = `create table if not exists ${table} (${defs.join(', ')})`;
  await pool.query(sql);
}

async function addMissingColumns(table, columns) {
  await ensurePool();
  const existing = await existingColumns(table);
  for (const c of columns) {
    if (!existing.has(c.name)) {
      const sql = `alter table ${table} add column ${c.name} ${toSqlType(c)}${c.constraints ? ' ' + c.constraints : ''}`;
      await pool.query(sql);
    }
  }
}

async function ensureSchema(table, cols) {
  const base = cols && cols.length ? cols : defaultColumnsFor(table);
  const exists = await tableExists(table);
  if (!exists) {
    await createTable(table, base);
    logger.info(`Created table ${table}`);
  } else {
    await addMissingColumns(table, base);
  }
  return true;
}

module.exports = { ensureSchema };

const express = require('express');
const router = express.Router();
const { supabase, pool } = require('../config/supabase');
const { ensureSchema } = require('../services/schemaManager');
const logger = require('../config/logger');

function ok(res, data) {
  return res.json({ ok: true, data });
}

function fail(res, message, code = 400) {
  return res.status(code).json({ ok: false, message });
}

async function doSelect(table, where = {}, options = {}) {
  if (supabase) {
    let q = supabase.from(table).select(options.columns || '*');
    if (Object.keys(where).length) q = q.match(where);
    if (options.limit) q = q.limit(options.limit);
    if (options.orderBy) q = q.order(options.orderBy, { ascending: options.ascending !== false });
    const { data, error } = await q;
    if (error) throw error;
    return data;
  }
  if (!pool) throw new Error('No database client configured');
  const whereKeys = Object.keys(where);
  const whereClause = whereKeys.length
    ? 'where ' + whereKeys.map((k, i) => `${k} = $${i + 1}`).join(' and ')
    : '';
  const sql = `select ${options.columns || '*'} from ${table} ${whereClause}`;
  const vals = whereKeys.map((k) => where[k]);
  const r = await pool.query(sql, vals);
  return r.rows;
}

async function doInsert(table, data) {
  if (supabase) {
    const { data: rows, error } = await supabase.from(table).insert(data).select();
    if (error) throw error;
    return rows;
  }
  if (!pool) throw new Error('No database client configured');
  const keys = Object.keys(data);
  const vals = keys.map((k) => data[k]);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(',');
  const sql = `insert into ${table} (${keys.join(',')}) values (${placeholders}) returning *`;
  const r = await pool.query(sql, vals);
  return r.rows;
}

async function doUpdate(table, where, data) {
  if (supabase) {
    const { data: rows, error } = await supabase.from(table).update(data).match(where).select();
    if (error) throw error;
    return rows;
  }
  if (!pool) throw new Error('No database client configured');
  const setKeys = Object.keys(data);
  const setSql = setKeys.map((k, i) => `${k} = $${i + 1}`).join(',');
  const whereKeys = Object.keys(where);
  const whereSql = whereKeys.map((k, i) => `${k} = $${setKeys.length + i + 1}`).join(' and ');
  const sql = `update ${table} set ${setSql} where ${whereSql} returning *`;
  const vals = [...setKeys.map((k) => data[k]), ...whereKeys.map((k) => where[k])];
  const r = await pool.query(sql, vals);
  return r.rows;
}

async function doDelete(table, where) {
  if (supabase) {
    const { data: rows, error } = await supabase.from(table).delete().match(where).select();
    if (error) throw error;
    return rows;
  }
  if (!pool) throw new Error('No database client configured');
  const whereKeys = Object.keys(where);
  const whereSql = whereKeys.map((k, i) => `${k} = $${i + 1}`).join(' and ');
  const sql = `delete from ${table} where ${whereSql} returning *`;
  const vals = whereKeys.map((k) => where[k]);
  const r = await pool.query(sql, vals);
  return r.rows;
}

router.post('/', async (req, res) => {
  const { table, action, columns, data, where, options } = req.body || {};
  if (!table || !action) return fail(res, 'Missing required fields: table, action');

  try {
    if (pool) {
      await ensureSchema(table, columns);
    } else {
      // When only Supabase client is configured, skip auto DDL
    }
  } catch (e) {
    logger.error('Schema ensure failed', { table, error: e.message });
    return fail(res, 'Service temporarily unavailable', 503);
  }

  try {
    let result;
    if (action === 'get') {
      result = await doSelect(table, where || {}, options || {});
    } else if (action === 'create') {
      if (!data) return fail(res, 'Missing data for create');
      result = await doInsert(table, data);
    } else if (action === 'update') {
      if (!data || !where) return fail(res, 'Missing data or where for update');
      result = await doUpdate(table, where, data);
    } else if (action === 'delete') {
      if (!where) return fail(res, 'Missing where for delete');
      result = await doDelete(table, where);
    } else {
      return fail(res, 'Unsupported action');
    }
    return ok(res, result);
  } catch (e) {
    logger.error('Bridge action failed', { table, action, error: e.message });
    return fail(res, 'Request failed');
  }
});

module.exports = router;

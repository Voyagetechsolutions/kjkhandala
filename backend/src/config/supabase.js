const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!SUPABASE_URL || !(SUPABASE_SERVICE_ROLE || SUPABASE_ANON_KEY)) {
  console.warn('[Supabase] Missing env vars (SUPABASE_URL and key). Supabase client will be disabled.');
}

const supabase = (SUPABASE_URL && (SUPABASE_SERVICE_ROLE || SUPABASE_ANON_KEY))
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE || SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

let pool = null;
if (SUPABASE_DB_URL) {
  pool = new Pool({ connectionString: SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
}

module.exports = { supabase, pool };

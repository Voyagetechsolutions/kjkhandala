import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || '';

if (!SUPABASE_URL || !(SUPABASE_SERVICE_ROLE || SUPABASE_ANON_KEY)) {
  console.warn('[Supabase] Missing environment variables. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE or SUPABASE_ANON_KEY');
}

// Create Supabase client with service role for backend operations
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE || SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// Create PostgreSQL pool for direct database queries
export const pool = SUPABASE_DB_URL
  ? new Pool({
      connectionString: SUPABASE_DB_URL,
      ssl: { rejectUnauthorized: false },
    })
  : null;

// Helper function to execute raw SQL queries
export async function executeQuery<T = any>(
  query: string,
  params: any[] = []
): Promise<T[]> {
  if (!pool) {
    throw new Error('Database pool not initialized. Check SUPABASE_DB_URL environment variable.');
  }

  const client = await pool.connect();
  try {
    const result = await client.query(query, params);
    return result.rows;
  } finally {
    client.release();
  }
}

// Helper function to call Supabase RPC functions
export async function callRPC<T = any>(
  functionName: string,
  params: Record<string, any> = {}
): Promise<T> {
  const { data, error } = await supabase.rpc(functionName, params);
  
  if (error) {
    throw new Error(`RPC Error (${functionName}): ${error.message}`);
  }
  
  return data as T;
}

export default supabase;

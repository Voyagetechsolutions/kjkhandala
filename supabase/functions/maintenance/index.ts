// Supabase Edge Function: maintenance
// Handles routes under /maintenance/* matching frontend service endpoints

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  // In Edge Functions, the function name segment is not part of pathname for routing here.
  // When calling {SUPABASE_URL}/functions/v1/maintenance/<path>, pathname here is '/<path>'.
  const pathname = url.pathname.replace(/^\/+/, '');
  const method = req.method;

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
  });

  try {
    // TODO: implement each route with supabase.from(...) or supabase.rpc(...)
    // Scaffolding returns a structured placeholder for now
    const body = await (async () => {
      switch (true) {
        // Work Orders
        case /^work-orders$/.test(pathname) && method === 'GET':
          return { message: 'List work orders - implement query with filters via supabase' };
        case /^work-orders$/.test(pathname) && method === 'POST':
          return { message: 'Create work order - implement insert' };
        case /^work-orders\/[^\/]+$/.test(pathname) && method === 'GET':
          return { message: 'Get work order by id - implement select by id' };
        case /^work-orders\/[^\/]+$/.test(pathname) && method === 'PUT':
          return { message: 'Update work order - implement update by id' };
        case /^work-orders\/[^\/]+$/.test(pathname) && method === 'DELETE':
          return { message: 'Delete work order - implement delete by id' };
        case /^work-orders\/[^\/]+\/assign$/.test(pathname) && method === 'PUT':
          return { message: 'Assign mechanic - implement update' };
        case /^work-orders\/[^\/]+\/status$/.test(pathname) && method === 'PUT':
          return { message: 'Update work order status - implement update' };
        case /^work-orders\/[^\/]+\/photo$/.test(pathname) && method === 'POST':
          return { message: 'Upload work order photo - use Supabase Storage' };

        // Schedule
        case /^schedule$/.test(pathname) && method === 'GET':
          return { message: 'Get maintenance schedule - implement query' };
        case /^schedule$/.test(pathname) && method === 'POST':
          return { message: 'Create schedule - implement insert' };
        case /^schedule\/[^\/]+$/.test(pathname) && method === 'PUT':
          return { message: 'Update schedule by id - implement update' };
        case /^schedule\/[^\/]+\/complete$/.test(pathname) && method === 'PUT':
          return { message: 'Mark schedule completed - implement update' };
        case /^schedule\/bus\/[^\/]+$/.test(pathname) && method === 'GET':
          return { message: 'Get schedule by bus - implement query' };
        case /^schedule\/upcoming$/.test(pathname) && method === 'GET':
          return { message: 'Get upcoming services - implement query' };
        case /^schedule\/overdue$/.test(pathname) && method === 'GET':
          return { message: 'Get overdue services - implement query' };

        // Inspections
        case /^inspections$/.test(pathname) && method === 'GET':
          return { message: 'List inspections - implement query' };
        case /^inspections$/.test(pathname) && method === 'POST':
          return { message: 'Create inspection - implement insert' };
        case /^inspections\/[^\/]+$/.test(pathname) && method === 'GET':
          return { message: 'Get inspection by id - implement select' };
        case /^inspections\/[^\/]+$/.test(pathname) && method === 'PUT':
          return { message: 'Update inspection - implement update' };
        case /^inspections\/[^\/]+\/photo$/.test(pathname) && method === 'POST':
          return { message: 'Upload inspection photo - use Supabase Storage' };
        case /^inspections\/[^\/]+\/report$/.test(pathname) && method === 'GET':
          return { message: 'Generate inspection report - implement export' };
        case /^inspections\/templates$/.test(pathname) && method === 'GET':
          return { message: 'Get inspection templates - implement query' };

        // Repairs
        case /^repairs$/.test(pathname) && method === 'GET':
          return { message: 'List repairs - implement query' };
        case /^repairs$/.test(pathname) && method === 'POST':
          return { message: 'Create repair - implement insert' };
        case /^repairs\/[^\/]+$/.test(pathname) && method === 'GET':
          return { message: 'Get repair by id - implement select' };
        case /^repairs\/[^\/]+$/.test(pathname) && method === 'PUT':
          return { message: 'Update repair - implement update' };
        case /^repairs\/[^\/]+\/complete$/.test(pathname) && method === 'PUT':
          return { message: 'Mark repair complete - implement update' };
        case /^repairs\/history\/[^\/]+$/.test(pathname) && method === 'GET':
          return { message: 'Get repair history by bus - implement query' };
        case /^repairs\/common-issues$/.test(pathname) && method === 'GET':
          return { message: 'Get common issues - implement query' };

        // Inventory
        case /^inventory$/.test(pathname) && method === 'GET':
          return { message: 'List inventory - implement query' };
        case /^inventory$/.test(pathname) && method === 'POST':
          return { message: 'Create inventory item - implement insert' };
        case /^inventory\/[^\/]+$/.test(pathname) && method === 'GET':
          return { message: 'Get inventory item - implement select' };
        case /^inventory\/[^\/]+$/.test(pathname) && method === 'PUT':
          return { message: 'Update inventory item - implement update' };
        case /^inventory\/[^\/]+\/stock$/.test(pathname) && method === 'PUT':
          return { message: 'Update stock - implement update/transaction' };
        case /^inventory\/low-stock$/.test(pathname) && method === 'GET':
          return { message: 'Get low stock items - implement query' };
        case /^inventory\/reorder-alert$/.test(pathname) && method === 'POST':
          return { message: 'Create reorder alert - implement insert' };
        case /^inventory\/[^\/]+\/movements$/.test(pathname) && method === 'GET':
          return { message: 'Get stock movements - implement query' };
        case /^inventory\/suppliers$/.test(pathname) && method === 'GET':
          return { message: 'Get suppliers - implement query' };

        // Costs & Reports
        case /^costs/.test(pathname) && method === 'GET':
          return { message: 'Get maintenance costs - implement aggregation' };
        case /^costs\/export$/.test(pathname) && method === 'GET':
          return { message: 'Export costs - implement file generation' };
        case /^reports\//.test(pathname):
          return { message: 'Maintenance report - implement report generation' };
        case /^settings/.test(pathname):
          return { message: 'Maintenance settings - implement CRUD' };

        default:
          return { error: 'Not Implemented', route: pathname, method };
      }
    })();

    return new Response(JSON.stringify({ ok: true, data: body }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 200,
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 500,
    });
  }
});

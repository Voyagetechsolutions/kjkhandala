// Supabase Edge Function: email
// Replaces fetch('/api/send-email') from the frontend

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = new URL(req.url);
  // When calling /functions/v1/email/<path>, pathname here is '/<path>'
  const pathname = url.pathname.replace(/^\/+/, '');

  try {
    if (pathname === 'send' && req.method === 'POST') {
      const { to, subject, html } = await req.json();
      // TODO: integrate with a provider (Resend/SendGrid)
      // For now, simulate and return success
      return new Response(JSON.stringify({ ok: true, sent: true }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ ok: false, error: 'Not Implemented', route: pathname }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 404,
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 400,
    });
  }
});

// Supabase Edge Function: auth
// Optional compatibility endpoints if frontend still calls /auth/*
import './types.ts';
// @deno-types="https://esm.sh/@supabase/supabase-js@2/dist/module/index.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const url = new URL(req.url);
  // When calling /functions/v1/auth/<path>, pathname here is '/<path>'
  const pathname = url.pathname.replace(/^\/+/, '');
  const method = req.method;

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: req.headers.get('Authorization') || '' } } }
  );

  try {
    let response: any = { message: 'Not Implemented' };

    if (pathname === 'login' && method === 'POST') {
      const { email, password } = await req.json();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      response = { user: data.user, session: data.session };
    } else if (pathname === 'register' && method === 'POST') {
      const { email, password, fullName } = await req.json();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) throw error;
      response = { user: data.user, session: data.session };
    } else if (pathname === 'logout' && method === 'POST') {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      response = { ok: true };
    } else if (pathname === 'me' && method === 'GET') {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      response = { user: data.user };
    }

    return new Response(JSON.stringify({ ok: true, data: response }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 400,
    });
  }
});

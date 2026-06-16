import { createClient } from '@supabase/supabase-js';

// Shared Supabase client for all serverless functions.
// Set these in Vercel → Project → Settings → Environment Variables:
//   SUPABASE_URL              (e.g. https://xxxx.supabase.co)
//   SUPABASE_SERVICE_ROLE_KEY (service_role key — server-side only, never expose to client)
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.warn('[parliament] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars');
}

export const supabase = createClient(url, key, {
  auth: { persistSession: false },
});

// Small helper so every function handles JSON + CORS + errors the same way.
export function send(res, status, body) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(status).json(body);
}

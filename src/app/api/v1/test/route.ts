// Debug endpoint: confirms which env vars are set + which Supabase tables exist.
// No auth required. Returns boolean flags only — never secret values.

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const envPresent = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    ADMIN_EMAIL: !!process.env.ADMIN_EMAIL,
    CRON_SECRET: !!process.env.CRON_SECRET,
    NEXT_PUBLIC_SITE_URL: !!process.env.NEXT_PUBLIC_SITE_URL,
    // Auth0
    AUTH0_DOMAIN: !!process.env.AUTH0_DOMAIN,
    AUTH0_CLIENT_ID: !!process.env.AUTH0_CLIENT_ID,
    AUTH0_CLIENT_SECRET: !!process.env.AUTH0_CLIENT_SECRET,
    AUTH0_SECRET: !!process.env.AUTH0_SECRET,
    AUTH0_BASE_URL: !!process.env.AUTH0_BASE_URL,
    // Common wrong-prefix values the integration might create
    AUTHENTICATION_DOMAIN: !!process.env.AUTHENTICATION_DOMAIN,
    AUTHENTICATION_CLIENT_ID: !!process.env.AUTHENTICATION_CLIENT_ID,
    AUTHENTICATION_CLIENT_SECRET: !!process.env.AUTHENTICATION_CLIENT_SECRET,
  };

  // Try connecting to Supabase and check which tables are reachable.
  const tables = ['profiles', 'api_keys', 'blocklist_entries', 'custom_words', 'blocklist_sources', 'built_in_entries', 'refresh_log'];
  const tableStatus: Record<string, 'ok' | 'missing' | 'error'> = {};
  try {
    const admin = createAdminClient();
    await Promise.all(tables.map(async (t) => {
      try {
        const { error } = await admin.from(t).select('id', { count: 'exact', head: true }).limit(1);
        if (!error) tableStatus[t] = 'ok';
        else if (error.code === '42P01' || /does not exist/i.test(error.message)) tableStatus[t] = 'missing';
        else tableStatus[t] = 'error';
      } catch (e: any) {
        tableStatus[t] = 'error';
      }
    }));
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      env_present: envPresent,
      supabase_error: e?.message ?? String(e),
      hint: 'Supabase service role key is wrong, the project is paused, or the URL is wrong.',
    }, { status: 503 });
  }

  const allPresent = Object.values(envPresent).every(Boolean);
  const anyMissing = Object.values(tableStatus).some((s) => s !== 'ok');

  return NextResponse.json({
    ok: allPresent && !anyMissing,
    env_present: envPresent,
    supabase_tables: tableStatus,
    hint: anyMissing
      ? 'Some Supabase tables are missing — apply supabase/schema.sql in the Supabase SQL editor.'
      : !allPresent
      ? 'Some env vars are missing in Vercel → Project → Settings → Environment Variables.'
      : 'All systems go.',
  });
}

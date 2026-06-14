// Debug endpoint: confirms which env vars are set + which Supabase tables exist.
// No auth required. Returns boolean flags + safe (redacted) value previews so
// you can verify in Vercel that the values are what you think they are
// without exposing the secrets.

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Show the first 8 chars of an env var (or 'EMPTY' / 'WHITESPACE' if blank).
// Safe: most secrets are >40 chars so this never reveals anything useful,
// but it's enough to confirm "is this the URL I set" vs "is this a wrong ID".
function preview(name: string): string {
  const v = process.env[name];
  if (v === undefined || v === null || v === '') return '(empty)';
  if (/^\s+$/.test(v)) return '(whitespace)';
  return v.length > 16 ? `${v.slice(0, 16)}...` : v;
}

function isLikelyValidDomain(v: string | undefined): boolean {
  if (!v) return false;
  // Auth0 tenant domains look like: foo.us.auth0.com / foo.eu.auth0.com / etc
  return /^[\w-]+\.(us|eu|au|jp)\.auth0\.com$/.test(v) || /^[\w-]+\.auth0\.com$/.test(v);
}

function isLikelyValidUrl(v: string | undefined): boolean {
  if (!v) return false;
  try {
    const u = new URL(v);
    return u.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function GET() {
  const envPresent = {
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    ADMIN_EMAIL: !!process.env.ADMIN_EMAIL,
    CRON_SECRET: !!process.env.CRON_SECRET,
    NEXT_PUBLIC_SITE_URL: !!process.env.NEXT_PUBLIC_SITE_URL,
    AUTH0_DOMAIN: !!process.env.AUTH0_DOMAIN,
    AUTH0_CLIENT_ID: !!process.env.AUTH0_CLIENT_ID,
    AUTH0_CLIENT_SECRET: !!process.env.AUTH0_CLIENT_SECRET,
    AUTH0_SECRET: !!process.env.AUTH0_SECRET,
    AUTH0_BASE_URL: !!process.env.AUTH0_BASE_URL,
  };

  // Value previews + format validation
  const envValidation = {
    AUTH0_DOMAIN: {
      value_preview: preview('AUTH0_DOMAIN'),
      looks_like_auth0_domain: isLikelyValidDomain(process.env.AUTH0_DOMAIN),
    },
    AUTH0_BASE_URL: {
      value_preview: preview('AUTH0_BASE_URL'),
      looks_like_https_url: isLikelyValidUrl(process.env.AUTH0_BASE_URL),
    },
    AUTH0_CLIENT_ID: { value_preview: preview('AUTH0_CLIENT_ID') },
    AUTH0_CLIENT_SECRET: { value_preview: preview('AUTH0_CLIENT_SECRET') },
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
      env_validation: envValidation,
      supabase_error: e?.message ?? String(e),
      hint: 'Supabase service role key is wrong, the project is paused, or the URL is wrong.',
    }, { status: 503 });
  }

  const allPresent = Object.values(envPresent).every(Boolean);
  const anyMissing = Object.values(tableStatus).some((s) => s !== 'ok');
  const auth0Valid =
    envValidation.AUTH0_DOMAIN.looks_like_auth0_domain &&
    envValidation.AUTH0_BASE_URL.looks_like_https_url;

  // Pick the most actionable hint
  let hint = 'All systems go.';
  if (!allPresent) {
    hint = 'Some env vars are missing in Vercel → Project → Settings → Environment Variables.';
  } else if (!auth0Valid) {
    if (!envValidation.AUTH0_DOMAIN.looks_like_auth0_domain) {
      hint =
        'AUTH0_DOMAIN does not look like a real Auth0 tenant hostname. ' +
        'Expected format: your-tenant.us.auth0.com (no https://). ' +
        'Go to https://manage.auth0.com → Applications → your app → Settings → "Domain" field.';
    } else if (!envValidation.AUTH0_BASE_URL.looks_like_https_url) {
      hint =
        'AUTH0_BASE_URL must be a full https URL like https://esystem.masud.app ' +
        '(not bare hostname). Fix in Vercel → Settings → Environment Variables.';
    }
  } else if (anyMissing) {
    hint = 'Some Supabase tables are missing — apply supabase/schema.sql in the Supabase SQL editor.';
  }

  return NextResponse.json({
    ok: allPresent && !anyMissing && auth0Valid,
    env_present: envPresent,
    env_validation: envValidation,
    supabase_tables: tableStatus,
    hint,
  });
}

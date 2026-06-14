// Service-role Supabase client. BYPASSES RLS. Server-only.
// Use for: API key auth (reading the api_keys table), admin operations,
// building the sync payload (joining built_in + per-user data), refreshing
// the built-in blocklist from external URLs.
// Never import this in a client component or expose it to the browser.

import { createClient } from '@supabase/supabase-js';

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

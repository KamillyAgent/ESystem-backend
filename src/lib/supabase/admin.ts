// Supabase admin (service-role) client — bypasses RLS. Server-only.
// Same as before; kept for compatibility. The auth-less user client is
// no longer needed because we use Auth0 for authentication.

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

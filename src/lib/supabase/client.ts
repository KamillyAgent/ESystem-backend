// Browser-side Supabase client. Use in client components only.
// Reads NEXT_PUBLIC_SUPABASE_* (safe to ship to browser).

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

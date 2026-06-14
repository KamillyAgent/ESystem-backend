// Server-side Supabase client for authenticated user requests (RSC, server actions, route handlers).
// Uses cookies() from next/headers to thread the session through the request.
// Honors RLS — only reads/writes the calling user is allowed to do.

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component (read-only context) — ignore.
            // Middleware refreshes the session, so this is fine.
          }
        },
      },
    }
  );
}

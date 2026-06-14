// Supabase auth session refresh. Runs on every request.
// In Next.js 16 the file is named proxy.ts (the old middleware.ts is deprecated).
// Gates /admin* and /dashboard* for unauthenticated users.
// CRITICAL: any thrown error here causes the entire request to 500. We
// catch all errors and fall through to the route handler so a transient
// Supabase issue doesn't take down the whole site.

import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function proxy(request: NextRequest) {
  // Fast-path: skip proxy work if env vars are missing (avoids crashing the deploy
  // if a user forgot to set NEXT_PUBLIC_SUPABASE_URL in Vercel).
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  let user: { id: string; email?: string } | null = null;
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // IMPORTANT: do not put code between createServerClient and getUser.
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch (err) {
    // Log and fall through. The route handler can still render — just without auth context.
    console.error('[ESystem proxy] auth refresh failed, falling through:', err);
    return supabaseResponse;
  }

  // Auth gate for protected paths.
  const path = request.nextUrl.pathname;
  const isProtected = path.startsWith('/admin') || path.startsWith('/dashboard');
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', path);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Run on all paths except: static assets, _next, favicon, public files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

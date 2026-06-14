// Supabase auth session refresh + Auth0 session check. Runs on every request.
// - For protected paths (/admin*, /dashboard*), if the user has no Auth0
//   session, redirect to /api/auth/login?returnTo=...
// - All other requests fall through to the route handler.
// - Errors are caught and logged; the request still proceeds (we never
//   want the proxy to take down the whole site).

import { type NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth0';

// Auth0 SDK v3 uses Node-only APIs (process.version, process.stdout) via
// openid-client. Force the Node.js runtime instead of the default Edge.
export const runtime = 'nodejs';

export async function middleware(request: NextRequest) {
  // Fast-path: skip proxy work if env vars are missing — the page itself
  // will surface a friendly "auth not configured" message via /auth/setup.
  if (!process.env.AUTH0_SECRET) {
    return NextResponse.next({ request });
  }

  // Auth check for protected paths
  const path = request.nextUrl.pathname;
  const isProtected = path.startsWith('/admin') || path.startsWith('/dashboard');

  if (isProtected) {
    // getAuthUser() already wraps the SDK's getSession() in try/catch and
    // returns null if config is missing or the session is invalid.
    const user = await getAuthUser();
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/api/auth/login';
      url.searchParams.set('returnTo', path);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

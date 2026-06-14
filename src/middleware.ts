// Supabase auth session refresh + Auth0 session check. Runs on every request.
// - For protected paths (/admin*, /dashboard*), if the user has no Auth0
//   session, redirect to /api/auth/login?returnTo=...
// - All other requests fall through to the route handler.
// - Errors are caught and logged; the request still proceeds (we never
//   want the proxy to take down the whole site).

import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';

// Auth0 SDK v3 uses Node-only APIs (process.version, process.stdout) via
// openid-client. Force the Node.js runtime instead of the default Edge.
export const runtime = 'nodejs';

export async function middleware(request: NextRequest) {
  // Fast-path: skip proxy work if env vars are missing.
  if (!process.env.AUTH0_SECRET) {
    return NextResponse.next({ request });
  }

  // Auth check for protected paths
  const path = request.nextUrl.pathname;
  const isProtected = path.startsWith('/admin') || path.startsWith('/dashboard');

  if (isProtected) {
    let session = null;
    try {
      session = await getSession();
    } catch (err) {
      console.error('[ESystem proxy] getSession failed:', err);
      // fall through, let the page handle it
    }
    if (!session?.user) {
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

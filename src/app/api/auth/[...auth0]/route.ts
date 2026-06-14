// Auth0 auth route catch-all. Handles:
//   GET /api/auth/login       → redirect to Auth0 hosted login
//   GET /api/auth/callback    → Auth0 redirects back here with ?code=
//   GET /api/auth/logout      → clear session, redirect to Auth0 logout
//   GET /api/auth/me          → return the current user as JSON
//
// After successful login, the SDK sets an encrypted session cookie.
// Server components call getSession() (from src/lib/auth0.ts) to read it.

import { handleAuth } from '@auth0/nextjs-auth0';
import { NextResponse, type NextRequest } from 'next/server';

// Force Node runtime (Auth0 SDK uses openid-client which needs Node APIs)
export const runtime = 'nodejs';

function setupNotConfigured() {
  return NextResponse.json(
    {
      error: 'auth0_not_configured',
      message:
        'Auth0 env vars are missing on this deployment. Set AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_SECRET, AUTH0_BASE_URL in Vercel -> Settings -> Environment Variables, then redeploy.',
      check: '/api/v1/test',
      setup: '/auth/setup',
    },
    { status: 503 }
  );
}

// `onError` catches the SDK's "issuerBaseURL is required" / "clientID is
// required" / etc. thrown when the env vars are missing, and returns a
// friendly 503 instead of a 500 stack trace.
export const GET = handleAuth({
  onError(_req: NextRequest, error: Error) {
    if (/issuerBaseURL|clientID|clientSecret|secret is required/i.test(error.message)) {
      console.error('[ESystem auth0] Missing config:', error.message);
      return setupNotConfigured();
    }
    console.error('[ESystem auth0] handleAuth error:', error);
    return NextResponse.json(
      { error: 'auth_handler_error', message: error.message },
      { status: 500 }
    );
  },
});

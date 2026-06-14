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
// required" / etc. thrown when the env vars are missing or malformed, and
// returns a friendly 503 with the actual error message so we can debug
// the env-var values without needing Vercel runtime logs.
export const GET = handleAuth({
  onError(_req: NextRequest, error: Error) {
    console.error('[ESystem auth0] handleAuth error:', error);
    const isConfig =
      /issuerBaseURL|clientID|clientSecret|secret is required|discovery|jwks|authorization_endpoint/i.test(
        error.message
      );
    if (isConfig) {
      // For Auth0 v3, AUTH0_DOMAIN must be JUST the hostname (no https://).
      // If the user pasted the full URL, the SDK tries to fetch
      // https://https://.../ which fails with the errors above.
      return NextResponse.json(
        {
          error: 'auth0_misconfigured',
          message: error.message,
          hint:
            'In SDK v3, the env var is AUTH0_ISSUER_BASE_URL (full URL like https://your-tenant.us.auth0.com), NOT the v2 AUTH0_DOMAIN. AUTH0_BASE_URL must be the site URL (e.g. "https://esystem.masud.app").',
          current_values: {
            AUTH0_ISSUER_BASE_URL: process.env.AUTH0_ISSUER_BASE_URL
              ? `${process.env.AUTH0_ISSUER_BASE_URL.slice(0, 24)}...`
              : '(empty — set this to the full Auth0 tenant URL)',
            AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID
              ? `${process.env.AUTH0_CLIENT_ID.slice(0, 6)}...`
              : '(empty)',
            AUTH0_BASE_URL: process.env.AUTH0_BASE_URL || '(empty)',
          },
          check: '/api/v1/test',
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: 'auth_handler_error', message: error.message },
      { status: 500 }
    );
  },
});

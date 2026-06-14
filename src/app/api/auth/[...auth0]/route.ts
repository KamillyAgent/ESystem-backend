// Auth0 auth route catch-all. Handles:
//   GET /api/auth/login       → redirect to Auth0 hosted login
//   GET /api/auth/callback    → Auth0 redirects back here with ?code=
//   GET /api/auth/logout      → clear session, redirect to Auth0 logout
//   GET /api/auth/me          → return the current user as JSON
//
// After successful login, the SDK sets an encrypted session cookie.
// Server components call getSession() (from src/lib/auth0.ts) to read it.

import { handleAuth } from '@auth0/nextjs-auth0';

export const GET = handleAuth();

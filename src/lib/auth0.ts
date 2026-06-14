// Auth0 helpers used in server components and route handlers.
// Wraps nextjs-auth0's getSession so callers can `requireUser()` or
// `optionalUser()` with one import.

import { getSession, type Session } from '@auth0/nextjs-auth0';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';

export interface AuthUser {
  sub: string;        // Auth0 user ID, e.g. "auth0|abc123"
  email: string;
  name?: string;
  picture?: string;
}

// Returns true when the Auth0 env vars are configured. When false, all
// auth helpers degrade to "signed out" so the site stays browseable.
export function auth0Configured(): boolean {
  return !!(
    process.env.AUTH0_DOMAIN &&
    process.env.AUTH0_CLIENT_ID &&
    process.env.AUTH0_CLIENT_SECRET &&
    process.env.AUTH0_SECRET
  );
}

// Get the current user or null. Use in pages/components.
// If Auth0 isn't configured, always returns null instead of throwing.
export async function getAuthUser(): Promise<AuthUser | null> {
  if (!auth0Configured()) return null;
  let session: Session | null | undefined;
  try {
    session = await getSession();
  } catch (err) {
    // Auth0 SDK throws when env vars are partially set or token is corrupt.
    // Treat as signed-out so the rest of the page still renders.
    console.error('[ESystem auth0] getSession failed:', err instanceof Error ? err.message : err);
    return null;
  }
  if (!session?.user) return null;
  return {
    sub: session.user.sub,
    email: session.user.email,
    name: session.user.name,
    picture: session.user.picture,
  };
}

// Require a signed-in user. If none, redirect to Auth0 login.
// Returns the user. Optionally takes a `returnTo` path to come back to.
// If Auth0 is unconfigured, redirects to /auth/setup so the operator sees
// the missing-env message instead of an infinite loop on /api/auth/login.
export async function requireUser(returnTo?: string): Promise<AuthUser> {
  if (!auth0Configured()) {
    redirect('/auth/setup');
  }
  const user = await getAuthUser();
  if (!user) {
    // The Auth0 SDK will read AUTH0_BASE_URL to build the redirect,
    // and the `returnTo` query param tells Auth0 where to come back to.
    const target = returnTo
      ? `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`
      : '/api/auth/login';
    redirect(target);
  }
  return user;
}

// Ensure the user has a row in our profiles table. Idempotent.
// Called from the auth callback right after a successful sign-in.
export async function ensureProfile(user: AuthUser): Promise<void> {
  const admin = createAdminClient();
  await admin.rpc('upsert_profile', {
    p_id: user.sub,
    p_email: user.email,
    p_display_name: user.name ?? user.email.split('@')[0],
  });
}

// Check if a user is the admin (matches the env var ADMIN_EMAIL)
export function isAdmin(user: AuthUser | null, adminEmail: string | undefined): boolean {
  if (!user || !adminEmail) return false;
  return user.email.toLowerCase() === adminEmail.toLowerCase();
}

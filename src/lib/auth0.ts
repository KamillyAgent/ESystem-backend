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

// Get the current user or null. Use in pages/components.
export async function getAuthUser(): Promise<AuthUser | null> {
  const session = await getSession();
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
export async function requireUser(returnTo?: string): Promise<AuthUser> {
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

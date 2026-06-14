// Helpers for dashboard-facing API routes that need a signed-in user
// (not an API key). These routes are called from the React client via
// fetch() while the user has an Auth0 session cookie.

import { NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import type { AuthUser } from './auth0';

export async function getAuthUserFromSession(): Promise<AuthUser | null> {
  const session = await getSession();
  if (!session?.user) return null;
  return {
    sub: session.user.sub,
    email: session.user.email,
    name: session.user.name,
    picture: session.user.picture,
  };
}

export async function requireAuthUser(): Promise<AuthUser | NextResponse> {
  const user = await getAuthUserFromSession();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  return user;
}

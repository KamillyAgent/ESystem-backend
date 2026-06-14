// Debug endpoint: probe Auth0 SDK's config reading in our actual runtime
// environment. This will tell us if the SDK is using a different code path
// than /api/v1/test for reading env vars.

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  // Snapshot of process.env values the Auth0 SDK would read
  const rawEnv = {
    AUTH0_DOMAIN: process.env.AUTH0_DOMAIN ?? null,
    AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID ?? null,
    AUTH0_CLIENT_SECRET: process.env.AUTH0_CLIENT_SECRET ? `${process.env.AUTH0_CLIENT_SECRET.length} chars` : null,
    AUTH0_SECRET: process.env.AUTH0_SECRET ? `${process.env.AUTH0_SECRET.length} chars` : null,
    AUTH0_BASE_URL: process.env.AUTH0_BASE_URL ?? null,
  };

  // Try to instantiate an Auth0Client and see what it says
  let sdkResult: any = { tried: false };
  try {
    const sdk = await import('@auth0/nextjs-auth0');
    // The SDK exports `Auth0Client` from '@auth0/nextjs-auth0/server' in v3
    // Try the main package's handleAuth first
    const { handleAuth } = sdk;
    // We can't easily call getConfig() directly in v3 because the SDK
    // doesn't export it. Instead, simulate what handleAuth would do by
    // checking the env values it would pass to openid-client.
    sdkResult = {
      tried: true,
      exports: Object.keys(sdk),
      domain_raw: rawEnv.AUTH0_DOMAIN,
      domain_trimmed: rawEnv.AUTH0_DOMAIN?.trim() ?? null,
      domain_with_protocol: rawEnv.AUTH0_DOMAIN ? `https://${rawEnv.AUTH0_DOMAIN}` : null,
      would_pass_to_openid_client: !!rawEnv.AUTH0_DOMAIN?.trim(),
    };
  } catch (err) {
    sdkResult = { tried: true, error: err instanceof Error ? err.message : String(err) };
  }

  return NextResponse.json({
    rawEnv,
    sdkResult,
    note:
      'AUTH0_DOMAIN should be a bare hostname (no https://). ' +
      'If looks_like_auth0_domain is true on /api/v1/test, the SDK should also see it.',
  });
}

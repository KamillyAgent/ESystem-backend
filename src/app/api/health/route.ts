// Public health check — no Supabase, no auth. Just confirms the deployment is live.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  return Response.json({
    ok: true,
    service: 'esystem-backend',
    version: '0.1.0',
    ts: new Date().toISOString(),
  });
}

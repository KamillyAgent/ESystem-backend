import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { createAdminClient } from "@/lib/supabase/admin";
import { refreshSource } from "@/lib/refresh-source";

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const session = await getSession();
  if (!session?.user || session.user.email !== process.env.ADMIN_EMAIL) return null;
  return session.user;
}

export async function POST(_req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const admin = createAdminClient();
  const { data: sources, error } = await admin
    .from('blocklist_sources')
    .select('*')
    .eq('enabled', true);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!sources || sources.length === 0) {
    return NextResponse.json({ sources_refreshed: 0, results: [] });
  }

  const results = await Promise.all(sources.map(refreshSource));
  return NextResponse.json({
    sources_refreshed: results.filter((r) => r.status === 'success').length,
    results,
  });
}

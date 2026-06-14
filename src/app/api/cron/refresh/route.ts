// Vercel Cron: triggered daily by vercel.json.
// Refreshes all enabled blocklist sources.
// Auth: Authorization: Bearer ${CRON_SECRET}

import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { refreshSource } from "@/lib/refresh-source";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: sources, error } = await admin
    .from('blocklist_sources')
    .select('*')
    .eq('enabled', true);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!sources || sources.length === 0) {
    return NextResponse.json({ sources_refreshed: 0 });
  }

  const results = await Promise.all(sources.map(refreshSource));
  return NextResponse.json({
    sources_refreshed: results.filter((r) => r.status === 'success').length,
    results,
  });
}

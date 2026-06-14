import { NextResponse, type NextRequest } from "next/server";
import { authenticateApiKey, unauthorized } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const VALID_TYPES = new Set(['page', 'domain', 'host']);

export async function POST(req: NextRequest) {
  const ctx = await authenticateApiKey(req.headers.get('authorization'));
  if (!ctx) return unauthorized();

  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const { url, block_type, detector, reason } = body ?? {};
  if (typeof url !== 'string' || url.length === 0 || url.length > 2048) {
    return NextResponse.json({ error: 'invalid_url' }, { status: 400 });
  }
  if (!VALID_TYPES.has(block_type)) {
    return NextResponse.json({ error: 'invalid_block_type' }, { status: 400 });
  }
  if (typeof detector !== 'string' || detector.length === 0 || detector.length > 64) {
    return NextResponse.json({ error: 'invalid_detector' }, { status: 400 });
  }
  if (typeof reason !== 'string' || reason.length === 0 || reason.length > 512) {
    return NextResponse.json({ error: 'invalid_reason' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Use ignoreDuplicates to detect create-vs-update:
  //   - If a row is returned → it was just inserted (created: true)
  //   - If no row is returned → it was a duplicate (created: false)
  const { data, error } = await admin
    .from('blocklist_entries')
    .upsert(
      {
        user_id: ctx.userId,
        url,
        block_type,
        detector,
        reason,
        source: 'detected',
        is_active: true,
      },
      { onConflict: 'user_id,url,block_type', ignoreDuplicates: true }
    )
    .select('id, created_at')
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: 'db_error', detail: error.message }, { status: 500 });
  }

  if (data) {
    return NextResponse.json(
      { id: data.id, created: true },
      { status: 201, headers: { 'X-Resource-Id': data.id } }
    );
  }

  // Already existed — fetch the existing id to return it
  const { data: existing } = await admin
    .from('blocklist_entries')
    .select('id')
    .eq('user_id', ctx.userId)
    .eq('url', url)
    .eq('block_type', block_type)
    .maybeSingle();

  return NextResponse.json(
    { id: existing?.id, created: false },
    { status: 200, headers: { 'X-Resource-Id': existing?.id ?? '' } }
  );
}

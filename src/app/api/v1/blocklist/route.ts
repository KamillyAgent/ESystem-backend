import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { url, block_type, detector, reason } = await req.json();
  if (typeof url !== 'string' || url.length > 2048) {
    return NextResponse.json({ error: 'invalid_url' }, { status: 400 });
  }
  if (!['page', 'domain', 'host'].includes(block_type)) {
    return NextResponse.json({ error: 'invalid_block_type' }, { status: 400 });
  }
  if (typeof detector !== 'string' || detector.length > 64) {
    return NextResponse.json({ error: 'invalid_detector' }, { status: 400 });
  }
  if (typeof reason !== 'string' || reason.length > 512) {
    return NextResponse.json({ error: 'invalid_reason' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('blocklist_entries')
    .upsert(
      { user_id: user.id, url, block_type, detector, reason, source: 'manual', is_active: true },
      { onConflict: 'user_id,url,block_type' }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entry: data }, { status: 201 });
}

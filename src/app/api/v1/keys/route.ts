import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { randomBytes } from "crypto";

export const dynamic = 'force-dynamic';

// 24 bytes base64url = 32 chars; prefix makes 36 total
function generateKey(): string {
  return 'esk_' + randomBytes(24).toString('base64url');
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { label } = await req.json();
  if (typeof label !== 'string' || !label.trim() || label.length > 50) {
    return NextResponse.json({ error: 'invalid_label' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Enforce 6-key cap
  const { count } = await admin
    .from('api_keys')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .is('revoked_at', null);

  if ((count ?? 0) >= 6) {
    return NextResponse.json({ error: 'max_keys_reached' }, { status: 400 });
  }

  const raw = generateKey();
  const keyPrefix = raw.slice(0, 8);
  // Hash is computed in the DB via the public.hash_api_key() helper
  const { data, error } = await admin.rpc('hash_api_key', { raw });
  if (error || !data) {
    return NextResponse.json({ error: 'hash_failed', detail: error?.message }, { status: 500 });
  }

  const { error: insertErr } = await admin.from('api_keys').insert({
    user_id: user.id,
    label: label.trim(),
    key_hash: data,
    key_prefix: keyPrefix,
  });

  if (insertErr) {
    return NextResponse.json({ error: 'insert_failed', detail: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ key: raw, key_prefix: keyPrefix });
}

import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuthUser } from "@/lib/api-session";

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAuthUser();
  if (auth instanceof NextResponse) return auth;

  const { is_active } = await req.json();
  if (typeof is_active !== 'boolean') {
    return NextResponse.json({ error: 'invalid_is_active' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('blocklist_entries')
    .update({ is_active })
    .eq('id', id)
    .eq('user_id', auth.sub);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAuthUser();
  if (auth instanceof NextResponse) return auth;

  const admin = createAdminClient();
  const { error } = await admin
    .from('blocklist_entries')
    .delete()
    .eq('id', id)
    .eq('user_id', auth.sub);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

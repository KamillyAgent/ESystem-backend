import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAuthUser } from "@/lib/api-session";

export const dynamic = 'force-dynamic';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAuthUser();
  if (auth instanceof NextResponse) return auth;

  const admin = createAdminClient();
  const { error } = await admin
    .from('custom_words')
    .delete()
    .eq('id', id)
    .eq('user_id', auth.sub);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

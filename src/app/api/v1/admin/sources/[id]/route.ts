import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@auth0/nextjs-auth0";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const session = await getSession();
  if (!session?.user || session.user.email !== process.env.ADMIN_EMAIL) return null;
  return session.user;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await requireAdmin())) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { label, enabled } = await req.json();
  const updates: any = {};
  if (typeof label === 'string' && label.trim() && label.length <= 100) updates.label = label.trim();
  if (typeof enabled === 'boolean') updates.enabled = enabled;
  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'no_valid_updates' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from('blocklist_sources').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await requireAdmin())) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const admin = createAdminClient();
  // ON DELETE CASCADE in schema handles built_in_entries
  const { error } = await admin.from('blocklist_sources').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

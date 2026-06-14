import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { refreshSource } from "@/lib/refresh-source";

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) return null;
  return user;
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await requireAdmin())) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const admin = createAdminClient();
  const { data: source, error } = await admin
    .from('blocklist_sources')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !source) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const result = await refreshSource(source);
  return NextResponse.json(result);
}

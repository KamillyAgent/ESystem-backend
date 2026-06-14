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

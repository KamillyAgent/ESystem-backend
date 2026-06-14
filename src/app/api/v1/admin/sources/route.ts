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

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('blocklist_sources')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sources: data });
}

export async function POST(req: NextRequest) {
  const adminUser = await requireAdmin();
  if (!adminUser) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { url, label, format } = await req.json();
  if (typeof url !== 'string' || !url.startsWith('https://')) {
    return NextResponse.json({ error: 'invalid_url' }, { status: 400 });
  }
  if (typeof label !== 'string' || !label.trim() || label.length > 100) {
    return NextResponse.json({ error: 'invalid_label' }, { status: 400 });
  }
  if (!['domains', 'hosts'].includes(format)) {
    return NextResponse.json({ error: 'invalid_format' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('blocklist_sources')
    .insert({
      url: url.trim(),
      label: label.trim(),
      format,
      added_by: adminUser.id,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'url_already_exists' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Refresh immediately so the user sees the count
  const result = await refreshSource(data);
  if (result.status === 'error') {
    // Source added but refresh failed — keep it, surface the error
    return NextResponse.json({ source: data, refresh: result }, { status: 201 });
  }

  return NextResponse.json({ source: data, refresh: result }, { status: 201 });
}

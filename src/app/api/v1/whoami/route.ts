import { NextResponse, type NextRequest } from "next/server";
import { authenticateApiKey, unauthorized } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ctx = await authenticateApiKey(req.headers.get('authorization'));
  if (!ctx) return unauthorized();

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('id, email, display_name')
    .eq('id', ctx.userId)
    .single();

  if (!profile) return unauthorized();

  return NextResponse.json({
    user_id: profile.id,
    email: profile.email,
    display_name: profile.display_name,
    key: {
      label: ctx.keyLabel,
      key_id: ctx.keyId,
    },
  });
}

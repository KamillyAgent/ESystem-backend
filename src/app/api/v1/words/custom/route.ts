import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });

  const { word } = await req.json();
  if (typeof word !== 'string' || !word.trim() || word.length > 64) {
    return NextResponse.json({ error: 'invalid_word' }, { status: 400 });
  }
  const w = word.trim().toLowerCase();

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('custom_words')
    .upsert({ user_id: user.id, word: w }, { onConflict: 'user_id,word' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ word: data });
}

import { NextResponse, type NextRequest } from "next/server";
import { authenticateApiKey, unauthorized } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SyncPayload } from "@/lib/types";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ctx = await authenticateApiKey(req.headers.get('authorization'));
  if (!ctx) return unauthorized();

  const admin = createAdminClient();

  // Built-in domains + hosts (active only)
  const { data: builtIn } = await admin
    .from('built_in_entries')
    .select('domain, block_type')
    .eq('is_active', true);

  const builtInDomains = (builtIn ?? []).filter((e) => e.block_type === 'domain').map((e) => e.domain);
  const builtInHosts   = (builtIn ?? []).filter((e) => e.block_type === 'host').map((e) => e.domain);

  // Personal blocklist (active only, all types)
  const { data: personal } = await admin
    .from('blocklist_entries')
    .select('url, block_type, detector, reason, created_at')
    .eq('user_id', ctx.userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  // Custom words
  const { data: words } = await admin
    .from('custom_words')
    .select('word')
    .eq('user_id', ctx.userId);

  const payload: SyncPayload = {
    synced_at: new Date().toISOString(),
    built_in: { domains: builtInDomains, hosts: builtInHosts },
    personal: personal ?? [],
    custom_words: (words ?? []).map((w) => w.word),
  };

  return NextResponse.json(payload);
}

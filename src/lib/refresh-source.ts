// Shared logic for refreshing a single blocklist source.
// Used by:
//   - POST /api/v1/admin/sources/:id/refresh  (manual, admin)
//   - POST /api/v1/admin/refresh-all         (manual, admin)
//   - GET  /api/cron/refresh                 (daily, Vercel Cron)

import { createAdminClient } from "./supabase/admin";
import { parseBlocklist, type BlocklistFormat } from "./blocklist-parser";
import type { BlocklistSource, RefreshLog } from "./types";

export interface RefreshResult {
  source_id: string;
  source_url: string;
  status: 'success' | 'error';
  added: number;
  removed: number;
  error: string | null;
  duration_ms: number;
}

async function fetchWithTimeout(url: string, timeoutMs = 30000): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'ESystem-Blocklist-Bot/0.1 (+https://esystem.masud.app)' },
      redirect: 'follow',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

export async function refreshSource(source: BlocklistSource): Promise<RefreshResult> {
  const admin = createAdminClient();
  const start = Date.now();

  // Log start
  const { data: logRow } = await admin
    .from('refresh_log')
    .insert({
      source_id: source.id,
      source_url: source.url,
      status: 'running',
    })
    .select('id')
    .single();

  try {
    const text = await fetchWithTimeout(source.url);
    const domains = parseBlocklist(text, source.format as BlocklistFormat);

    // Diff against existing
    const { data: existing } = await admin
      .from('built_in_entries')
      .select('id, domain')
      .eq('source_id', source.id);

    const existingSet = new Set((existing ?? []).map((e) => e.domain));
    const newSet = domains;

    const toAdd = [...newSet].filter((d) => !existingSet.has(d));
    const toRemove = (existing ?? []).filter((e) => !newSet.has(e.domain));

    // Apply
    if (toAdd.length > 0) {
      const { error: addErr } = await admin
        .from('built_in_entries')
        .insert(
          toAdd.map((domain) => ({
            domain,
            block_type: 'domain' as const,
            source_id: source.id,
            is_active: true,
          }))
        );
      if (addErr) throw new Error(`Insert failed: ${addErr.message}`);
    }
    if (toRemove.length > 0) {
      const { error: rmErr } = await admin
        .from('built_in_entries')
        .delete()
        .in('id', toRemove.map((e) => e.id));
      if (rmErr) throw new Error(`Delete failed: ${rmErr.message}`);
    }

    // Update source
    await admin
      .from('blocklist_sources')
      .update({
        last_fetched: new Date().toISOString(),
        last_count: newSet.size,
        last_error: null,
      })
      .eq('id', source.id);

    const result: RefreshResult = {
      source_id: source.id,
      source_url: source.url,
      status: 'success',
      added: toAdd.length,
      removed: toRemove.length,
      error: null,
      duration_ms: Date.now() - start,
    };

    if (logRow) {
      await admin.from('refresh_log').update({
        finished_at: new Date().toISOString(),
        status: 'success',
        added: result.added,
        removed: result.removed,
      }).eq('id', logRow.id);
    }

    return result;
  } catch (err: any) {
    const errorMsg = err?.message ?? String(err);
    await admin
      .from('blocklist_sources')
      .update({ last_fetched: new Date().toISOString(), last_error: errorMsg })
      .eq('id', source.id);

    if (logRow) {
      await admin.from('refresh_log').update({
        finished_at: new Date().toISOString(),
        status: 'error',
        error: errorMsg,
      }).eq('id', logRow.id);
    }

    return {
      source_id: source.id,
      source_url: source.url,
      status: 'error',
      added: 0,
      removed: 0,
      error: errorMsg,
      duration_ms: Date.now() - start,
    };
  }
}

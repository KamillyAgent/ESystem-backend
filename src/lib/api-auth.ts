// API-key auth helper for /api/v1/* routes.
// Validates "Authorization: Bearer ***" header against the api_keys table.
// Returns { userId, keyId, keyLabel } on success, null on failure.

import { createAdminClient } from './supabase/admin';

export interface ApiKeyContext {
  userId: string;
  keyId: string;
  keyLabel: string;
}

export async function authenticateApiKey(authHeader: string | null): Promise<ApiKeyContext | null> {
  if (!authHeader) return null;
  const m = authHeader.match(/^Bearer\s+esk_[A-Za-z0-9_-]{32,}$/);
  if (!m) return null;
  const raw = m[0].replace(/^Bearer\s+/, '');

  const admin = createAdminClient();

  // Use the SECURITY DEFINER helper from the schema — it does the hash + lookup
  // and bumps last_used_at atomically.
  const { data, error } = await admin.rpc('authenticate_api_key', { raw });
  if (error || !data || data.length === 0) return null;

  const row = data[0];
  return { userId: row.user_id, keyId: row.key_id, keyLabel: row.key_label };
}

export function unauthorized() {
  return new Response(JSON.stringify({ error: 'invalid_key' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

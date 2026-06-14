// Shared types between server actions, API routes, and the dashboard.

export type BlockType = 'page' | 'domain' | 'host';
export type BlocklistFormat = 'domains' | 'hosts';

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface ApiKeyRow {
  id: string;
  user_id: string;
  label: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

export interface BlocklistEntry {
  id: string;
  user_id: string;
  url: string;
  block_type: BlockType;
  detector: string;
  reason: string;
  source: string;
  is_active: boolean;
  created_at: string;
}

export interface CustomWord {
  id: string;
  user_id: string;
  word: string;
  created_at: string;
}

export interface BlocklistSource {
  id: string;
  url: string;
  label: string;
  format: BlocklistFormat;
  enabled: boolean;
  last_fetched: string | null;
  last_count: number | null;
  last_error: string | null;
  added_by: string | null;
  created_at: string;
}

export interface RefreshLog {
  id: string;
  source_id: string | null;
  source_url: string;
  started_at: string;
  finished_at: string | null;
  added: number | null;
  removed: number | null;
  status: 'running' | 'success' | 'error';
  error: string | null;
}

// Sync payload returned by GET /api/v1/sync
export interface SyncPayload {
  synced_at: string;
  built_in: {
    domains: string[];
    hosts: string[];
  };
  personal: Array<{
    url: string;
    block_type: BlockType;
    detector: string;
    reason: string;
    created_at: string;
  }>;
  custom_words: string[];
}

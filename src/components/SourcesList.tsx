"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

interface Source {
  id: string;
  url: string;
  label: string;
  format: 'domains' | 'hosts';
  enabled: boolean;
  last_fetched: string | null;
  last_count: number | null;
  last_error: string | null;
  created_at: string;
}

export function SourcesList({ initialSources }: { initialSources: Source[] }) {
  const router = useRouter();
  const [sources, setSources] = useState<Source[]>(initialSources);
  const [busy, setBusy] = useState<string | null>(null);

  async function del(id: string) {
    if (!confirm("Remove this source? Built-in entries from it will also be removed.")) return;
    const res = await fetch(`/api/v1/admin/sources/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSources((prev) => prev.filter((s) => s.id !== id));
      router.refresh();
    }
  }

  async function toggle(id: string, enabled: boolean) {
    setBusy(id);
    const res = await fetch(`/api/v1/admin/sources/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !enabled }),
    });
    setBusy(null);
    if (res.ok) {
      setSources((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: !enabled } : s)));
      router.refresh();
    }
  }

  async function refresh(id: string) {
    setBusy(id);
    const res = await fetch(`/api/v1/admin/sources/${id}/refresh`, { method: "POST" });
    setBusy(null);
    if (res.ok) {
      const data = await res.json();
      alert(`Refreshed: +${data.added} new, -${data.removed} removed`);
      router.refresh();
    } else {
      const err = await res.json();
      alert(`Failed: ${err.error || "unknown"}`);
    }
  }

  async function refreshAll() {
    setBusy("all");
    const res = await fetch("/api/v1/admin/refresh-all", { method: "POST" });
    setBusy(null);
    if (res.ok) {
      const data = await res.json();
      alert(`Refreshed ${data.sources_refreshed} sources.`);
      router.refresh();
    } else {
      alert("Failed");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <Link href="/admin/sources/new" className="px-3 py-1.5 rounded bg-red-500 hover:bg-red-600 text-sm">
          + Add source
        </Link>
        <button
          onClick={refreshAll}
          disabled={busy === "all"}
          className="px-3 py-1.5 rounded border border-zinc-800 hover:border-zinc-700 text-sm disabled:opacity-50"
        >
          {busy === "all" ? "Refreshing..." : "Refresh all enabled"}
        </button>
      </div>

      <div className="space-y-2">
        {sources.length === 0 && <p className="text-sm text-zinc-500">No sources yet. Add one to start.</p>}
        {sources.map((s) => (
          <div
            key={s.id}
            className={`p-3 rounded border ${s.enabled ? "border-zinc-800" : "border-zinc-900 opacity-60"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium text-sm">{s.label}</div>
                <div className="font-mono text-xs text-zinc-500 truncate mt-0.5">{s.url}</div>
                <div className="text-xs text-zinc-500 mt-1 flex flex-wrap gap-x-3">
                  <span>format: {s.format}</span>
                  {s.last_fetched && <span>last: {new Date(s.last_fetched).toLocaleString()}</span>}
                  {s.last_count != null && <span>count: {s.last_count}</span>}
                  {s.last_error && <span className="text-red-400">err: {s.last_error}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs shrink-0">
                <button
                  onClick={() => refresh(s.id)}
                  disabled={busy === s.id}
                  className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50"
                >
                  {busy === s.id ? "..." : "Refresh"}
                </button>
                <button
                  onClick={() => toggle(s.id, s.enabled)}
                  className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700"
                >
                  {s.enabled ? "Disable" : "Enable"}
                </button>
                <button onClick={() => del(s.id)} className="px-2.5 py-1 rounded text-red-400 hover:bg-red-900/30">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

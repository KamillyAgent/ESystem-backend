"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface ApiKey {
  id: string;
  label: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

export function ApiKeysList({
  userId,
  initialKeys,
  activeCount,
}: {
  userId: string;
  initialKeys: ApiKey[];
  activeCount: number;
}) {
  const router = useRouter();
  const [keys, setKeys] = useState<ApiKey[]>(initialKeys);
  // Track active count locally so the "Generate (X/6)" label updates instantly
  // without waiting for router.refresh() to round-trip the server.
  const [localActiveCount, setLocalActiveCount] = useState(
    initialKeys.filter((k) => !k.revoked_at).length
  );
  const [newLabel, setNewLabel] = useState("");
  const [creating, setCreating] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    if (!newLabel.trim()) {
      setError("Label is required");
      return;
    }
    if (activeCount >= 6) {
      setError("You already have 6 active keys. Revoke one to create another.");
      return;
    }
    setCreating(true);
    setError(null);
    const res = await fetch("/api/v1/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: newLabel.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to create key");
      setCreating(false);
      return;
    }
    setNewKey(data.key);
    setNewLabel("");
    setCreating(false);
    router.refresh();
    // Optimistically bump the count so the button updates before refresh lands
    setLocalActiveCount((c) => c + 1);
  }

  async function revoke(id: string) {
    if (!confirm("Revoke this key? The extension using it will stop working.")) return;
    const res = await fetch(`/api/v1/keys/${id}`, { method: "DELETE" });
    if (res.ok) {
      setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, revoked_at: new Date().toISOString() } : k)));
      setLocalActiveCount((c) => Math.max(0, c - 1));
      router.refresh();
    }
  }

  return (
    <div>
      {newKey && (
        <div className="mb-4 p-4 rounded-lg border border-emerald-700 bg-emerald-900/20">
          <div className="text-xs text-emerald-300 mb-2 font-semibold">
            Save this key now — it will never be shown again.
          </div>
          <code className="block p-3 rounded bg-zinc-950 text-emerald-300 text-sm break-all">{newKey}</code>
          <button
            onClick={() => { navigator.clipboard.writeText(newKey); setNewKey(null); }}
            className="mt-3 px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 text-sm"
          >
            Copy & dismiss
          </button>
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Key label (e.g. MacBook Pro)"
          className="flex-1 px-3 py-2 rounded bg-zinc-950 border border-zinc-800 focus:border-zinc-600 outline-none text-sm"
          maxLength={50}
        />
        <button
          onClick={create}
          disabled={creating || localActiveCount >= 6}
          className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 disabled:opacity-50 text-sm font-medium"
        >
          {creating ? "..." : `Generate (${localActiveCount}/6)`}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      <div className="mt-4 space-y-1.5">
        {keys.length === 0 && <p className="text-sm text-zinc-500">No keys yet.</p>}
        {keys.map((k) => (
          <div
            key={k.id}
            className={`flex items-center justify-between p-2.5 rounded border ${
              k.revoked_at ? "border-zinc-900 opacity-50" : "border-zinc-800"
            }`}
          >
            <div className="min-w-0">
              <div className="text-sm font-medium">{k.label}</div>
              <div className="text-xs text-zinc-500 font-mono">{k.key_prefix}…</div>
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <span>{new Date(k.created_at).toLocaleDateString()}</span>
              {k.last_used_at && <span>used {new Date(k.last_used_at).toLocaleDateString()}</span>}
              {!k.revoked_at ? (
                <button onClick={() => revoke(k.id)} className="text-red-400 hover:text-red-300">Revoke</button>
              ) : (
                <span className="text-zinc-600">revoked</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

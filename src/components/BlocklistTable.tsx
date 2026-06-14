"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Entry {
  id: string;
  url: string;
  block_type: 'page' | 'domain' | 'host';
  detector: string;
  reason: string;
  source: string;
  is_active: boolean;
  created_at: string;
}

export function BlocklistTable({ userId, initialEntries }: { userId: string; initialEntries: Entry[] }) {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>(initialEntries);
  const [filter, setFilter] = useState<"" | "page" | "domain" | "host">("");
  const [showAdd, setShowAdd] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newType, setNewType] = useState<'page' | 'domain' | 'host'>('page');
  const [newReason, setNewReason] = useState("Manually added from dashboard");
  const [adding, setAdding] = useState(false);

  const filtered = filter ? entries.filter((e) => e.block_type === filter) : entries;

  async function del(id: string) {
    if (!confirm("Remove this entry?")) return;
    const res = await fetch(`/api/v1/blocklist/${id}`, { method: "DELETE" });
    if (res.ok) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
      router.refresh();
    }
  }

  async function toggle(id: string, active: boolean) {
    const res = await fetch(`/api/v1/blocklist/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !active }),
    });
    if (res.ok) {
      setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, is_active: !active } : e)));
    }
  }

  async function add() {
    if (!newUrl.trim()) return;
    setAdding(true);
    const res = await fetch("/api/v1/blocklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: newUrl.trim(),
        block_type: newType,
        detector: "manual",
        reason: newReason.trim() || "Manually added",
      }),
    });
    setAdding(false);
    if (res.ok) {
      const data = await res.json();
      setEntries((prev) => [data.entry, ...prev]);
      setNewUrl("");
      setShowAdd(false);
      router.refresh();
    } else {
      const err = await res.json();
      alert(err.error || "Failed to add");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1 text-xs">
          {(["", "page", "domain", "host"] as const).map((f) => (
            <button
              key={f || "all"}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 rounded ${
                filter === f ? "bg-zinc-700" : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800"
              }`}
            >
              {f || "all"}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="px-3 py-1.5 rounded bg-red-500 hover:bg-red-600 text-sm"
        >
          {showAdd ? "Cancel" : "+ Add entry"}
        </button>
      </div>

      {showAdd && (
        <div className="mt-3 p-3 rounded border border-zinc-800 bg-zinc-950 grid gap-2 sm:grid-cols-[1fr,140px,2fr,auto]">
          <input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="URL or domain"
            className="px-2 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-sm"
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value as any)}
            className="px-2 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-sm"
          >
            <option value="page">page</option>
            <option value="domain">domain</option>
            <option value="host">host (+ subs)</option>
          </select>
          <input
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            placeholder="Reason"
            className="px-2 py-1.5 rounded bg-zinc-900 border border-zinc-800 text-sm"
          />
          <button
            onClick={add}
            disabled={adding}
            className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-sm disabled:opacity-50"
          >
            Add
          </button>
        </div>
      )}

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-zinc-500 border-b border-zinc-800">
            <tr>
              <th className="py-2 font-medium">URL / Domain</th>
              <th className="py-2 font-medium">Type</th>
              <th className="py-2 font-medium">Detector</th>
              <th className="py-2 font-medium">Reason</th>
              <th className="py-2 font-medium">When</th>
              <th className="py-2 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="py-6 text-center text-zinc-500 text-sm">No entries.</td></tr>
            )}
            {filtered.map((e) => (
              <tr key={e.id} className={`border-b border-zinc-900 ${!e.is_active ? "opacity-40" : ""}`}>
                <td className="py-2 font-mono text-xs truncate max-w-md">{e.url}</td>
                <td className="py-2"><span className="px-1.5 py-0.5 rounded bg-zinc-800 text-xs">{e.block_type}</span></td>
                <td className="py-2 text-xs text-zinc-400">{e.detector}</td>
                <td className="py-2 text-xs text-zinc-400 truncate max-w-xs">{e.reason}</td>
                <td className="py-2 text-xs text-zinc-500">{new Date(e.created_at).toLocaleDateString()}</td>
                <td className="py-2 text-right space-x-2">
                  <button onClick={() => toggle(e.id, e.is_active)} className="text-xs text-zinc-400 hover:text-zinc-200">
                    {e.is_active ? "Disable" : "Enable"}
                  </button>
                  <button onClick={() => del(e.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

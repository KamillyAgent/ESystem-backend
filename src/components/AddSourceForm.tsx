"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export function AddSourceForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [format, setFormat] = useState<'domains' | 'hosts'>('domains');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/v1/admin/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url.trim(), label: label.trim(), format }),
    });
    setSubmitting(false);
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to add");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-xs text-zinc-400 mb-1">Label</label>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. StevenBlack NSFW additions"
          className="w-full px-3 py-2 rounded bg-zinc-950 border border-zinc-800 focus:border-zinc-600 outline-none text-sm"
          required
          maxLength={100}
        />
      </div>
      <div>
        <label className="block text-xs text-zinc-400 mb-1">URL</label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://raw.githubusercontent.com/.../list.txt"
          className="w-full px-3 py-2 rounded bg-zinc-950 border border-zinc-800 focus:border-zinc-600 outline-none text-sm font-mono"
          required
          type="url"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Examples:{" "}
          <a href="https://raw.githubusercontent.com/StevenBlack/hosts/master/alternates/porn-only/hosts" target="_blank" rel="noopener" className="text-red-400 hover:underline">
            StevenBlack porn hosts
          </a>,{" "}
          <a href="https://blocklistproject.github.io/Lists/porn.txt" target="_blank" rel="noopener" className="text-red-400 hover:underline">
            BlockList Project porn
          </a>
        </p>
      </div>
      <div>
        <label className="block text-xs text-zinc-400 mb-1">Format</label>
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value as any)}
          className="w-full px-3 py-2 rounded bg-zinc-950 border border-zinc-800 focus:border-zinc-600 outline-none text-sm"
        >
          <option value="domains">Plain domains (one per line)</option>
          <option value="hosts">Hosts file (0.0.0.0 domain.com)</option>
        </select>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 disabled:opacity-50 text-sm font-medium"
        >
          {submitting ? "Adding & fetching..." : "Add source"}
        </button>
        <Link href="/admin" className="px-4 py-2 rounded border border-zinc-800 hover:border-zinc-700 text-sm">
          Cancel
        </Link>
      </div>
    </form>
  );
}

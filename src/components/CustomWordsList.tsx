"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Word { id: string; word: string; created_at: string; }

export function CustomWordsList({ userId, initialWords }: { userId: string; initialWords: Word[] }) {
  const router = useRouter();
  const [words, setWords] = useState<Word[]>(initialWords);
  const [newWord, setNewWord] = useState("");
  const [adding, setAdding] = useState(false);

  async function add() {
    const w = newWord.trim().toLowerCase();
    if (!w) return;
    setAdding(true);
    const res = await fetch("/api/v1/words/custom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word: w }),
    });
    setAdding(false);
    if (res.ok) {
      const data = await res.json();
      setWords((prev) => [data.word, ...prev]);
      setNewWord("");
      router.refresh();
    } else {
      const err = await res.json();
      alert(err.error || "Failed to add");
    }
  }

  async function del(id: string) {
    if (!confirm(`Remove "${words.find((w) => w.id === id)?.word}"?`)) return;
    const res = await fetch(`/api/v1/words/custom/${id}`, { method: "DELETE" });
    if (res.ok) {
      setWords((prev) => prev.filter((w) => w.id !== id));
      router.refresh();
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={newWord}
          onChange={(e) => setNewWord(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add a word to detect in page text"
          className="flex-1 px-3 py-2 rounded bg-zinc-950 border border-zinc-800 focus:border-zinc-600 outline-none text-sm"
          maxLength={64}
        />
        <button
          onClick={add}
          disabled={adding || !newWord.trim()}
          className="px-4 py-2 rounded bg-red-500 hover:bg-red-600 disabled:opacity-50 text-sm"
        >
          Add
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {words.length === 0 && <p className="text-sm text-zinc-500">No custom words. The built-in set is still active.</p>}
        {words.map((w) => (
          <span key={w.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-800 text-sm">
            {w.word}
            <button onClick={() => del(w.id)} className="text-zinc-500 hover:text-red-400 text-xs">×</button>
          </span>
        ))}
      </div>
    </div>
  );
}

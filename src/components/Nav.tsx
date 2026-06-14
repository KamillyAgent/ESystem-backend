"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface NavUser { email: string; isAdmin: boolean; }

export function Nav({ user }: { user: NavUser | null }) {
  const router = useRouter();

  async function signOut() {
    // Auth0 handles logout at /api/auth/logout
    window.location.href = '/api/auth/logout';
  }

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="inline-block w-6 h-6 rounded bg-red-500 grid place-items-center text-xs">🛡</span>
          ESystem
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/how-it-works" className="px-3 py-1.5 rounded hover:bg-zinc-800">How it works</Link>
          {user ? (
            <>
              <Link href="/dashboard" className="px-3 py-1.5 rounded hover:bg-zinc-800">Dashboard</Link>
              {user.isAdmin && (
                <Link href="/admin" className="px-3 py-1.5 rounded hover:bg-zinc-800 text-amber-400">Admin</Link>
              )}
              <span className="hidden sm:inline text-xs text-zinc-500 ml-2">{user.email}</span>
              <button onClick={signOut} className="ml-1 px-3 py-1.5 rounded hover:bg-zinc-800 text-zinc-400">
                Sign out
              </button>
            </>
          ) : (
            <Link href="/api/auth/login" className="px-3 py-1.5 rounded bg-red-500 hover:bg-red-600 text-white">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

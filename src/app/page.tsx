import Link from "next/link";
import { getAuthUser } from "@/lib/auth0";
import { redirect } from "next/navigation";

export default async function Home() {
  const user = await getAuthUser();
  if (user) redirect("/dashboard");

  return (
    <div className="max-w-5xl mx-auto px-4 py-16 sm:py-24">
      <section className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          v0.1.0 · early access
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
          Block the web<br />you <span className="text-red-500">don&apos;t</span> want to see.
        </h1>
        <p className="mt-6 text-lg text-zinc-400 max-w-2xl mx-auto">
          ESystem is a cross-browser content blocker for NSFW, adult, and 18+ pages and domains.
          It scans every page you visit and redirects anything it finds to a clean block page —
          with no data sent anywhere until you sign in and connect your own backend.
        </p>
        <div className="mt-10 flex items-center justify-center gap-3">
          <Link href="/api/auth/login" className="px-5 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium">
            Sign in
          </Link>
          <Link href="/how-it-works" className="px-5 py-2.5 rounded-lg border border-zinc-800 hover:border-zinc-700">
            How it works
          </Link>
        </div>
      </section>

      <section className="mt-24 grid sm:grid-cols-3 gap-4">
        {[
          { t: "Scans in real time", d: "URL, metadata, and page text are checked on every navigation and every DOM mutation. New findings go to your personal blocklist." },
          { t: "Synced across devices", d: "Up to 6 API keys per account. Use one on your laptop, one on your phone, one in a VM — they all share the same blocklist." },
          { t: "You own the data", d: "Stored in Supabase Postgres under your account. Export, delete, or self-host any time. No tracking, no ads, no analytics." },
        ].map((f) => (
          <div key={f.t} className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/50">
            <h3 className="font-semibold">{f.t}</h3>
            <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{f.d}</p>
          </div>
        ))}
      </section>

      <section className="mt-24 text-center text-sm text-zinc-500">
        Currently supports Chrome, Brave, and Firefox (MV3). More browsers on request.
      </section>
    </div>
  );
}

import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser, ensureProfile, isAdmin } from "@/lib/auth0";
import { SourcesList } from "@/components/SourcesList";

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await requireUser('/admin');
  await ensureProfile(user);

  const admin = createAdminClient();
  const [sourcesRes, logRes] = await Promise.all([
    admin.from("blocklist_sources").select("*").order("created_at", { ascending: false }),
    admin.from("refresh_log").select("*").order("started_at", { ascending: false }).limit(20),
  ]);

  const { count: builtInCount } = await admin
    .from("built_in_entries")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold">Admin</h1>
      <p className="mt-1 text-sm text-zinc-400">Manage the built-in community blocklist.</p>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40">
          <div className="text-xs text-zinc-500">Sources</div>
          <div className="text-2xl font-semibold mt-1">{(sourcesRes.data ?? []).length}</div>
        </div>
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40">
          <div className="text-xs text-zinc-500">Built-in entries</div>
          <div className="text-2xl font-semibold mt-1">{builtInCount ?? 0}</div>
        </div>
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/40">
          <div className="text-xs text-zinc-500">Recent refreshes</div>
          <div className="text-2xl font-semibold mt-1">{(logRes.data ?? []).length}</div>
        </div>
      </div>

      <section className="mt-8 p-5 rounded-xl border border-zinc-800 bg-zinc-900/40">
        <h2 className="text-lg font-semibold">Blocklist sources</h2>
        <p className="mt-1 text-xs text-zinc-500">URLs the admin feeds into the built-in list. Refreshed daily + on demand.</p>
        <div className="mt-4">
          <SourcesList initialSources={sourcesRes.data ?? []} />
        </div>
      </section>

      <section className="mt-4 p-5 rounded-xl border border-zinc-800 bg-zinc-900/40">
        <h2 className="text-lg font-semibold">Recent refresh log</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-zinc-500 border-b border-zinc-800">
              <tr>
                <th className="py-2 font-medium">Started</th>
                <th className="py-2 font-medium">Source</th>
                <th className="py-2 font-medium">Status</th>
                <th className="py-2 font-medium text-right">+</th>
                <th className="py-2 font-medium text-right">−</th>
                <th className="py-2 font-medium">Error</th>
              </tr>
            </thead>
            <tbody>
              {(logRes.data ?? []).map((r: any) => (
                <tr key={r.id} className="border-b border-zinc-900">
                  <td className="py-2 text-zinc-400 text-xs">{new Date(r.started_at).toLocaleString()}</td>
                  <td className="py-2 truncate max-w-xs">{r.source_url}</td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      r.status === 'success' ? 'bg-emerald-900/40 text-emerald-300' :
                      r.status === 'error' ? 'bg-red-900/40 text-red-300' :
                      'bg-zinc-800 text-zinc-400'
                    }`}>{r.status}</span>
                  </td>
                  <td className="py-2 text-right text-emerald-400">{r.added ?? '—'}</td>
                  <td className="py-2 text-right text-red-400">{r.removed ?? '—'}</td>
                  <td className="py-2 text-xs text-zinc-500 truncate max-w-xs">{r.error ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

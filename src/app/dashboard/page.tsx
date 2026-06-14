import { requireUser, ensureProfile, isAdmin } from "@/lib/auth0";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApiKeysList } from "@/components/ApiKeysList";
import { CustomWordsList } from "@/components/CustomWordsList";
import { BlocklistTable } from "@/components/BlocklistTable";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await requireUser('/dashboard');

  // Ensure the user has a profile row (creates on first visit after sign-in).
  // Wrap in try/catch so a Supabase hiccup doesn't take down the whole page.
  try {
    await ensureProfile(user);
  } catch (err) {
    console.error('[ESystem dashboard] ensureProfile failed:', err);
    // Page still renders — the profile is only needed for display, not auth.
  }

  const admin = createAdminClient();
  const userId = user.sub;

  // Use allSettled so one failing query doesn't kill the whole page.
  const [keysSettled, wordsSettled, listSettled] = await Promise.allSettled([
    admin.from("api_keys").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    admin.from("custom_words").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    admin.from("blocklist_entries").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(200),
  ]);

  const keys = keysSettled.status === 'fulfilled' ? (keysSettled.value.data ?? []) : [];
  const words = wordsSettled.status === 'fulfilled' ? (wordsSettled.value.data ?? []) : [];
  const list = listSettled.status === 'fulfilled' ? (listSettled.value.data ?? []) : [];
  const errors: string[] = [];
  if (keysSettled.status === 'rejected') errors.push(`api_keys: ${keysSettled.reason?.message ?? 'unknown'}`);
  if (wordsSettled.status === 'rejected') errors.push(`custom_words: ${wordsSettled.reason?.message ?? 'unknown'}`);
  if (listSettled.status === 'rejected') errors.push(`blocklist_entries: ${listSettled.reason?.message ?? 'unknown'}`);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-400">{user.email}</p>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="mt-4 p-3 rounded-lg border border-amber-700 bg-amber-900/20 text-amber-200 text-sm">
          <strong>Some data could not be loaded:</strong>
          <ul className="mt-1 ml-4 list-disc">{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
          <p className="mt-1 text-xs">The rest of the page is still usable.</p>
        </div>
      )}

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <section className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/40">
          <h2 className="text-lg font-semibold">API keys</h2>
          <p className="mt-1 text-xs text-zinc-500">Use these in the ESystem extension. Up to 6 active at a time.</p>
          <div className="mt-4">
            <ApiKeysList
              userId={userId}
              initialKeys={keys}
              activeCount={keys.filter((k) => !k.revoked_at).length}
            />
          </div>
        </section>

        <section className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/40">
          <h2 className="text-lg font-semibold">Custom detection words</h2>
          <p className="mt-1 text-xs text-zinc-500">Add words to detect in page text. Merged with the built-in list.</p>
          <div className="mt-4">
            <CustomWordsList userId={userId} initialWords={words} />
          </div>
        </section>
      </div>

      <section className="mt-4 p-5 rounded-xl border border-zinc-800 bg-zinc-900/40">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your blocklist</h2>
          <span className="text-xs text-zinc-500">{list.length} entries</span>
        </div>
        <p className="mt-1 text-xs text-zinc-500">Detected by the extension or added manually.</p>
        <div className="mt-4">
          <BlocklistTable userId={userId} initialEntries={list} />
        </div>
      </section>
    </div>
  );
}

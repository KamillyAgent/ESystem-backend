import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { ApiKeysList } from "@/components/ApiKeysList";
import { CustomWordsList } from "@/components/CustomWordsList";
import { BlocklistTable } from "@/components/BlocklistTable";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const admin = createAdminClient();

  // Server components — full access via service role (bypasses RLS for our own user)
  const [keysRes, wordsRes, listRes] = await Promise.all([
    admin.from("api_keys").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    admin.from("custom_words").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    admin.from("blocklist_entries").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(200),
  ]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-400">{user.email}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <section className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/40">
          <h2 className="text-lg font-semibold">API keys</h2>
          <p className="mt-1 text-xs text-zinc-500">Use these in the ESystem extension. Up to 6 active at a time.</p>
          <div className="mt-4">
            <ApiKeysList
              userId={user.id}
              initialKeys={keysRes.data ?? []}
              activeCount={(keysRes.data ?? []).filter((k) => !k.revoked_at).length}
            />
          </div>
        </section>

        <section className="p-5 rounded-xl border border-zinc-800 bg-zinc-900/40">
          <h2 className="text-lg font-semibold">Custom detection words</h2>
          <p className="mt-1 text-xs text-zinc-500">Add words to detect in page text. Merged with the built-in list.</p>
          <div className="mt-4">
            <CustomWordsList userId={user.id} initialWords={wordsRes.data ?? []} />
          </div>
        </section>
      </div>

      <section className="mt-4 p-5 rounded-xl border border-zinc-800 bg-zinc-900/40">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your blocklist</h2>
          <span className="text-xs text-zinc-500">{(listRes.data ?? []).length} entries</span>
        </div>
        <p className="mt-1 text-xs text-zinc-500">Detected by the extension or added manually.</p>
        <div className="mt-4">
          <BlocklistTable userId={user.id} initialEntries={listRes.data ?? []} />
        </div>
      </section>
    </div>
  );
}

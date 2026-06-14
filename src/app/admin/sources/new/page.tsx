import { requireUser, isAdmin, ensureProfile } from "@/lib/auth0";
import { redirect } from "next/navigation";
import { AddSourceForm } from "@/components/AddSourceForm";

export default async function NewSourcePage() {
  const user = await requireUser('/admin/sources/new');
  await ensureProfile(user);
  if (!isAdmin(user, process.env.ADMIN_EMAIL)) redirect("/dashboard");

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold">Add blocklist source</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Paste a URL that serves a list of domains. The backend will fetch and parse it, then store the entries in the built-in blocklist.
      </p>
      <div className="mt-8 p-5 rounded-xl border border-zinc-800 bg-zinc-900/40">
        <AddSourceForm />
      </div>
    </div>
  );
}

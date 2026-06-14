export const metadata = { title: "Privacy — ESystem" };

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 prose prose-invert">
      <h1 className="text-3xl font-bold">Privacy</h1>
      <p className="text-zinc-400 mt-2 text-sm">Last updated: June 2026</p>

      <h2 className="text-xl font-semibold mt-10">What ESystem collects</h2>
      <ul className="text-zinc-300 text-sm space-y-2 mt-2 list-disc pl-5">
        <li>Your Google account email and display name (used to sign you in, identify your account, and gate the admin panel).</li>
        <li>The URLs and domains you (or the extension) add to your blocklist.</li>
        <li>Custom detection words you add.</li>
        <li>API key creation, revocation, and last-used timestamps.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-10">What ESystem does NOT collect</h2>
      <ul className="text-zinc-300 text-sm space-y-2 mt-2 list-disc pl-5">
        <li>Your browsing history beyond what the extension explicitly reports to your own blocklist.</li>
        <li>Page content, screenshots, or images.</li>
        <li>Device identifiers, IP addresses (beyond standard Vercel edge logs), or fingerprinting data.</li>
        <li>Third-party analytics, ads, or trackers.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-10">Where data is stored</h2>
      <p className="text-zinc-300 text-sm mt-2">
        All account and blocklist data is stored in a Supabase Postgres database that we operate.
        Extension-to-backend communication is TLS-encrypted in transit.
      </p>

      <h2 className="text-xl font-semibold mt-10">Data deletion</h2>
      <p className="text-zinc-300 text-sm mt-2">
        To delete your account and all associated data, sign in and email us at{" "}
        <a href="mailto:privacy@masud.app" className="text-red-400">privacy@masud.app</a>.
        We will delete your profile, API keys, blocklist, and custom words within 7 days.
      </p>

      <h2 className="text-xl font-semibold mt-10">Open source</h2>
      <p className="text-zinc-300 text-sm mt-2">
        The backend is open source at{" "}
        <a href="https://github.com/KamillyAgent/ESystem-backend" className="text-red-400">github.com/KamillyAgent/ESystem-backend</a>.
        Audit the code, self-host, or report issues there.
      </p>
    </div>
  );
}

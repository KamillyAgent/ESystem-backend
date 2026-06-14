export const metadata = { title: "How it works — ESystem" };

export default function HowItWorksPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold">How it works</h1>

      <ol className="mt-10 space-y-8">
        {[
          { n: 1, t: "Sign in", d: "Click Sign in, authenticate with Google. We create your account and a default empty blocklist. Nothing is sent anywhere until you connect an extension." },
          { n: 2, t: "Generate an API key", d: "On the dashboard, click \"Generate API key\". Give it a name (e.g. \"MacBook Pro\"). Copy the key — it's shown once and never again." },
          { n: 3, t: "Install the extension", d: "Load the unpacked extension into Chrome, Brave, or Firefox. (See the extension repo for exact steps.)" },
          { n: 4, t: "Connect the extension", d: "Open the extension's settings page. Paste your backend URL (https://esystem.masud.app) and the API key. The extension verifies the key, downloads your blocklist + custom words, and starts working." },
          { n: 5, t: "Browse", d: "As you browse, the extension scans every page (URL, metadata, text). On detection, it reports the finding to your blocklist and redirects the page to the block screen." },
          { n: 6, t: "Sync", d: "The extension pulls a fresh blocklist + words every 6 hours. You can also click \"Sync now\" in the extension popup." },
        ].map((s) => (
          <li key={s.n} className="flex gap-4">
            <div className="flex-none w-9 h-9 rounded-full bg-red-500 grid place-items-center font-semibold">{s.n}</div>
            <div>
              <h2 className="font-semibold">{s.t}</h2>
              <p className="text-sm text-zinc-400 mt-1">{s.d}</p>
            </div>
          </li>
        ))}
      </ol>

      <h2 className="text-xl font-semibold mt-16">The block page</h2>
      <p className="text-sm text-zinc-400 mt-2">
        When ESystem blocks a page, the extension navigates the tab to your backend&apos;s <code className="px-1.5 py-0.5 rounded bg-zinc-800">/block</code> route.
        The backend renders a clean page showing the reason, the domain, and a back button. Nothing is loaded from the original page.
      </p>
    </div>
  );
}

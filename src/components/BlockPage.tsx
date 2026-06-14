import Link from "next/link";

export function BlockPage({
  url,
  domain,
  reason,
  detector,
}: {
  url: string;
  domain: string;
  reason: string;
  detector: string;
}) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="inline-flex w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500 items-center justify-center mb-6">
          <span className="text-3xl">🛡</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Blocked by ESystem</h1>
        <p className="mt-3 text-zinc-400">{reason}</p>

        <div className="mt-8 p-5 rounded-xl border border-zinc-800 bg-zinc-900/40 text-left">
          <dl className="space-y-2 text-sm">
            {domain && (
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Domain</dt>
                <dd className="font-mono text-zinc-200">{domain}</dd>
              </div>
            )}
            {url && (
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">URL</dt>
                <dd className="font-mono text-xs text-zinc-400 truncate max-w-[300px]" title={url}>{url}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Detector</dt>
              <dd className="font-mono text-zinc-300">{detector}</dd>
            </div>
          </dl>
        </div>

        <div className="mt-8 flex items-center justify-center gap-3">
          <button
            onClick={() => (window.history.length > 1 ? window.history.back() : window.close())}
            className="px-5 py-2.5 rounded-lg border border-zinc-800 hover:border-zinc-700"
          >
            ← Go back
          </button>
          <Link href="/dashboard" className="px-5 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700">
            Manage blocklist
          </Link>
        </div>

        <p className="mt-8 text-xs text-zinc-600">
          If you think this is wrong, visit your dashboard to disable or remove the rule.
        </p>
      </div>
    </div>
  );
}

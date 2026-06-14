// Friendly setup-instructions page shown when Auth0 env vars are missing
// on the deployment. Triggered by requireUser() when AUTH0_SECRET (etc.)
// are not configured in Vercel.

import Link from 'next/link';
import { auth0Configured } from '@/lib/auth0';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export default async function AuthSetupPage() {
  const configured = auth0Configured();

  return (
    <main className="min-h-screen bg-[#060812] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] rounded-3xl shadow-2xl shadow-black/60 overflow-hidden">
          <div className="h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />

          <div className="px-8 md:px-10 py-9 md:py-10 flex flex-col gap-6">
            <div>
              <span className="inline-block text-xs uppercase tracking-widest text-amber-400 font-semibold mb-3">
                Setup needed
              </span>
              <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-[-0.02em]">
                {configured ? 'Auth0 is configured' : 'Auth0 env vars are missing'}
              </h1>
              <p className="text-slate-400 text-sm md:text-[15px] mt-2 leading-relaxed">
                {configured
                  ? 'Auth0 is configured, but you are not signed in. Use the button below to start the sign-in flow.'
                  : 'This deployment is missing the Auth0 environment variables. Sign-in is disabled until they are set. Follow the steps below, then redeploy.'}
              </p>
            </div>

            {!configured && (
              <div className="bg-black/30 border border-white/[0.06] rounded-2xl p-5 font-mono text-[13px] leading-relaxed">
                <p className="text-amber-300 mb-3">
                  # Set these 5 env vars in Vercel → Project → Settings → Environment Variables
                </p>
                <p className="text-slate-300">
                  <span className="text-blue-400">AUTH0_DOMAIN</span>
                  <span className="text-slate-500">=your-tenant.us.auth0.com</span>
                </p>
                <p className="text-slate-300">
                  <span className="text-blue-400">AUTH0_CLIENT_ID</span>
                  <span className="text-slate-500">=abc123...  (from Auth0 Application)</span>
                </p>
                <p className="text-slate-300">
                  <span className="text-blue-400">AUTH0_CLIENT_SECRET</span>
                  <span className="text-slate-500">=xyz789...  (from Auth0 Application)</span>
                </p>
                <p className="text-slate-300">
                  <span className="text-blue-400">AUTH0_SECRET</span>
                  <span className="text-slate-500">=$(openssl rand -hex 32)</span>
                </p>
                <p className="text-slate-300">
                  <span className="text-blue-400">AUTH0_BASE_URL</span>
                  <span className="text-slate-500">=https://esystem.masud.app</span>
                </p>
              </div>
            )}

            <ol className="flex flex-col gap-3 text-slate-300 text-sm">
              <li>
                <span className="text-blue-400 font-semibold mr-2">1.</span>
                In Vercel, open this project and go to <strong>Settings → Environment Variables</strong>.
              </li>
              <li>
                <span className="text-blue-400 font-semibold mr-2">2.</span>
                Add the 5 variables above. Use values from your Auth0 tenant
                (Auth0 dashboard → Applications → your app → Settings).
              </li>
              <li>
                <span className="text-blue-400 font-semibold mr-2">3.</span>
                In Auth0 → your Application → Settings, set:
                <ul className="ml-6 mt-2 flex flex-col gap-1 text-slate-400 text-[13px] list-disc">
                  <li>
                    <strong className="text-slate-200">Allowed Callback URLs:</strong>{' '}
                    <code className="text-slate-300">https://esystem.masud.app/api/auth/callback</code>
                  </li>
                  <li>
                    <strong className="text-slate-200">Allowed Logout URLs:</strong>{' '}
                    <code className="text-slate-300">https://esystem.masud.app</code>
                  </li>
                </ul>
              </li>
              <li>
                <span className="text-blue-400 font-semibold mr-2">4.</span>
                In Auth0 → Authentication → Social, enable{' '}
                <strong className="text-slate-200">Google</strong> (or any provider you want).
              </li>
              <li>
                <span className="text-blue-400 font-semibold mr-2">5.</span>
                Redeploy this Vercel project (Deployments → latest → Redeploy).
              </li>
            </ol>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {configured ? (
                <Link
                  href="/api/auth/login"
                  className="flex-1 text-center px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-2xl text-[15px] transition-all"
                >
                  Sign in with Auth0
                </Link>
              ) : (
                <Link
                  href="/api/v1/test"
                  className="flex-1 text-center px-6 py-3 bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 font-medium rounded-2xl text-[15px] border border-white/[0.08] transition-all"
                >
                  Check env-var status (/api/v1/test)
                </Link>
              )}
              <Link
                href="/"
                className="flex-1 text-center px-6 py-3 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 font-medium rounded-2xl text-[15px] border border-white/[0.08] transition-all"
              >
                ← Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

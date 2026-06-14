"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const returnTo = typeof window !== 'undefined' ? window.location.pathname : '/dashboard';

  return (
    <div className="max-w-md mx-auto px-4 py-24">
      <h1 className="text-3xl font-bold">Sign in</h1>
      <p className="mt-2 text-zinc-400">
        Sign in with your Auth0 account to create a free ESystem account.
        You&apos;ll get an API key to paste into the extension.
      </p>
      <Link
        href={`/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`}
        className="mt-8 w-full px-5 py-3 rounded-lg bg-white text-zinc-900 font-medium hover:bg-zinc-200 flex items-center justify-center gap-3"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#EB5424" d="M21.7 7.6c0-.1 0-.2-.1-.3-.1-.2-.3-.3-.5-.3h-3.2c-.1 0-.2 0-.3.1-.1.1-.1.2-.1.3v8.9c0 .1 0 .2.1.3.1.1.2.1.3.1h3.2c.1 0 .2 0 .3-.1.1-.1.1-.2.1-.3V7.6zm-9.4 4.3v3.9c0 .1 0 .2-.1.3-.1.1-.2.1-.3.1H8.7c-.1 0-.2 0-.3-.1-.1-.1-.1-.2-.1-.3V7.6c0-.1 0-.2.1-.3.1-.1.2-.1.3-.1H12c.1 0 .2 0 .3.1.1.1.1.2.1.3v3.5c0 .1 0 .2-.1.3l-1.7 1.7c-.1.1-.1.2 0 .3l1.7 1.7c.1.1.1.2.1.3z"/></svg>
        Continue with Auth0
      </Link>
      <p className="mt-4 text-xs text-zinc-500">
        You&apos;ll be redirected to Auth0 to sign in. New accounts are created automatically.
      </p>
    </div>
  );
}

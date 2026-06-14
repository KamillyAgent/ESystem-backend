import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { getAuthUser } from "@/lib/auth0";
import { isAdmin } from "@/lib/auth0";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ESystem — NSFW Shield",
  description: "Block NSFW, adult, and 18+ pages and domains. Cross-browser content blocker.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        <Nav user={user ? { email: user.email, isAdmin: isAdmin(user, process.env.ADMIN_EMAIL) } : null} />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-zinc-800 py-6 text-center text-sm text-zinc-500">
          ESystem · <a href="/how-it-works" className="hover:text-zinc-300">How it works</a> · <a href="/privacy" className="hover:text-zinc-300">Privacy</a>
        </footer>
        {/* Vercel Web Analytics — fires a pageview on every navigation. */}
        <Analytics />
        {/* Vercel Speed Insights — measures real-user Core Web Vitals. */}
        <SpeedInsights />
      </body>
    </html>
  );
}

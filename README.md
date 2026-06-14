# ESystem Backend

Next.js 14 App Router backend for the ESystem NSFW blocker.

- **Live URL:** https://esystem.masud.app (once deployed)
- **Stack:** Next.js 14 · Supabase (Postgres + Auth) · Tailwind
- **Spec:** see [SPEC.md](../../SPEC.md) in the parent folder

## Quick start (local dev)

```bash
npm install
cp .env.example .env.local        # fill in the values (see "Environment" below)
npm run dev
# → http://localhost:3000
```

## Environment

| Var | Where to get it | Used by |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`    | Supabase dashboard → Settings → API | browser + server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same | browser (public, low privilege) |
| `SUPABASE_SERVICE_ROLE_KEY`   | same (secret — server only) | server-side API routes only |
| `ADMIN_EMAIL`                 | your Google account email | gates `/admin*` routes |
| `CRON_SECRET`                 | a random string you make up | `Authorization: Bearer <CRON_SECRET>` for Vercel Cron |
| `NEXT_PUBLIC_SITE_URL`        | `http://localhost:3000` in dev, `https://esystem.masud.app` in prod | absolute URLs in emails / OAuth redirects |

## Deploy

Vercel auto-deploys on push to `main` of `KamillyAgent/ESystem-backend`.

## Database setup

1. Create a new Supabase project called `esystem`
2. Run `supabase/schema.sql` in the SQL editor
3. Enable Google provider in Auth → Providers
4. Add redirect URLs:
   - `https://esystem.masud.app/auth/callback` (prod)
   - `http://localhost:3000/auth/callback` (dev)

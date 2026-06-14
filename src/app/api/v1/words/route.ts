import { NextResponse, type NextRequest } from "next/server";
import { authenticateApiKey, unauthorized } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = 'force-dynamic';

// Built-in word set. Keep this short — the extension ships its own
// patterns.js with the same list. This is what gets returned via API
// so the extension can pick up the canonical set.
const BUILT_IN_WORDS = [
  'porn', 'pornography', 'xxx', 'nsfw', 'hentai', 'xvideos', 'xnxx',
  'erotic', 'nude', 'nudity', 'topless', 'naked', 'stripper', 'escort',
  'prostitute', 'fetish', 'bdsm', 'bondage', 'orgasm', 'vagina', 'penis',
  'breast', 'pussy', 'dick', 'cum', 'anal', 'blowjob', 'cumshot', 'creampie',
  'orgy', 'swinger', 'voyeur', 'pedo', 'loli', 'incest', 'bestiality',
  'necrophilia', 'tranny', 'shemale', 'tgirl', 'futanari', 'ahegao', 'doujinshi',
  'ecchi', 'waifu', 'oppai', 'panty', 'panties', 'lingerie', 'thong', 'stockings',
  'swimsuit', 'bikini', 'topless', 'nudist',
];

export async function GET(req: NextRequest) {
  const ctx = await authenticateApiKey(req.headers.get('authorization'));
  if (!ctx) return unauthorized();

  const admin = createAdminClient();
  const { data: custom } = await admin
    .from('custom_words')
    .select('word')
    .eq('user_id', ctx.userId);

  const userWords = (custom ?? []).map((w) => w.word);
  // Union — user words win on overlap
  const all = Array.from(new Set([...BUILT_IN_WORDS, ...userWords]));

  return NextResponse.json({ words: all });
}

import Link from "next/link";
import { BlockPage } from "@/components/BlockPage";

export default async function BlockPageRoute({
  searchParams,
}: {
  searchParams: Promise<{ url?: string; reason?: string; domain?: string; detector?: string }>;
}) {
  const params = await searchParams;
  return (
    <BlockPage
      url={params.url ?? ''}
      domain={params.domain ?? ''}
      reason={params.reason ?? 'This page is on your blocklist.'}
      detector={params.detector ?? 'blocklist'}
    />
  );
}

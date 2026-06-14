// Parsers for the two blocklist source formats the admin can add.
// Returns a Set of lowercased domain names. Whitespace + comments stripped.

export type BlocklistFormat = 'domains' | 'hosts';

export function parseDomainsList(text: string): Set<string> {
  const out = new Set<string>();
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith('!')) continue;
    // Some lists have inline comments after a tab/space
    const cleaned = line.split(/\s+/)[0];
    if (!cleaned || cleaned.includes(' ')) continue;
    // Skip wildcard / regex entries (v1 only supports exact domains)
    if (cleaned.includes('*') || cleaned.includes('/')) continue;
    out.add(cleaned.toLowerCase());
  }
  return out;
}

export function parseHostsList(text: string): Set<string> {
  const out = new Set<string>();
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const parts = line.split(/\s+/);
    // Hosts format: "0.0.0.0 domain.com" or "127.0.0.1 domain.com"
    // Also accept plain-domain lines (some lists are mixed)
    if (parts.length === 1) {
      const d = parts[0];
      if (d && !d.includes('*') && !d.includes('/') && d.includes('.')) {
        out.add(d.toLowerCase());
      }
    } else if (parts.length >= 2 && /^(0\.0\.0\.0|127\.0\.0\.[01]|::|::1)$/.test(parts[0])) {
      const d = parts[1];
      if (d && !d.includes('*') && !d.includes('/') && d.includes('.')) {
        out.add(d.toLowerCase());
      }
    }
  }
  return out;
}

export function parseBlocklist(text: string, format: BlocklistFormat): Set<string> {
  return format === 'hosts' ? parseHostsList(text) : parseDomainsList(text);
}

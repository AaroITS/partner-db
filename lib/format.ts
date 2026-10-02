/* Shared formatters. These live here rather than in a page file: all three
   pages need them, and importing one page from another makes the build
   depend on which version of that page happens to be in place. */

export function formatDate(iso: string | null) {
  if (!iso) return "no date";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

// Compact money: $12.6M, $840K. Full figures would dominate the row.
export function formatMoney(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${Math.round(n)}`;
}

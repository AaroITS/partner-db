import Link from "next/link";
import {
  ACCENT,
  ACCENT_TEXT,
  ACCENT_WASH,
  BODY,
  BORDER,
  MUTED,
} from "@/lib/theme";

// A filter arrives as a string when one value is picked, an array when
// several are. `list()` normalises both.
export type Param = string | string[] | undefined;

export function list(value: Param): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

// Counts how many records carry each value. `pick` pulls the values out of
// one record — one for country, several for industries.
export function tally<T>(records: T[], pick: (r: T) => (string | null)[]) {
  const counts = new Map<string, number>();
  for (const r of records) {
    for (const value of pick(r)) {
      if (!value) continue;
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  );
}

// Link for ticking a value on, or unticking it if already chosen. Every other
// active filter carries over untouched. `basePath` keeps the link on the
// current page — '/' for partners, '/leads' for tenders.
export function toggleHref(
  params: Record<string, Param>,
  key: string,
  value: string,
  basePath: string,
) {
  const next = new URLSearchParams();

  for (const [k, v] of Object.entries(params)) {
    if (k === key) continue;
    for (const item of list(v)) next.append(k, item);
  }

  const current = list(params[key]);
  const updated = current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value];

  for (const item of updated) next.append(key, item);

  const qs = next.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function Facet({
  title,
  hint,
  param,
  values,
  picked,
  params,
  basePath,
}: {
  title: string;
  hint?: string;
  param: string;
  values: [string, number][];
  picked: string[];
  params: Record<string, Param>;
  basePath: string;
}) {
  // A filter offering a single option can't narrow anything, so hide it.
  if (values.length < 2 && picked.length === 0) return null;

  return (
    <div style={{ borderColor: BORDER }} className="border-t px-4 py-3">
      <h3 style={{ color: MUTED }} className="text-[11px] font-semibold">
        {title}
      </h3>
      {hint && (
        <p style={{ color: MUTED }} className="mt-0.5 text-[11px] leading-snug">
          {hint}
        </p>
      )}

      <ul className="mt-2">
        {values.map(([value, count]) => {
          const isPicked = picked.includes(value);
          return (
            <li key={value}>
              <Link
                href={toggleHref(params, param, value, basePath)}
                style={{
                  color: isPicked ? ACCENT_TEXT : BODY,
                  backgroundColor: isPicked ? ACCENT_WASH : undefined,
                }}
                className={`-mx-1.5 flex items-baseline gap-2 rounded px-1.5 py-1 text-[13px] leading-snug transition-colors ${
                  isPicked ? "font-semibold" : "hover:bg-[#F0F0FE]"
                }`}
              >
                <span
                  aria-hidden
                  style={{
                    borderColor: isPicked ? ACCENT : "#C9C9D2",
                    backgroundColor: isPicked ? ACCENT : "transparent",
                  }}
                  className="mt-[3px] flex h-3 w-3 shrink-0 items-center justify-center rounded-[3px] border text-[8px] font-bold leading-none text-white"
                >
                  {isPicked ? "✓" : ""}
                </span>
                <span className="flex-1">{value}</span>
                <span
                  style={{ color: MUTED }}
                  className="text-[11px] tabular-nums"
                >
                  {count}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function SearchBox({
  query,
  hidden,
  placeholder,
}: {
  query: string;
  // The tick-box filters, preserved so submitting the search doesn't clear them
  hidden: { name: string; values: string[] }[];
  placeholder: string;
}) {
  return (
    <form method="get" className="px-4 py-3">
      <label htmlFor="q" className="sr-only">
        Search
      </label>
      <input
        id="q"
        name="q"
        type="search"
        defaultValue={query}
        placeholder={placeholder}
        style={{
          borderColor: BORDER,
          color: BODY,
          ["--tw-ring-color" as string]: "rgba(79,70,229,0.18)",
        }}
        className="w-full rounded border bg-white px-2.5 py-1.5 text-[13px] outline-none focus:border-[#4F46E5] focus:ring-2"
      />
      {hidden.map((h) =>
        h.values.map((v) => (
          <input key={`${h.name}-${v}`} type="hidden" name={h.name} value={v} />
        )),
      )}
    </form>
  );
}

export function ClearFilters({
  show,
  basePath,
}: {
  show: boolean;
  basePath: string;
}) {
  if (!show) return null;
  return (
    <div style={{ borderColor: BORDER }} className="border-t px-4 py-3">
      <Link
        href={basePath}
        style={{ color: ACCENT_TEXT }}
        className="text-[12px] font-semibold hover:underline"
      >
        Clear all filters
      </Link>
    </div>
  );
}

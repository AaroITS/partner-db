import Link from 'next/link'
import { BLUE, BLUE_DEEP, BLUE_TINT } from '@/lib/theme'

// A filter arrives as a string when one value is picked, an array when
// several are. `list()` normalises both.
export type Param = string | string[] | undefined

export function list(value: Param): string[] {
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

// Counts how many records carry each value. `pick` pulls the values out of
// one record — one for country, several for industries.
export function tally<T>(records: T[], pick: (r: T) => (string | null)[]) {
  const counts = new Map<string, number>()
  for (const r of records) {
    for (const value of pick(r)) {
      if (!value) continue
      counts.set(value, (counts.get(value) ?? 0) + 1)
    }
  }
  return [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
  )
}

// Link for ticking a value on, or unticking it if already chosen. Every other
// active filter carries over untouched. `basePath` keeps the link on the
// current page — '/' for partners, '/leads' for tenders.
export function toggleHref(
  params: Record<string, Param>,
  key: string,
  value: string,
  basePath: string
) {
  const next = new URLSearchParams()

  for (const [k, v] of Object.entries(params)) {
    if (k === key) continue
    for (const item of list(v)) next.append(k, item)
  }

  const current = list(params[key])
  const updated = current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value]

  for (const item of updated) next.append(key, item)

  const qs = next.toString()
  return qs ? `${basePath}?${qs}` : basePath
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
  title: string
  hint?: string
  param: string
  values: [string, number][]
  picked: string[]
  params: Record<string, Param>
  basePath: string
}) {
  // A filter offering a single option can't narrow anything, so hide it.
  if (values.length < 2 && picked.length === 0) return null

  return (
    <div className="mb-7">
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
        {title}
      </h3>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}

      <ul className="mt-3 space-y-0.5">
        {values.map(([value, count]) => {
          const isPicked = picked.includes(value)
          return (
            <li key={value}>
              <Link
                href={toggleHref(params, param, value, basePath)}
                style={
                  isPicked
                    ? {
                        backgroundColor: BLUE,
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.28)',
                      }
                    : undefined
                }
                className={`group flex items-baseline gap-2 rounded-xl px-2 py-1.5 text-sm transition-colors ${
                  isPicked
                    ? 'font-semibold text-white'
                    : 'text-slate-700 hover:bg-white/70'
                }`}
              >
                <span
                  aria-hidden
                  style={
                    isPicked ? { color: BLUE_DEEP } : { backgroundColor: BLUE_TINT }
                  }
                  className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[5px] border text-[9px] font-bold leading-none ${
                    isPicked
                      ? 'border-white bg-white'
                      : 'border-slate-300/80 group-hover:border-slate-400'
                  }`}
                >
                  {isPicked ? '✓' : ''}
                </span>
                <span className="flex-1">{value}</span>
                <span
                  className={`text-[11px] tabular-nums ${
                    isPicked ? 'text-white/70' : 'text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function SearchBox({
  query,
  hidden,
  placeholder,
}: {
  query: string
  // The tick-box filters, preserved so submitting the search doesn't clear them
  hidden: { name: string; values: string[] }[]
  placeholder: string
}) {
  return (
    <form method="get" className="mb-7">
      <label
        htmlFor="q"
        className="mb-2 block text-[11px] font-semibold uppercase tracking-widest text-slate-500"
      >
        Search
      </label>
      <input
        id="q"
        name="q"
        type="search"
        defaultValue={query}
        placeholder={placeholder}
        style={{ ['--tw-ring-color' as string]: 'rgba(11,92,255,0.25)' }}
        className="w-full rounded-xl border border-white/70 bg-white/70 px-3 py-2 text-sm text-slate-900 outline-none backdrop-blur focus:border-[#0B5CFF]/50 focus:bg-white/95 focus:ring-2"
      />
      {hidden.map((h) =>
        h.values.map((v) => (
          <input key={`${h.name}-${v}`} type="hidden" name={h.name} value={v} />
        ))
      )}
    </form>
  )
}

export function ClearFilters({
  show,
  basePath,
}: {
  show: boolean
  basePath: string
}) {
  if (!show) return null
  return (
    <Link
      href={basePath}
      style={{ color: BLUE }}
      className="text-[11px] font-semibold uppercase tracking-widest underline underline-offset-4"
    >
      Clear all filters
    </Link>
  )
}

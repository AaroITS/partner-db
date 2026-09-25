import { createClient, type Contract } from '@/lib/supabase/server'
import { BLUE, BLUE_DEEP, GLASS, GLASS_HOVER } from '@/lib/theme'
import {
  ClearFilters,
  Facet,
  SearchBox,
  list,
  tally,
  type Param,
} from '@/components/filters'
import { Disclaimer } from '@/app/page'

export const revalidate = 0

const BASE = '/contracts'

type Search = {
  q?: string
  buyer?: Param
  industry?: Param
}

export default async function Contracts({
  searchParams,
}: {
  searchParams: Promise<Search>
}) {
  const params = await searchParams
  const supabase = createClient()

  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .order('awarded_date', { ascending: false })

  if (error) {
    return (
      <p className="rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-800 backdrop-blur-xl">
        Could not load contracts: {error.message}
      </p>
    )
  }

  const all = (data ?? []) as Contract[]

  const pickedBuyers = list(params.buyer)
  const pickedIndustries = list(params.industry)
  const query = typeof params.q === 'string' ? params.q : ''

  const matchBuyer = (c: Contract) =>
    pickedBuyers.length === 0 ||
    (c.buyer !== null && pickedBuyers.includes(c.buyer))

  // Several industries picked means "covers all of them", as elsewhere.
  const matchIndustry = (c: Contract) =>
    pickedIndustries.every((i) => (c.industry ?? []).includes(i))

  const matchQuery = (c: Contract) =>
    !query ||
    [c.title, c.supplier, c.buyer, c.theme]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query.toLowerCase())

  const results = all.filter(
    (c) => matchBuyer(c) && matchIndustry(c) && matchQuery(c)
  )

  const buyerFacets = tally(
    all.filter((c) => matchIndustry(c) && matchQuery(c)),
    (c) => [c.buyer]
  )
  const industryFacets = tally(results, (c) => c.industry ?? [])
  for (const picked of pickedIndustries) {
    if (!industryFacets.some(([v]) => v === picked)) {
      industryFacets.push([picked, 0])
    }
  }

  // Disclosed values only — some contracts don't publish one, so the total is
  // a floor rather than a true sum, and the label says so.
  const disclosed = results.filter((c) => c.awarded_value !== null)
  const totalValue = disclosed.reduce((sum, c) => sum + (c.awarded_value ?? 0), 0)

  const hasFilters =
    Boolean(query) || pickedBuyers.length + pickedIndustries.length > 0

  return (
    <div className="grid gap-8 lg:grid-cols-[17rem_1fr] lg:items-start">
      <aside className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
        <div className={`${GLASS} p-5`}>
          <SearchBox
            query={query}
            placeholder="Title or supplier…"
            hidden={[
              { name: 'buyer', values: pickedBuyers },
              { name: 'industry', values: pickedIndustries },
            ]}
          />

          <Facet
            title="Buyer"
            param="buyer"
            values={buyerFacets}
            picked={pickedBuyers}
            params={params as Record<string, Param>}
            basePath={BASE}
          />
          <Facet
            title="Industries"
            hint="Pick several to see only contracts covering all of them"
            param="industry"
            values={industryFacets}
            picked={pickedIndustries}
            params={params as Record<string, Param>}
            basePath={BASE}
          />

          <ClearFilters show={hasFilters} basePath={BASE} />
        </div>
      </aside>

      <section>
        <div className={`${GLASS} mb-6 p-6`}>
          <h2 className="text-sm font-bold tracking-tight text-slate-900">
            Information
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            Smart mobility contracts already awarded by public buyers in
            Ontario, Quebec and the Canadian federal government. Use this to see
            which companies win work in the Canadian market, and in which
            fields.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            Smart mobility has no strict definition, so which contracts are
            included and how they are tagged reflects our judgement rather than
            an agreed standard. Data quality varies between buyers, since each
            publishes through its own platform with its own practices on what is
            recorded and disclosed.
          </p>

          <Disclaimer />
        </div>

        <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
          {results.length} of {all.length} contracts · {formatMoney(totalValue)}{' '}
          disclosed
        </p>

        {results.length === 0 ? (
          <p className={`${GLASS} p-6 text-sm text-slate-600`}>
            No contracts match every filter. Remove one to widen the search.
          </p>
        ) : (
          <ul className="space-y-4">
            {results.map((c) => (
              <li key={c.id} className={`${GLASS} ${GLASS_HOVER} p-6`}>
                <div className="flex items-start justify-between gap-4">
                  <h2 className="max-w-2xl text-base font-bold leading-snug tracking-tight text-slate-900">
                    {c.title}
                  </h2>
                  <span
                    title="Canada"
                    aria-label="Canada"
                    className="shrink-0 text-2xl leading-none"
                  >
                    🇨🇦
                  </span>
                </div>

                {c.supplier && (
                  <p
                    style={{ color: BLUE_DEEP }}
                    className="mt-2 text-sm font-semibold"
                  >
                    {c.supplier}
                  </p>
                )}

                <p className="mt-1 text-sm text-slate-600">
                  {c.buyer}
                  {c.source_id && (
                    <span className="text-slate-400"> · ref {c.source_id}</span>
                  )}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-2 border-t border-white/70 pt-4">
                  {(c.industry ?? []).map((tag) => {
                    const isPicked = pickedIndustries.includes(tag)
                    return (
                      <span
                        key={tag}
                        style={{
                          backgroundColor: isPicked ? BLUE_DEEP : BLUE,
                          boxShadow: isPicked
                            ? '0 0 0 2px rgba(255,255,255,0.85), inset 0 1px 0 rgba(255,255,255,0.30)'
                            : 'inset 0 1px 0 rgba(255,255,255,0.28)',
                        }}
                        className="rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white"
                      >
                        {tag}
                      </span>
                    )
                  })}

                  <span className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span className="text-[11px] font-semibold tabular-nums text-slate-500">
                      {formatDate(c.awarded_date)}
                    </span>
                    <span className="rounded-full border border-white/70 bg-white/80 px-3 py-1 text-[11px] font-semibold tabular-nums text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]">
                      {c.awarded_value === null
                        ? 'Not disclosed'
                        : formatMoney(c.awarded_value)}
                    </span>

                    {/* Only 184 of 217 contracts have a link, so this is
                        conditional — no dead buttons on the rest. */}
                    {c.link && (
                      <a
                        href={c.link}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: BLUE_DEEP }}
                        className="rounded-full border border-white/70 bg-white/80 px-3.5 py-1 text-[11px] font-semibold tracking-wide shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] transition-colors hover:bg-white"
                      >
                        View contract
                      </a>
                    )}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function formatDate(iso: string | null) {
  if (!iso) return 'No date'
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

// Compact money: $12.6M, $840K. Full figures would dominate the card.
function formatMoney(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`
  return `$${Math.round(n)}`
}

import {
  createClient,
  companyKey,
  type Contract,
  type Partner,
} from '@/lib/supabase/server'
import {
  BODY,
  BUTTON,
  CARD,
  CARD_HOVER,
  HAIRLINE,
  INK,
  LABEL,
  MUTED,
  TAG,
  SCROLL_PANEL,
  TAG_BORDER,
  VIOLET,
  VIOLET_TEXT,
} from '@/lib/theme'
import {
  ClearFilters,
  Facet,
  SearchBox,
  list,
  tally,
  type Param,
} from '@/components/filters'
import { ArrowOut } from '@/components/arrow'
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

  // Partners are fetched too, so a supplier name can link to its website.
  const [contractRes, partnerRes] = await Promise.all([
    supabase
      .from('contracts')
      .select('*')
      .order('awarded_date', { ascending: false }),
    supabase.from('partners').select('name, website'),
  ])

  if (contractRes.error) {
    return (
      <p className="rounded-[22px] bg-white p-5 text-sm text-red-800">
        Could not load contracts: {contractRes.error.message}
      </p>
    )
  }

  const all = (contractRes.data ?? []) as Contract[]

  // Supplier name -> that partner's website, keyed on the normalised name so
  // "MIOVISION TECHNOLOGIES INCORPORATED" finds the partner called
  // "Miovision". Exact comparison, for the reason given in server.ts.
  const siteOf = new Map<string, string>()
  for (const p of (partnerRes.data ?? []) as Pick<Partner, 'name' | 'website'>[]) {
    const key = companyKey(p.name)
    if (key && p.website) siteOf.set(key, p.website)
  }

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
    <div className="grid gap-6 lg:grid-cols-[17rem_1fr] lg:items-start">
      <aside className="lg:sticky lg:top-6">
        <div className={`${CARD} ${SCROLL_PANEL} p-5`}>
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
        <div className={`${CARD} mb-5 p-6`}>
          <h2 style={{ color: INK }} className="text-[15px] font-bold tracking-tight">
            Information
          </h2>
          <p style={{ color: BODY }} className="mt-3 text-sm leading-relaxed">
            Smart mobility contracts already awarded by public buyers in
            Ontario, Quebec and the Canadian federal government. Use this to see
            which companies win work in the Canadian market, and in which
            fields.
          </p>
          <p style={{ color: BODY }} className="mt-3 text-sm leading-relaxed">
            Smart mobility has no strict definition, so which contracts are
            included and how they are tagged reflects our judgement rather than
            an agreed standard. Data quality varies between buyers, since each
            publishes through its own platform with its own practices on what is
            recorded and disclosed.
          </p>

          <Disclaimer />
        </div>

        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#F4F3FA]/75">
          {results.length} of {all.length} contracts · {formatMoney(totalValue)}{' '}
          disclosed
        </p>

        {results.length === 0 ? (
          <p style={{ color: BODY }} className={`${CARD} p-6 text-sm`}>
            No contracts match every filter. Remove one to widen the search.
          </p>
        ) : (
          <ul className="space-y-3.5">
            {results.map((c) => (
              <li key={c.id} className={`${CARD} ${CARD_HOVER} p-6`}>
                <div className="flex items-start justify-between gap-4">
                  <h2
                    style={{ color: INK }}
                    className="max-w-2xl text-[17px] font-bold leading-snug tracking-[-0.01em]"
                  >
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

                {c.supplier &&
                  (() => {
                    // Linked only where this supplier exists as a partner
                    // with a website; otherwise it stays plain text.
                    const site = siteOf.get(companyKey(c.supplier))
                    return site ? (
                      <a
                        href={site}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: VIOLET_TEXT }}
                        className="mt-2 inline-block text-sm font-semibold underline underline-offset-4 transition-opacity hover:opacity-70"
                      >
                        {c.supplier}
                      </a>
                    ) : (
                      <p style={{ color: INK }} className="mt-2 text-sm font-semibold">
                        {c.supplier}
                      </p>
                    )
                  })()}

                <p style={{ color: MUTED }} className="mt-1 text-sm">
                  {c.buyer}
                  {c.source_id && <span> · ref {c.source_id}</span>}
                </p>

                <div
                  style={{ borderColor: HAIRLINE }}
                  className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-2 border-t pt-4"
                >
                  {(c.industry ?? []).map((tag) => {
                    const isPicked = pickedIndustries.includes(tag)
                    return (
                      <span
                        key={tag}
                        style={
                          isPicked
                            ? {
                                backgroundColor: VIOLET,
                                borderColor: VIOLET,
                                color: '#FFFFFF',
                              }
                            : { borderColor: TAG_BORDER, color: BODY }
                        }
                        className={TAG}
                      >
                        {tag}
                      </span>
                    )
                  })}

                  <span className="ml-auto flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span
                      style={{ color: MUTED }}
                      className="text-[11px] font-semibold tabular-nums"
                    >
                      {formatDate(c.awarded_date)}
                    </span>
                    <span
                      style={{ borderColor: TAG_BORDER, color: BODY }}
                      className="rounded-full border px-3 py-1 text-[11px] font-semibold tabular-nums"
                    >
                      {c.awarded_value === null
                        ? 'Not disclosed'
                        : formatMoney(c.awarded_value)}
                    </span>

                    {/* Not every contract has a link, so this is conditional —
                        no dead buttons on the rest. */}
                    {c.link && (
                      <a
                        href={c.link}
                        target="_blank"
                        rel="noreferrer"
                        style={{ borderColor: VIOLET, color: VIOLET_TEXT }}
                        className={BUTTON}
                      >
                        View contract
                        <ArrowOut />
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

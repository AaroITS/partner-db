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

export const revalidate = 0

const BASE = '/'

type Search = {
  q?: string
  country?: Param
  org?: Param
  industry?: Param
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Search>
}) {
  const params = await searchParams
  const supabase = createClient()

  // Contracts are fetched too, so a partner card can show what it has won.
  const [partnerRes, contractRes] = await Promise.all([
    supabase.from('partners').select('*').order('name'),
    supabase
      .from('contracts')
      .select('*')
      .order('awarded_date', { ascending: false }),
  ])

  if (partnerRes.error) {
    return (
      <p className="rounded-[22px] bg-white p-5 text-sm text-red-800">
        Could not load partners: {partnerRes.error.message}
      </p>
    )
  }

  const all = (partnerRes.data ?? []) as Partner[]
  const contracts = (contractRes.data ?? []) as Contract[]

  // Group contracts by normalised supplier name once, rather than scanning
  // the whole list again for every partner.
  const byCompany = new Map<string, Contract[]>()
  for (const c of contracts) {
    const key = companyKey(c.supplier)
    if (!key) continue
    const bucket = byCompany.get(key)
    if (bucket) bucket.push(c)
    else byCompany.set(key, [c])
  }

  const pickedCountries = list(params.country)
  const pickedOrgTypes = list(params.org)
  const pickedIndustries = list(params.industry)
  const query = typeof params.q === 'string' ? params.q : ''

  // A partner has one country, so picking two means "either one".
  const matchCountry = (p: Partner) =>
    pickedCountries.length === 0 ||
    (p.country !== null && pickedCountries.includes(p.country))

  const matchOrgType = (p: Partner) =>
    pickedOrgTypes.length === 0 ||
    (p.org_type !== null && pickedOrgTypes.includes(p.org_type))

  // A partner has several industries, so picking two means "does both".
  const matchIndustry = (p: Partner) =>
    pickedIndustries.every((i) => (p.industry ?? []).includes(i))

  const matchQuery = (p: Partner) =>
    !query ||
    [p.name, p.country, p.org_type, p.about, p.projects]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query.toLowerCase())

  const results = all.filter(
    (p) => matchCountry(p) && matchOrgType(p) && matchIndustry(p) && matchQuery(p)
  )

  // "Either" filters count against everything except their own dimension,
  // so each number shows what you'd get by adding that option.
  const countryFacets = tally(
    all.filter((p) => matchOrgType(p) && matchIndustry(p) && matchQuery(p)),
    (p) => [p.country]
  )
  const orgTypeFacets = tally(
    all.filter((p) => matchCountry(p) && matchIndustry(p) && matchQuery(p)),
    (p) => [p.org_type]
  )

  // The "all of them" filter only ever narrows, so counting within the
  // current results is right — and no visible option leads to a dead end.
  const industryFacets = tally(results, (p) => p.industry ?? [])
  for (const picked of pickedIndustries) {
    if (!industryFacets.some(([v]) => v === picked)) {
      industryFacets.push([picked, 0])
    }
  }

  const hasFilters =
    Boolean(query) ||
    pickedCountries.length + pickedOrgTypes.length + pickedIndustries.length > 0

  return (
    <div className="grid gap-6 lg:grid-cols-[17rem_1fr] lg:items-start">
      {/* Filters — stick in place while the right column scrolls, and scroll
          on their own once the list is taller than the screen. */}
      <aside className="lg:sticky lg:top-6">
        <div className={`${CARD} ${SCROLL_PANEL} p-5`}>
          <SearchBox
            query={query}
            placeholder="Name, description, projects…"
            hidden={[
              { name: 'country', values: pickedCountries },
              { name: 'org', values: pickedOrgTypes },
              { name: 'industry', values: pickedIndustries },
            ]}
          />

          {/* Broadest filter first, narrowing down to the most specific. */}
          <Facet
            title="Country"
            param="country"
            values={countryFacets}
            picked={pickedCountries}
            params={params as Record<string, Param>}
            basePath={BASE}
          />
          <Facet
            title="Type of organisation"
            param="org"
            values={orgTypeFacets}
            picked={pickedOrgTypes}
            params={params as Record<string, Param>}
            basePath={BASE}
          />
          <Facet
            title="Industries"
            hint="Pick several to see only partners covering all of them"
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
            This database can be used to locate business partners in JASMEX
            project&apos;s target markets: Canada &amp; Türkiye.
          </p>
          <p style={{ color: BODY }} className="mt-3 text-sm leading-relaxed">
            JASMEX is carried out in collaboration by ITS Finland, ITL Estonia,
            and Linköping Science Park, aimed at supporting the export of SMEs
            in particular to the smart transport and smart city markets in
            Canada and Turkey. The project is funded by the European
            Union&apos;s Interreg programme and runs for 36 months until 2029.
          </p>

          <Disclaimer />
        </div>

        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#F4F3FA]/75">
          {results.length} of {all.length} partners
        </p>

        {results.length === 0 ? (
          <p style={{ color: BODY }} className={`${CARD} p-6 text-sm`}>
            No partners match every filter. Remove one to widen the search.
          </p>
        ) : (
          <ul className="space-y-3.5">
            {results.map((p) => {
              const won = byCompany.get(companyKey(p.name)) ?? []

              return (
                <li key={p.id} className={`${CARD} ${CARD_HOVER} p-6`}>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h2
                      style={{ color: INK }}
                      className="text-[17px] font-bold tracking-[-0.01em]"
                    >
                      {p.name}
                    </h2>
                    {p.country && (
                      <span style={{ color: MUTED }} className="text-sm">
                        {p.country}
                      </span>
                    )}
                  </div>

                  {p.org_type && (
                    <p
                      style={{ color: LABEL }}
                      className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.1em]"
                    >
                      {p.org_type}
                    </p>
                  )}

                  {p.about && (
                    <p
                      style={{ color: BODY }}
                      className="mt-3 max-w-2xl text-sm leading-relaxed"
                    >
                      {p.about}
                    </p>
                  )}

                  {p.projects && (
                    <div
                      style={{ borderColor: HAIRLINE }}
                      className="mt-4 max-w-2xl rounded-xl border bg-[#FAFAFD] px-4 py-3"
                    >
                      <h3
                        style={{ color: LABEL }}
                        className="text-[11px] font-semibold uppercase tracking-[0.1em]"
                      >
                        Projects
                      </h3>
                      <p style={{ color: BODY }} className="mt-1 text-sm leading-relaxed">
                        {p.projects}
                      </p>
                    </div>
                  )}

                  {(p.industry?.length || p.website) && (
                    <div
                      style={{ borderColor: HAIRLINE }}
                      className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-2 border-t pt-4"
                    >
                      {/* Outlined tags. A currently-filtered one fills violet
                          so you can see which put this partner in the results. */}
                      {(p.industry ?? []).map((tag) => {
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

                      {p.website && (
                        <a
                          href={p.website}
                          target="_blank"
                          rel="noreferrer"
                          style={{ borderColor: VIOLET, color: VIOLET_TEXT }}
                          className={`ml-auto ${BUTTON}`}
                        >
                          Website
                        <ArrowOut />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Only shown when this partner appears in the contracts
                      data. Plain <details> — no JavaScript needed. */}
                  {won.length > 0 && (
                    <details
                      style={{ borderColor: TAG_BORDER }}
                      className="group mt-4 overflow-hidden rounded-xl border"
                    >
                      <summary
                        style={{ color: BODY, borderColor: TAG_BORDER }}
                        className="cursor-pointer list-none px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-[#F3F0FD] group-open:border-b"
                      >
                        <span className="inline-block w-4 transition-transform group-open:rotate-90">
                          ›
                        </span>
                        See contracts won in Canada
                        <span style={{ color: MUTED }} className="ml-1 font-normal">
                          ({won.length})
                        </span>
                      </summary>

                      <ul style={{ borderColor: HAIRLINE }} className="divide-y bg-[#FAFAFD]">
                        {won.map((c) => (
                          <li key={c.id} className="px-4 py-3">
                            {/* The title is the link where the buyer published
                                one; the rest stay as plain text. */}
                            {c.link ? (
                              <a
                                href={c.link}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: VIOLET_TEXT }}
                                className="text-sm font-semibold leading-snug underline underline-offset-4 transition-opacity hover:opacity-70"
                              >
                                {c.title}
                              </a>
                            ) : (
                              <p
                                style={{ color: INK }}
                                className="text-sm font-semibold leading-snug"
                              >
                                {c.title}
                              </p>
                            )}
                            <p
                              style={{ color: MUTED }}
                              className="mt-1 flex flex-wrap items-baseline gap-x-2 text-[11px]"
                            >
                              <span>{c.buyer}</span>
                              <span>·</span>
                              <span className="tabular-nums">
                                {formatDate(c.awarded_date)}
                              </span>
                              <span>·</span>
                              <span
                                style={{ color: BODY }}
                                className="font-semibold tabular-nums"
                              >
                                {c.awarded_value === null
                                  ? 'Not disclosed'
                                  : formatMoney(c.awarded_value)}
                              </span>
                            </p>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </li>
              )
            })}
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

// Compact money: $12.6M, $840K. Full figures would dominate the row.
function formatMoney(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`
  return `$${Math.round(n)}`
}

// Shown on all three pages. Collapsed by default so it doesn't crowd out the
// content above it, but still one click away.
export function Disclaimer() {
  return (
    <details
      style={{ borderColor: HAIRLINE }}
      className="group mt-4 border-t pt-3"
    >
      <summary
        style={{ color: LABEL }}
        className="cursor-pointer list-none text-xs font-semibold transition-colors hover:text-[#15131F]"
      >
        <span className="inline-block w-3 transition-transform group-open:rotate-90">
          ›
        </span>
        Disclaimer
      </summary>
      <p style={{ color: LABEL }} className="mt-2 pl-3 text-xs leading-relaxed">
        All information on this site is collected from publicly available
        sources and provided for general guidance only. ITS Finland and the
        JASMEX project partners accept no liability for its accuracy or for any
        action taken based on it. Always verify deadlines and tender details
        against the original source.
      </p>
    </details>
  )
}

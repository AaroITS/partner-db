import { createClient, type Partner } from '@/lib/supabase/server'
import { BLUE_DEEP, GLASS, GLASS_HOVER, BLUE } from '@/lib/theme'
import {
  ClearFilters,
  Facet,
  SearchBox,
  list,
  tally,
  type Param,
} from '@/components/filters'

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

  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .order('name')

  if (error) {
    return (
      <p className="rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-800 backdrop-blur-xl">
        Could not load partners: {error.message}
      </p>
    )
  }

  const all = (data ?? []) as Partner[]

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
    <div className="grid gap-8 lg:grid-cols-[17rem_1fr] lg:items-start">
      {/* Filters — stick in place while the right column scrolls, and scroll
          on their own once the list is taller than the screen. */}
      <aside className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
        <div className={`${GLASS} p-5`}>
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
        {/* Information — same glass panel as the cards below it. */}
        <div className={`${GLASS} mb-6 p-6`}>
          <h2 className="text-sm font-bold tracking-tight text-slate-900">
            Information
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            This database can be used to locate business partners in JASMEX
            project&apos;s target markets: Canada &amp; Türkiye.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            JASMEX is carried out in collaboration by ITS Finland, ITL Estonia,
            and Linköping Science Park, aimed at supporting the export of SMEs
            in particular to the smart transport and smart city markets in
            Canada and Turkey. The project is funded by the European
            Union&apos;s Interreg programme and runs for 36 months until 2029.
          </p>

          <Disclaimer />
        </div>

        <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
          {results.length} of {all.length} partners
        </p>

        {results.length === 0 ? (
          <p className={`${GLASS} p-6 text-sm text-slate-600`}>
            No partners match every filter. Remove one to widen the search.
          </p>
        ) : (
          <ul className="space-y-4">
            {results.map((p) => (
              <li key={p.id} className={`${GLASS} ${GLASS_HOVER} p-6`}>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h2 className="text-base font-bold tracking-tight text-slate-900">
                    {p.name}
                  </h2>
                  {p.country && (
                    <span className="text-sm text-slate-500">{p.country}</span>
                  )}
                </div>

                {p.org_type && (
                  <p
                    style={{ color: BLUE_DEEP }}
                    className="mt-1.5 text-[11px] font-semibold uppercase tracking-widest"
                  >
                    {p.org_type}
                  </p>
                )}

                {p.about && (
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-700">
                    {p.about}
                  </p>
                )}

                {p.projects && (
                  <div className="mt-4 max-w-2xl rounded-xl border border-white/60 bg-white/45 px-4 py-3">
                    <h3 className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
                      Projects
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                      {p.projects}
                    </p>
                  </div>
                )}

                {(p.industry?.length || p.website) && (
                  <div className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-2 border-t border-white/70 pt-4">
                    {/* A currently-filtered industry goes darker with a white
                        halo, so you can see which pills put this partner in
                        the results. */}
                    {(p.industry ?? []).map((tag) => {
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

                    {p.website && (
                      <a
                        href={p.website}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: BLUE_DEEP }}
                        className="ml-auto rounded-full border border-white/70 bg-white/80 px-3.5 py-1 text-[11px] font-semibold tracking-wide shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] transition-colors hover:bg-white"
                      >
                        Website
                      </a>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

// Shown on both pages. Collapsed by default so it doesn't crowd out the
// content above it, but still one click away.
export function Disclaimer() {
  return (
    <details className="group mt-4 border-t border-white/70 pt-3">
      <summary className="cursor-pointer list-none text-xs font-semibold text-slate-500 transition-colors hover:text-slate-700">
        <span className="inline-block w-3 transition-transform group-open:rotate-90">
          ›
        </span>
        Disclaimer
      </summary>
      <p className="mt-2 pl-3 text-xs leading-relaxed text-slate-500">
        All information on this site is collected from publicly available
        sources and provided for general guidance only. ITS Finland and the
        JASMEX project partners accept no liability for its accuracy or for any
        action taken based on it. Always verify deadlines and tender details
        against the original source.
      </p>
    </details>
  )
}
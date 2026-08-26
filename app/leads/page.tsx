import { createClient, type Partner, type Tender } from '@/lib/supabase/server'
import { BLUE_DEEP, GLASS, GLASS_NO_BORDER, GREEN, RED } from '@/lib/theme'
import {
  ClearFilters,
  Facet,
  SearchBox,
  list,
  tally,
  type Param,
} from '@/components/filters'
import { Disclaimer } from '@/app/page'

// Never cache: the green/red deadline state depends on today's date, so a
// cached page would eventually show a stale colour.
export const dynamic = 'force-dynamic'
export const revalidate = 0

const BASE = '/leads'

// Regional-indicator pairs. Any country without an entry falls back to its
// name, so adding a market later degrades gracefully rather than breaking.
const FLAGS: Record<string, string> = {
  Canada: '🇨🇦',
  Türkiye: '🇹🇷',
  Turkey: '🇹🇷',
}

function flag(country: string | null) {
  if (!country) return null
  return FLAGS[country] ?? country
}

type Search = {
  q?: string
  country?: Param
  industry?: Param
}

export default async function Leads({
  searchParams,
}: {
  searchParams: Promise<Search>
}) {
  const params = await searchParams
  const supabase = createClient()

  // Partners are fetched too, for the "possible partners" accordion.
  const [tenderRes, partnerRes] = await Promise.all([
    supabase.from('tenders').select('*').order('deadline'),
    supabase.from('partners').select('*').order('name'),
  ])

  if (tenderRes.error) {
    return (
      <p className="rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-800 backdrop-blur-xl">
        Could not load leads: {tenderRes.error.message}
      </p>
    )
  }

  const all = (tenderRes.data ?? []) as Tender[]
  const partners = (partnerRes.data ?? []) as Partner[]

  const pickedCountries = list(params.country)
  const pickedIndustries = list(params.industry)
  const query = typeof params.q === 'string' ? params.q : ''

  // Compared as YYYY-MM-DD strings, which sort correctly and sidestep
  // timezone drift entirely.
  const today = new Date().toISOString().slice(0, 10)

  const matchCountry = (t: Tender) =>
    pickedCountries.length === 0 ||
    (t.country !== null && pickedCountries.includes(t.country))

  // Several industries picked means "covers all of them", as on partners.
  const matchIndustry = (t: Tender) =>
    pickedIndustries.every((i) => (t.industry ?? []).includes(i))

  const matchQuery = (t: Tender) =>
    !query ||
    [t.title, t.organisation, t.country]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(query.toLowerCase())

  const results = all.filter(
    (t) => matchCountry(t) && matchIndustry(t) && matchQuery(t)
  )

  const countryFacets = tally(
    all.filter((t) => matchIndustry(t) && matchQuery(t)),
    (t) => [t.country]
  )
  const industryFacets = tally(results, (t) => t.industry ?? [])
  for (const picked of pickedIndustries) {
    if (!industryFacets.some(([v]) => v === picked)) {
      industryFacets.push([picked, 0])
    }
  }

  const openCount = results.filter(
    (t) => t.deadline !== null && t.deadline >= today
  ).length

  const hasFilters =
    Boolean(query) || pickedCountries.length + pickedIndustries.length > 0

  return (
    <div className="grid gap-8 lg:grid-cols-[17rem_1fr] lg:items-start">
      <aside className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
        <div className={`${GLASS} p-5`}>
          <SearchBox
            query={query}
            placeholder="Title or organisation…"
            hidden={[
              { name: 'country', values: pickedCountries },
              { name: 'industry', values: pickedIndustries },
            ]}
          />

          <Facet
            title="Country"
            param="country"
            values={countryFacets}
            picked={pickedCountries}
            params={params as Record<string, Param>}
            basePath={BASE}
          />
          <Facet
            title="Industries"
            hint="Pick several to see only leads covering all of them"
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
            This is a database of business opportunities in the JASMEX target
            markets, Canada and Türkiye. A green border means the deadline is
            still ahead; red means it has passed. Expand a lead to see possible
            partners from the same country operating in relevant industries.
          </p>

          <Disclaimer />
        </div>

        <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
          {results.length} of {all.length} leads · {openCount} still open
        </p>

        {results.length === 0 ? (
          <p className={`${GLASS} p-6 text-sm text-slate-600`}>
            No leads match every filter. Remove one to widen the search.
          </p>
        ) : (
          <ul className="space-y-4">
            {results.map((t) => {
              const isOpen = t.deadline !== null && t.deadline >= today
              const edge = isOpen ? GREEN : RED

              // Same country, and at least one industry in common.
              const suggested = partners.filter(
                (p) =>
                  p.country === t.country &&
                  (p.industry ?? []).some((i) => (t.industry ?? []).includes(i))
              )

              return (
                <li
                  key={t.id}
                  style={{ border: `2px solid ${edge}` }}
                  className={`${GLASS_NO_BORDER} p-6`}
                >
                  {/* Flag sits in the card's top-right corner. The title
                      reserves space for it so long titles don't run underneath. */}
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="max-w-2xl text-base font-bold leading-snug tracking-tight text-slate-900">
                      {t.title}
                    </h2>
                    {t.country && (
                      <span
                        title={t.country}
                        aria-label={t.country}
                        className="shrink-0 text-2xl leading-none"
                      >
                        {flag(t.country)}
                      </span>
                    )}
                  </div>

                  {t.organisation && (
                    <p className="mt-2 text-sm text-slate-600">
                      {t.organisation}
                    </p>
                  )}

                  {/* Deadline and action, pushed right. The border colour
                      already says whether it's open, so no label is needed. */}
                  <div className="mt-5 flex flex-wrap items-center justify-end gap-x-3 gap-y-2 border-t border-white/70 pt-4">
                    <span
                      style={{ backgroundColor: edge }}
                      className="rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]"
                    >
                      {formatDate(t.deadline)}
                    </span>

                    {t.link && (
                      <a
                        href={t.link}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: BLUE_DEEP }}
                        className="rounded-full border border-white/70 bg-white/80 px-3.5 py-1 text-[11px] font-semibold tracking-wide shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] transition-colors hover:bg-white"
                      >
                        View opportunity
                      </a>
                    )}
                  </div>

                  {/* Plain <details> — no JavaScript needed for the accordion. */}
                  <details className="group mt-4">
                    <summary className="cursor-pointer list-none rounded-xl border border-[#9ec1f5] bg-white/60 px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-white/85">
                      <span className="inline-block w-4 transition-transform group-open:rotate-90">
                        ›
                      </span>
                      Partners you could talk to
                      <span className="ml-1 font-normal text-slate-400">
                        ({suggested.length})
                      </span>
                    </summary>

                    {suggested.length === 0 ? (
                      <p className="px-4 pt-3 text-sm text-slate-500">
                        No partners in {t.country ?? 'this country'} currently
                        list any of these industries.
                      </p>
                    ) : (
                      <ul className="mt-3 space-y-2">
                        {suggested.map((p) => (
                          <li
                            key={p.id}
                            // Light blue edge so the row separates from the
                            // translucent card behind it.
                            className="rounded-xl border border-[#9ec1f5] bg-white/60 px-4 py-3"
                          >
                            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                              <span className="text-sm font-semibold text-slate-900">
                                {p.name}
                              </span>
                              {p.website && (
                                <a
                                  href={p.website}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ color: BLUE_DEEP }}
                                  className="text-[11px] font-semibold underline underline-offset-4"
                                >
                                  Website
                                </a>
                              )}
                            </div>
                            {p.about && (
                              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                                {p.about}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </details>
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
  if (!iso) return 'No deadline'
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

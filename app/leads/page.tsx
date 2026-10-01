import { createClient, type Partner, type Tender } from '@/lib/supabase/server'
import {
  BODY,
  BUTTON,
  CARD,
  GREEN,
  HAIRLINE,
  INK,
  LABEL,
  MUTED,
  RED,
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
      <p className="rounded-[22px] bg-white p-5 text-sm text-red-800">
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

  const results = all
    .filter((t) => matchCountry(t) && matchIndustry(t) && matchQuery(t))
    .sort((a, b) => {
      const aOpen = a.deadline !== null && a.deadline >= today
      const bOpen = b.deadline !== null && b.deadline >= today

      // Open leads first.
      if (aOpen !== bOpen) return aOpen ? -1 : 1

      // Within open leads, soonest deadline first — those need attention now.
      // Within expired ones, most recent first, since old ones matter least.
      if (a.deadline === null) return 1
      if (b.deadline === null) return -1
      return aOpen
        ? a.deadline.localeCompare(b.deadline)
        : b.deadline.localeCompare(a.deadline)
    })

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
    <div className="grid gap-6 lg:grid-cols-[17rem_1fr] lg:items-start">
      <aside className="lg:sticky lg:top-6">
        <div className={`${CARD} ${SCROLL_PANEL} p-5`}>
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
        <div className={`${CARD} mb-5 p-6`}>
          <h2 style={{ color: INK }} className="text-[15px] font-bold tracking-tight">
            Information
          </h2>
          <p style={{ color: BODY }} className="mt-3 text-sm leading-relaxed">
            This is a database of business opportunities in the JASMEX target
            markets, Canada and Türkiye. A green border means the deadline is
            still ahead; red means it has passed. Expand a lead to see possible
            partners from the same country operating in relevant industries.
          </p>

          <Disclaimer />
        </div>

        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#F4F3FA]/75">
          {results.length} of {all.length} leads · {openCount} still open
        </p>

        {results.length === 0 ? (
          <p style={{ color: BODY }} className={`${CARD} p-6 text-sm`}>
            No leads match every filter. Remove one to widen the search.
          </p>
        ) : (
          <ul className="space-y-3.5">
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
                  style={{ border: `3px solid ${edge}` }}
                  className={`${CARD} p-6`}
                >
                  {/* Flag sits in the card's top-right corner. The title
                      reserves space for it so long titles don't run underneath. */}
                  <div className="flex items-start justify-between gap-4">
                    <h2
                      style={{ color: INK }}
                      className="max-w-2xl text-[17px] font-bold leading-snug tracking-[-0.01em]"
                    >
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
                    <p style={{ color: MUTED }} className="mt-2 text-sm">
                      {t.organisation}
                    </p>
                  )}

                  {/* Deadline and action, pushed right. The border colour
                      already says whether it's open, so no label is needed. */}
                  <div
                    style={{ borderColor: HAIRLINE }}
                    className="mt-5 flex flex-wrap items-center justify-end gap-x-3 gap-y-2 border-t pt-4"
                  >
                    <span
                      style={{ backgroundColor: edge }}
                      className="rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide text-white"
                    >
                      {formatDate(t.deadline)}
                    </span>

                    {t.link && (
                      <a
                        href={t.link}
                        target="_blank"
                        rel="noreferrer"
                        style={{ borderColor: VIOLET, color: VIOLET_TEXT }}
                        className={BUTTON}
                      >
                        View opportunity
                        <ArrowOut />
                      </a>
                    )}
                  </div>

                  {/* Plain <details> — no JavaScript needed for the accordion. */}
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
                      Partners you could talk to
                      <span style={{ color: MUTED }} className="ml-1 font-normal">
                        ({suggested.length})
                      </span>
                    </summary>

                    {suggested.length === 0 ? (
                      <p
                        style={{ color: LABEL }}
                        className="bg-[#FAFAFD] px-4 py-3 text-sm"
                      >
                        No partners in {t.country ?? 'this country'} currently
                        list any of these industries.
                      </p>
                    ) : (
                      <ul
                        style={{ borderColor: HAIRLINE }}
                        className="divide-y bg-[#FAFAFD]"
                      >
                        {suggested.map((p) => (
                          <li key={p.id} className="px-4 py-3">
                            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                              <span
                                style={{ color: INK }}
                                className="text-sm font-semibold"
                              >
                                {p.name}
                              </span>
                              {p.website && (
                                <a
                                  href={p.website}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ color: VIOLET_TEXT }}
                                  className="text-[11px] font-semibold underline underline-offset-4"
                                >
                                  Website
                                </a>
                              )}
                            </div>
                            {p.about && (
                              <p
                                style={{ color: BODY }}
                                className="mt-1.5 text-sm leading-relaxed"
                              >
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

import { createClient, type Partner, type Tender } from "@/lib/supabase/server";
import {
  ACCENT,
  ACCENT_TEXT,
  ACCENT_WASH,
  BODY,
  BORDER,
  BUTTON,
  CARD,
  GREEN,
  INK,
  MUTED,
  RED,
  SCROLL_PANEL,
  TAG,
} from "@/lib/theme";
import {
  ClearFilters,
  Facet,
  SearchBox,
  list,
  tally,
  type Param,
} from "@/components/filters";
import { ArrowOut } from "@/components/arrow";
import {
  About,
  CardTitle,
  EmptyState,
  ErrorState,
} from "@/components/page-parts";
import { formatDate } from "@/lib/format";

// Never cache: the open/closed state depends on today's date, so a cached
// page would eventually be wrong.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const BASE = "/leads";

type Search = {
  q?: string;
  country?: Param;
  industry?: Param;
};

export default async function Leads({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const supabase = createClient();

  // Partners are fetched too, for the suggested-partners accordion.
  const [tenderRes, partnerRes] = await Promise.all([
    supabase.from("tenders").select("*").order("deadline"),
    supabase.from("partners").select("*").order("name"),
  ]);

  if (tenderRes.error) {
    return (
      <ErrorState
        message={`Could not load leads: ${tenderRes.error.message}`}
      />
    );
  }

  const all = (tenderRes.data ?? []) as Tender[];
  const partners = (partnerRes.data ?? []) as Partner[];

  const pickedCountries = list(params.country);
  const pickedIndustries = list(params.industry);
  const query = typeof params.q === "string" ? params.q : "";

  // Compared as YYYY-MM-DD strings, which sort correctly and sidestep
  // timezone drift entirely.
  const today = new Date().toISOString().slice(0, 10);

  const matchCountry = (t: Tender) =>
    pickedCountries.length === 0 ||
    (t.country !== null && pickedCountries.includes(t.country));

  const matchIndustry = (t: Tender) =>
    pickedIndustries.every((i) => (t.industry ?? []).includes(i));

  const matchQuery = (t: Tender) =>
    !query ||
    [t.title, t.organisation, t.country]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase());

  const results = all
    .filter((t) => matchCountry(t) && matchIndustry(t) && matchQuery(t))
    .sort((a, b) => {
      const aOpen = a.deadline !== null && a.deadline >= today;
      const bOpen = b.deadline !== null && b.deadline >= today;

      // Open leads first.
      if (aOpen !== bOpen) return aOpen ? -1 : 1;

      // Within open leads, soonest deadline first — those need attention now.
      // Within expired ones, most recent first, since old ones matter least.
      if (a.deadline === null) return 1;
      if (b.deadline === null) return -1;
      return aOpen
        ? a.deadline.localeCompare(b.deadline)
        : b.deadline.localeCompare(a.deadline);
    });

  const countryFacets = tally(
    all.filter((t) => matchIndustry(t) && matchQuery(t)),
    (t) => [t.country],
  );
  const industryFacets = tally(results, (t) => t.industry ?? []);
  for (const picked of pickedIndustries) {
    if (!industryFacets.some(([v]) => v === picked)) {
      industryFacets.push([picked, 0]);
    }
  }

  const openCount = results.filter(
    (t) => t.deadline !== null && t.deadline >= today,
  ).length;

  const hasFilters =
    Boolean(query) || pickedCountries.length + pickedIndustries.length > 0;

  return (
    <div className="grid gap-5 lg:grid-cols-[15rem_1fr] lg:items-start">
      <aside className="lg:sticky lg:top-5">
        <div
          style={{ borderColor: BORDER }}
          className={`${CARD} ${SCROLL_PANEL}`}
        >
          <SearchBox
            query={query}
            placeholder="Search leads"
            hidden={[
              { name: "country", values: pickedCountries },
              { name: "industry", values: pickedIndustries },
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
            hint="Pick several to see leads covering all of them"
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
        <About
          label="About these leads"
          meta={
            results.length === all.length
              ? `${all.length} leads · ${openCount} open`
              : `${results.length} of ${all.length} leads · ${openCount} open`
          }
        >
          <p>
            This is a database of business opportunities in the JASMEX target
            markets, Canada and Türkiye. Open leads are listed first and marked
            green; closed ones are marked red. Expand a lead to see possible
            partners from the same country operating in relevant industries.
          </p>
        </About>

        {results.length === 0 ? (
          <EmptyState>
            No leads match every filter. Remove one to widen the search.
          </EmptyState>
        ) : (
          <ul className="space-y-2.5">
            {results.map((t) => {
              const isOpen = t.deadline !== null && t.deadline >= today;
              const edge = isOpen ? GREEN : RED;

              // Same country, and at least one industry in common.
              const suggested = partners.filter(
                (p) =>
                  p.country === t.country &&
                  (p.industry ?? []).some((i) =>
                    (t.industry ?? []).includes(i),
                  ),
              );

              return (
                <li
                  key={t.id}
                  style={{
                    borderColor: BORDER,
                    borderLeft: `3px solid ${edge}`,
                  }}
                  className={`${CARD} px-4 py-3.5`}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <CardTitle>{t.title}</CardTitle>
                    {/* The date carries the status in words as well as colour,
                        so it doesn't rely on colour alone. */}
                    <span
                      style={{ color: edge }}
                      className="shrink-0 text-[12px] font-semibold tabular-nums"
                    >
                      {isOpen ? "Closes" : "Closed"} {formatDate(t.deadline)}
                    </span>
                  </div>

                  <p style={{ color: MUTED }} className="mt-0.5 text-[12px]">
                    {t.organisation}
                    {t.country && <span> · {t.country}</span>}
                  </p>

                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    {(t.industry ?? []).map((tag) => {
                      const isPicked = pickedIndustries.includes(tag);
                      return (
                        <span
                          key={tag}
                          style={
                            isPicked
                              ? {
                                  backgroundColor: ACCENT_WASH,
                                  borderColor: ACCENT,
                                  color: ACCENT_TEXT,
                                }
                              : { borderColor: BORDER, color: MUTED }
                          }
                          className={TAG}
                        >
                          {tag}
                        </span>
                      );
                    })}
                  </div>

                  {/* The accordion toggle and the action share one row. The
                      link is a sibling of <details>, not a child of
                      <summary> — nested inside, clicking it would toggle the
                      accordion as well as follow the link. */}
                  <div className="relative mt-2.5">
                    {t.link && (
                      <a
                        href={t.link}
                        target="_blank"
                        rel="noreferrer"
                        style={{ borderColor: BORDER, color: ACCENT_TEXT }}
                        className={`absolute right-0 top-0 ${BUTTON} hover:bg-[#F0F0FE]`}
                      >
                        View opportunity
                        <ArrowOut />
                      </a>
                    )}

                    <details className="group">
                      {/* Near-black rather than the accent: the card already
                          carries a status colour, a link and a button, and a
                          fourth coloured element made it noisy. */}
                      <summary
                        style={{ color: INK }}
                        className="inline-flex cursor-pointer list-none items-center py-1 pr-32 text-[12px] font-semibold hover:underline"
                      >
                        <span className="mr-1 inline-block transition-transform group-open:rotate-90">
                          ›
                        </span>
                        Partners you could talk to ({suggested.length})
                      </summary>

                      {suggested.length === 0 ? (
                        <p
                          style={{ color: MUTED }}
                          className="mt-2 text-[12px]"
                        >
                          No partners in {t.country ?? "this country"} currently
                          list any of these industries.
                        </p>
                      ) : (
                        <ul
                          style={{ borderColor: BORDER }}
                          className="mt-2 divide-y border-t"
                        >
                          {suggested.map((p) => (
                            <li key={p.id} className="py-2">
                              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                                <span
                                  style={{ color: INK }}
                                  className="text-[13px] font-medium"
                                >
                                  {p.name}
                                </span>
                                {p.website && (
                                  <a
                                    href={p.website}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ color: ACCENT_TEXT }}
                                    className="text-[11px] font-semibold hover:underline"
                                  >
                                    Website
                                  </a>
                                )}
                              </div>
                              {p.about && (
                                <p
                                  style={{ color: BODY }}
                                  className="mt-0.5 text-[12px] leading-relaxed"
                                >
                                  {p.about}
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </details>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

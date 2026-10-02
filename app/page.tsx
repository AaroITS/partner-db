import {
  createClient,
  companyKey,
  type Contract,
  type Partner,
} from "@/lib/supabase/server";
import {
  ACCENT,
  ACCENT_TEXT,
  ACCENT_WASH,
  BODY,
  BORDER,
  BUTTON,
  CARD,
  INK,
  MUTED,
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
import { formatDate, formatMoney } from "@/lib/format";
import {
  About,
  CardTitle,
  EmptyState,
  ErrorState,
  GroupHeading,
} from "@/components/page-parts";

export const revalidate = 0;

const BASE = "/";

type Search = {
  q?: string;
  country?: Param;
  org?: Param;
  industry?: Param;
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const supabase = createClient();

  // Contracts are fetched too, so a partner card can show what it has won.
  const [partnerRes, contractRes] = await Promise.all([
    supabase.from("partners").select("*").order("name"),
    supabase
      .from("contracts")
      .select("*")
      .order("awarded_date", { ascending: false }),
  ]);

  if (partnerRes.error) {
    return (
      <ErrorState
        message={`Could not load partners: ${partnerRes.error.message}`}
      />
    );
  }

  const all = (partnerRes.data ?? []) as Partner[];
  const contracts = (contractRes.data ?? []) as Contract[];

  // Group contracts by normalised supplier name once, rather than scanning
  // the whole list again for every partner.
  const byCompany = new Map<string, Contract[]>();
  for (const c of contracts) {
    const key = companyKey(c.supplier);
    if (!key) continue;
    const bucket = byCompany.get(key);
    if (bucket) bucket.push(c);
    else byCompany.set(key, [c]);
  }

  const pickedCountries = list(params.country);
  const pickedOrgTypes = list(params.org);
  const pickedIndustries = list(params.industry);
  const query = typeof params.q === "string" ? params.q : "";

  // A partner has one country, so picking two means "either one".
  const matchCountry = (p: Partner) =>
    pickedCountries.length === 0 ||
    (p.country !== null && pickedCountries.includes(p.country));

  const matchOrgType = (p: Partner) =>
    pickedOrgTypes.length === 0 ||
    (p.org_type !== null && pickedOrgTypes.includes(p.org_type));

  // A partner has several industries, so picking two means "does both".
  const matchIndustry = (p: Partner) =>
    pickedIndustries.every((i) => (p.industry ?? []).includes(i));

  const matchQuery = (p: Partner) =>
    !query ||
    [p.name, p.country, p.org_type, p.about, p.projects]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase());

  const results = all.filter(
    (p) =>
      matchCountry(p) && matchOrgType(p) && matchIndustry(p) && matchQuery(p),
  );

  // "Either" filters count against everything except their own dimension,
  // so each number shows what you'd get by adding that option.
  const countryFacets = tally(
    all.filter((p) => matchOrgType(p) && matchIndustry(p) && matchQuery(p)),
    (p) => [p.country],
  );
  const orgTypeFacets = tally(
    all.filter((p) => matchCountry(p) && matchIndustry(p) && matchQuery(p)),
    (p) => [p.org_type],
  );

  // The "all of them" filter only ever narrows, so counting within the
  // current results is right — and no visible option leads to a dead end.
  const industryFacets = tally(results, (p) => p.industry ?? []);
  for (const picked of pickedIndustries) {
    if (!industryFacets.some(([v]) => v === picked)) {
      industryFacets.push([picked, 0]);
    }
  }

  const hasFilters =
    Boolean(query) ||
    pickedCountries.length + pickedOrgTypes.length + pickedIndustries.length >
      0;

  /* Grouped by country, largest group first, so the country is stated once
     above a block instead of repeated on every card. Partners with no country
     fall into a final group rather than disappearing. */
  const groups = new Map<string, Partner[]>();
  for (const p of results) {
    const key = p.country ?? "Other";
    const bucket = groups.get(key);
    if (bucket) bucket.push(p);
    else groups.set(key, [p]);
  }
  const grouped = [...groups.entries()].sort(
    (a, b) => b[1].length - a[1].length,
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[15rem_1fr] lg:items-start">
      <aside className="lg:sticky lg:top-5">
        <div
          style={{ borderColor: BORDER }}
          className={`${CARD} ${SCROLL_PANEL}`}
        >
          <SearchBox
            query={query}
            placeholder="Search partners"
            hidden={[
              { name: "country", values: pickedCountries },
              { name: "org", values: pickedOrgTypes },
              { name: "industry", values: pickedIndustries },
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
            hint="Pick several to see partners covering all of them"
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
          meta={
            results.length === all.length
              ? `${all.length} partners`
              : `${results.length} of ${all.length} partners`
          }
        >
          <p>
            This database can be used to locate business partners in JASMEX
            project&apos;s target markets: Canada and Türkiye.
          </p>
          <p>
            JASMEX is carried out in collaboration by ITS Finland, ITL Estonia,
            and Linköping Science Park, aimed at supporting the export of SMEs
            in particular to the smart transport and smart city markets in
            Canada and Turkey. The project is funded by the European
            Union&apos;s Interreg programme and runs for 36 months until 2029.
          </p>
        </About>

        {results.length === 0 ? (
          <EmptyState>
            No partners match every filter. Remove one to widen the search.
          </EmptyState>
        ) : (
          <div className="space-y-5">
            {grouped.map(([country, members]) => (
              <div key={country}>
                {/* Hidden when everything is one country — a single heading
                    over the whole list tells you nothing. */}
                {grouped.length > 1 && (
                  <GroupHeading label={country} count={members.length} />
                )}

                <ul className="space-y-2.5">
                  {members.map((p) => {
                    const won = byCompany.get(companyKey(p.name)) ?? [];

                    return (
                      <li
                        key={p.id}
                        style={{ borderColor: BORDER }}
                        className={`${CARD} px-4 py-3.5`}
                      >
                        {/* Name left, Website button right on the same line: it's
                      the action people take from a partner card, so it sits
                      where the eye lands first. */}
                        <div className="flex items-start justify-between gap-3">
                          <CardTitle>{p.name}</CardTitle>

                          {p.website && (
                            <a
                              href={p.website}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                borderColor: BORDER,
                                color: ACCENT_TEXT,
                              }}
                              className={`shrink-0 ${BUTTON} hover:bg-[#F0F0FE]`}
                            >
                              Website
                              <ArrowOut />
                            </a>
                          )}
                        </div>

                        {/* Sentence case, not uppercase: these values are phrases,
                      and uppercase phrases are slow to read. */}
                        {p.org_type && (
                          <p
                            style={{ color: MUTED }}
                            className="mt-0.5 text-[12px]"
                          >
                            {p.org_type}
                          </p>
                        )}

                        {p.about && (
                          <p
                            style={{ color: BODY }}
                            className="mt-2 max-w-3xl text-[13px] leading-relaxed"
                          >
                            {p.about}
                          </p>
                        )}

                        {p.projects && (
                          <p
                            style={{ color: MUTED }}
                            className="mt-1.5 max-w-3xl text-[12px] leading-relaxed"
                          >
                            <span className="font-semibold">Projects: </span>
                            {p.projects}
                          </p>
                        )}

                        {Boolean(p.industry?.length) && (
                          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                            {(p.industry ?? []).map((tag) => {
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
                        )}

                        {/* Only shown when this partner appears in the contracts
                      data. Plain <details> — no JavaScript needed. */}
                        {won.length > 0 && (
                          <details className="group mt-2.5">
                            <summary
                              style={{ color: ACCENT_TEXT }}
                              className="cursor-pointer list-none text-[12px] font-semibold hover:underline"
                            >
                              <span className="mr-1 inline-block transition-transform group-open:rotate-90">
                                ›
                              </span>
                              Contracts won in Canada ({won.length})
                            </summary>

                            <ul
                              style={{ borderColor: BORDER }}
                              className="mt-2 divide-y border-t"
                            >
                              {won.map((c) => (
                                <li key={c.id} className="py-2">
                                  {c.link ? (
                                    <a
                                      href={c.link}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={{ color: ACCENT_TEXT }}
                                      className="text-[13px] font-medium leading-snug hover:underline"
                                    >
                                      {c.title}
                                    </a>
                                  ) : (
                                    <p
                                      style={{ color: INK }}
                                      className="text-[13px] font-medium leading-snug"
                                    >
                                      {c.title}
                                    </p>
                                  )}
                                  <p
                                    style={{ color: MUTED }}
                                    className="mt-0.5 text-[11px]"
                                  >
                                    {c.buyer} · {formatDate(c.awarded_date)} ·{" "}
                                    {c.awarded_value === null
                                      ? "value not disclosed"
                                      : formatMoney(c.awarded_value)}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

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
import {
  About,
  CardTitle,
  EmptyState,
  ErrorState,
} from "@/components/page-parts";
import { formatDate, formatMoney } from "@/lib/format";

export const revalidate = 0;

const BASE = "/contracts";

type Search = {
  q?: string;
  buyer?: Param;
  industry?: Param;
};

export default async function Contracts({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const supabase = createClient();

  // Partners are fetched too, so a supplier name can link to its website.
  const [contractRes, partnerRes] = await Promise.all([
    supabase
      .from("contracts")
      .select("*")
      .order("awarded_date", { ascending: false }),
    supabase.from("partners").select("name, website"),
  ]);

  if (contractRes.error) {
    return (
      <ErrorState
        message={`Could not load contracts: ${contractRes.error.message}`}
      />
    );
  }

  const all = (contractRes.data ?? []) as Contract[];

  // Supplier name -> that partner's website, keyed on the normalised name so
  // "MIOVISION TECHNOLOGIES INCORPORATED" finds the partner called
  // "Miovision". Exact comparison, for the reason given in server.ts.
  const siteOf = new Map<string, string>();
  for (const p of (partnerRes.data ?? []) as Pick<
    Partner,
    "name" | "website"
  >[]) {
    const key = companyKey(p.name);
    if (key && p.website) siteOf.set(key, p.website);
  }

  const pickedBuyers = list(params.buyer);
  const pickedIndustries = list(params.industry);
  const query = typeof params.q === "string" ? params.q : "";

  const matchBuyer = (c: Contract) =>
    pickedBuyers.length === 0 ||
    (c.buyer !== null && pickedBuyers.includes(c.buyer));

  const matchIndustry = (c: Contract) =>
    pickedIndustries.every((i) => (c.industry ?? []).includes(i));

  const matchQuery = (c: Contract) =>
    !query ||
    [c.title, c.supplier, c.buyer, c.theme]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase());

  const results = all.filter(
    (c) => matchBuyer(c) && matchIndustry(c) && matchQuery(c),
  );

  const buyerFacets = tally(
    all.filter((c) => matchIndustry(c) && matchQuery(c)),
    (c) => [c.buyer],
  );
  const industryFacets = tally(results, (c) => c.industry ?? []);
  for (const picked of pickedIndustries) {
    if (!industryFacets.some(([v]) => v === picked)) {
      industryFacets.push([picked, 0]);
    }
  }

  // Disclosed values only — some contracts don't publish one, so the total is
  // a floor rather than a true sum, and the label says so.
  const disclosed = results.filter((c) => c.awarded_value !== null);
  const totalValue = disclosed.reduce(
    (sum, c) => sum + (c.awarded_value ?? 0),
    0,
  );

  const hasFilters =
    Boolean(query) || pickedBuyers.length + pickedIndustries.length > 0;

  return (
    <div className="grid gap-5 lg:grid-cols-[15rem_1fr] lg:items-start">
      <aside className="lg:sticky lg:top-5">
        <div
          style={{ borderColor: BORDER }}
          className={`${CARD} ${SCROLL_PANEL}`}
        >
          <SearchBox
            query={query}
            placeholder="Search contracts"
            hidden={[
              { name: "buyer", values: pickedBuyers },
              { name: "industry", values: pickedIndustries },
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
            hint="Pick several to see contracts covering all of them"
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
          label="About these contracts"
          meta={
            results.length === all.length
              ? `${all.length} contracts · ${formatMoney(totalValue)} disclosed`
              : `${results.length} of ${all.length} contracts · ${formatMoney(totalValue)} disclosed`
          }
        >
          <p>
            Smart mobility contracts already awarded by public buyers in
            Ontario, Quebec and the Canadian federal government. Use this to see
            which companies win work in the Canadian market, and in which
            fields.
          </p>
          <p>
            Smart mobility has no strict definition, so which contracts are
            included and how they are tagged reflects our judgement rather than
            an agreed standard. Data quality varies between buyers, since each
            publishes through its own platform with its own practices on what is
            recorded and disclosed.
          </p>
        </About>

        {results.length === 0 ? (
          <EmptyState>
            No contracts match every filter. Remove one to widen the search.
          </EmptyState>
        ) : (
          <ul className="space-y-2.5">
            {results.map((c) => {
              const site = c.supplier
                ? siteOf.get(companyKey(c.supplier))
                : undefined;

              return (
                <li
                  key={c.id}
                  style={{ borderColor: BORDER }}
                  className={`${CARD} px-4 py-3.5`}
                >
                  {/* No wrapping: a long title must wrap within its own
                      column rather than pushing the value onto the next line,
                      so the value sits top-right on every card. min-w-0 is
                      what lets the title column actually shrink. */}
                  <div className="flex items-start justify-between gap-x-4">
                    <div className="min-w-0 flex-1">
                      <CardTitle>{c.title}</CardTitle>
                    </div>
                    <span
                      style={{ color: INK }}
                      className="shrink-0 whitespace-nowrap text-[13px] font-semibold tabular-nums"
                    >
                      {c.awarded_value === null
                        ? "Not disclosed"
                        : formatMoney(c.awarded_value)}
                    </span>
                  </div>

                  <p style={{ color: MUTED }} className="mt-0.5 text-[12px]">
                    {site ? (
                      <a
                        href={site}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: ACCENT_TEXT }}
                        className="font-semibold hover:underline"
                      >
                        {c.supplier}
                      </a>
                    ) : (
                      <span style={{ color: INK }} className="font-medium">
                        {c.supplier}
                      </span>
                    )}
                    <span>
                      {" "}
                      · {c.buyer} · {formatDate(c.awarded_date)}
                    </span>
                  </p>

                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    {(c.industry ?? []).map((tag) => {
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

                    {c.link && (
                      <a
                        href={c.link}
                        target="_blank"
                        rel="noreferrer"
                        style={{ borderColor: BORDER, color: ACCENT_TEXT }}
                        className={`ml-auto ${BUTTON} hover:bg-[#F0F0FE]`}
                      >
                        View contract
                        <ArrowOut />
                      </a>
                    )}
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

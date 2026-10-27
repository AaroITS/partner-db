import partnersJson from "@/data/partners.json";
import tendersJson from "@/data/tenders.json";
import contractsJson from "@/data/contracts.json";
import type { Contract, Partner, Tender } from "@/lib/supabase/server";

/* The site's data, baked into the build.
 *
 * October 2026: a scraper burned the whole Supabase egress allowance in a
 * few days, which restricted the project and took the site down. The three
 * tables together are about 190 KB — small enough that querying a database
 * for them on every page view was never buying anything.
 *
 * Reading them from here means the site makes no database calls at all at
 * runtime, so no amount of traffic can take it offline or cost anything.
 *
 * Supabase is still the place to EDIT the data. The flow is:
 *   1. edit in the Supabase Table Editor as before
 *   2. npm run sync-data     (pulls the tables down into data/*.json)
 *   3. git add . && git commit && git push
 *
 * So changes now need a deploy to go live, rather than appearing by
 * themselves within ten minutes.
 */

export const partners = partnersJson as Partner[];
export const tenders = tendersJson as Tender[];
export const contracts = contractsJson as Contract[];

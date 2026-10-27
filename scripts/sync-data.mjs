/**
 * Pulls the three tables out of Supabase and writes them to data/*.json.
 *
 * Run this after editing anything in the Supabase Table Editor, then commit
 * and push. The site reads those JSON files at build time, so nothing
 * queries the database when a visitor loads a page.
 *
 * Usage:  npm run sync-data
 *
 * It fetches about 190 KB in total, once — against the 5 GB monthly egress
 * allowance that's roughly 0.004%, so you could run it hundreds of times a
 * day without noticing.
 */
import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.\n" +
      "They live in .env.local; the npm script loads that file for you.",
  );
  process.exit(1);
}

const supabase = createClient(url, key);

/* Column lists rather than select("*"): these are the fields the pages
   actually render, and keeping them explicit means a new column added in
   Supabase can't silently bloat every page. */
const TABLES = [
  {
    name: "partners",
    columns:
      "id, name, country, org_type, industry, about, projects, website",
    order: { column: "name", ascending: true },
  },
  {
    name: "tenders",
    columns: "id, title, country, organisation, deadline, industry, link",
    order: { column: "deadline", ascending: true },
  },
  {
    name: "contracts",
    columns:
      "id, title, buyer, supplier, theme, awarded_value, awarded_date, industry, source_id, link",
    order: { column: "awarded_date", ascending: false },
  },
];

const dir = join(process.cwd(), "data");
await mkdir(dir, { recursive: true });

let failed = false;

for (const table of TABLES) {
  const { data, error } = await supabase
    .from(table.name)
    .select(table.columns)
    .order(table.order.column, { ascending: table.order.ascending });

  if (error) {
    console.error(`✗ ${table.name}: ${error.message}`);
    failed = true;
    continue;
  }

  if (!data || data.length === 0) {
    // Writing an empty file would silently blank a section of the site, so
    // stop instead and leave the previous data in place.
    console.error(
      `✗ ${table.name}: returned no rows — refusing to overwrite the existing file`,
    );
    failed = true;
    continue;
  }

  const path = join(dir, `${table.name}.json`);
  await writeFile(path, JSON.stringify(data, null, 1) + "\n", "utf8");
  console.log(`✓ ${table.name.padEnd(10)} ${String(data.length).padStart(4)} rows`);
}

if (failed) {
  console.error("\nSome tables did not sync. data/ was left unchanged for those.");
  process.exit(1);
}

console.log("\nDone. Now: git add . && git commit -m 'Update data' && git push");

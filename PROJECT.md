# JASMEX Partner Mapping and Leads Database — project reference

A public, filterable site with three sections: partner organisations, open
tenders ("Leads"), and awarded Canadian contracts. Data lives in Supabase; the
site reads it and displays it. There is no admin page — everything is added and
edited through the Supabase dashboard.

Live at **https://jasmexdatabase.its-finland.fi**, hosted on Vercel, deploying
automatically from GitHub (`AaroITS/partner-db`).

---

## Stack

| Piece | What it is |
|---|---|
| Next.js (App Router, TypeScript) | The website |
| Tailwind CSS | Styling, via `className` attributes in the code |
| Supabase | Postgres database + the admin interface |
| Vercel | Hosting, plus the firewall that handles bot traffic |
| Instrument Sans | Font, loaded through `next/font` |

## File map

```
app/layout.tsx            Header, page background, font, the gradient rule
app/page.tsx              Partners
app/leads/page.tsx        Tenders
app/contracts/page.tsx    Awarded contracts
app/robots.ts             Crawler rules (generates /robots.txt)
app/sitemap.ts            Generates /sitemap.xml
app/globals.css           Base styles (the dark-mode block was deleted)
components/filters.tsx    Shared filter sidebar, used by all three pages
components/page-parts.tsx About panel, group headings, card titles, states
components/section-nav.tsx  The Partners / Leads / Contracts tabs
components/arrow.tsx      The ↗ icon used on buttons
lib/theme.ts              Every colour and shared class string
lib/format.ts             Date and money formatters
lib/supabase/server.ts    DB connection, row types, companyKey()
.env.local                Supabase keys — never committed
```

Reference SQL, kept so the setup is reproducible: `schema.sql`,
`schema-tenders.sql`, `schema-contracts.sql`, `migrate-tags.sql`,
`add-contract-links.sql`.

**No page imports another page.** Shared code lives in `lib/` or
`components/`. This matters: an earlier version had the leads page importing a
formatter from the partners page, and the build broke whenever those two files
were out of step.

## Environment variables

In `.env.local` locally, and in Vercel's project settings for the live site:

```
NEXT_PUBLIC_SUPABASE_URL=https://txbtgbkuenrboyrzoaxt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

The variable says `ANON_KEY` because that's what the code looks for; Supabase
now calls this key "publishable". Same thing, newer name.

⚠️ Never use the `sb_secret_` key. It bypasses all security rules, and
anything named `NEXT_PUBLIC_` is sent to every visitor's browser.

---

## Data model

Three tables. All have Row Level Security on with a single policy: anyone can
read, nobody can write. The site is physically incapable of modifying data.

### `partners` — 161 rows (107 Canada, 54 Türkiye)

| Column | Type | Notes |
|---|---|---|
| `name` | text | |
| `country` | text | **Filterable**, one value. Also groups the list |
| `org_type` | text | **Filterable**, one value |
| `industry` | text[] | **Filterable**, several values |
| `about`, `projects`, `website` | text | Display only |

### `tenders` — open opportunities, shown as "Leads"

| Column | Type | Notes |
|---|---|---|
| `title` | text | |
| `country` | text | **Filterable** |
| `industry` | text[] | **Filterable** |
| `deadline` | date | Drives the green/red left bar and "Closes"/"Closed" |
| `organisation`, `link` | text | Display only |

### `contracts` — 217 awarded Canadian contracts

Six public buyers in Ontario, Quebec and federal. The source had 223; the six
with multiple winners were deliberately excluded.

| Column | Type | Notes |
|---|---|---|
| `title` | text | English where the original is French |
| `buyer` | text | **Filterable** |
| `industry` | text[] | **Filterable**, mapped by rule from `theme` |
| `theme` | text | The source dataset's own category, kept for reference |
| `supplier` | text | Used to link to partners |
| `awarded_value` | numeric | **Null for 26** undisclosed contracts |
| `awarded_date` | date | |
| `link` | text | Tender portal URL. **Null for 33** |
| `source_id` | text | Buyer's own reference number |

---

## How the filtering works

Identical on all three pages, via `components/filters.tsx`:

- **Country / Buyer / Type of organisation** are OR — picking two shows
  records matching either.
- **Industries** is AND — picking `ITS` and `Micromobility` shows only records
  carrying both. This was the original core requirement.
- Counts beside each option reflect the current filter state, so no visible
  option can ever lead to an empty page.
- A filter with fewer than two possible values hides itself. **If a filter is
  missing from the sidebar, the underlying column is probably empty** — that's
  how the contracts industry filter went missing when a conversion step
  silently failed.
- Filter state lives in the URL, so any filtered view can be bookmarked.

### Sorting and grouping

- **Partners**: grouped by country, largest group first, with a sticky heading
  above each block. Alphabetical within a group. The country is *not* repeated
  on each card.
- **Leads**: open first (soonest deadline first), then closed (most recent
  first).
- **Contracts**: newest award first.

---

## The cross-links between sections

**Leads → Partners.** Each lead expands to show partners in the same country
carrying at least one of its industries. Straightforward array matching at
render time.

**Partners → Contracts.** A partner card shows "Contracts won in Canada" when
its name matches a contract supplier.

**Contracts → Partners.** A supplier name links to that partner's website when
one exists — currently about 140 of 217 contracts.

Both directions use `companyKey()` in `lib/supabase/server.ts`, which
lowercases and strips legal suffixes (Inc, Ltd, Technologies, Canada…) then
compares **exactly**.

⚠️ The exact comparison is deliberate. Substring matching was tried and
produced false positives — it linked "SMATS Traffic" to "ATS Traffic" and
"TapLane" to "Plan Group Inc". A missed link is a small loss; a wrong one puts
someone else's contracts on a partner's card. Don't loosen this without a
manual alias list.

---

## Industry vocabulary

One shared vocabulary across all three tables — that's what makes the
cross-links work. Roughly 45 tags. Casing is preserved deliberately: `ITS`,
`IoT`, `MaaS`, `AI` are acronyms.

**Traffic signals are two distinct tags**, merged from four in September 2026:

- `Traffic Signals` — supplying the hardware (absorbed `Traffic Lights`)
- `Traffic Signal Management` — managing them (absorbed
  `Traffic Signal Optimization`)

**Tags added with the contracts data**: `Video Surveillance`, `Data & Software`,
`Infrastructure Monitoring`, `EV Charging`, `Building Systems`. Later additions
from the partner import: `Air Quality Monitoring`,
`Geographic Information Systems`.

Contract tags were assigned **by rule from the `theme` column**, not row by
row. They're a reasonable guide, not authoritative. `theme` is kept on every
row so the original category is always recoverable.

### Checking for typos

Nothing validates spelling when adding records. `Micromobility` and
`micromobility` become two separate filters silently. After adding anything:

```sql
select unnest(industry) as tag, count(*) from partners group by 1 order by 1;
```

Anything with a count of 1 that resembles another entry is probably a typo.
Run it against `tenders` and `contracts` too.

---

## Design

Deliberately plain, after several rounds that weren't. Off-white canvas, white
cards with one hairline border and an 8px radius, near-black text, and a single
accent on anything clickable. No shadows, no gradient surfaces, no hover
animation on cards.

Everything lives in `lib/theme.ts`:

- `ACCENT` `#4F46E5`, `ACCENT_TEXT`, `ACCENT_WASH` — interactive states only
- `ACCENT_GRADIENT` — blue to violet. **Only ever used on a rule**: the line
  under the header and the active tab underline. Putting it on a surface or a
  button is what made earlier versions look like a template.
- `INK` / `BODY` / `MUTED` — three neutrals, no more
- `BORDER`, `CANVAS`, `CARD`, `TAG`, `BUTTON`, `SCROLL_PANEL`

⚠️ **Tailwind can't read these constants at build time.** Hover and focus
colours written inside class strings must be literal hex. If you change the
accent, also search `app/` and `components/` for `#F0F0FE`, `#4F46E5` and
`rgba(79,70,229` — those drifted out of sync once already.

---

## Performance and bot protection

Added October 2026 after Supabase and Vercel both flagged usage limits.

**What happened:** roughly 22,000 requests from Amazon AWS, sharing one JA4
TLS fingerprint, spoofing a Chrome user agent, rotating across hundreds of IPs,
hitting `/` almost exclusively. A commercial scraper, not an attack — nothing
probed for vulnerabilities, and the data is public and read-only. The cost came
from every request rendering fresh and querying two full tables.

**Caching** is the main defence:

| Page | `revalidate` | Why |
|---|---|---|
| Partners | 600 (10 min) | Edited most often |
| Leads | 3600 (1 hr) | Deadlines only flip at midnight |
| Contracts | 3600 (1 hr) | Historical data |

⚠️ This means **Supabase edits take up to 10 minutes to appear** on Partners,
an hour on the others. Lower the numbers if that's too slow while adding
records. Do not put `force-dynamic` back on Leads — it was there once and meant
every single request re-queried two tables.

**Other measures:**

- Queries select named columns, never `select("*")`.
- `generateMetadata` in each page adds `noindex, nofollow` to any URL carrying
  filters, so the thousands of filter permutations aren't treated as pages.
- `app/robots.ts` disallows query-string URLs, names AI crawlers individually
  (several ignore wildcards but honour a direct rule), and blocks SEO auditors
  outright.
- Vercel Firewall: a custom rule denying JA4 digest
  `t13d450900_d524c25c267f_9da38b6fd1bc`, Bot Protection set to Challenge, AI
  Bots set to Block.

The JA4 rule is a fast fix, not a permanent one — fingerprints change when the
operator updates their tooling. Caching and Bot Protection are what hold up.

---

## Common tasks

### Adding a record

Supabase → Table Editor → pick the table → Insert row. Leave `id` and
`created_at` blank.

`industry` needs Postgres array syntax — braces, double quotes, no space after
the commas:

```
{"ITS","Traffic Management","Micromobility"}
```

If the row editor rejects it, insert without industries and set them after:

```sql
update partners set industry = array['ITS', 'Traffic Management']
where name = 'New Partner Name';
```

### Importing a batch from Excel

The pattern used for every table so far:

1. Clean in Excel: one header row, snake_case column names, industries
   comma-separated in one cell.
2. Add an `industries_raw` text column to the table if it doesn't have one.
3. Import the CSV, mapping industries to **`industries_raw`**, not `industry`.
4. Run the `update` that converts `industries_raw` into the `industry` array.
   Include `where industries_raw is not null` when adding to a table that
   already has rows, or you will wipe the existing ones.
5. **Verify the conversion before dropping `industries_raw`.**
6. Drop the column.

⚠️ Run those statements **one at a time**. The Supabase editor only reports the
last statement's result, so a silently-failing update inside a pasted block
goes unnoticed — which is exactly what happened with contracts.

### Changing how the site looks

Edit the file, save, and the browser updates. Styling is in the `className`
attributes next to the content. `lib/theme.ts` drives all three pages.

### Deploying

```bash
git add .
git commit -m "what changed"
git push
```

Vercel rebuilds automatically, one to two minutes.

**Database edits need none of this** — they appear once the cache expires.

⚠️ If localhost doesn't reflect your changes, check whether an old dev server
is still running: `npm run dev` does not replace one, it just exits and leaves
the stale server serving. The error message names the PID to `kill`.

---

## Things to know

**Free-plan Supabase projects pause after a week with no activity.** Data isn't
lost; you click restore.

**There are no automatic database backups on the free plan.** Export all three
tables to CSV periodically, and always before structural changes. This is the
real single point of failure — the code is safe on GitHub, the data isn't.
*Still outstanding.*

**Each page loads all rows and filters them in memory.** Fine to roughly 2,000
rows per table. Past that, move filtering into the query with `.eq()` and
`.contains()`.

**No typo protection when adding records.** That was the deliberate trade for
not building an admin panel. If several people start adding data, build
`/admin`: Supabase Auth with signups disabled, `@supabase/ssr`, session
middleware, a write policy, and industry dropdowns populated from existing
values. Consider archiving instead of deleting, and `updated_by` /
`updated_at` columns.

**The dark-mode block in `globals.css` was deleted.** If it returns, the site
turns dark on macOS regardless of the Tailwind classes.

---

## Known data issues

- 26 contracts have no disclosed value; totals are labelled "disclosed" and are
  a floor rather than a true sum.
- 33 contracts have no link, so those cards show no button.
- Contract titles from Québec and Montréal are in French where no English
  version was published.
- Some partners have no `about` text, so their rows in the leads expander look
  sparse.
- One tender may still carry both `Traffic Signals` and the retired
  `Traffic Lights`; worth checking.

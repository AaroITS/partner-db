# JASMEX Partner Mapping and Leads Database — project reference

A public, filterable site with three sections: partner organisations, open
tenders, and awarded contracts. Data lives in Supabase; the site reads it and
displays it. There is no admin page — everything is added and edited through
the Supabase dashboard.

Live on Vercel, deploys automatically from GitHub (`AaroITS/partner-db`).

---

## Stack

| Piece | What it is |
|---|---|
| Next.js (App Router, TypeScript) | The website |
| Tailwind CSS | Styling, via `className` attributes in the code |
| Supabase | Postgres database + the admin interface |
| Vercel | Hosting |
| Plus Jakarta Sans | Font — free stand-in for TT Hoves |

## File map

```
app/layout.tsx            Header, page background, font, site title
app/page.tsx              Partners page + the shared Disclaimer component
app/leads/page.tsx        Tenders
app/contracts/page.tsx    Awarded contracts
app/globals.css           Base styles (dark-mode block was deleted)
components/filters.tsx    Shared filter sidebar, used by all three pages
components/section-nav.tsx  The Partners / Leads / Contracts switcher
lib/theme.ts              Colours and the glass-panel styles
lib/supabase/server.ts    DB connection, row types, companyKey()
.env.local                Supabase keys — never committed
schema.sql                Reference: partners table setup
schema-tenders.sql        Reference: tenders table setup
schema-contracts.sql      Reference: contracts table setup
migrate-tags.sql          Reference: the traffic signal tag merge
```

`Disclaimer` is defined in `app/page.tsx` and imported by the other two pages,
so editing it there updates all three.

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

### `partners` — 76 rows (54 Türkiye, 22 Canada)

| Column | Type | Notes |
|---|---|---|
| `name` | text | |
| `country` | text | **Filterable**, one value |
| `org_type` | text | **Filterable**, one value |
| `industry` | text[] | **Filterable**, several values |
| `about`, `projects`, `website` | text | Display only |

### `tenders` — open opportunities, shown as "Leads"

| Column | Type | Notes |
|---|---|---|
| `title` | text | |
| `country` | text | **Filterable** |
| `industry` | text[] | **Filterable** |
| `deadline` | date | Drives the green/red card border |
| `organisation`, `link` | text | Display only |

### `contracts` — 217 awarded Canadian contracts

Six public buyers in Ontario, Quebec and federal. Source data had 223; the six
with multiple winners were deliberately excluded.

| Column | Type | Notes |
|---|---|---|
| `title` | text | English where the original is French |
| `buyer` | text | **Filterable** |
| `industry` | text[] | **Filterable**, mapped from `theme` |
| `theme` | text | The source dataset's own category |
| `supplier` | text | Used to link to partners |
| `awarded_value` | numeric | **Null for 26** undisclosed contracts |
| `awarded_date` | date | |
| `source_id` | text | Buyer's reference. No usable URLs in the source |

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

### Sorting

- Partners: alphabetical.
- Leads: open first (soonest deadline first), then expired (most recent
  first).
- Contracts: newest award first.

---

## The cross-links between sections

**Leads → Partners.** Each lead has an expander showing partners in the same
country carrying at least one of its industries. Straightforward array
matching, computed at render time.

**Partners → Contracts.** A partner card shows "See contracts won in Canada"
when its name matches a contract supplier. The match uses `companyKey()` in
`lib/supabase/server.ts`, which lowercases and strips legal suffixes (Inc,
Ltd, Technologies, Canada…) then compares **exactly**.

⚠️ The exact comparison is deliberate. Substring matching was tried and
produced false positives — it linked "SMATS Traffic" to "ATS Traffic" and
"TapLane" to "Plan Group Inc". A missed link is a small loss; a wrong one puts
someone else's contracts on a partner's card. Don't loosen this without a
manual alias list.

Currently 4 partners match: Fortran Traffic, Orange Traffic, ATS Traffic,
Miovision. This number rises naturally as suppliers from the contracts data
are added as partners.

---

## Industry vocabulary

One shared vocabulary across all three tables — that's what makes the
cross-links work. Roughly 45 tags. Casing is preserved deliberately: `ITS`,
`IoT`, `MaaS`, `AI` are acronyms.

**Traffic signals are two distinct tags**, merged from four in September 2026:

- `Traffic Signals` — supplying the hardware (absorbed `Traffic Lights`)
- `Traffic Signal Management` — managing them (absorbed
  `Traffic Signal Optimization`)

**Five tags were added with the contracts data**: `Video Surveillance`,
`Data & Software`, `Infrastructure Monitoring`, `EV Charging`,
`Building Systems`.

Contract tags were assigned **by rule from the `theme` column**, not row by
row. They're a reasonable guide, not authoritative. The mapping is in the
cleaning script; `theme` is kept on every row so the original category is
always recoverable.

### Checking for typos

Nothing validates spelling when adding records. `Micromobility` and
`micromobility` become two separate filters silently. After adding anything:

```sql
select unnest(industry) as tag, count(*) from partners group by 1 order by 1;
```

Anything with a count of 1 that resembles another entry is probably a typo.
Run it against `tenders` and `contracts` too.

---

## Common tasks

### Adding a record

Supabase → Table Editor → pick the table → Insert row. Leave `id` and
`created_at` blank.

`industry` needs Postgres array syntax — braces, double quotes, no space
after commas:

```
{"ITS","Traffic Management","Micromobility"}
```

If the row editor rejects it, insert without industries and set them after:

```sql
update partners set industry = array['ITS', 'Traffic Management']
where name = 'New Partner Name';
```

### Importing a batch from Excel

The pattern used for all three tables:

1. Clean in Excel: one header row, snake_case column names, industries
   comma-separated in one cell.
2. Create the table with the `industries_raw` text column included.
3. Import the CSV, mapping industries to **`industries_raw`**, not `industry`.
4. Run the `update` that converts `industries_raw` into the `industry` array.
5. **Verify the conversion before dropping `industries_raw`.**
6. Drop the column, create the GIN index.

⚠️ Run those statements **one at a time**. The Supabase editor only reports
the last statement's result, so a silently-failing update inside a pasted
block goes unnoticed — which is exactly what happened with contracts.

### Changing how the site looks

Edit the file, save, and the browser updates by itself. Styling is in the
`className` attributes next to the content.

- `BLUE`, `BLUE_DEEP`, `BLUE_TINT`, `GREEN`, `RED` in `lib/theme.ts` — every
  colour on the site.
- `GLASS`, `GLASS_HOVER`, `GLASS_NO_BORDER`, same file — the frosted panels.
  Raise `bg-white/58` toward `/70` if text feels washed out.
- Background gradients are in `app/layout.tsx`. Lower the `rgba` alphas to
  calm them down.
- Filter sidebar behaviour is in `components/filters.tsx` — changing it
  changes all three pages.

### Deploying

```bash
git add .
git commit -m "what changed"
git push
```

Vercel rebuilds automatically, one to two minutes.

**Database edits need none of this** — Supabase changes appear on the live
site immediately.

---

## Things to know

**Free-plan Supabase projects pause after a week with no activity.** Data
isn't lost; you click restore. Normal site traffic prevents it.

**There are no automatic database backups on the free plan.** Export all three
tables to CSV periodically, and always before structural changes. This is the
real single point of failure — the code is safe on GitHub, the data isn't.

**Each page loads all rows and filters them in memory.** Fine to roughly 2,000
rows per table. Past that, move filtering into the query with `.eq()` and
`.contains()`.

**The leads page is `dynamic = 'force-dynamic'`** so the green/red deadline
state is never cached. Don't remove that or deadlines will go stale.

**No typo protection when adding records.** That was the deliberate trade for
not building an admin panel. If several people start adding data, build
`/admin`: Supabase Auth with signups disabled, `@supabase/ssr`, session
middleware, a write policy, and industry dropdowns populated from existing
values. Consider archiving instead of deleting, and `updated_by` / `updated_at`
columns.

**The dark-mode block in `globals.css` was deleted.** If it returns, the site
turns dark on macOS regardless of the Tailwind classes.

---

## Known data issues

- One tender lists both `Traffic Signals` and `Traffic Lights` as separate
  industries; `Traffic Lights` no longer exists after the merge, so this may
  need checking.
- 26 contracts have no disclosed value. Totals on the contracts page are a
  floor, and labelled "disclosed".
- Some partners have no `about` text, so their rows in the leads accordion
  look sparse.
- Contract titles from Québec and Montréal are in French where no English
  version was published.

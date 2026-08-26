# JASMEX Partner Mapping Database — project reference

A public, filterable directory of business partners. Data lives in Supabase;
the site reads it and displays it. There is no admin page — partners are added
and edited through the Supabase dashboard.

---

## Stack

| Piece | What it is |
|---|---|
| Next.js (App Router, TypeScript) | The website |
| Tailwind CSS | Styling, via `className` attributes in the code |
| Supabase | Postgres database + the admin interface |
| Vercel | Hosting (deploys automatically from GitHub) |
| Plus Jakarta Sans | Font — free stand-in for TT Hoves |

## Files that matter

```
app/layout.tsx          Header, page background, font
app/page.tsx            Everything else: filters, cards, Information panel
app/globals.css         Base styles (dark-mode block was deleted)
lib/supabase/server.ts  Database connection + the Partner type
.env.local              Supabase keys — never committed to git
schema.sql              Reference copy of the database setup
```

Nearly all changes happen in `app/page.tsx`.

## Environment variables

In `.env.local` locally, and pasted into Vercel's settings for the live site:

```
NEXT_PUBLIC_SUPABASE_URL=https://txbtgbkuenrboyrzoaxt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

The variable name says `ANON_KEY` because that's what the code looks for.
Supabase now calls this key "publishable" — same thing, newer name.

⚠️ Never use the `sb_secret_` key. It bypasses all security rules, and
anything named `NEXT_PUBLIC_` is sent to every visitor's browser.

---

## Data model

Table: `partners`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Auto-generated. Leave blank when adding rows. |
| `name` | text | Organisation name |
| `country` | text | **Filterable** — one value per partner |
| `org_type` | text | **Filterable** — one value per partner |
| `industry` | text[] | **Filterable** — an array, several per partner |
| `about` | text | Display only |
| `projects` | text | Display only |
| `website` | text | Display only, rendered as a "Website" button |
| `created_at` | timestamptz | Auto-generated |

### Security

Row Level Security is on, with a single policy: anyone can read, nobody can
write. The website is physically incapable of modifying data. Edits happen in
the Supabase dashboard, which uses admin credentials and bypasses the policy.

### How the filtering works

- **Country** and **Type of organisation** are OR — picking two shows partners
  matching either. A partner has only one of each, so AND would return nothing.
- **Industries** is AND — picking `ITS` and `Micromobility` shows only partners
  doing both. This was the core requirement.
- Counts beside each option reflect the current filter state, so no visible
  option can ever lead to an empty page.
- A filter with only one possible value hides itself. Country appeared once
  partners from a second country were added.
- Filter state lives in the URL, so any filtered view can be bookmarked
  or shared.

---

## Common tasks

### Adding a partner

Supabase → Table Editor → `partners` → Insert row. Leave `id` and
`created_at` blank.

The `industry` field needs Postgres array syntax — braces, each value in
double quotes, no space after the commas:

```
{"ITS","Traffic Management","Micromobility"}
```

If the row editor rejects it, insert the partner without industries and set
them with SQL instead, which is more forgiving:

```sql
update partners
set industry = array['ITS', 'Traffic Management']
where name = 'New Partner Name';
```

Spelling must match existing values exactly. `Micromobility` and
`micromobility` become two separate filters, and nothing warns you.

### Checking for typos

```sql
select unnest(industry) as industry, count(*)
from partners group by 1 order by 2 desc, 1;
```

Anything with a count of 1 that resembles another entry is probably a typo.

### Editing or deleting

Table Editor → click a cell to edit, or tick a row to delete. Changes appear
on the site on the next page load; no deploy needed.

### Changing how the site looks

Edit `app/page.tsx`, save, and the browser updates by itself. Styling is in
the `className` attributes next to the content — no separate stylesheet.

Useful anchors:

- `BLUE`, `BLUE_DEEP`, `BLUE_TINT` at the top of `page.tsx` — every blue on
  the site. Change `BLUE` and everything follows.
- `GLASS` and `GLASS_HOVER`, just below — the frosted-panel effect. Raise
  `bg-white/58` toward `/70` if text feels washed out.
- Background gradients are in `layout.tsx`. Lower the `rgba` alpha values
  (`0.34`, `0.34`, `0.26`) to calm them down.
- Header text is in `layout.tsx`; the Information panel is near the top of
  the `<section>` in `page.tsx`.

### Deploying

Not yet done. Push to GitHub, import the repo in Vercel, and **paste the two
environment variables into Vercel before deploying** — otherwise the live site
shows `supabaseKey is required`. After that, every `git push` redeploys.

---

## Things to know

**Free-plan projects pause after a week with no activity.** Data isn't lost;
you click restore in the dashboard. Normal site traffic prevents it.

**Every partner load fetches all rows and filters them in memory.** Fine to
roughly 2,000 partners. Past that, move filtering into the database query
using `.eq()` and `.contains()`.

**There is no typo protection when adding partners.** That was the deliberate
trade for not building an admin panel. If several people start adding
partners, that's the point to build `/admin` with proper dropdowns — it needs
Supabase Auth, the `@supabase/ssr` package, session middleware, and a write
policy on the table.

**The dark-mode block in `globals.css` was deleted.** If it ever comes back
(e.g. after regenerating the project), the site will turn dark on macOS in
dark mode regardless of the Tailwind classes.

---

## Data cleaning history

The source spreadsheet needed three fixes before import, worth repeating if
you ever re-import from Excel:

1. `Passanger Information` (typo), `Passenger information`, and
   `Passenger Information` were three separate filters. Merged.
2. Many industry cells ended with a trailing comma, creating blank entries.
3. Casing is preserved deliberately — `ITS`, `IoT`, and `MaaS` are acronyms
   and would look wrong lowercased. Duplicates are matched case-insensitively
   but the original casing is kept.

The typo still exists in the source Excel file and will return on re-import
unless fixed there.

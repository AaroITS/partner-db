import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Read-only public client. The anon key is safe in the browser — Row Level
// Security in the database decides what it's actually allowed to do.
export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export type Partner = {
  id: string
  name: string
  country: string | null
  org_type: string | null
  industry: string[] | null
  about: string | null
  projects: string | null
  website: string | null
}

export type Tender = {
  id: string
  title: string
  country: string | null
  organisation: string | null
  deadline: string | null // ISO date, e.g. "2026-09-30"
  industry: string[] | null
  link: string | null
}

export type Contract = {
  id: string
  title: string
  buyer: string | null
  supplier: string | null
  theme: string | null
  awarded_value: number | null // null where the value was not disclosed
  awarded_date: string | null
  industry: string[] | null
  source_id: string | null
}

/* ---------- linking contracts to partners ----------
   Supplier names in the contracts data carry legal suffixes that partner
   names don't: "Miovision" is "MIOVISION TECHNOLOGIES INCORPORATED" there.
   Stripping those suffixes and comparing exactly links the two reliably.

   Exact comparison is deliberate. Substring matching was tried and produced
   false positives — it linked "SMATS Traffic" to "ATS Traffic" and "TapLane"
   to "Plan Group Inc", which would put contracts on the wrong partner. A
   missed link is a small loss; a wrong one is misinformation. */

const LEGAL_SUFFIXES =
  /\b(inc|incorporated|ltd|limited|llc|ulc|corp|corporation|co|company|canada|ltee|ltée|group|technologies|technology|solutions|systems|services|international|the)\b/g

export function companyKey(name: string | null): string {
  if (!name) return ''
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(LEGAL_SUFFIXES, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .join(' ')
}

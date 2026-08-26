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

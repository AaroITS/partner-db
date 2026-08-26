import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { SectionNav } from '@/components/section-nav'

// Closest freely-licensed match to TT Hoves: geometric grotesque,
// open apertures, slightly squared curves.
const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'JASMEX Partner Mapping and Leads Database',
  description:
    'Browse partner organisations and open tenders in the JASMEX target markets.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      {/* Washes are cyan and blue only — no warm hues — so the glass stays
          cold. They also give the frosted panels something to refract. */}
      <body
        className={`${sans.className} min-h-screen text-slate-900 antialiased`}
        style={{
          backgroundColor: '#dde8f8',
          backgroundImage: [
            'radial-gradient(900px 520px at 8% -10%, rgba(34,211,238,0.34), transparent 60%)',
            'radial-gradient(860px 620px at 92% 2%, rgba(59,130,246,0.34), transparent 62%)',
            'radial-gradient(780px 520px at 48% 110%, rgba(14,165,233,0.26), transparent 60%)',
          ].join(','),
          backgroundAttachment: 'fixed',
        }}
      >
        {/* No fill of its own — the page background shows straight through,
            so the header reads as part of the same surface. */}
        <header className="border-b border-white/50">
          <div className="mx-auto max-w-6xl px-6 pt-6 pb-5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <span className="text-lg font-bold tracking-tight text-slate-900">
                JASMEX Partner Mapping and Leads Database
              </span>
              <span className="text-sm text-slate-600">
                This website is managed by ITS Finland
              </span>
            </div>

            <SectionNav />
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { SectionNav } from '@/components/section-nav'

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'JASMEX Partner Mapping and Leads Database',
  description:
    'Browse partner organisations and open tenders in the JASMEX target markets.',
}

/* Grain: an SVG noise filter inlined as a data URI. It breaks up the banding
   that large gradients show on cheap monitors and makes the ground read as a
   printed surface rather than a screen fill.
   baseFrequency sets the grain size — higher is finer. */
const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={`${sans.className} relative min-h-screen text-white antialiased`}
        style={{
          backgroundColor: '#3B3180',
          backgroundImage: [
            'radial-gradient(900px 560px at 6% -12%, rgba(126,110,238,0.60), transparent 64%)',
            'radial-gradient(880px 640px at 94% 0%, rgba(78,112,222,0.55), transparent 66%)',
            'radial-gradient(780px 540px at 48% 112%, rgba(150,104,214,0.45), transparent 62%)',
          ].join(','),
          backgroundAttachment: 'fixed',
        }}
      >
        {/* The grain sits in its own fixed layer above the gradients and below
            everything else. soft-light makes it interact with the colour
            underneath rather than greying it out, so it reads as pigment. */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0 opacity-[0.055] mix-blend-soft-light"
          style={{ backgroundImage: GRAIN, backgroundSize: '300px 300px' }}
        />

        <div className="relative z-10">
          <header className="border-b border-white/20">
            {/* Title hard against the left margin, nav hard against the right,
                both on one row. items-center keeps them optically level
                despite the title being much larger. */}
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-4 px-6 py-6">
              <div>
                <h1 className="text-[30px] font-bold leading-tight tracking-[-0.02em] text-white">
                  JASMEX Partner Mapping and Leads Database
                </h1>
                <p className="mt-1 text-sm text-white/70">
                  This website is managed by ITS Finland
                </p>
              </div>

              <SectionNav />
            </div>
          </header>

          <main className="mx-auto max-w-6xl px-6 py-7">{children}</main>
        </div>
      </body>
    </html>
  )
}

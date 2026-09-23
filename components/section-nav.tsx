'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BLUE } from '@/lib/theme'

const SECTIONS = [
  { href: '/', label: 'Partners' },
  { href: '/leads', label: 'Leads' },
  { href: '/contracts', label: 'Contracts' },
]

// Segmented control. Needs to be a client component because it reads the
// current URL to decide which segment is active.
export function SectionNav() {
  const pathname = usePathname()

  return (
    // The wrapper spans the header width and centres the pill; the pill
    // itself stays only as wide as its buttons.
    <div className="mt-5 flex justify-center">
      <nav className="inline-flex gap-1 rounded-full border border-white/60 bg-white/50 p-1 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
        {SECTIONS.map((s) => {
          const isActive = pathname === s.href
          return (
            <Link
              key={s.href}
              href={s.href}
              aria-current={isActive ? 'page' : undefined}
              style={
                isActive
                  ? {
                      backgroundColor: BLUE,
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.28)',
                    }
                  : undefined
              }
              className={`rounded-full px-5 py-1.5 text-sm font-semibold transition-colors ${
                isActive ? 'text-white' : 'text-slate-600 hover:bg-white/70'
              }`}
            >
              {s.label}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

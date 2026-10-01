'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const SECTIONS = [
  { href: '/', label: 'Partners' },
  { href: '/leads', label: 'Leads' },
  { href: '/contracts', label: 'Contracts' },
]

// Segmented control. Needs to be a client component because it reads the
// current URL to decide which segment is active.
//
// No wrapper and no margin: the header row positions it, so it sits flush
// against the right margin.
export function SectionNav() {
  const pathname = usePathname()

  return (
    <nav className="inline-flex shrink-0 gap-1 rounded-full border border-white/20 bg-white/12 p-1">
      {SECTIONS.map((s) => {
        const isActive = pathname === s.href
        return (
          <Link
            key={s.href}
            href={s.href}
            aria-current={isActive ? 'page' : undefined}
            className={`rounded-full px-5 py-1.5 text-sm font-semibold transition-colors ${
              isActive
                ? 'bg-white text-[#231B50]'
                : 'text-white/80 hover:bg-white/15'
            }`}
          >
            {s.label}
          </Link>
        )
      })}
    </nav>
  )
}

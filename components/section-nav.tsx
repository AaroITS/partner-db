"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ACCENT_GRADIENT, INK, MUTED } from "@/lib/theme";

const SECTIONS = [
  { href: "/", label: "Partners" },
  { href: "/leads", label: "Leads" },
  { href: "/contracts", label: "Contracts" },
];

// Underlined tabs. The accent underline marks the current section and the
// label goes from grey to near-black, so the state survives without colour.
export function SectionNav() {
  const pathname = usePathname();

  return (
    <nav className="flex shrink-0 gap-6">
      {SECTIONS.map((s) => {
        const isActive = pathname === s.href;
        return (
          <Link
            key={s.href}
            href={s.href}
            aria-current={isActive ? "page" : undefined}
            style={{ color: isActive ? INK : MUTED }}
            className="relative pb-1.5 text-sm font-semibold transition-colors hover:text-[#0A0A0B]"
          >
            {s.label}
            {/* Matches the rule under the header, so the active tab reads as
                a piece of the same line. */}
            {isActive && (
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-0.5 rounded-full"
                style={{ backgroundImage: ACCENT_GRADIENT }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}

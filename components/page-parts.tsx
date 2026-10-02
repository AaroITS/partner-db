import { BODY, BORDER, CANVAS, INK, MUTED } from "@/lib/theme";

/* The project description is the same on every page and every visit. Shown
   open it pushes the first record below the fold for a returning user, so it
   sits collapsed and the disclaimer lives inside it rather than separately. */
export function About({
  children,
  label = "About this database",
  meta,
}: {
  children: React.ReactNode;
  label?: string;
  meta?: React.ReactNode;
}) {
  return (
    <details
      style={{ borderColor: BORDER }}
      className="group mb-3 border-b pb-2"
    >
      {/* The toggle and the record count share one row, so the page has a
          single line of chrome above the list instead of two stacked labels
          at different weights. */}
      <summary
        style={{ color: MUTED }}
        className="flex cursor-pointer list-none items-baseline text-[12px] font-semibold"
      >
        <span className="transition-colors hover:text-[#1C1A17]">
          <span className="mr-1 inline-block transition-transform group-open:rotate-90">
            ›
          </span>
          {label}
        </span>
        {meta && (
          <span className="ml-auto font-normal tabular-nums">{meta}</span>
        )}
      </summary>

      <div
        style={{ color: BODY }}
        className="mt-2.5 max-w-3xl space-y-2.5 text-[13px] leading-relaxed"
      >
        {children}

        <p style={{ color: MUTED }} className="text-[12px] leading-relaxed">
          All information on this site is collected from publicly available
          sources and provided for general guidance only. ITS Finland and the
          JASMEX project partners accept no liability for its accuracy or for
          any action taken based on it. Always verify deadlines and tender
          details against the original source.
        </p>
      </div>
    </details>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{ borderColor: BORDER, color: BODY }}
      className="rounded-lg border bg-white px-4 py-6 text-center text-[13px]"
    >
      {children}
    </p>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
      {message}
    </p>
  );
}

/* A thin heading above a block of cards. One label for 107 partners rather
   than the same word repeated on 107 cards. Sticky, so the country stays
   visible while you scroll through its block. */
export function GroupHeading({
  label,
  count,
}: {
  label: string;
  count: number;
}) {
  return (
    <div
      style={{ borderColor: BORDER, backgroundColor: CANVAS }}
      className="sticky top-0 z-10 mb-2 flex items-baseline gap-2 border-b py-1.5"
    >
      <span style={{ color: INK }} className="text-[12px] font-semibold">
        {label}
      </span>
      <span style={{ color: MUTED }} className="text-[11px] tabular-nums">
        {count}
      </span>
    </div>
  );
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{ color: INK }}
      className="text-[15px] font-semibold leading-snug tracking-[-0.01em]"
    >
      {children}
    </h2>
  );
}

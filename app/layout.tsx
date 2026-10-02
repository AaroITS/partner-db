import type { Metadata } from "next";
import { Instrument_Sans } from "next/font/google";
import "./globals.css";
import { SectionNav } from "@/components/section-nav";
import { ACCENT_GRADIENT, BODY, CANVAS, INK, MUTED } from "@/lib/theme";

/* One face throughout. Instrument Sans has slightly more character in its
   letterforms than Inter without being decorative, and it stays neutral at
   11px, which is where most of this page lives. Exposed as a variable so
   components elsewhere can reach it. */
const sans = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "JASMEX Partner Mapping and Leads Database",
  description:
    "Browse partner organisations and open tenders in the JASMEX target markets.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${sans.variable} min-h-screen antialiased`}
        style={{
          backgroundColor: CANVAS,
          color: BODY,
          fontFamily: "var(--font-sans)",
        }}
      >
        {/* White against the off-white body, with a hairline underneath. The
            two tones are close enough that the line is what actually does the
            separating — which is the point: no band, no weight. */}
        <header className="bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-6 py-3.5">
            <div>
              <h1
                style={{ color: INK }}
                className="text-[20px] font-semibold leading-tight tracking-[-0.02em]"
              >
                JASMEX Partner Mapping and Leads Database
              </h1>
              <p style={{ color: MUTED }} className="mt-0.5 text-xs">
                Managed by ITS Finland
              </p>
            </div>

            <SectionNav />
          </div>

          {/* The one gradient on the site: a 2px rule separating the header
              from the body. A line can carry colour without the page
              becoming colourful. */}
          <div
            aria-hidden
            className="h-px w-full"
            style={{ backgroundImage: ACCENT_GRADIENT }}
          />
        </header>

        <main className="mx-auto max-w-6xl px-6 py-6">{children}</main>
      </body>
    </html>
  );
}

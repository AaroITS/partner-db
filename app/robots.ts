import type { MetadataRoute } from "next";

/* Faceted navigation is a crawler trap: every combination of filters is a
   distinct URL, and each page links to the next combination, so the set is
   effectively infinite. Disallowing query strings keeps crawlers on the three
   real pages instead of walking thousands of filter permutations.

   The AI crawlers are named individually because several of them ignore a
   wildcard pattern in the catch-all group but honour a rule addressed to
   them directly. */

const QUERY_STRINGS = ["/*?*"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: QUERY_STRINGS,
      },
      {
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "ClaudeBot",
          "Claude-Web",
          "CCBot",
          "PerplexityBot",
          "Google-Extended",
          "Applebot-Extended",
          "Bytespider",
          "Amazonbot",
          "meta-externalagent",
        ],
        disallow: QUERY_STRINGS,
      },
      {
        // SEO auditing crawlers: they bring no visitors and are among the
        // most aggressive on faceted sites.
        userAgent: [
          "AhrefsBot",
          "SemrushBot",
          "MJ12bot",
          "DotBot",
          "DataForSeoBot",
          "BLEXBot",
        ],
        disallow: "/",
      },
    ],
    sitemap: "https://jasmexdatabase.its-finland.fi/sitemap.xml",
  };
}

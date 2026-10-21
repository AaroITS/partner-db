import type { MetadataRoute } from "next";

/* The three real pages. Pointing crawlers at these explicitly gives them
   something to index instead of discovering the site through filter links. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://jasmexdatabase.its-finland.fi";
  const now = new Date();

  return [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/leads`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${base}/contracts`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}

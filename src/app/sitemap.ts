import { MetadataRoute } from "next";

/**
 * Dynamic Sitemap generator for Next.js App Router.
 * Generates an XML sitemap for search engines.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://your-domain.com"; // Update for production

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    // Add dynamic routes here by fetching from your API/DB
  ];
}

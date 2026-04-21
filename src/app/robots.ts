import { MetadataRoute } from "next";

/**
 * Standard Robots.txt generator for Next.js App Router.
 * Configures how search engine crawlers should interact with the site.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/private/",
    },
    sitemap: "https://your-domain.com/sitemap.xml", // Update for production
  };
}

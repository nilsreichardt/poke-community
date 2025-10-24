import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { listAutomationSlugs } from "@/lib/data/automations";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  let automations: Awaited<ReturnType<typeof listAutomationSlugs>> = [];

  try {
    automations = await listAutomationSlugs();
  } catch (error) {
    console.error("Failed to build automation sitemap entries", error);
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/automations"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/submit"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: absoluteUrl("/imprint"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: absoluteUrl("/privacy"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: absoluteUrl("/terms"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const automationRoutes: MetadataRoute.Sitemap = automations.map(
    (automation) => {
      const lastModified =
        automation.updated_at ?? automation.created_at ?? now.toISOString();
      return {
        url: absoluteUrl(`/automations/${automation.slug}`),
        lastModified: new Date(lastModified),
        changeFrequency: "weekly",
        priority: 0.7,
      };
    }
  );

  return [...staticRoutes, ...automationRoutes];
}

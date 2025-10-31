const rawSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined) ??
  "http://localhost:3000";

const normalizedSiteUrl = rawSiteUrl.replace(/\/+$/, "");

export const siteMetadata = {
  name: "poke.community",
  shortName: "poke.community",
  description:
    "Discover and share community-curated Poke automations. Explore trending workflows, vote on favorites, and stay inspired with the latest playbooks.",
  url: normalizedSiteUrl,
  locale: "en_US",
  keywords: [
    "Poke automations",
    "workflow templates",
    "automation community",
    "AI workflow inspiration",
    "Poke integrations",
    "automation marketplace",
  ],
  author: "poke.community",
  defaultOgImage: "/opengraph-image",
};

export function metadataBaseUrl() {
  return new URL(siteMetadata.url);
}

export function absoluteUrl(path = "/") {
  return new URL(path, siteMetadata.url).toString();
}

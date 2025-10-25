import type { Metadata } from "next";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AutomationCard } from "@/components/automation/automation-card";
import { getAutomations, getCurrentUser, getSubscriptionPreferences } from "@/lib/data/automations";
import { absoluteUrl, siteMetadata } from "@/lib/seo";
import { CompactNotificationSubscription } from "@/components/automations/notification-subscription";
import { AutoEnableSubscription } from "@/components/automations/auto-enable-subscription";

const pageTitle = "Community automations";
const pageDescription =
  "Browse every automation shared by the poke.community builders. Search by keyword, and find the perfect workflow to remix.";

export const metadata: Metadata = {
  title: `${pageTitle}`,
  description: pageDescription,
  alternates: {
    canonical: absoluteUrl("/automations"),
  },
  openGraph: {
    title: `${pageTitle} — ${siteMetadata.shortName}`,
    description: pageDescription,
    type: "website",
    url: absoluteUrl("/automations"),
  },
  twitter: {
    card: "summary_large_image",
    title: `${pageTitle} — ${siteMetadata.shortName}`,
    description: pageDescription,
  },
};

type AutomationsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

export default async function AutomationsPage({
  searchParams,
}: AutomationsPageProps) {
  const params = (await searchParams) ?? {};
  const rawQuery = normalizeParam(params.q);
  const q = rawQuery?.trim() ?? "";
  const sortParam = normalizeParam(params.sort) === "top" ? "top" : "new";

  const user = await getCurrentUser();
  const preferences = user ? (await getSubscriptionPreferences()) ?? new Map() : new Map();

  const automations = await getAutomations({
    search: q || undefined,
    orderBy: sortParam === "top" ? "top" : "new",
  });

  return (
    <div className="space-y-10">
      <AutoEnableSubscription isSignedIn={!!user} />
      <header className="grid gap-6 lg:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Community automations</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Browse every automation submitted by the poke community. Use the search to filter by topic or vote count, and
              click any card to view the full breakdown.
            </p>
          </div>
          <SearchForm defaultQuery={q} sort={sortParam} />
        </div>

        <div className="flex flex-col gap-4 lg:items-end mt-3.5">
          <CompactNotificationSubscription isSignedIn={!!user} preferences={preferences} />
          <div className="flex flex-wrap gap-3">
            <SortToggle current={sortParam} query={q} />
            <Button asChild>
              <Link href="/submit">Share your automation</Link>
            </Button>
          </div>
        </div>
      </header>

      {automations.length ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {automations.map((automation) => (
            <AutomationCard key={automation.id} automation={automation} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-border/70 bg-muted/30 p-8 text-sm text-muted-foreground">
          {q
            ? `No automations match "${q}". Try a different search term.`
            : "No automations submitted yet. Be the first to add one!"}
        </div>
      )}
    </div>
  );
}

function SearchForm({
  defaultQuery,
  sort,
}: {
  defaultQuery: string;
  sort: "new" | "top";
}) {
  return (
    <form className="flex w-full flex-col gap-3 sm:flex-row" action="/automations">
      <Input
        name="q"
        placeholder="Search by title, summary, or tags"
        defaultValue={defaultQuery}
        className="flex-1"
      />
      <input type="hidden" name="sort" value={sort} />
      <Button type="submit" variant="outline">
        Search
      </Button>
    </form>
  );
}

function SortToggle({
  current,
  query,
}: {
  current: "new" | "top";
  query: string;
}) {
  const nextSort = current === "new" ? "top" : "new";
  const label = current === "new" ? "Sort by votes" : "Sort by newest";
  const params = new URLSearchParams();
  params.set("sort", nextSort);
  if (query) {
    params.set("q", query);
  }
  const href = `/automations?${params.toString()}`;

  return (
    <Button asChild variant="secondary">
      <Link href={href}>{label}</Link>
    </Button>
  );
}

function normalizeParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? undefined;
  }
  return value ?? undefined;
}

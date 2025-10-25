import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AutomationCard } from "@/components/automation/automation-card";
import {
  getAutomations,
  getTrendingAutomations,
} from "@/lib/data/automations";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  alternates: {
    canonical: absoluteUrl("/"),
  },
};

// const isProduction = process.env.NODE_ENV === "production";

export default async function Home() {
  // if (isProduction) {
  //   return (
  //     <main className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)]">
  //       <div className="w-full">
  //         <LandingHeroSection />
  //       </div>
  //     </main>
  //   );
  // }

  const [top, trending, latest] = await Promise.all([
    getAutomations({ limit: 4, orderBy: "top" }),
    getTrendingAutomations(4),
    getAutomations({ limit: 6, orderBy: "new" }),
  ]);

  return (
    <div className="space-y-16">
      <HeroSection />

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Top automations</h2>
            <p className="text-sm text-muted-foreground">
              Community favorites ranked by total votes.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/automations?sort=top">See leaderboard</Link>
          </Button>
        </div>
        {top.length ? (
          <div className="grid gap-6 md:grid-cols-2">
            {top.map((automation) => (
              <AutomationCard key={automation.id} automation={automation} />
            ))}
          </div>
        ) : (
          <EmptyState message="No automations ranked yet. Share your go-to workflow to get things started!" />
        )}
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Trending this week</h2>
            <p className="text-sm text-muted-foreground">
              Automations getting the most love right now.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/automations?sort=top">See leaderboard</Link>
          </Button>
        </div>
        {trending.length ? (
          <div className="grid gap-6 md:grid-cols-2">
            {trending.map((automation) => (
              <AutomationCard key={automation.id} automation={automation} />
            ))}
          </div>
        ) : (
          <EmptyState message="No trending automations yet. Share your favorite Poke workflow to kick things off!" />
        )}
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Latest drops</h2>
            <p className="text-sm text-muted-foreground">
              Fresh automations from the community.
            </p>
          </div>
          <Button asChild>
            <Link href="/automations">Browse all</Link>
          </Button>
        </div>
        {latest.length ? (
          <div className="grid gap-6 md:grid-cols-2">
            {latest.map((automation) => (
              <AutomationCard key={automation.id} automation={automation} />
            ))}
          </div>
        ) : (
          <EmptyState message="No automations posted yet. Be the first to publish one!" />
        )}
      </section>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-background to-secondary/40 p-10 sm:p-12">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
        <div className="max-w-xl space-y-6">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Discover & Share Poke Automations
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Don’t rely on luck to find great automations on X. Explore, share, and follow the best Poke automations — and get notified when new ones start trending.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button size="lg" asChild>
              <Link href="/submit">Share an automation</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/automations">Browse automations</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            poke.community is an independent project and is not affiliated with or endorsed by{" "}
            <Link href="https://poke.com" target="_blank" rel="noopener noreferrer" className="hover:underline">
              Poke
            </Link>{" "}
            or{" "}
            <Link href="https://interaction.co/about" target="_blank" rel="noopener noreferrer" className="hover:underline">
              The Interaction Company of California
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}

function LandingHeroSection() {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-background to-secondary/40 p-10 sm:p-12">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
        <div className="max-w-xl space-y-6">
          <p className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            poke.community
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Discover & Share Poke Automations
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Don’t rely on luck to find great automations on X. Explore, share, and follow the best Poke automations — and get notified when new ones start trending.
          </p>
          <p className="text-sm font-medium text-primary">More coming soon.</p>
          <p className="text-xs text-muted-foreground">
            poke.community is an independent project and is not affiliated with or endorsed by{" "}
            <Link href="https://poke.com" target="_blank" rel="noopener noreferrer" className="hover:underline">
              Poke
            </Link>{" "}
            or{" "}
            <Link href="https://interaction.co/about" target="_blank" rel="noopener noreferrer" className="hover:underline">
              The Interaction Company of California
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border/70 bg-muted/30 p-8 text-sm text-muted-foreground">
      {message}
    </div>
  );
}

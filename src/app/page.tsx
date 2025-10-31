import type { Metadata } from "next";
import Link from "next/link";
import { CloudOff } from "lucide-react";
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

export default async function Home() {
  let top: Awaited<ReturnType<typeof getAutomations>> = [];
  let trending: Awaited<ReturnType<typeof getTrendingAutomations>> = [];
  let latest: Awaited<ReturnType<typeof getAutomations>> = [];

  try {
    [top, trending, latest] = await Promise.all([
      getAutomations({ limit: 4, orderBy: "top" }),
      getTrendingAutomations(4),
      getAutomations({ limit: 6, orderBy: "new" }),
    ]);
  } catch (error) {
    return (
      <ServiceUnavailable message={getServiceOutageMessage(error)} />
    );
  }

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

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border/70 bg-muted/30 p-8 text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function ServiceUnavailable({ message }: { message: string }) {
  return (
    <main className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4">
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-border/60 bg-background/80 p-10 shadow-2xl">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-secondary/30 opacity-80 blur-2xl" />
        <div className="relative space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CloudOff className="h-8 w-8" aria-hidden="true" />
          </div>
          <div className="space-y-3">
            <h1 className="text-2xl font-semibold">We can’t reach our automations right now</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {message}
            </p>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>
              We&apos;re working to restore the connection. You can try refreshing the page in a moment or send email to our support{" "}
              <Link
                href="mailto:hi@poke.community"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                hi@poke.community
              </Link>
              .
            </p>
            <Button asChild variant="outline">
              <Link href="/">Retry now</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}

function getServiceOutageMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return refineOutageCopy(error.message);
  }

  if (typeof error === "string") {
    return refineOutageCopy(error);
  }

  return "Our data service is temporarily unreachable. Please try again soon.";
}

function refineOutageCopy(rawMessage: string): string {
  if (!rawMessage) {
    return "Our data service is temporarily unreachable. Please try again soon.";
  }

  const networkCopy = rawMessage.match(
    /(Our data service is temporarily unreachable[^.]*(?:\.)?)/
  );
  if (networkCopy?.[0]) {
    return networkCopy[0].trim();
  }

  const colonIndex = rawMessage.indexOf(":");
  if (colonIndex !== -1 && colonIndex + 1 < rawMessage.length) {
    return rawMessage.slice(colonIndex + 1).trim();
  }

  const periodIndex = rawMessage.indexOf(".");
  if (periodIndex !== -1 && periodIndex + 1 < rawMessage.length) {
    return rawMessage.slice(periodIndex + 1).trim();
  }

  return rawMessage;
}

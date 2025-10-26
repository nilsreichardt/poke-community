import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { format } from "date-fns";
import { getAutomationBySlug, getCurrentUser } from "@/lib/data/automations";
import { VoteControls } from "@/components/automation/vote-controls";
import { Badge } from "@/components/ui/badge";
import { PromptBlock } from "@/components/automation/prompt-block";
import { cn } from "@/lib/utils";
import { absoluteUrl, siteMetadata } from "@/lib/seo";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PencilIcon } from "lucide-react";

type AutomationPageParams = {
  slug: string;
};

type AutomationPageProps = {
  params?: Promise<AutomationPageParams>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: AutomationPageProps): Promise<Metadata> {
  const resolvedParams = params ? await params : null;

  if (!resolvedParams?.slug) {
    return {
      title: "Automation not found",
      description: "The automation you requested could not be located.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const automation = await getAutomationBySlug(resolvedParams.slug);

  if (!automation) {
    return {
      title: "Automation not found",
      description: "The automation you requested could not be located.",
      robots: {
        index: false,
        follow: false,
      },
      alternates: {
        canonical: absoluteUrl(`/automations/${resolvedParams.slug}`),
      },
    };
  }

  const summary =
    automation.summary ??
    "Explore setup details, prompts, and community sentiment for this poke.community automation.";
  const canonical = absoluteUrl(`/automations/${automation.slug}`);
  const ogImageUrl = absoluteUrl(
    `/automations/${automation.slug}/opengraph-image`
  );

  const publishedTime = automation.created_at ?? undefined;
  const modifiedTime = automation.updated_at ?? automation.created_at ?? undefined;

  return {
    title: `${automation.title} — ${siteMetadata.shortName}`,
    description: summary,
    alternates: {
      canonical,
    },
    openGraph: {
      type: "article",
      title: `${automation.title} — ${siteMetadata.shortName}`,
      description: summary,
      url: canonical,
      siteName: siteMetadata.name,
      publishedTime,
      modifiedTime,
      authors: automation.profiles?.name ? [automation.profiles.name] : undefined,
      tags: automation.tags ?? undefined,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: automation.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${automation.title} — ${siteMetadata.shortName}`,
      description: summary,
      images: [ogImageUrl],
    },
  };
}

export default async function AutomationPage({ params }: AutomationPageProps) {
  const resolvedParams = params ? await params : null;

  if (!resolvedParams?.slug) {
    notFound();
  }

  const automation = await getAutomationBySlug(resolvedParams.slug);

  if (!automation) {
    notFound();
  }

  const user = await getCurrentUser();
  const isAuthor = user?.id === automation.user_id;

  const canonicalUrl = absoluteUrl(`/automations/${automation.slug}`);
  const authorName = automation.profiles?.name ?? null;
  const createdAt = automation.created_at
    ? new Date(automation.created_at)
    : null;
  const createdLabel = createdAt ? format(createdAt, "PP") : "Recently";

  return (
    <article className="space-y-10">
      <AutomationJsonLd
        automation={automation}
        canonicalUrl={canonicalUrl}
      />
      <section className="space-y-8 rounded-2xl border border-border bg-card/70 p-8 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Shared {createdLabel}
              </span>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight">
                {automation.title}
              </h1>
              {automation.summary ? (
                <p className="text-base text-muted-foreground">
                  {automation.summary}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>Shared by {authorName ?? "Anonymous member"}</span>
              <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/50 sm:inline-block" />
              <span>{automation.vote_total} total votes</span>
            </div>
            {automation.tags?.length ? (
              <div className="flex flex-wrap gap-2">
                {automation.tags.map((tag: string) => (
                  <Badge key={tag} variant="outline" className="text-xs uppercase">
                    #{tag}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex flex-col items-stretch gap-3">
            {isAuthor && (
              <Button asChild size="sm" variant="outline">
                <Link href={`/dashboard/${automation.id}/edit`}>
                  <PencilIcon className="-ml-0.5 h-4 w-4" />
                  Edit
                </Link>
              </Button>
            )}
            <VoteControls
              automationId={automation.id}
              initialVote={automation.user_vote ?? 0}
              voteTotal={automation.vote_total}
            />
          </div>
        </div>

        {automation.description ? (
          <div className="space-y-4 text-sm leading-relaxed text-foreground">
            <h2 className="text-lg font-semibold">Automation overview</h2>
            <div className="space-y-4">
              <ReactMarkdown components={markdownComponents}>
                {automation.description}
              </ReactMarkdown>
            </div>
          </div>
        ) : null}

        {automation.prompt ? (
          <PromptBlock
            prompt={automation.prompt}
            variant="plain"
            className="border-t border-border/60 pt-6"
          />
        ) : null}
      </section>
    </article>
  );
}

const markdownComponents: Components = {
  p: ({ className, children, ...props }) => (
    <p
      {...props}
      className={cn("leading-relaxed text-foreground/90", className)}
    >
      {children}
    </p>
  ),
  a: ({ className, children, href, ...props }) => (
    <a
      {...props}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "font-medium text-primary underline-offset-2 hover:underline",
        className
      )}
    >
      {children}
    </a>
  ),
  code: ({ className, children, ...props }) => (
    <code
      {...props}
      className={cn("rounded bg-muted px-1 py-0.5 text-xs", className)}
    >
      {children}
    </code>
  ),
  ul: ({ className, children, ...props }) => (
    <ul
      {...props}
      className={cn("ml-4 list-disc space-y-1", className)}
    >
      {children}
    </ul>
  ),
  ol: ({ className, children, ...props }) => (
    <ol
      {...props}
      className={cn("ml-4 list-decimal space-y-1", className)}
    >
      {children}
    </ol>
  ),
  h2: ({ className, children, ...props }) => (
    <h2
      {...props}
      className={cn("text-lg font-semibold text-foreground", className)}
    >
      {children}
    </h2>
  ),
  h3: ({ className, children, ...props }) => (
    <h3
      {...props}
      className={cn("text-base font-semibold text-foreground", className)}
    >
      {children}
    </h3>
  ),
};

type AutomationForJsonLd = NonNullable<
  Awaited<ReturnType<typeof getAutomationBySlug>>
>;

function AutomationJsonLd({
  automation,
  canonicalUrl,
}: {
  automation: AutomationForJsonLd;
  canonicalUrl: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: automation.title,
    abstract: automation.summary ?? undefined,
    datePublished: automation.created_at ?? undefined,
    dateModified:
      automation.updated_at ?? automation.created_at ?? undefined,
    url: canonicalUrl,
    mainEntityOfPage: canonicalUrl,
    author: automation.profiles?.name
      ? {
          "@type": "Person",
          name: automation.profiles.name,
        }
      : {
          "@type": "Organization",
          name: siteMetadata.name,
        },
    keywords: automation.tags?.length ? automation.tags : undefined,
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/LikeAction",
      userInteractionCount: automation.vote_total ?? 0,
    },
  };

  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { format } from "date-fns";
import { getAutomationBySlug } from "@/lib/data/automations";
import { VoteControls } from "@/components/automation/vote-controls";
import { Badge } from "@/components/ui/badge";
import { PromptBlock } from "@/components/automation/prompt-block";
import { cn } from "@/lib/utils";

type AutomationPageParams = {
  slug: string;
};

type AutomationPageProps = {
  params?: Promise<AutomationPageParams>;
};

export const dynamic = "force-dynamic";

export default async function AutomationPage({ params }: AutomationPageProps) {
  const resolvedParams = params ? await params : null;

  if (!resolvedParams?.slug) {
    notFound();
  }

  const automation = await getAutomationBySlug(resolvedParams.slug);

  if (!automation) {
    notFound();
  }

  return (
    <article className="space-y-10">
      <header className="flex flex-col gap-6 rounded-2xl border border-border bg-card/70 p-8 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Shared {format(new Date(automation.created_at), "PP")}
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
            <span>Shared by {automation.profiles?.username ?? "Community member"}</span>
            <span className="hidden h-1 w-1 rounded-full bg-muted-foreground/50 sm:inline-block" />
            <span>{automation.vote_total} total votes</span>
          </div>
          {automation.tags?.length ? (
            <div className="flex flex-wrap gap-2">
              {automation.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs uppercase">
                  #{tag}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:w-56">
          <VoteControls
            automationId={automation.id}
            initialVote={automation.user_vote ?? 0}
            voteTotal={automation.vote_total}
          />
        </div>
      </header>

      <PromptBlock prompt={automation.prompt} />

      {automation.description ? (
        <section className="space-y-4 rounded-2xl border border-border bg-card/40 p-8 text-sm leading-relaxed text-foreground">
          <h2 className="text-lg font-semibold">Automation overview</h2>
          <div className="space-y-4">
            <ReactMarkdown components={markdownComponents}>
              {automation.description}
            </ReactMarkdown>
          </div>
        </section>
      ) : null}
    </article>
  );
}

const markdownComponents: Components = {
  p: ({ node: _node, className, children, ...props }) => (
    <p
      {...props}
      className={cn("leading-relaxed text-foreground/90", className)}
    >
      {children}
    </p>
  ),
  a: ({ node: _node, className, children, href, ...props }) => (
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
  code: ({ node: _node, className, children, ...props }) => (
    <code
      {...props}
      className={cn("rounded bg-muted px-1 py-0.5 text-xs", className)}
    >
      {children}
    </code>
  ),
  ul: ({ node: _node, className, children, ...props }) => (
    <ul
      {...props}
      className={cn("ml-4 list-disc space-y-1", className)}
    >
      {children}
    </ul>
  ),
  ol: ({ node: _node, className, children, ...props }) => (
    <ol
      {...props}
      className={cn("ml-4 list-decimal space-y-1", className)}
    >
      {children}
    </ol>
  ),
  h2: ({ node: _node, className, children, ...props }) => (
    <h2
      {...props}
      className={cn("text-lg font-semibold text-foreground", className)}
    >
      {children}
    </h2>
  ),
  h3: ({ node: _node, className, children, ...props }) => (
    <h3
      {...props}
      className={cn("text-base font-semibold text-foreground", className)}
    >
      {children}
    </h3>
  ),
};

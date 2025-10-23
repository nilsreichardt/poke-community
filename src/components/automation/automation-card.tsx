import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AutomationRecord } from "@/lib/supabase/types";
import { VoteControls } from "./vote-controls";

type AutomationCardProps = {
  automation: AutomationRecord & {
    profiles: {
      id: string;
      username: string | null;
      avatar_url: string | null;
    } | null;
    user_vote?: number;
    recent_votes?: number;
  };
};

export function AutomationCard({ automation }: AutomationCardProps) {
  const ownerName =
    automation.profiles?.username ??
    automation.profiles?.id?.slice(0, 8) ??
    "Community member";
  const createdDistance = formatDistanceToNow(new Date(automation.created_at), {
    addSuffix: true,
  });

  return (
    <Card className="flex h-full flex-col border-border/80" data-testid="automation-card">
      <CardHeader className="flex-1 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <CardTitle className="text-lg font-semibold">
              <Link href={`/automations/${automation.slug}`} className="hover:underline">
                {automation.title}
              </Link>
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Shared by {ownerName} · {createdDistance}
            </p>
          </div>
        </div>
        {automation.summary ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {automation.summary}
          </p>
        ) : null}
        {automation.tags?.length ? (
          <div className="flex flex-wrap gap-2">
            {automation.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs uppercase">
                {tag}
              </Badge>
            ))}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <p className="line-clamp-3 whitespace-pre-line">{automation.description}</p>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Prompt</p>
          <pre className="line-clamp-6 whitespace-pre-wrap rounded-md bg-muted px-3 py-2 font-mono text-xs leading-5 text-foreground/80">
            {automation.prompt}
          </pre>
        </div>
      </CardContent>
      <CardFooter className="mt-auto flex items-center justify-between gap-4 border-t border-border/60 bg-muted/40">
        <VoteControls
          automationId={automation.id}
          initialVote={automation.user_vote ?? 0}
          voteTotal={automation.vote_total}
        />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
            {automation.category}
          </span>
          {typeof automation.recent_votes === "number" ? (
            <span>{automation.recent_votes} votes this week</span>
          ) : null}
        </div>
      </CardFooter>
    </Card>
  );
}

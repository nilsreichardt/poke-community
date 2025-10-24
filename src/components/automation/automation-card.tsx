"use client";

import Link from "next/link";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { AutomationRecord } from "@/lib/supabase/records";
import { VoteControls } from "./vote-controls";

type AutomationCardProps = {
  automation: AutomationRecord & {
    profiles: {
      id: string;
      name: string | null;
      avatar_url: string | null;
    } | null;
    user_vote?: number;
    recent_votes?: number;
  };
};

export function AutomationCard({ automation }: AutomationCardProps) {
  const [isHeaderHover, setIsHeaderHover] = useState(false);
  const ownerName =
    automation.profiles?.name ??
    "Anonymous member";
  const createdAt = automation.created_at
    ? new Date(automation.created_at)
    : null;
  const createdDistance = createdAt
    ? formatDistanceToNow(createdAt, { addSuffix: true })
    : "Recently";

  return (
    <Card
      className={`flex h-full flex-col overflow-hidden border-border/80 py-0 transition-shadow ${
        isHeaderHover ? "shadow-lg" : "shadow-sm"
      }`}
      data-testid="automation-card"
    >
      <Link
        href={`/automations/${automation.slug}`}
        className="block flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Open automation ${automation.title}`}
        onMouseEnter={() => setIsHeaderHover(true)}
        onMouseLeave={() => setIsHeaderHover(false)}
        onFocus={() => setIsHeaderHover(true)}
        onBlur={() => setIsHeaderHover(false)}
      >
        <CardHeader className="space-y-3 pt-6 cursor-pointer">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5">
              <CardTitle className="text-lg font-semibold">
                {automation.title}
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
        </CardHeader>
      </Link>
      <CardFooter className="mt-auto flex items-center justify-between gap-4 border-t border-border/60 bg-muted/40 pb-6">
        <VoteControls
          automationId={automation.id}
          initialVote={automation.user_vote ?? 0}
          voteTotal={automation.vote_total}
        />
      </CardFooter>
    </Card>
  );
}

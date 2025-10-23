"use client";

import { useOptimistic, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ArrowBigUp, ArrowBigDown } from "lucide-react";
import { toggleVoteAction } from "@/app/actions/automation-actions";
import { useSupabase } from "@/components/providers/supabase-provider";
import { Button } from "@/components/ui/button";

type VoteState = {
  total: number;
  userVote: number;
};

type VoteControlsProps = {
  automationId: string;
  initialVote: number;
  voteTotal: number;
};

export function VoteControls({
  automationId,
  initialVote,
  voteTotal,
}: VoteControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { session } = useSupabase();
  const [optimisticVote, setOptimisticVote] = useOptimistic<VoteState, 1 | -1>(
    {
      total: voteTotal,
      userVote: initialVote,
    },
    (state, newVote) => {
      const toggled =
        state.userVote === newVote ? { userVote: 0, total: state.total - newVote } : {
          userVote: newVote,
          total: state.total - state.userVote + newVote,
        };
      return toggled;
    }
  );
  const [isPending, startTransition] = useTransition();

  const handleVote = (value: 1 | -1) => {
    if (!session) {
      const searchString = searchParams.toString();
      const redirectTarget = searchString ? `${pathname}?${searchString}` : pathname;
      router.push(`/auth/sign-in?redirectTo=${encodeURIComponent(redirectTarget)}`);
      return;
    }

    setOptimisticVote(value);

    startTransition(async () => {
      try {
        await toggleVoteAction(automationId, value);
      } catch (error) {
        console.error("Unable to update vote", error);
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="icon"
        variant={optimisticVote.userVote === 1 ? "default" : "outline"}
        onClick={() => handleVote(1)}
        disabled={isPending}
        aria-label="Upvote automation"
      >
        <ArrowBigUp className="h-5 w-5" />
      </Button>
      <span className="w-10 text-center text-sm font-semibold">
        {optimisticVote.total}
      </span>
      <Button
        type="button"
        size="icon"
        variant={optimisticVote.userVote === -1 ? "default" : "outline"}
        onClick={() => handleVote(-1)}
        disabled={isPending}
        aria-label="Downvote automation"
      >
        <ArrowBigDown className="h-5 w-5" />
      </Button>
    </div>
  );
}

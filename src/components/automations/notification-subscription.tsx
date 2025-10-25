"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toggleSubscriptionAction } from "@/app/actions/automation-actions";

type CompactSubscriptionSwitchProps = {
  type: "new" | "trending";
  label: string;
  defaultChecked: boolean;
  isSignedIn: boolean;
};

function CompactSubscriptionSwitch({
  type,
  label,
  defaultChecked,
  isSignedIn,
}: CompactSubscriptionSwitchProps) {
  const [checked, setChecked] = useState(defaultChecked);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleToggle = (nextValue: boolean) => {
    if (!isSignedIn) {
      // Pass the subscription type in the return URL
      const nextUrl = `/automations?enableSubscription=${type}`;
      router.push(`/auth/sign-in?next=${encodeURIComponent(nextUrl)}`);
      return;
    }

    setChecked(nextValue);
    startTransition(async () => {
      try {
        await toggleSubscriptionAction(type, nextValue);
      } catch (error) {
        console.error("Unable to update subscription", error);
        setChecked((prev) => !prev);
      }
    });
  };

  const tooltipMessage = type === "new"
    ? "Get notifications about new automations"
    : "Get notifications about trending automations";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-sm font-medium leading-none flex-1">{label}</span>
          <Switch checked={checked} onCheckedChange={handleToggle} disabled={isPending} className="cursor-pointer" />
        </label>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltipMessage}</p>
      </TooltipContent>
    </Tooltip>
  );
}

type CompactNotificationSubscriptionProps = {
  isSignedIn: boolean;
  preferences: Map<string, boolean>;
};

export function CompactNotificationSubscription({
  isSignedIn,
  preferences,
}: CompactNotificationSubscriptionProps) {
  return (
    <TooltipProvider>
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Email notifications
        </p>
        <div className="space-y-2 items-end">
          <CompactSubscriptionSwitch
            type="new"
            label="New"
            defaultChecked={preferences.get("new") ?? false}
            isSignedIn={isSignedIn}
          />
          <CompactSubscriptionSwitch
            type="trending"
            label="Trending"
            defaultChecked={preferences.get("trending") ?? false}
            isSignedIn={isSignedIn}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}

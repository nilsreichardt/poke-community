"use client";

import { useState, useTransition } from "react";
import { Switch } from "@/components/ui/switch";
import { toggleSubscriptionAction } from "@/app/actions/automation-actions";

type SubscriptionSwitchProps = {
  type: "new" | "trending";
  label: string;
  description: string;
  defaultChecked: boolean;
};

export function SubscriptionSwitch({
  type,
  label,
  description,
  defaultChecked,
}: SubscriptionSwitchProps) {
  const [checked, setChecked] = useState(defaultChecked);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (nextValue: boolean) => {
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

  return (
    <label className="flex items-start justify-between gap-4 rounded-lg border border-border/70 bg-background/70 p-4">
      <div className="space-y-1">
        <span className="text-sm font-medium leading-none">{label}</span>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={handleToggle} disabled={isPending} />
    </label>
  );
}

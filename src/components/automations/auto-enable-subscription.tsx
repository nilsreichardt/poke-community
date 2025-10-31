"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toggleSubscriptionAction } from "@/app/actions/automation-actions";

type AutoEnableSubscriptionProps = {
  isSignedIn: boolean;
};

export function AutoEnableSubscription({
  isSignedIn,
}: AutoEnableSubscriptionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const enableSubscription = searchParams.get("enableSubscription");

    if (isSignedIn && enableSubscription) {
      if (enableSubscription === "new" || enableSubscription === "trending") {
        toggleSubscriptionAction(enableSubscription, true)
          .then(() => {
            const params = new URLSearchParams(searchParams.toString());
            params.delete("enableSubscription");
            const newUrl = params.toString()
              ? `/automations?${params.toString()}`
              : "/automations";
            router.replace(newUrl);

            // Refresh to get updated subscription preferences
            router.refresh();
          })
          .catch((error) => {
            console.error("Unable to auto-enable subscription", error);
            const params = new URLSearchParams(searchParams.toString());
            params.delete("enableSubscription");
            const newUrl = params.toString()
              ? `/automations?${params.toString()}`
              : "/automations";
            router.replace(newUrl);
          });
      }
    }
  }, [isSignedIn, searchParams, router]);

  return null;
}

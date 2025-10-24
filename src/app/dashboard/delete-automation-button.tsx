"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteAutomationAction } from "@/app/actions/automation-actions";
import { Button } from "@/components/ui/button";

type DeleteAutomationButtonProps = {
  automationId: string;
  automationTitle: string;
};

export function DeleteAutomationButton({
  automationId,
  automationTitle,
}: DeleteAutomationButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${automationTitle}"? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("automationId", automationId);
        await deleteAutomationAction(formData);
        router.refresh();
      } catch (error) {
        console.error("Unable to delete automation", error);
        window.alert(
          "We couldn't delete that automation. Please try again."
        );
      }
    });
  };

  return (
    <Button
      type="button"
      size="sm"
      variant="destructive"
      onClick={handleDelete}
      disabled={isPending}
    >
      {isPending ? "Deleting..." : "Delete"}
    </Button>
  );
}


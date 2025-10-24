"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function DeleteAccountButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="destructive"
      disabled={pending}
      onClick={(event) => {
        if (pending) {
          return;
        }

        const confirmed = window.confirm(
          "This will permanently delete your account and all associated data. This action cannot be undone. Are you absolutely sure?"
        );

        if (!confirmed) {
          event.preventDefault();
          return;
        }
      }}
    >
      {pending ? "Deleting..." : "Delete account"}
    </Button>
  );
}

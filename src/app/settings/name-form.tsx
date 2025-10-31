"use client";

import { useActionState } from "react";
import { updateProfileNameAction } from "@/app/actions/automation-actions";
import {
  updateNameFormInitialState,
  type UpdateNameFormState,
} from "@/app/actions/form-states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type NameFormProps = {
  initialName: string | null;
};

export function NameForm({ initialName }: NameFormProps) {
  const [state, formAction, pending] = useActionState<
    UpdateNameFormState,
    FormData
  >(updateProfileNameAction, updateNameFormInitialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="name" className="text-sm font-medium leading-none">
          Name
        </label>
        <Input
          id="name"
          name="name"
          defaultValue={initialName ?? ""}
          placeholder="How should we refer to you?"
          aria-describedby="name-help"
          disabled={pending}
        />
        <p id="name-help" className="text-xs text-muted-foreground">
          This appears next to automations you share. Leave blank to stay
          anonymous.
        </p>
        {state.status === "error" && state.message ? (
          <p className="text-xs text-destructive" role="alert">
            {state.message}
          </p>
        ) : null}
        {state.status === "success" && state.message ? (
          <p className="text-xs text-muted-foreground" role="status">
            {state.message}
          </p>
        ) : null}
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save name"}
      </Button>
    </form>
  );
}

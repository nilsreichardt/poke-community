"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { requestPasswordSignIn } from "@/app/actions/automation-actions";
import { passwordSignInInitialState } from "@/app/actions/form-states";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type SignInFormProps = {
  redirectTo: string;
};

export function SignInForm({ redirectTo }: SignInFormProps) {
  const [state, formAction] = useActionState(
    requestPasswordSignIn,
    passwordSignInInitialState
  );

  return (
    <form className="flex flex-col gap-4" action={formAction}>
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <label className="flex flex-col gap-2 text-sm">
        Email address
        <Input
          type="email"
          name="email"
          placeholder="you@example.com"
          required
          autoComplete="email"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm">
        Password
        <Input
          type="password"
          name="password"
          placeholder="your password"
          required
          autoComplete="current-password"
          minLength={4}
        />
      </label>
      <SubmitButton />
      {state.message ? (
        <p
          className={`text-sm ${
            state.status === "success"
              ? "text-emerald-600"
              : state.status === "error"
                ? "text-destructive"
                : ""
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Signing in..." : "Sign in"}
    </Button>
  );
}

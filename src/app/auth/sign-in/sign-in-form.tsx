"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  requestGoogleSignIn,
  requestPasswordSignIn,
} from "@/app/actions/automation-actions";
import {
  googleSignInInitialState,
  passwordSignInInitialState,
} from "@/app/actions/form-states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SignInFormProps = {
  redirectTo: string;
  googleErrorMessage?: string | null;
};

export function SignInForm({
  redirectTo,
  googleErrorMessage,
}: SignInFormProps) {
  const [passwordState, passwordFormAction] = useActionState(
    requestPasswordSignIn,
    passwordSignInInitialState
  );
  const googleInitialState = googleErrorMessage
    ? {
        status: "error" as const,
        message: googleErrorMessage,
      }
    : googleSignInInitialState;
  const [googleState, googleFormAction] = useActionState(
    requestGoogleSignIn,
    googleInitialState
  );

  return (
    <div className="flex flex-col gap-6">
      <form className="flex flex-col gap-3" action={googleFormAction}>
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <GoogleSubmitButton />
      </form>
      {googleState.status === "error" && googleState.message ? (
        <p className="text-sm text-destructive">{googleState.message}</p>
      ) : null}
      <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        <span>Or continue with email</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <form className="flex flex-col gap-4" action={passwordFormAction}>
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
        <PasswordSubmitButton />
        {passwordState.message ? (
          <p
            className={`text-sm ${
              passwordState.status === "success"
                ? "text-emerald-600"
                : passwordState.status === "error"
                  ? "text-destructive"
                  : ""
            }`}
          >
            {passwordState.message}
          </p>
        ) : null}
      </form>
    </div>
  );
}

function PasswordSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Signing in..." : "Sign in"}
    </Button>
  );
}

function GoogleSubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" disabled={pending}>
      {pending ? "Redirecting..." : "Continue with Google"}
    </Button>
  );
}

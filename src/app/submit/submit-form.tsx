"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { createAutomationAction } from "@/app/actions/automation-actions";
import { automationFormInitialState } from "@/app/actions/form-states";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function AutomationForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(
    createAutomationAction,
    automationFormInitialState
  );

  useEffect(() => {
    if (state.status === "success" && state.slug) {
      router.push(`/automations/${state.slug}`);
    }
  }, [state, router]);

  return (
    <form className="space-y-6" action={formAction}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" required>
          <Input
            name="title"
            placeholder="Give your automation a memorable name"
            maxLength={120}
            required
          />
        </Field>
      </div>
      <Field label="Summary" required hint="One-liner that appears in lists">
        <Input
          name="summary"
          placeholder="Who is this for and what problem does it solve?"
          maxLength={180}
          required
        />
      </Field>
      <Field
        label="Description"
        hint="Share the workflow, key steps, and any setup instructions. Markdown is supported."
      >
        <Textarea
          name="description"
          rows={8}
          placeholder={
            "Explain the automation in detail so others can reproduce it."
          }
        />
      </Field>
      <Field
        label="Prompt"
        required
        hint="Exact text to paste into Poke to recreate this automation."
      >
        <Textarea
          name="prompt"
          rows={5}
          required
          placeholder="Write a personalised welcome email for {{customer_name}} highlighting the onboarding checklist and assign follow-up tasks to the success team."
        />
      </Field>
      <Field label="Tags" hint="Comma separated tags such as marketing, onboarding">
        <Input
          name="tags"
          placeholder="automation, marketing, onboarding"
        />
      </Field>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          By publishing you agree to share this automation publicly. You can
          edit or delete it later from your dashboard.
        </p>
        <SubmitButton />
      </div>

      {state.status === "error" && state.message ? (
        <p className="text-sm text-destructive">{state.message}</p>
      ) : null}
    </form>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="font-medium">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </span>
      {children}
      {hint ? <span className="text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg">
      {pending ? "Publishing..." : "Publish automation"}
    </Button>
  );
}

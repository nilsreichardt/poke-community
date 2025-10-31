"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { updateAutomationAction } from "@/app/actions/automation-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MarkdownEditor } from "@/components/forms/markdown-editor";
import { Textarea } from "@/components/ui/textarea";
import type { AutomationForEditing } from "@/lib/data/automations";
import {
  type AutomationFormFieldErrors,
  type AutomationFormValues,
  validateAutomationForm,
} from "@/lib/validation/automation-form";

const TITLE_LIMIT = 120;
const SUMMARY_LIMIT = 180;
const DESCRIPTION_LIMIT = 8000;
const INITIAL_TOUCHED_STATE: Record<keyof AutomationFormValues, boolean> = {
  title: false,
  summary: false,
  description: false,
  prompt: false,
  tags: false,
};

type EditAutomationFormProps = {
  automation: AutomationForEditing;
};

export function EditAutomationForm({ automation }: EditAutomationFormProps) {
  const router = useRouter();
  const initialValues = useMemo<AutomationFormValues>(
    () => ({
      title: automation.title ?? "",
      summary: automation.summary ?? "",
      description: automation.description ?? "",
      prompt: automation.prompt ?? "",
      tags: Array.isArray(automation.tags) ? automation.tags.join(", ") : "",
    }),
    [automation],
  );

  const initialState = useMemo(
    () => ({
      status: "idle" as const,
      message: null,
      values: initialValues,
      fieldErrors: {},
      slug: automation.slug,
    }),
    [initialValues, automation.slug],
  );

  const [state, formAction] = useActionState(
    updateAutomationAction,
    initialState,
  );
  const [formValues, setFormValues] = useState(initialValues);
  const [fieldErrors, setFieldErrors] = useState<AutomationFormFieldErrors>(
    initialState.fieldErrors,
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [touchedFields, setTouchedFields] = useState(INITIAL_TOUCHED_STATE);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  useEffect(() => {
    setFormValues(initialValues);
    setFieldErrors(initialState.fieldErrors);
    setTouchedFields(INITIAL_TOUCHED_STATE);
    setSubmitError(null);
    setHasAttemptedSubmit(false);
  }, [initialValues, initialState.fieldErrors]);

  useEffect(() => {
    if (state.status === "success" && state.slug) {
      router.push(`/automations/${state.slug}`);
    }
  }, [state, router]);

  useEffect(() => {
    if (state.status === "error") {
      setFormValues(state.values);
      setFieldErrors(state.fieldErrors);
      setSubmitError(state.message);
      setHasAttemptedSubmit(true);
    }
  }, [state]);

  const getVisibleError = (field: keyof AutomationFormValues) => {
    if (!(hasAttemptedSubmit || touchedFields[field])) {
      return undefined;
    }

    return fieldErrors[field];
  };

  const visibleErrors = {
    title: getVisibleError("title"),
    summary: getVisibleError("summary"),
    description: getVisibleError("description"),
    prompt: getVisibleError("prompt"),
    tags: getVisibleError("tags"),
  };

  const handleChange =
    (field: keyof AutomationFormValues) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      setTouchedFields((prev) => ({
        ...prev,
        [field]: true,
      }));
      setFormValues((prev) => {
        const next = {
          ...prev,
          [field]: value,
        };
        const validation = validateAutomationForm(next);
        setFieldErrors(validation.fieldErrors);
        return next;
      });

      if (submitError) {
        setSubmitError(null);
      }
    };

  const handleBlur = (field: keyof AutomationFormValues) => () => {
    setTouchedFields((prev) => ({
      ...prev,
      [field]: true,
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    const validation = validateAutomationForm(formValues);
    setFieldErrors(validation.fieldErrors);
    setHasAttemptedSubmit(true);

    if (!validation.success) {
      event.preventDefault();
      setSubmitError("Please review the form fields and try again.");
      return;
    }

    setSubmitError(null);
  };

  return (
    <form
      className="space-y-6"
      action={formAction}
      noValidate
      onSubmit={handleSubmit}
    >
      <input type="hidden" name="automationId" value={automation.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Title"
          required
          error={visibleErrors.title}
          hintThresholdText={limitHint(formValues.title, TITLE_LIMIT)}
        >
          <Input
            name="title"
            placeholder="Give your automation a memorable name"
            maxLength={TITLE_LIMIT}
            required
            value={formValues.title}
            onChange={handleChange("title")}
            onBlur={handleBlur("title")}
            aria-invalid={Boolean(visibleErrors.title)}
          />
        </Field>
      </div>
      <Field
        label="Summary"
        required
        hint="One-liner that appears in lists"
        error={visibleErrors.summary}
        hintThresholdText={limitHint(formValues.summary, SUMMARY_LIMIT)}
      >
        <Input
          name="summary"
          placeholder="Who is this for and what problem does it solve?"
          maxLength={SUMMARY_LIMIT}
          required
          value={formValues.summary}
          onChange={handleChange("summary")}
          onBlur={handleBlur("summary")}
          aria-invalid={Boolean(visibleErrors.summary)}
        />
      </Field>
      <Field
        label="Description"
        hint="Share the workflow, key steps, and any setup instructions. Markdown is supported."
        error={visibleErrors.description}
        hintThresholdText={limitHint(formValues.description, DESCRIPTION_LIMIT)}
      >
        <MarkdownEditor
          name="description"
          rows={8}
          maxLength={DESCRIPTION_LIMIT}
          placeholder="Explain the automation in detail so others can reproduce it."
          value={formValues.description}
          onChange={handleChange("description")}
          onBlur={handleBlur("description")}
          aria-invalid={Boolean(visibleErrors.description)}
        />
      </Field>
      <Field
        label="Prompt"
        hint="Optional. Include the exact text if it helps others recreate this automation."
        error={visibleErrors.prompt}
      >
        <Textarea
          name="prompt"
          rows={5}
          placeholder="Write a personalised welcome email for {{customer_name}} highlighting the onboarding checklist and assign follow-up tasks to the success team."
          value={formValues.prompt}
          onChange={handleChange("prompt")}
          onBlur={handleBlur("prompt")}
          aria-invalid={Boolean(visibleErrors.prompt)}
        />
      </Field>
      <Field
        label="Tags"
        hint="Comma separated tags such as marketing, onboarding"
        error={visibleErrors.tags}
      >
        <Input
          name="tags"
          placeholder="automation, marketing, onboarding"
          value={formValues.tags}
          onChange={handleChange("tags")}
          onBlur={handleBlur("tags")}
          aria-invalid={Boolean(visibleErrors.tags)}
        />
      </Field>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Need to revert your edits? You can always make more changes or delete
          the automation later.
        </p>
        <SubmitButton />
      </div>

      {submitError ? (
        <p className="text-sm text-destructive">{submitError}</p>
      ) : null}
    </form>
  );
}

function Field({
  label,
  hint,
  required,
  error,
  hintThresholdText,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  hintThresholdText?: string | null;
  children: React.ReactNode;
}) {
  const hasHintRow = Boolean(hint || hintThresholdText);
  return (
    <label className="flex flex-col gap-2 text-sm">
      <span className="font-medium">
        {label}
        {required ? <span className="text-destructive"> *</span> : null}
      </span>
      {children}
      {hasHintRow ? (
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          {hint ? (
            <span className="text-xs text-muted-foreground">{hint}</span>
          ) : (
            <span />
          )}
          {hintThresholdText ? (
            <span className="text-xs text-muted-foreground">
              {hintThresholdText}
            </span>
          ) : null}
        </div>
      ) : null}
      {error ? <span className="text-xs text-destructive">{error}</span> : null}
    </label>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg">
      {pending ? "Saving..." : "Save changes"}
    </Button>
  );
}

function limitHint(value: string, limit: number) {
  if (!limit) {
    return null;
  }

  const remaining = limit - value.length;

  if (remaining < 0) {
    return `Over the limit by ${Math.abs(remaining)} characters (${limit} max)`;
  }

  const threshold = Math.min(50, Math.max(10, Math.floor(limit * 0.1)));

  if (remaining <= threshold) {
    return `${remaining} characters remaining (${limit} max)`;
  }

  return null;
}

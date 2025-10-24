import { z } from "zod";

export type AutomationFormValues = {
  title: string;
  summary: string;
  description: string;
  prompt: string;
  tags: string;
};

export type AutomationFormFieldErrors = Partial<
  Record<keyof AutomationFormValues, string>
>;

export type AutomationFormParsed = {
  title: string;
  summary: string;
  description: string | null;
  prompt: string;
  tags?: string;
};

export const automationSchema = z.object({
  title: z.string().min(4, "Title must be at least 4 characters long.").max(
    120,
    "Title cannot exceed 120 characters."
  ),
  summary: z
    .string()
    .min(1, "Summary is required.")
    .max(180, "Summary cannot exceed 180 characters."),
  description: z
    .string()
    .max(8000, "Description cannot exceed 8000 characters.")
    .nullable(),
  prompt: z.string().min(1, "Prompt is required."),
  tags: z.string().optional(),
});

export const emptyAutomationFormValues: AutomationFormValues = {
  title: "",
  summary: "",
  description: "",
  prompt: "",
  tags: "",
};

export function normalizeAutomationFormValues(
  values: AutomationFormValues
): AutomationFormParsed {
  const title = values.title.trim();
  const summary = values.summary.trim();
  const prompt = values.prompt.trim();

  const descriptionInput = values.description.trim();
  const description = descriptionInput.length ? descriptionInput : null;

  const tagsInput = values.tags.trim();
  const tags = tagsInput.length ? tagsInput : undefined;

  return {
    title,
    summary,
    description,
    prompt,
    tags,
  };
}

export function validateAutomationForm(
  values: AutomationFormValues
):
  | {
      success: true;
      data: AutomationFormParsed;
      fieldErrors: AutomationFormFieldErrors;
    }
  | {
      success: false;
      data: AutomationFormParsed;
      fieldErrors: AutomationFormFieldErrors;
    } {
  const normalized = normalizeAutomationFormValues(values);
  const parsed = automationSchema.safeParse(normalized);

  if (parsed.success) {
    return {
      success: true,
      data: parsed.data,
      fieldErrors: {},
    };
  }

  const zodErrors = parsed.error.flatten().fieldErrors;
  const fieldErrors: AutomationFormFieldErrors = {};

  for (const key of Object.keys(zodErrors) as Array<
    keyof typeof zodErrors
  >) {
    const issues = zodErrors[key];
    if (issues && issues.length) {
      fieldErrors[key as keyof AutomationFormValues] = issues[0];
    }
  }

  return {
    success: false,
    data: normalized,
    fieldErrors,
  };
}

export function formDataToAutomationFormValues(
  formData: FormData
): AutomationFormValues {
  const getValue = (field: string) => {
    const value = formData.get(field);
    return typeof value === "string" ? value : "";
  };

  return {
    title: getValue("title"),
    summary: getValue("summary"),
    description: getValue("description"),
    prompt: getValue("prompt"),
    tags: getValue("tags"),
  };
}

export function parsedToFormValues(
  parsed: AutomationFormParsed
): AutomationFormValues {
  return {
    title: parsed.title,
    summary: parsed.summary,
    description: parsed.description ?? "",
    prompt: parsed.prompt,
    tags: parsed.tags ?? "",
  };
}

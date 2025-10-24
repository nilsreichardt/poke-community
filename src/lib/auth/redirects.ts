import { revalidatePath } from "next/cache";

const FALLBACK_REDIRECT = "/";

function sanitizeRelativePath(value: string | null | undefined) {
  if (!value) {
    return FALLBACK_REDIRECT;
  }

  let normalized = value;

  try {
    normalized = decodeURIComponent(value);
  } catch {
    return FALLBACK_REDIRECT;
  }

  if (!normalized.startsWith("/") || normalized.startsWith("//")) {
    return FALLBACK_REDIRECT;
  }

  return normalized || FALLBACK_REDIRECT;
}

export function parseRedirectParam(
  value: string | string[] | undefined
): string {
  if (Array.isArray(value)) {
    return sanitizeRelativePath(value[0]);
  }

  return sanitizeRelativePath(value);
}

export function parseRedirectFormValue(
  value: FormDataEntryValue | null
): string {
  if (typeof value !== "string") {
    return FALLBACK_REDIRECT;
  }

  return sanitizeRelativePath(value);
}

export function revalidateAuthPaths(target: string) {
  const base = target.split("?")[0] || FALLBACK_REDIRECT;
  revalidatePath("/");
  revalidatePath("/automations");

  if (base !== "/" && base !== "/automations") {
    revalidatePath(base);
  }
}

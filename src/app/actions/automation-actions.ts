"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabase/server";
import type { SubscriptionType } from "@/lib/supabase/records";
import type { TablesInsert } from "@/lib/supabase/types";
import { getCurrentUser } from "@/lib/data/automations";
import { sendAutomationAnnouncement } from "@/lib/email/subscriptions";
import { upsertProfileFromSession } from "@/lib/profiles";
import { slugify } from "@/lib/slug";
import {
  formDataToAutomationFormValues,
  parsedToFormValues,
  validateAutomationForm,
} from "@/lib/validation/automation-form";
import type { AuthFormState, AutomationFormState } from "./form-states";

const passwordSignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});

export async function requestPasswordSignIn(
  _prevState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const parseResult = passwordSignInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parseResult.success) {
    return {
      status: "error",
      message: "Enter a valid email and password to sign in.",
    };
  }

  const { email, password } = parseResult.data;

  const redirectTo = parseRedirectPath(formData.get("redirectTo"));

  const supabase = await createSupabaseServerClient("mutate");
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      status: "error",
      message: error.message,
    };
  }

  if (data.user) {
    await upsertProfileFromSession(data.user);
  }

  revalidateAuthPaths(redirectTo);

  redirect(redirectTo);
}

export async function signOutAction(formData: FormData) {
  const redirectTo = parseRedirectPath(formData.get("redirectTo"));

  const supabase = await createSupabaseServerClient("mutate");
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }

  revalidateAuthPaths(redirectTo);

  redirect(redirectTo);
}

export async function deleteAccountAction() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/sign-in?next=/settings");
  }

  const serviceClient = createSupabaseServiceRoleClient();
  const supabase = await createSupabaseServerClient("mutate");

  const { data: automationRows, error: automationQueryError } = await serviceClient
    .from("automations")
    .select("id")
    .eq("user_id", user.id);

  if (automationQueryError) {
    throw new Error(`Unable to fetch automations for deletion: ${automationQueryError.message}`);
  }

  const automationIds = (automationRows ?? []).map((automation) => automation.id);

  if (automationIds.length > 0) {
    const { error: deleteAutomationVotesError } = await serviceClient
      .from("votes")
      .delete()
      .in("automation_id", automationIds);

    if (deleteAutomationVotesError) {
      throw new Error(`Unable to remove votes for your automations: ${deleteAutomationVotesError.message}`);
    }
  }

  const { error: deleteUserVotesError } = await serviceClient
    .from("votes")
    .delete()
    .eq("user_id", user.id);

  if (deleteUserVotesError) {
    throw new Error(`Unable to remove your votes: ${deleteUserVotesError.message}`);
  }

  const { error: deleteSubscriptionsError } = await serviceClient
    .from("subscriptions")
    .delete()
    .eq("user_id", user.id);

  if (deleteSubscriptionsError) {
    throw new Error(`Unable to remove your subscriptions: ${deleteSubscriptionsError.message}`);
  }

  if (automationIds.length > 0) {
    const { error: deleteAutomationsError } = await serviceClient
      .from("automations")
      .delete()
      .in("id", automationIds);

    if (deleteAutomationsError) {
      throw new Error(`Unable to delete your automations: ${deleteAutomationsError.message}`);
    }
  }

  const { error: deleteProfileError } = await serviceClient
    .from("profiles")
    .delete()
    .eq("id", user.id);

  if (deleteProfileError) {
    throw new Error(`Unable to delete your profile: ${deleteProfileError.message}`);
  }

  const { error: deleteAuthUserError } = await serviceClient.auth.admin.deleteUser(user.id);

  if (deleteAuthUserError) {
    throw new Error(`Unable to delete your account: ${deleteAuthUserError.message}`);
  }

  const { error: signOutError } = await supabase.auth.signOut();

  if (signOutError) {
    throw new Error(`Unable to reset your session: ${signOutError.message}`);
  }

  revalidateAuthPaths("/");
  revalidatePath("/settings");

  redirect("/");
}

export async function createAutomationAction(
  _prevState: AutomationFormState,
  formData: FormData
): Promise<AutomationFormState> {
  const submittedValues = formDataToAutomationFormValues(formData);
  const validation = validateAutomationForm(submittedValues);
  const nextValues = parsedToFormValues(validation.data);

  if (!validation.success) {
    return {
      status: "error",
      message: "Please review the form fields and try again.",
      values: nextValues,
      fieldErrors: validation.fieldErrors,
    };
  }

  const normalized = validation.data;

  const user = await getCurrentUser();

  if (!user) {
    return {
      status: "error",
      message: "You need to sign in before sharing an automation.",
      values: nextValues,
      fieldErrors: {},
    };
  }

  await upsertProfileFromSession(user);

  const normalizedTags: string[] | null = normalized.tags
    ? normalized.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : null;

  const supabase = await createSupabaseServerClient("mutate");
  const slug = await generateUniqueSlug(normalized.title);

  const automationValues: TablesInsert<"automations"> = {
    title: normalized.title,
    summary: normalized.summary ?? null,
    description: normalized.description ?? "",
    prompt: normalized.prompt,
    tags: normalizedTags ?? null,
    slug,
    user_id: user.id,
  };

  const { error } = await supabase.from("automations").insert(automationValues);

  if (error) {
    return {
      status: "error",
      message: `Unable to create automation: ${error.message}`,
      values: nextValues,
      fieldErrors: {},
    };
  }

  await sendAutomationAnnouncement({
    automationTitle: normalized.title,
    automationSlug: slug,
  });

  revalidatePath("/");
  revalidatePath("/automations");

  return {
    status: "success",
    message: "Automation published!",
    values: nextValues,
    fieldErrors: {},
    slug,
  };
}

export async function toggleVoteAction(
  automationId: string,
  value: 1 | -1
) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("You need to be signed in to vote.");
  }

  const supabase = await createSupabaseServerClient("mutate");

  const existingVoteRes = await supabase
    .from("votes")
    .select("id, value")
    .eq("automation_id", automationId)
    .eq("user_id", user.id)
    .single();

  if (existingVoteRes.error && existingVoteRes.error.code !== "PGRST116") {
    throw new Error(`Unable to fetch vote: ${existingVoteRes.error.message}`);
  }

  const existingVote = existingVoteRes.data;

  if (existingVote && existingVote.value === value) {
    const { error: deleteError } = await supabase
      .from("votes")
      .delete()
      .eq("id", existingVote.id);

    if (deleteError) {
      throw new Error(`Unable to remove vote: ${deleteError.message}`);
    }

    await refreshVoteTotals(automationId);
    revalidatePath("/");
    revalidatePath("/automations");
    return;
  }

  if (existingVote) {
    const { error: updateError } = await supabase
      .from("votes")
      .update({ value })
      .eq("id", existingVote.id);

    if (updateError) {
      throw new Error(`Unable to update vote: ${updateError.message}`);
    }
  } else {
    const { error: insertError } = await supabase.from("votes").insert({
      automation_id: automationId,
      user_id: user.id,
      value,
    });

    if (insertError) {
      throw new Error(`Unable to submit vote: ${insertError.message}`);
    }
  }

  await refreshVoteTotals(automationId);

  revalidatePath("/");
  revalidatePath("/automations");
}

export async function deleteAutomationAction(formData: FormData) {
  const automationId = formData.get("automationId");

  if (typeof automationId !== "string" || !automationId) {
    throw new Error("Missing automation identifier.");
  }

  const user = await getCurrentUser();

  if (!user) {
    throw new Error("You need to be signed in to manage automations.");
  }

  const supabase = await createSupabaseServerClient("mutate");

  const { data: automation, error } = await supabase
    .from("automations")
    .select("id, slug, user_id")
    .eq("id", automationId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load automation: ${error.message}`);
  }

  if (!automation || automation.user_id !== user.id) {
    throw new Error("You can only delete automations you created.");
  }

  const { error: deleteError } = await supabase
    .from("automations")
    .delete()
    .eq("id", automationId);

  if (deleteError) {
    throw new Error(`Unable to delete automation: ${deleteError.message}`);
  }

  revalidatePath("/");
  revalidatePath("/automations");
  revalidatePath("/dashboard");
  if (automation.slug) {
    revalidatePath(`/automations/${automation.slug}`);
  }
}

export async function toggleSubscriptionAction(
  type: SubscriptionType,
  active: boolean
) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("You need to be signed in to manage subscriptions.");
  }

  await upsertProfileFromSession(user);

  const supabase = await createSupabaseServerClient("mutate");

  const { data: existing, error } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .eq("type", type)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to update subscription: ${error.message}`);
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from("subscriptions")
      .update({ active })
      .eq("id", existing.id);

    if (updateError) {
      throw new Error(
        `Unable to update subscription preference: ${updateError.message}`
      );
    }
  } else if (active) {
    const { error: insertError } = await supabase.from("subscriptions").insert({
      user_id: user.id,
      type,
      active: true,
    });

    if (insertError) {
      throw new Error(
        `Unable to create subscription preference: ${insertError.message}`
      );
    }
  }

  revalidatePath("/settings");
}

async function generateUniqueSlug(title: string) {
  const slugBase = slugify(title);
  let slug = slugBase;
  let attempts = 1;

  const supabase = await createSupabaseServerClient();

  // Ensure uniqueness by appending suffix if needed
  while (attempts < 5) {
    const { data, error } = await supabase
      .from("automations")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      throw new Error(`Unable to verify slug: ${error.message}`);
    }

    if (!data) {
      return slug;
    }

    slug = `${slugBase}-${Math.random().toString(36).slice(2, 6)}`;
    attempts += 1;
  }

  return `${slugBase}-${Date.now().toString(36)}`;
}

async function refreshVoteTotals(automationId: string) {
  const supabase = createSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from("votes")
    .select("value")
    .eq("automation_id", automationId);

  if (error) {
    throw new Error(`Unable to recalculate votes: ${error.message}`);
  }

  const voteRows = (data ?? []) as {
    value: number;
  }[];
  const voteTotal = voteRows.reduce(
    (sum, vote) => sum + vote.value,
    0
  );

  const { error: updateError } = await supabase
    .from("automations")
    .update({ vote_total: voteTotal })
    .eq("id", automationId);

  if (updateError) {
    throw new Error(`Unable to update vote total: ${updateError.message}`);
  }
}

function parseRedirectPath(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") {
    return "/";
  }

  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return "/";
  }

  if (!decoded.startsWith("/") || decoded.startsWith("//")) {
    return "/";
  }

  return decoded || "/";
}

function revalidateAuthPaths(target: string) {
  const base = target.split("?")[0] || "/";
  revalidatePath("/");
  revalidatePath("/automations");

  if (base !== "/" && base !== "/automations") {
    revalidatePath(base);
  }
}

"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabase/server";
import type { SubscriptionType } from "@/lib/supabase/records";
import type { TablesInsert } from "@/lib/supabase/types";
import { sendAutomationAnnouncement } from "@/lib/email/subscriptions";
import { upsertProfileFromSession } from "@/lib/profiles";
import { slugify } from "@/lib/slug";
import {
  formDataToAutomationFormValues,
  parsedToFormValues,
  validateAutomationForm,
} from "@/lib/validation/automation-form";
import {
  parseRedirectFormValue,
  revalidateAuthPaths,
} from "@/lib/auth/redirects";
import type {
  AuthFormState,
  AutomationFormState,
  UpdateNameFormState,
} from "./form-states";

const passwordSignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
});

const updateProfileNameSchema = z.object({
  name: z
    .string()
    .transform((value) => value.trim())
    .refine(
      (value) => value.length === 0 || value.length >= 2,
      "Name must be at least 2 characters or left blank.",
    )
    .refine(
      (value) => value.length <= 80,
      "Name must be 80 characters or fewer.",
    ),
});

export async function requestPasswordSignIn(
  _prevState: AuthFormState,
  formData: FormData,
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

  const redirectTo = parseRedirectFormValue(formData.get("redirectTo"));

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

export async function requestGoogleSignIn(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const redirectTo = parseRedirectFormValue(formData.get("redirectTo"));
  const supabase = await createSupabaseServerClient("mutate");
  const headersList = await headers();

  const origin = headersList.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;
  const callbackUrl = new URL("/auth/callback", origin);

  if (redirectTo && redirectTo !== "/") {
    callbackUrl.searchParams.set("redirectTo", redirectTo);
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString(),
    },
  });

  if (error || !data?.url) {
    return {
      status: "error",
      message:
        error?.message ??
        "Unable to start Google sign-in. Please try again in a moment.",
    };
  }

  redirect(data.url);
}

export async function signOutAction(formData: FormData) {
  const redirectTo = parseRedirectFormValue(formData.get("redirectTo"));

  const supabase = await createSupabaseServerClient("mutate");
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }

  revalidateAuthPaths(redirectTo);

  redirect(redirectTo);
}

export async function updateProfileNameAction(
  _prevState: UpdateNameFormState,
  formData: FormData,
): Promise<UpdateNameFormState> {
  const supabase = await createSupabaseServerClient("mutate");

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      status: "error",
      message: "You need to be signed in to update your name.",
    };
  }

  const parseResult = updateProfileNameSchema.safeParse({
    name: formData.get("name"),
  });

  if (!parseResult.success) {
    return {
      status: "error",
      message:
        parseResult.error.issues[0]?.message ??
        "Enter a valid name and try again.",
    };
  }

  const normalized = parseResult.data.name;
  const nextName = normalized.length === 0 ? null : normalized;
  const { error } = await supabase
    .from("profiles")
    .update({ name: nextName })
    .eq("id", user.id);

  if (error) {
    console.error("Unable to update profile name", error);
    return {
      status: "error",
      message: "Unable to update your name. Please try again.",
    };
  }

  revalidatePath("/");
  revalidatePath("/automations");
  revalidatePath("/dashboard");
  revalidatePath("/settings");

  return {
    status: "success",
    message: nextName
      ? "Your name has been updated."
      : "Your name has been cleared.",
  };
}

export async function deleteAccountAction() {
  const supabase = await createSupabaseServerClient("mutate");

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/sign-in?next=/settings");
  }

  const serviceClient = createSupabaseServiceRoleClient();

  const { data: automationRows, error: automationQueryError } =
    await serviceClient.from("automations").select("id").eq("user_id", user.id);

  if (automationQueryError) {
    throw new Error(
      `Unable to fetch automations for deletion: ${automationQueryError.message}`,
    );
  }

  const automationIds = (automationRows ?? []).map(
    (automation) => automation.id,
  );

  if (automationIds.length > 0) {
    const { error: deleteAutomationVotesError } = await serviceClient
      .from("votes")
      .delete()
      .in("automation_id", automationIds);

    if (deleteAutomationVotesError) {
      throw new Error(
        `Unable to remove votes for your automations: ${deleteAutomationVotesError.message}`,
      );
    }
  }

  const { error: deleteUserVotesError } = await serviceClient
    .from("votes")
    .delete()
    .eq("user_id", user.id);

  if (deleteUserVotesError) {
    throw new Error(
      `Unable to remove your votes: ${deleteUserVotesError.message}`,
    );
  }

  const { error: deleteSubscriptionsError } = await serviceClient
    .from("subscriptions")
    .delete()
    .eq("user_id", user.id);

  if (deleteSubscriptionsError) {
    throw new Error(
      `Unable to remove your subscriptions: ${deleteSubscriptionsError.message}`,
    );
  }

  if (automationIds.length > 0) {
    const { error: deleteAutomationsError } = await serviceClient
      .from("automations")
      .delete()
      .in("id", automationIds);

    if (deleteAutomationsError) {
      throw new Error(
        `Unable to delete your automations: ${deleteAutomationsError.message}`,
      );
    }
  }

  const { error: deleteProfileError } = await serviceClient
    .from("profiles")
    .delete()
    .eq("id", user.id);

  if (deleteProfileError) {
    throw new Error(
      `Unable to delete your profile: ${deleteProfileError.message}`,
    );
  }

  const { error: deleteAuthUserError } =
    await serviceClient.auth.admin.deleteUser(user.id);

  if (deleteAuthUserError) {
    throw new Error(
      `Unable to delete your account: ${deleteAuthUserError.message}`,
    );
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
  formData: FormData,
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

  const supabase = await createSupabaseServerClient("mutate");

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
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
  const slug = await generateUniqueSlug(normalized.title);

  const automationValues: TablesInsert<"automations"> = {
    title: normalized.title,
    summary: normalized.summary ?? null,
    description: normalized.description ?? "",
    prompt: normalized.prompt ?? null,
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

  await sendAutomationAnnouncement(
    {
      automationTitle: normalized.title,
      automationSlug: slug,
    },
    user.id,
  );

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

export async function updateAutomationAction(
  _prevState: AutomationFormState,
  formData: FormData,
): Promise<AutomationFormState> {
  const automationId = formData.get("automationId");
  const submittedValues = formDataToAutomationFormValues(formData);
  const validation = validateAutomationForm(submittedValues);
  const nextValues = parsedToFormValues(validation.data);

  if (typeof automationId !== "string" || !automationId) {
    return {
      status: "error",
      message: "Missing automation identifier.",
      values: nextValues,
      fieldErrors: {
        ...validation.fieldErrors,
      },
    };
  }

  if (!validation.success) {
    return {
      status: "error",
      message: "Please review the form fields and try again.",
      values: nextValues,
      fieldErrors: validation.fieldErrors,
    };
  }

  const normalized = validation.data;

  const supabase = await createSupabaseServerClient("mutate");

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      status: "error",
      message: "You need to sign in before updating an automation.",
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

  const { data: existing, error: fetchError } = await supabase
    .from("automations")
    .select("id, slug, user_id")
    .eq("id", automationId)
    .maybeSingle();

  if (fetchError) {
    return {
      status: "error",
      message: `Unable to load automation: ${fetchError.message}`,
      values: nextValues,
      fieldErrors: {},
    };
  }

  if (!existing || existing.user_id !== user.id) {
    return {
      status: "error",
      message: "You can only edit automations you created.",
      values: nextValues,
      fieldErrors: {},
    };
  }

  const { data: updated, error: updateError } = await supabase
    .from("automations")
    .update({
      title: normalized.title,
      summary: normalized.summary,
      description: normalized.description ?? "",
      prompt: normalized.prompt ?? null,
      tags: normalizedTags,
      updated_at: new Date().toISOString(),
    })
    .eq("id", automationId)
    .select("slug")
    .maybeSingle();

  if (updateError) {
    return {
      status: "error",
      message: `Unable to update automation: ${updateError.message}`,
      values: nextValues,
      fieldErrors: {},
    };
  }

  const slug = updated?.slug ?? existing.slug;

  revalidatePath("/");
  revalidatePath("/automations");
  revalidatePath("/dashboard");
  if (slug) {
    revalidatePath(`/automations/${slug}`);
  }

  return {
    status: "success",
    message: "Automation updated!",
    values: nextValues,
    fieldErrors: {},
    slug,
  };
}

export async function toggleVoteAction(automationId: string, value: 1 | -1) {
  const supabase = await createSupabaseServerClient("mutate");

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("You need to be signed in to vote.");
  }

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

  revalidatePath("/");
  revalidatePath("/automations");
}

export async function deleteAutomationAction(formData: FormData) {
  const automationId = formData.get("automationId");

  if (typeof automationId !== "string" || !automationId) {
    throw new Error("Missing automation identifier.");
  }

  const supabase = await createSupabaseServerClient("mutate");

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("You need to be signed in to manage automations.");
  }

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
  active: boolean,
) {
  const supabase = await createSupabaseServerClient("mutate");

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("You need to be signed in to manage subscriptions.");
  }

  await upsertProfileFromSession(user);

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
        `Unable to update subscription preference: ${updateError.message}`,
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
        `Unable to create subscription preference: ${insertError.message}`,
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

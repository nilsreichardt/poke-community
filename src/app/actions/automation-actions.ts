"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabase/server";
import type { SubscriptionType } from "@/lib/supabase/types";
import { getCurrentUser } from "@/lib/data/automations";
import { sendAutomationAnnouncement } from "@/lib/email/subscriptions";
import { upsertProfileFromSession } from "@/lib/profiles";
import { isMockMode } from "@/lib/config";
import {
  createAutomationMock,
  toggleVoteMock,
  setMockSubscriptionPreference,
} from "@/lib/data/mock-data";
import { slugify } from "@/lib/slug";
import type { AuthFormState, AutomationFormState } from "./form-states";

const automationSchema = z.object({
  title: z.string().min(4).max(120),
  summary: z.string().min(1).max(180),
  description: z.string().min(24).nullable(),
  prompt: z.string().min(10),
  tags: z.string().optional(),
});

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

  if (isMockMode) {
    revalidateAuthPaths(redirectTo);
    redirect(redirectTo);
  }

  const supabase = await createSupabaseServerClient();
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

  if (isMockMode) {
    revalidateAuthPaths(redirectTo);
    redirect(redirectTo);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }

  revalidateAuthPaths(redirectTo);

  redirect(redirectTo);
}

export async function createAutomationAction(
  _prevState: AutomationFormState,
  formData: FormData
): Promise<AutomationFormState> {
  const summary = formData.get("summary");
  const description = formData.get("description");

  const parsed = automationSchema.safeParse({
    title: formData.get("title"),
    summary: typeof summary === "string" ? summary.trim() : "",
    description:
      typeof description === "string" && description.trim().length
        ? description.trim()
        : null,
    prompt: formData.get("prompt"),
    tags: formData.get("tags"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please review the form fields and try again.",
    };
  }

  const user = await getCurrentUser();

  if (!user) {
    return {
      status: "error",
      message: "You need to sign in before sharing an automation.",
    };
  }

  await upsertProfileFromSession(user);

  const normalizedTags = parsed.data.tags
    ? parsed.data.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
    : null;

  if (isMockMode) {
    const automation = createAutomationMock({
      title: parsed.data.title,
      summary: parsed.data.summary,
      description: parsed.data.description,
      prompt: parsed.data.prompt,
      tags: normalizedTags,
      user_id: user.id,
    });

    revalidatePath("/");
    revalidatePath("/automations");

    return {
      status: "success",
      message: "Automation published!",
      slug: automation.slug,
    };
  }

  const supabase = await createSupabaseServerClient();
  const slug = await generateUniqueSlug(parsed.data.title);

  const { error } = await supabase.from("automations").insert({
    title: parsed.data.title,
    summary: parsed.data.summary,
    description: parsed.data.description,
    prompt: parsed.data.prompt,
    setup_details: null,
    tags: normalizedTags,
    category: "automation",
    slug,
    user_id: user.id,
  });

  if (error) {
    return {
      status: "error",
      message: `Unable to create automation: ${error.message}`,
    };
  }

  await sendAutomationAnnouncement({
    automationTitle: parsed.data.title,
    automationSlug: slug,
  });

  revalidatePath("/");
  revalidatePath("/automations");

  return {
    status: "success",
    message: "Automation published!",
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

  if (isMockMode) {
    toggleVoteMock(automationId, user.id, value);
    revalidatePath("/");
    revalidatePath("/automations");
    return;
  }

  const supabase = await createSupabaseServerClient();

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

export async function toggleSubscriptionAction(
  type: SubscriptionType,
  active: boolean
) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("You need to be signed in to manage subscriptions.");
  }

  await upsertProfileFromSession(user);

  if (isMockMode) {
    setMockSubscriptionPreference(user.id, type, active);
    revalidatePath("/dashboard");
    return;
  }

  const supabase = await createSupabaseServerClient();

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

  revalidatePath("/dashboard");
}

async function generateUniqueSlug(title: string) {
  const slugBase = slugify(title);
  let slug = slugBase;
  let attempts = 1;

  if (isMockMode) {
    return slug;
  }

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

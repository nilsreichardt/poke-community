import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AutomationRecord,
  SubscriptionType,
  VoteRecord,
} from "@/lib/supabase/records";

type ProfileRowSubset = {
  id: string;
  name: string | null;
  avatar_url: string | null;
};

type AutomationRowWithRelations = AutomationRecord & {
  profiles: ProfileRowSubset | null;
  votes: {
    value: number;
    user_id: string;
  }[] | null;
};

type AutomationWithRelations = AutomationRecord & {
  profiles: ProfileRowSubset | null;
  recent_votes?: number;
  user_vote?: number;
};

export type AutomationForEditing = Pick<
  AutomationRecord,
  "id" | "title" | "summary" | "description" | "prompt" | "tags" | "slug" | "updated_at" | "created_at"
>;

type ListAutomationsOptions = {
  search?: string;
  limit?: number;
  orderBy?: "new" | "top";
};

export const getCurrentUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return user;
});

export async function getAutomations(
  options: ListAutomationsOptions = {}
): Promise<AutomationWithRelations[]> {
  const user = await getCurrentUser();

  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("automations")
    .select(
      "*, profiles(id, name, avatar_url), votes(value, automation_id, user_id)"
    );

  if (options.search) {
    const likeValue = `%${options.search}%`;
    query = query.or(
      `title.ilike.${likeValue},description.ilike.${likeValue},summary.ilike.${likeValue}`
    );
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.orderBy === "top") {
    query = query.order("vote_total", { ascending: false });
  } else {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } =
    await query.returns<AutomationRowWithRelations[]>();

  if (error) {
    throw new Error(`Unable to load automations: ${error.message}`);
  }

  const rows = data ?? [];

  return rows.map<AutomationWithRelations>((item) => {
    const votes = Array.isArray(item.votes)
      ? (item.votes as VoteRecord[])
      : [];
    const userVote =
      votes.find((vote) => vote.user_id === user?.id)?.value ?? 0;
    const { votes: _unusedVotes, ...rest } = item;
    void _unusedVotes;

    return {
      ...rest,
      user_vote: userVote,
    };
  });
}

export async function getAutomationsForCurrentUser(): Promise<
  AutomationWithRelations[]
> {
  const user = await getCurrentUser();

  if (!user) {
    return [];
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("automations")
    .select(
      "*, profiles(id, name, avatar_url), votes(value, automation_id, user_id)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<AutomationRowWithRelations[]>();

  if (error) {
    throw new Error(
      `Unable to load your automations: ${error.message}`
    );
  }

  const rows = data ?? [];

  return rows.map<AutomationWithRelations>((item) => {
    const votes = Array.isArray(item.votes)
      ? (item.votes as VoteRecord[])
      : [];
    const userVote =
      votes.find((vote) => vote.user_id === user.id)?.value ?? 0;
    const { votes: _unusedVotes, ...rest } = item;
    void _unusedVotes;

    return {
      ...rest,
      user_vote: userVote,
    };
  });
}

export async function getAutomationForEditing(
  automationId: string
): Promise<AutomationForEditing | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("automations")
    .select(
      "id, title, summary, description, prompt, tags, slug, updated_at, created_at, user_id"
    )
    .eq("id", automationId)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load automation: ${error.message}`);
  }

  if (!data || data.user_id !== user.id) {
    return null;
  }

  const { user_id: _userId, ...automation } = data;
  void _userId;

  return automation;
}

export async function getAutomationBySlug(
  slug: string
): Promise<AutomationWithRelations | null> {
  const user = await getCurrentUser();

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("automations")
    .select(
      "*, profiles(id, name, avatar_url), votes(value, automation_id, user_id)"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load automation: ${error.message}`);
  }

  const automation = data as AutomationRowWithRelations | null;

  if (!automation) {
    return null;
  }

  const votes = Array.isArray(automation.votes)
    ? (automation.votes as VoteRecord[])
    : [];
  const userVote =
    votes.find((vote) => vote.user_id === user?.id)?.value ?? 0;
  const { votes: _unusedVotes, ...rest } = automation;
  void _unusedVotes;

  return {
    ...rest,
    user_vote: userVote,
  };
}

export async function getTrendingAutomations(limit = 6) {
  const user = await getCurrentUser();

  const supabase = await createSupabaseServerClient();

  const { data: rankings, error: rankingError } = await supabase
    .from("automations_with_scores")
    .select("id, recent_votes, vote_total")
    .order("recent_votes", { ascending: false })
    .order("vote_total", { ascending: false })
    .limit(limit);

  if (rankingError) {
    throw new Error(
      `Unable to load trending automations: ${rankingError.message}`
    );
  }

  if (!rankings?.length) {
    return [];
  }

  const rankedAutomations = rankings
    .map((item) =>
      typeof item.id === "string"
        ? {
            id: item.id,
            recent_votes: item.recent_votes ?? 0,
          }
        : null
    )
    .filter(
      (item): item is { id: string; recent_votes: number } => item !== null
    );

  if (!rankedAutomations.length) {
    return [];
  }

  const ids = rankedAutomations.map((item) => item.id);
  const rankingsMap = new Map(
    rankedAutomations.map((item) => [item.id, item.recent_votes] as const)
  );

  const { data: automationRows, error: automationsError } = await supabase
    .from("automations")
    .select(
      "*, profiles(id, name, avatar_url), votes(value, automation_id, user_id)"
    )
    .in("id", ids)
    .returns<AutomationRowWithRelations[]>();

  if (automationsError) {
    throw new Error(
      `Unable to load trending automations: ${automationsError.message}`
    );
  }

  const rows = automationRows ?? [];
  const automationMap = new Map(
    rows.map((row) => [row.id, row] as const)
  );

  return rankedAutomations
    .map(({ id }) => automationMap.get(id))
    .filter((item): item is AutomationRowWithRelations => Boolean(item))
    .map<AutomationWithRelations>((item) => {
      const votes = Array.isArray(item.votes)
        ? (item.votes as VoteRecord[])
        : [];
      const userVote =
        votes.find((vote) => vote.user_id === user?.id)?.value ?? 0;
      const { votes: _unusedVotes, ...rest } = item;
      void _unusedVotes;

      return {
        ...rest,
        recent_votes: rankingsMap.get(item.id) ?? 0,
        user_vote: userVote,
      };
    });
}

type AutomationSlugSummary = {
  slug: string;
  created_at: string;
  updated_at: string | null;
};

export async function listAutomationSlugs(): Promise<
  AutomationSlugSummary[]
> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("automations")
    .select("slug, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<AutomationSlugSummary[]>();

  if (error) {
    throw new Error(
      `Unable to list automation slugs: ${error.message}`
    );
  }

  return data ?? [];
}

export async function getSubscriptionPreferences() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("subscriptions")
    .select("type, active")
    .eq("user_id", user.id);

  if (error) {
    throw new Error(`Unable to load subscriptions: ${error.message}`);
  }

  const map = new Map<SubscriptionType, boolean>();
  (data ?? []).forEach((subscription) => {
    map.set(subscription.type, subscription.active);
  });

  return map;
}

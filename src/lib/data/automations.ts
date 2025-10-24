import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  AutomationRecord,
  AutomationCategory,
  SubscriptionType,
} from "@/lib/supabase/types";
import { isMockMode } from "@/lib/config";
import {
  queryAutomationsMock,
  getAutomationBySlugMock,
  getTrendingAutomationsMock,
  getSubscriptionPreferencesMock,
  getMockUser,
  listAutomationSlugsMock,
} from "@/lib/data/mock-data";

type AutomationRowWithRelations = AutomationRecord & {
  profiles: {
    id: string;
    username: string | null;
    avatar_url: string | null;
  } | null;
  votes: {
    value: number;
    user_id: string;
  }[] | null;
};

type AutomationWithRelations = AutomationRecord & {
  profiles: {
    id: string;
    username: string | null;
    avatar_url: string | null;
  } | null;
  recent_votes?: number;
  user_vote?: number;
};

type ListAutomationsOptions = {
  search?: string;
  limit?: number;
  category?: AutomationCategory;
  orderBy?: "new" | "top";
};

export const getCurrentUser = cache(async () => {
  if (isMockMode) {
    return getMockUser();
  }

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

  if (isMockMode) {
    return queryAutomationsMock({
      ...options,
      userId: user?.id ?? null,
    });
  }

  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("automations")
    .select(
      "*, profiles(id, username, avatar_url), votes(value, automation_id, user_id)"
    );

  if (options.search) {
    const likeValue = `%${options.search}%`;
    query = query.or(
      `title.ilike.${likeValue},description.ilike.${likeValue},summary.ilike.${likeValue}`
    );
  }

  if (options.category) {
    query = query.eq("category", options.category);
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
    const votes = Array.isArray(item.votes) ? item.votes : [];
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

export async function getAutomationBySlug(
  slug: string
): Promise<AutomationWithRelations | null> {
  const user = await getCurrentUser();

  if (isMockMode) {
    return getAutomationBySlugMock(slug);
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("automations")
    .select(
      "*, profiles(id, username, avatar_url), votes(value, automation_id, user_id)"
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

  const votes = Array.isArray(automation.votes) ? automation.votes : [];
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

  if (isMockMode) {
    return getTrendingAutomationsMock(limit);
  }

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

  const ids = rankings.map((item) => item.id);
  const rankingsMap = new Map(
    rankings.map((item) => [item.id, item.recent_votes] as const)
  );

  const { data: automationRows, error: automationsError } = await supabase
    .from("automations")
    .select(
      "*, profiles(id, username, avatar_url), votes(value, automation_id, user_id)"
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

  return ids
    .map((id) => automationMap.get(id))
    .filter((item): item is AutomationRowWithRelations => Boolean(item))
    .map<AutomationWithRelations>((item) => {
      const votes = Array.isArray(item.votes) ? item.votes : [];
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
  if (isMockMode) {
    return listAutomationSlugsMock();
  }

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
    if (isMockMode) {
      return null;
    }
    return null;
  }

  if (isMockMode) {
    return getSubscriptionPreferencesMock(user.id);
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

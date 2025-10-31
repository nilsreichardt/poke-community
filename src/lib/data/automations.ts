import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
} from "@/lib/supabase/server";
import type {
  AutomationRecord,
  SubscriptionType,
} from "@/lib/supabase/records";
import type { Database } from "@/lib/supabase/types";

type ProfileRowSubset = {
  id: string;
  name: string | null;
  avatar_url: string | null;
};

type AutomationRowWithProfile = AutomationRecord & {
  public_profiles: ProfileRowSubset | null;
};

type AutomationWithRelations = AutomationRecord & {
  public_profiles: ProfileRowSubset | null;
  vote_total: number;
  recent_votes?: number;
  user_vote?: number;
};

export type AutomationForEditing = Pick<
  AutomationRecord,
  | "id"
  | "title"
  | "summary"
  | "description"
  | "prompt"
  | "tags"
  | "slug"
  | "updated_at"
  | "created_at"
>;

type ListAutomationsOptions = {
  search?: string;
  limit?: number;
  orderBy?: "new" | "top";
};

function extractErrorMessage(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    return (error as { message?: string }).message ?? "";
  }

  return "";
}

function formatSupabaseError(baseMessage: string, error: unknown): string {
  const message = extractErrorMessage(error);

  if (message) {
    const lower = message.toLowerCase();

    if (
      lower.includes("fetch failed") ||
      lower.includes("failed to fetch") ||
      lower.includes("network error") ||
      lower.includes("econnrefused")
    ) {
      return `${baseMessage}. Our data service is temporarily unreachable. Please try again soon.`;
    }

    return `${baseMessage}: ${message}`;
  }

  return baseMessage;
}

type VoteStatisticRow = {
  automation_id: string | null;
  vote_total: number | null;
  recent_votes: number | null;
};

type UserVoteRow = {
  automation_id: string | null;
  value: number | null;
};

function normalizeNumber(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

async function getVoteStatisticsMap(
  client: SupabaseClient<Database>,
  automationIds: string[],
): Promise<Map<string, { vote_total: number; recent_votes: number }>> {
  if (automationIds.length === 0) {
    return new Map();
  }

  const { data, error } = await client.rpc("get_vote_statistics", {
    target_ids: automationIds,
  });

  if (error) {
    throw new Error(
      formatSupabaseError("Unable to load vote statistics", error),
    );
  }

  const stats = new Map<string, { vote_total: number; recent_votes: number }>();

  (data as VoteStatisticRow[] | null)?.forEach((row) => {
    if (!row?.automation_id) {
      return;
    }

    stats.set(row.automation_id, {
      vote_total: normalizeNumber(row.vote_total ?? 0),
      recent_votes: normalizeNumber(row.recent_votes ?? 0),
    });
  });

  return stats;
}

async function getUserVotesMap(
  client: SupabaseClient<Database>,
  automationIds: string[],
  hasUser: boolean,
): Promise<Map<string, number>> {
  if (!hasUser || automationIds.length === 0) {
    return new Map();
  }

  const { data, error } = await client.rpc("get_user_votes", {
    target_ids: automationIds,
  });

  if (error) {
    throw new Error(
      formatSupabaseError("Unable to load vote preferences", error),
    );
  }

  const votes = new Map<string, number>();

  (data as UserVoteRow[] | null)?.forEach((row) => {
    if (!row?.automation_id) {
      return;
    }

    votes.set(row.automation_id, normalizeNumber(row.value ?? 0));
  });

  return votes;
}

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
  options: ListAutomationsOptions = {},
): Promise<AutomationWithRelations[]> {
  const user = await getCurrentUser();

  const supabase = await createSupabaseServerClient();

  if (options.orderBy === "top") {
    let viewQuery = supabase
      .from("automations_with_scores")
      .select("id, vote_total, recent_votes");

    if (options.search) {
      const likeValue = `%${options.search}%`;
      viewQuery = viewQuery.or(
        `title.ilike.${likeValue},description.ilike.${likeValue},summary.ilike.${likeValue},prompt.ilike.${likeValue},tags.cs.{${options.search}}`,
      );
    }

    viewQuery = viewQuery.order("vote_total", { ascending: false });

    if (options.limit) {
      viewQuery = viewQuery.limit(options.limit);
    }

    const { data: rankedData, error: viewError } = await viewQuery;

    if (viewError) {
      throw new Error(
        formatSupabaseError("Unable to load automations", viewError),
      );
    }

    if (!rankedData?.length) {
      return [];
    }

    const ranked = rankedData
      .map((item) =>
        typeof item.id === "string"
          ? {
              id: item.id,
              vote_total: normalizeNumber(item.vote_total ?? 0),
              recent_votes: normalizeNumber(item.recent_votes ?? 0),
            }
          : null,
      )
      .filter(
        (
          item,
        ): item is { id: string; vote_total: number; recent_votes: number } =>
          item !== null,
      );

    const ids = ranked.map((item) => item.id);
    const statsMap = new Map(ranked.map((item) => [item.id, item] as const));

    const { data, error } = await supabase
      .from("automations")
      .select("*, public_profiles(id, name, avatar_url)")
      .in("id", ids)
      .returns<AutomationRowWithProfile[]>();

    if (error) {
      throw new Error(formatSupabaseError("Unable to load automations", error));
    }

    const rows = data ?? [];
    const automationsById = new Map(rows.map((row) => [row.id, row] as const));
    const userVotes = await getUserVotesMap(supabase, ids, Boolean(user?.id));

    return ids
      .map((id) => automationsById.get(id))
      .filter(
        (row): row is AutomationRowWithProfile =>
          row !== undefined && row !== null,
      )
      .map<AutomationWithRelations>((row) => {
        const stats = statsMap.get(row.id) ?? {
          vote_total: 0,
          recent_votes: 0,
        };

        return {
          ...row,
          vote_total: stats.vote_total,
          recent_votes: stats.recent_votes,
          user_vote: userVotes.get(row.id) ?? 0,
        };
      });
  }

  let query = supabase
    .from("automations")
    .select("*, public_profiles(id, name, avatar_url)");

  if (options.search) {
    const likeValue = `%${options.search}%`;
    query = query.or(
      `title.ilike.${likeValue},description.ilike.${likeValue},summary.ilike.${likeValue},tags.cs.{${options.search}}`,
    );
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  query = query.order("created_at", { ascending: false });

  const { data, error } = await query.returns<AutomationRowWithProfile[]>();

  if (error) {
    throw new Error(formatSupabaseError("Unable to load automations", error));
  }

  const rows = data ?? [];
  const ids = rows.map((row) => row.id);

  const [statsMap, userVotes] = await Promise.all([
    getVoteStatisticsMap(supabase, ids),
    getUserVotesMap(supabase, ids, Boolean(user?.id)),
  ]);

  return rows.map<AutomationWithRelations>((row) => {
    const stats = statsMap.get(row.id);

    return {
      ...row,
      vote_total: stats?.vote_total ?? 0,
      recent_votes: stats?.recent_votes ?? 0,
      user_vote: userVotes.get(row.id) ?? 0,
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
    .select("*, public_profiles(id, name, avatar_url)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .returns<AutomationRowWithProfile[]>();

  if (error) {
    throw new Error(
      formatSupabaseError("Unable to load your automations", error),
    );
  }

  const rows = data ?? [];
  const ids = rows.map((row) => row.id);

  const [statsMap, userVotes] = await Promise.all([
    getVoteStatisticsMap(supabase, ids),
    getUserVotesMap(supabase, ids, true),
  ]);

  return rows.map<AutomationWithRelations>((row) => {
    const stats = statsMap.get(row.id);

    return {
      ...row,
      vote_total: stats?.vote_total ?? 0,
      recent_votes: stats?.recent_votes ?? 0,
      user_vote: userVotes.get(row.id) ?? 0,
    };
  });
}

export async function getAutomationForEditing(
  automationId: string,
): Promise<AutomationForEditing | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("automations")
    .select(
      "id, title, summary, description, prompt, tags, slug, updated_at, created_at, user_id",
    )
    .eq("id", automationId)
    .maybeSingle();

  if (error) {
    throw new Error(formatSupabaseError("Unable to load automation", error));
  }

  if (!data || data.user_id !== user.id) {
    return null;
  }

  const { user_id: _userId, ...automation } = data;
  void _userId;

  return automation;
}

export async function getAutomationBySlug(
  slug: string,
): Promise<(AutomationWithRelations & { user_id: string }) | null> {
  const user = await getCurrentUser();

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("automations")
    .select("*, public_profiles(id, name, avatar_url)")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(formatSupabaseError("Unable to load automation", error));
  }

  const automation = data as
    | (AutomationRowWithProfile & { user_id: string })
    | null;

  if (!automation) {
    return null;
  }

  const [statsMap, userVotes] = await Promise.all([
    getVoteStatisticsMap(supabase, [automation.id]),
    getUserVotesMap(supabase, [automation.id], Boolean(user?.id)),
  ]);

  const stats = statsMap.get(automation.id);

  return {
    ...automation,
    vote_total: stats?.vote_total ?? 0,
    recent_votes: stats?.recent_votes ?? 0,
    user_vote: userVotes.get(automation.id) ?? 0,
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
      formatSupabaseError("Unable to load trending automations", rankingError),
    );
  }

  if (!rankings?.length) {
    return [];
  }

  const ranked = rankings
    .map((item) =>
      typeof item.id === "string"
        ? {
            id: item.id,
            vote_total: normalizeNumber(item.vote_total ?? 0),
            recent_votes: normalizeNumber(item.recent_votes ?? 0),
          }
        : null,
    )
    .filter(
      (
        item,
      ): item is { id: string; vote_total: number; recent_votes: number } =>
        item !== null,
    );

  if (!ranked.length) {
    return [];
  }

  const ids = ranked.map((item) => item.id);
  const statsMap = new Map(ranked.map((item) => [item.id, item] as const));

  const { data: automationRows, error: automationsError } = await supabase
    .from("automations")
    .select("*, public_profiles(id, name, avatar_url)")
    .in("id", ids)
    .returns<AutomationRowWithProfile[]>();

  if (automationsError) {
    throw new Error(
      formatSupabaseError(
        "Unable to load trending automations",
        automationsError,
      ),
    );
  }

  const rows = automationRows ?? [];
  const automationMap = new Map(rows.map((row) => [row.id, row] as const));

  const userVotes = await getUserVotesMap(supabase, ids, Boolean(user?.id));

  return ranked
    .map(({ id }) => automationMap.get(id))
    .filter(
      (item): item is AutomationRowWithProfile =>
        item !== undefined && item !== null,
    )
    .map<AutomationWithRelations>((item) => {
      const stats = statsMap.get(item.id);

      return {
        ...item,
        vote_total: stats?.vote_total ?? 0,
        recent_votes: stats?.recent_votes ?? 0,
        user_vote: userVotes.get(item.id) ?? 0,
      };
    });
}

type AutomationSlugSummary = {
  slug: string;
  created_at: string;
  updated_at: string | null;
};

export async function listAutomationSlugs(): Promise<AutomationSlugSummary[]> {
  const supabase = createSupabaseServiceRoleClient();

  const { data, error } = await supabase
    .from("automations")
    .select("slug, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<AutomationSlugSummary[]>();

  if (error) {
    throw new Error(
      formatSupabaseError("Unable to list automation slugs", error),
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
    throw new Error(formatSupabaseError("Unable to load subscriptions", error));
  }

  const map = new Map<SubscriptionType, boolean>();
  (data ?? []).forEach((subscription) => {
    map.set(subscription.type, subscription.active);
  });

  return map;
}

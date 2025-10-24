import type { User } from "@supabase/supabase-js";
import type {
  AutomationRecord,
  SubscriptionType,
  VoteRecord,
} from "@/lib/supabase/types";
import { slugify } from "@/lib/slug";

type MockProfile = {
  id: string;
  username: string | null;
  avatar_url: string | null;
  email: string | null;
};

type MockSubscription = {
  id: string;
  user_id: string;
  type: SubscriptionType;
  active: boolean;
  created_at: string;
};

type MockState = {
  profiles: MockProfile[];
  automations: AutomationRecord[];
  votes: VoteRecord[];
  subscriptions: MockSubscription[];
  currentUserId: string | null;
};

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function nowMinus(days: number) {
  return new Date(Date.now() - days * DAY_IN_MS).toISOString();
}

function createInitialState(): MockState {
  const profiles: MockProfile[] = [
    {
      id: "11111111-1111-1111-1111-111111111111",
      username: "ava",
      avatar_url: null,
      email: "ava@poke.community",
    },
    {
      id: "22222222-2222-2222-2222-222222222222",
      username: "liam",
      avatar_url: null,
      email: "liam@poke.community",
    },
  ];

  const automations: AutomationRecord[] = [
    {
      id: "aaaa1111-1111-1111-1111-111111111111",
      created_at: nowMinus(2),
      updated_at: nowMinus(1),
      title: "Smart Inbox Routing",
      summary: "Route inbound leads based on region, company size, and urgency.",
      description:
        "## Highlights\n- Detects company size from CRM\n- Scores urgency using message sentiment\n- Routes to the right owner instantly\n\n### Output\nRecords in CRM are enriched with routing metadata so the inbox stays balanced.\n",
      prompt:
        "Route inbound lead {{company_name}} to {{owner_email}} if score >= 80. Score by combining intent signals from HubSpot and sentiment analysis of the last email. Add a Slack DM to the owner with top 3 context points.",
      setup_details:
        "### Pre-reqs\n- Connect the HubSpot and Slack MCPs\n- Enable sentiment analysis MCP\n- Create a shared Slack channel `#lead-routing`\n\n### Notes\nTune the score threshold inline in the prompt to match your territory model.",
      slug: "smart-inbox-routing",
      tags: ["sales", "routing", "crm"],
      category: "automation",
      user_id: profiles[0].id,
      vote_total: 2,
    },
    {
      id: "bbbb2222-2222-2222-2222-222222222222",
      created_at: nowMinus(5),
      updated_at: nowMinus(2),
      title: "Onboarding Pulse Template",
      summary:
        "Collects customer feedback at key milestones and alerts CSMs.",
      description:
        "### Why it matters\nKeep a pulse on onboarding with automated surveys.\n\n### Flow\n1. Trigger surveys after signup, activation, and 14 days\n2. If score < 7, alert the owning CSM in Slack\n3. Aggregate responses weekly into Notion dashboard\n",
      prompt:
        "Send the Onboarding Pulse survey to {{customer_email}} with template `cs-onboarding-pulse`. If the response score is below 7, notify {{csm_email}} in Slack with the open text answer and create a follow-up task in Asana.",
      setup_details:
        "### Pre-reqs\n- Enable the SurveyMonkey MCP and connect the pulse template\n- Map `customer_email` and `csm_email` from your CRM sync\n- Connect the Asana MCP with default project `Customer Success > Pulse Follow-up`\n\n### Customisation\nAdjust the scoring threshold in the prompt if your team uses a different health metric.",
      slug: "onboarding-pulse-template",
      tags: ["onboarding", "cs", "survey"],
      category: "template",
      user_id: profiles[1].id,
      vote_total: 2,
    },
    {
      id: "cccc3333-3333-3333-3333-333333333333",
      created_at: nowMinus(10),
      updated_at: nowMinus(9),
      title: "Renewal Risk Radar",
      summary: "Consolidates health signals and flags accounts at risk.",
      description:
        "Monitor product usage, support tickets, and NPS to proactively catch churn risk.\n\n- Usage down 20% week-over-week? Tag as watchlist\n- Two high-priority tickets in 48h? Notify success lead\n- Surface signals in Monday dashboard\n",
      prompt:
        "Summarise health for {{account_name}} using product usage trend, open support tickets, and latest NPS comment. If risk is high, post to #renewal-risk with next best action.",
      setup_details:
        "### Pre-reqs\n- Connect the product analytics MCP exposing `usage_trend`\n- Connect the Zendesk MCP with ticket priority metadata\n- Sync NPS verbatim comments to poke\n\n### Tips\nAdjust what counts as \"high risk\" by editing thresholds in the prompt.",
      slug: "renewal-risk-radar",
      tags: ["success", "renewal", "alerts"],
      category: "integration",
      user_id: profiles[0].id,
      vote_total: 0,
    },
  ];

  const votes: VoteRecord[] = [
    {
      id: "dddd4444-4444-4444-4444-444444444444",
      created_at: nowMinus(1),
      automation_id: automations[0].id,
      user_id: profiles[0].id,
      value: 1,
    },
    {
      id: "eeee5555-5555-5555-5555-555555555555",
      created_at: nowMinus(3),
      automation_id: automations[0].id,
      user_id: profiles[1].id,
      value: 1,
    },
    {
      id: "ffff6666-6666-6666-6666-666666666666",
      created_at: nowMinus(2),
      automation_id: automations[1].id,
      user_id: profiles[0].id,
      value: 1,
    },
    {
      id: "gggg7777-7777-7777-7777-777777777777",
      created_at: nowMinus(4),
      automation_id: automations[1].id,
      user_id: profiles[1].id,
      value: 1,
    },
    {
      id: "hhhh8888-8888-8888-8888-888888888888",
      created_at: nowMinus(8),
      automation_id: automations[2].id,
      user_id: profiles[1].id,
      value: -1,
    },
  ];

  const subscriptions: MockSubscription[] = [
    {
      id: "iiii9999-9999-9999-9999-999999999999",
      user_id: profiles[0].id,
      type: "new",
      active: true,
      created_at: nowMinus(1),
    },
    {
      id: "jjjj0000-0000-0000-0000-000000000000",
      user_id: profiles[0].id,
      type: "trending",
      active: true,
      created_at: nowMinus(1),
    },
    {
      id: "kkkkaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      user_id: profiles[1].id,
      type: "trending",
      active: false,
      created_at: nowMinus(2),
    },
  ];

  return {
    profiles,
    automations,
    votes,
    subscriptions,
    currentUserId: profiles[0].id,
  };
}

const mockState: MockState = createInitialState();

export function resetMockState() {
  const fresh = createInitialState();
  mockState.profiles.length = 0;
  mockState.profiles.push(...fresh.profiles);

  mockState.automations.length = 0;
  mockState.automations.push(...fresh.automations);

  mockState.votes.length = 0;
  mockState.votes.push(...fresh.votes);

  mockState.subscriptions.length = 0;
  mockState.subscriptions.push(...fresh.subscriptions);

  mockState.currentUserId = fresh.currentUserId;
}

export function setMockCurrentUser(userId: string | null) {
  mockState.currentUserId = userId;
}

export function getMockProfile(userId: string | null) {
  if (!userId) {
    return null;
  }
  return mockState.profiles.find((profile) => profile.id === userId) ?? null;
}

export function getMockUser(): User | null {
  const profile = getMockProfile(mockState.currentUserId);
  if (!profile) {
    return null;
  }

  const user: User = {
    id: profile.id,
    email: profile.email ?? undefined,
    aud: "authenticated",
    role: "authenticated",
    created_at: nowMinus(0),
    app_metadata: { provider: "email" },
    user_metadata: { username: profile.username ?? "" },
    confirmed_at: nowMinus(0),
    email_confirmed_at: nowMinus(0),
    last_sign_in_at: nowMinus(0),
    updated_at: nowMinus(0),
    identities: [],
  };

  return user;
}

type QueryOptions = {
  search?: string;
  limit?: number;
  category?: string;
  orderBy?: "new" | "top";
  userId?: string | null;
};

function attachDerivedFields(
  automation: AutomationRecord,
  userId: string | null
) {
  const profile = getMockProfile(automation.user_id);
  const recentVotes = getRecentVotesForAutomation(automation.id);
  const userVote =
    mockState.votes.find(
      (vote) => vote.automation_id === automation.id && vote.user_id === userId
    )?.value ?? 0;

  return {
    ...automation,
    profiles: profile,
    recent_votes: recentVotes,
    user_vote: userVote,
  };
}

function getRecentVotesForAutomation(automationId: string) {
  const threshold = Date.now() - 7 * DAY_IN_MS;
  return mockState.votes
    .filter(
      (vote) =>
        vote.automation_id === automationId &&
        new Date(vote.created_at).getTime() >= threshold
    )
    .reduce((sum, vote) => sum + vote.value, 0);
}

export function queryAutomationsMock(options: QueryOptions = {}) {
  const userId = options.userId ?? mockState.currentUserId;
  let results = mockState.automations.slice();

  if (options.search) {
    const search = options.search.toLowerCase();
    results = results.filter((automation) => {
      const haystacks = [
        automation.title,
        automation.summary ?? "",
        automation.description,
        ...(automation.tags ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return haystacks.includes(search);
    });
  }

  if (options.category) {
    results = results.filter(
      (automation) => automation.category === options.category
    );
  }

  if (options.orderBy === "top") {
    results.sort((a, b) => {
      if (b.vote_total === a.vote_total) {
        return (
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
        );
      }
      return b.vote_total - a.vote_total;
    });
  } else {
    results.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  if (options.limit && options.limit > 0) {
    results = results.slice(0, options.limit);
  }

  return results.map((automation) => attachDerivedFields(automation, userId));
}

export function getAutomationBySlugMock(slug: string) {
  const userId = mockState.currentUserId;
  const automation = mockState.automations.find((item) => item.slug === slug);
  return automation ? attachDerivedFields(automation, userId) : null;
}

export function listAutomationSlugsMock() {
  return mockState.automations.map((automation) => ({
    slug: automation.slug,
    created_at: automation.created_at,
    updated_at: automation.updated_at,
  }));
}

export function getTrendingAutomationsMock(limit = 6) {
  const userId = mockState.currentUserId;
  const ranked = mockState.automations
    .map((automation) => ({
      automation,
      recentVotes: getRecentVotesForAutomation(automation.id),
    }))
    .sort((a, b) => {
      if (b.recentVotes === a.recentVotes) {
        return b.automation.vote_total - a.automation.vote_total;
      }
      return b.recentVotes - a.recentVotes;
    })
    .slice(0, limit)
    .map(({ automation }) => attachDerivedFields(automation, userId));

  return ranked;
}

export function getSubscriptionPreferencesMock(userId: string) {
  const map = new Map<SubscriptionType, boolean>();
  mockState.subscriptions
    .filter((subscription) => subscription.user_id === userId)
    .forEach((subscription) => {
      map.set(subscription.type, subscription.active);
    });
  return map;
}

export function createAutomationMock(input: {
  title: string;
  summary: string;
  description: string | null;
  prompt: string;
  tags?: string[] | null;
  user_id: string;
}) {
  const baseSlug = slugify(input.title);
  let slug = baseSlug;
  let attempt = 1;

  while (
    mockState.automations.some((automation) => automation.slug === slug)
  ) {
    attempt += 1;
    slug = `${baseSlug}-${attempt}`;
  }

  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const now = new Date().toISOString();

  const automation: AutomationRecord = {
    id,
    created_at: now,
    updated_at: now,
    title: input.title,
    summary: input.summary,
    description: input.description,
    prompt: input.prompt,
    setup_details: null,
    slug,
    tags: input.tags ?? null,
    category: "automation",
    user_id: input.user_id,
    vote_total: 0,
  };

  mockState.automations.unshift(automation);

  return attachDerivedFields(automation, input.user_id);
}

export function toggleVoteMock(automationId: string, userId: string, value: 1 | -1) {
  const existing = mockState.votes.find(
    (vote) => vote.automation_id === automationId && vote.user_id === userId
  );

  if (existing && existing.value === value) {
    mockState.votes = mockState.votes.filter((vote) => vote.id !== existing.id);
  } else if (existing) {
    existing.value = value;
    existing.created_at = new Date().toISOString();
  } else {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    mockState.votes.push({
      id,
      automation_id: automationId,
      user_id: userId,
      value,
      created_at: new Date().toISOString(),
    });
  }

  recomputeVoteTotal(automationId);
}

export function setMockSubscriptionPreference(
  userId: string,
  type: SubscriptionType,
  active: boolean
) {
  const existing = mockState.subscriptions.find(
    (subscription) =>
      subscription.user_id === userId && subscription.type === type
  );

  if (existing) {
    existing.active = active;
    existing.created_at = new Date().toISOString();
  } else {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    mockState.subscriptions.push({
      id,
      user_id: userId,
      type,
      active,
      created_at: new Date().toISOString(),
    });
  }
}

function recomputeVoteTotal(automationId: string) {
  const automation = mockState.automations.find(
    (item) => item.id === automationId
  );
  if (!automation) {
    return;
  }

  automation.vote_total = mockState.votes
    .filter((vote) => vote.automation_id === automationId)
    .reduce((sum, vote) => sum + vote.value, 0);
}

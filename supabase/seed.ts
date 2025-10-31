import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

type SeedUser = {
  id: string;
  email: string;
  name: string;
};

type SeedAutomation = {
  id: string;
  title: string;
  summary: string;
  description: string;
  prompt: string;
  slug: string;
  tags: string[];
  userId: string;
  createdDaysAgo: number;
  updatedDaysAgo: number;
};

type SeedVote = {
  id: string;
  automationId: string;
  userId: string;
  value: number;
  createdDaysAgo: number;
};

type SeedSubscription = {
  id: string;
  userId: string;
  type: "new" | "trending";
  active: boolean;
};

const USERS: SeedUser[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    email: "ava@poke.community",
    name: "ava",
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    email: "liam@poke.community",
    name: "liam",
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    email: "mia@poke.community",
    name: "mia",
  },
  {
    id: "44444444-4444-4444-4444-444444444444",
    email: "noah@poke.community",
    name: "noah",
  },
  {
    id: "55555555-5555-5555-5555-555555555555",
    email: "zoe@poke.community",
    name: "zoe",
  },
  {
    id: "66666666-6666-6666-6666-666666666666",
    email: "jessica@poke.community",
    name: "jessica",
  },
  {
    id: "77777777-7777-7777-7777-777777777777",
    email: "bob@poke.community",
    name: "bob",
  },
  {
    id: "88888888-8888-8888-8888-888888888888",
    email: "jeff@poke.community",
    name: "jeff",
  },
];

const AUTOMATIONS: SeedAutomation[] = [
  {
    id: "aaaa1111-1111-1111-1111-111111111111",
    title: "Smart Inbox Routing",
    summary: "Route inbound leads based on region, company size, and urgency.",
    description: `## Highlights
- Detects company size from CRM
- Scores urgency using message sentiment
- Routes to the right owner instantly

### Output
Records in CRM are enriched with routing metadata so the inbox stays balanced.
`,
    prompt:
      "Route inbound lead {{company_name}} to {{owner_email}} if score >= 80. Score by combining intent signals from HubSpot and sentiment analysis of the last email. Add a Slack DM to the owner with top 3 context points.",
    slug: "smart-inbox-routing",
    tags: ["sales", "routing", "crm"],
    userId: USERS[0]!.id,
    createdDaysAgo: 2,
    updatedDaysAgo: 1,
  },
  {
    id: "bbbb2222-2222-2222-2222-222222222222",
    title: "Onboarding Pulse Template",
    summary: "Collects customer feedback at key milestones and alerts CSMs.",
    description: `### Why it matters
Keep a pulse on onboarding with automated surveys.

### Flow
1. Trigger surveys after signup, activation, and 14 days
2. If score < 7, alert the owning CSM in Slack
3. Aggregate responses weekly into Notion dashboard
`,
    prompt:
      "Send the Onboarding Pulse survey to {{customer_email}} with template `cs-onboarding-pulse`. If the response score is below 7, notify {{csm_email}} in Slack with the open text answer and create a follow-up task in Asana.",
    slug: "onboarding-pulse-template",
    tags: ["onboarding", "cs", "survey"],
    userId: USERS[1]!.id,
    createdDaysAgo: 5,
    updatedDaysAgo: 2,
  },
  {
    id: "cccc3333-3333-3333-3333-333333333333",
    title: "Renewal Risk Radar",
    summary: "Consolidates health signals and flags accounts at risk.",
    description: `Monitor product usage, support tickets, and NPS to proactively catch churn risk.

- Usage down 20% week-over-week? Tag as watchlist
- Two high-priority tickets in 48h? Notify success lead
- Surface signals in Monday dashboard
`,
    prompt:
      "Summarise health for {{account_name}} using product usage trend, open support tickets, and latest NPS comment. If risk is high, post to #renewal-risk with next best action.",
    slug: "renewal-risk-radar",
    tags: ["success", "renewal", "alerts"],
    userId: USERS[0]!.id,
    createdDaysAgo: 10,
    updatedDaysAgo: 9,
  },
];

const VOTES: SeedVote[] = [
  {
    id: "dddd4444-4444-4444-4444-444444444444",
    automationId: AUTOMATIONS[0]!.id,
    userId: USERS[0]!.id,
    value: 1,
    createdDaysAgo: 1,
  },
  {
    id: "eeee5555-5555-5555-5555-555555555555",
    automationId: AUTOMATIONS[0]!.id,
    userId: USERS[1]!.id,
    value: 1,
    createdDaysAgo: 3,
  },
  {
    id: "ffff6666-6666-6666-6666-666666666666",
    automationId: AUTOMATIONS[1]!.id,
    userId: USERS[0]!.id,
    value: 1,
    createdDaysAgo: 2,
  },
  {
    id: "aaaa7777-7777-7777-7777-777777777777",
    automationId: AUTOMATIONS[1]!.id,
    userId: USERS[1]!.id,
    value: 1,
    createdDaysAgo: 4,
  },
  {
    id: "bbbb8888-8888-8888-8888-888888888888",
    automationId: AUTOMATIONS[2]!.id,
    userId: USERS[1]!.id,
    value: -1,
    createdDaysAgo: 8,
  },
];

const SUBSCRIPTIONS: SeedSubscription[] = [
  {
    id: "aaaa9999-9999-9999-9999-999999999999",
    userId: USERS[0]!.id,
    type: "new",
    active: true,
  },
  {
    id: "bbbb0000-0000-0000-0000-000000000000",
    userId: USERS[0]!.id,
    type: "trending",
    active: true,
  },
  {
    id: "ccccaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    userId: USERS[1]!.id,
    type: "trending",
    active: false,
  },
];

const USER_PASSWORD = "12345678";
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const daysAgo = (days: number, base: Date) =>
  new Date(base.getTime() - days * DAY_IN_MS);

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceRoleKey) {
    throw new Error(
      "Missing Supabase service role key. Set SUPABASE_SERVICE_ROLE_KEY before seeding.",
    );
  }

  if (!supabaseUrl) {
    throw new Error(
      "Missing Supabase URL. Set NEXT_PUBLIC_SUPABASE_URL before seeding.",
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });

  const now = new Date();

  for (const user of USERS) {
    const { error } = await supabase.auth.admin.createUser({
      id: user.id,
      email: user.email,
      password: USER_PASSWORD,
      email_confirm: true,
      user_metadata: { name: user.name },
      app_metadata: {
        provider: "email",
        providers: ["email"],
      },
    });

    if (error) {
      throw new Error(
        `Failed to create auth user ${user.email}: ${error.message}`,
      );
    }
  }

  const profileRows = USERS.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    created_at: now.toISOString(),
  }));

  const { error: profilesError } = await supabase
    .from("profiles")
    .upsert(profileRows, { onConflict: "id" });

  if (profilesError) {
    throw new Error(`Failed to seed profiles: ${profilesError.message}`);
  }

  const { error: automationsError } = await supabase.from("automations").upsert(
    AUTOMATIONS.map(
      ({
        id,
        title,
        summary,
        description,
        prompt,
        slug,
        tags,
        userId,
        createdDaysAgo,
        updatedDaysAgo,
      }) => ({
        id,
        title,
        summary,
        description,
        prompt,
        slug,
        tags,
        user_id: userId,
        created_at: daysAgo(createdDaysAgo, now).toISOString(),
        updated_at: daysAgo(updatedDaysAgo, now).toISOString(),
      }),
    ),
    { onConflict: "id" },
  );

  if (automationsError) {
    throw new Error(`Failed to seed automations: ${automationsError.message}`);
  }

  const { error: votesError } = await supabase.from("votes").upsert(
    VOTES.map(({ id, automationId, userId, value, createdDaysAgo }) => ({
      id,
      automation_id: automationId,
      user_id: userId,
      value,
      created_at: daysAgo(createdDaysAgo, now).toISOString(),
    })),
    { onConflict: "id" },
  );

  if (votesError) {
    throw new Error(`Failed to seed votes: ${votesError.message}`);
  }

  const { error: subscriptionsError } = await supabase
    .from("subscriptions")
    .upsert(
      SUBSCRIPTIONS.map(({ id, userId, type, active }) => ({
        id,
        user_id: userId,
        type,
        active,
        created_at: now.toISOString(),
      })),
      { onConflict: "id" },
    );

  if (subscriptionsError) {
    throw new Error(
      `Failed to seed subscriptions: ${subscriptionsError.message}`,
    );
  }

  console.log("Database seeded successfully.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

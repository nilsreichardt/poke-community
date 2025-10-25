import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { resendClient } from "./resend";
import { createUnsubscribeUrl } from "./unsubscribe";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://poke.community";

type AutomationAnnouncementInput = {
  automationTitle: string;
  automationSlug: string;
};

type TrendingDigestInput = {
  automations: Array<{ title: string; slug: string; vote_total: number }>;
};

type SubscriptionRowWithProfile = {
  id: string;
  user_id: string;
  profiles: {
    email: string | null;
  } | null;
};

export async function sendAutomationAnnouncement(
  input: AutomationAnnouncementInput,
  creatorId: string,
) {
  if (!resendClient) {
    return;
  }
  const client = resendClient;

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("id, user_id, profiles!inner(email)")
    .eq("type", "new")
    .eq("active", true)
    .neq("user_id", creatorId)
    .returns<SubscriptionRowWithProfile[]>();

  if (error) {
    console.error("Unable to load subscribers", error);
    return;
  }

  const recipients =
    data
      ?.map((subscription) => {
        const email = subscription.profiles?.email;

        if (!email) {
          return null;
        }

        return {
          email,
          unsubscribeUrl: createUnsubscribeUrl(subscription.id, "new"),
        };
      })
      .filter(
        (
          subscription
        ): subscription is { email: string; unsubscribeUrl: string } =>
          subscription !== null
      ) ?? [];

  if (recipients.length === 0) {
    return;
  }

  const automationUrl = `${SITE_URL.replace(/\/$/, "")}/automations/${input.automationSlug}`;

  try {
    await Promise.all(
      recipients.map(async ({ email, unsubscribeUrl }) => {
        await client.emails.send({
          from: "poke.community <updates@emails.poke.community>",
          to: email,
          subject: `New automation on poke.community: ${input.automationTitle}`,
          html: buildAnnouncementHtml(
            input.automationTitle,
            automationUrl,
            unsubscribeUrl
          ),
          text: buildAnnouncementText(
            input.automationTitle,
            automationUrl,
            unsubscribeUrl
          ),
          headers: buildUnsubscribeHeaders(unsubscribeUrl),
        });
      })
    );
  } catch (sendError) {
    console.error("Unable to send automation announcement", sendError);
  }
}

function buildAnnouncementHtml(
  title: string,
  automationUrl: string,
  unsubscribeUrl: string
) {
  return [
    `<p>Hey community 👋</p>`,
    `<p>A new automation just dropped on <strong>poke.community</strong>:</p>`,
    `<p><a href="${automationUrl}">${title}</a></p>`,
    `<p>Give it a look, vote, and let the creator know what you think.</p>`,
    `<p>If you no longer want to receive these updates you can <a href="${unsubscribeUrl}">unsubscribe instantly</a>.</p>`,
    `<hr />`,
    `<small>poke.community is an independent community project and not affiliated with poke.</small>`,
  ].join("");
}

function buildAnnouncementText(
  title: string,
  automationUrl: string,
  unsubscribeUrl: string
) {
  return [
    `Hey community,`,
    ``,
    `A new automation just dropped on poke.community:`,
    title,
    automationUrl,
    ``,
    `Vote and share your thoughts with the creator.`,
    ``,
    `To unsubscribe instantly, visit: ${unsubscribeUrl}`,
    ``,
    `poke.community is an independent community project and not affiliated with poke.`,
  ].join("\n");
}

export async function sendTrendingDigest({
  automations,
}: TrendingDigestInput) {
  if (!resendClient || automations.length === 0) {
    return;
  }
  const client = resendClient;

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("id, user_id, profiles!inner(email)")
    .eq("type", "trending")
    .eq("active", true)
    .returns<SubscriptionRowWithProfile[]>();

  if (error) {
    console.error("Unable to load trending subscribers", error);
    return;
  }

  const recipients =
    data
      ?.map((subscription) => {
        const email = subscription.profiles?.email;

        if (!email) {
          return null;
        }

        return {
          email,
          unsubscribeUrl: createUnsubscribeUrl(subscription.id, "trending"),
        };
      })
      .filter(
        (
          subscription
        ): subscription is { email: string; unsubscribeUrl: string } =>
          subscription !== null
      ) ?? [];

  if (!recipients.length) {
    return;
  }

  const formattedList = automations
    .map((automation) => {
      const automationUrl = `${SITE_URL.replace(/\/$/, "")}/automations/${automation.slug}`;
      return `<li><a href="${automationUrl}">${automation.title}</a> – ${automation.vote_total} votes</li>`;
    })
    .join("");

  try {
    await Promise.all(
      recipients.map(async ({ email, unsubscribeUrl }) => {
        await client.emails.send({
          from: "poke.community <updates@poke.community>",
          to: email,
          subject: "Trending automations on poke.community",
          html: buildTrendingHtml(formattedList, unsubscribeUrl),
          text: buildTrendingText(automations, unsubscribeUrl),
          headers: buildUnsubscribeHeaders(unsubscribeUrl),
        });
      })
    );
  } catch (sendError) {
    console.error("Unable to send trending digest", sendError);
  }
}

function buildTrendingHtml(listItems: string, unsubscribeUrl: string) {
  return [
    `<p>Here are the automations people loved this week:</p>`,
    `<ul>${listItems}</ul>`,
    `<p>Vote for your favorites or submit your own automation on poke.community.</p>`,
    `<p>If you'd rather not receive trending updates you can <a href="${unsubscribeUrl}">unsubscribe here</a>.</p>`,
    `<hr />`,
    `<small>poke.community is an independent project and not affiliated with Poke.</small>`,
  ].join("");
}

function buildTrendingText(
  automations: TrendingDigestInput["automations"],
  unsubscribeUrl: string
) {
  return [
    `Here are the automations people loved this week:`,
    ``,
    ...automations.map(
      (automation, index) =>
        `${index + 1}. ${automation.title} (${automation.vote_total} votes)`
    ),
    ``,
    `Submit your own automations or vote on others at poke.community.`,
    ``,
    `To unsubscribe instantly, visit: ${unsubscribeUrl}`,
    ``,
    `poke.community is an independent project and not affiliated with Poke.`,
  ].join("\n");
}

function buildUnsubscribeHeaders(unsubscribeUrl: string) {
  return {
    "List-Unsubscribe": `<${unsubscribeUrl}>`,
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
  };
}

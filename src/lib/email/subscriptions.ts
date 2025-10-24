import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { resendClient } from "./resend";
import { isMockMode } from "@/lib/config";

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
  user_id: string;
  profiles: {
    email: string | null;
  } | null;
};

export async function sendAutomationAnnouncement(
  input: AutomationAnnouncementInput
) {
  if (!resendClient || isMockMode) {
    return;
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("user_id, profiles!inner(email)")
    .eq("type", "new")
    .eq("active", true)
    .returns<SubscriptionRowWithProfile[]>();

  if (error) {
    console.error("Unable to load subscribers", error);
    return;
  }

  const recipients =
    data
      ?.map((subscription) => subscription.profiles?.email)
      .filter((email): email is string => Boolean(email)) ?? [];

  if (recipients.length === 0) {
    return;
  }

  const automationUrl = `${SITE_URL.replace(/\/$/, "")}/automations/${input.automationSlug}`;

  try {
    await resendClient.emails.send({
      from: "poke.community <updates@poke.community>",
      to: recipients,
      subject: `New automation on poke.community: ${input.automationTitle}`,
      html: buildAnnouncementHtml(input.automationTitle, automationUrl),
      text: buildAnnouncementText(input.automationTitle, automationUrl),
    });
  } catch (sendError) {
    console.error("Unable to send automation announcement", sendError);
  }
}

function buildAnnouncementHtml(title: string, automationUrl: string) {
  return [
    `<p>Hey community 👋</p>`,
    `<p>A new automation just dropped on <strong>poke.community</strong>:</p>`,
    `<p><a href="${automationUrl}">${title}</a></p>`,
    `<p>Give it a look, vote, and let the creator know what you think.</p>`,
    `<p>If you no longer want to receive these updates you can manage your notification preferences from your profile.</p>`,
    `<hr />`,
    `<small>poke.community is an independent community project and not affiliated with poke.</small>`,
  ].join("");
}

function buildAnnouncementText(title: string, automationUrl: string) {
  return [
    `Hey community,`,
    ``,
    `A new automation just dropped on poke.community:`,
    title,
    automationUrl,
    ``,
    `Vote and share your thoughts with the creator.`,
    ``,
    `To unsubscribe, update your notification preferences in your profile.`,
    ``,
    `poke.community is an independent community project and not affiliated with poke.`,
  ].join("\n");
}

export async function sendTrendingDigest({
  automations,
}: TrendingDigestInput) {
  if (!resendClient || automations.length === 0 || isMockMode) {
    return;
  }

  const supabase = createSupabaseServiceRoleClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("user_id, profiles!inner(email)")
    .eq("type", "trending")
    .eq("active", true)
    .returns<SubscriptionRowWithProfile[]>();

  if (error) {
    console.error("Unable to load trending subscribers", error);
    return;
  }

  const recipients =
    data
      ?.map((subscription) => subscription.profiles?.email)
      .filter((email): email is string => Boolean(email)) ?? [];

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
    await resendClient.emails.send({
      from: "poke.community <updates@poke.community>",
      to: recipients,
      subject: "Trending automations on poke.community",
      html: `
        <p>Here are the automations people loved this week:</p>
        <ul>${formattedList}</ul>
        <p>Vote for your favorites or submit your own automation on poke.community.</p>
        <hr />
        <small>poke.community is an independent project and not affiliated with poke.</small>
      `,
      text: automations
        .map((automation, index) => `${index + 1}. ${automation.title} (${automation.vote_total} votes)`)
        .join("\n"),
    });
  } catch (sendError) {
    console.error("Unable to send trending digest", sendError);
  }
}

import { NextRequest, NextResponse } from "next/server";

import {
  SubscriptionType,
  verifyUnsubscribeToken,
} from "@/lib/email/unsubscribe";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

type RouteParams = {
  subscriptionId: string;
};

type RouteContext = {
  params: Promise<RouteParams>;
};

type UnsubscribeResult =
  | { kind: "success"; alreadyUnsubscribed: boolean }
  | { kind: "notFound" }
  | { kind: "error" };

async function unsubscribeSubscription(
  subscriptionId: string,
  type: SubscriptionType
): Promise<UnsubscribeResult> {
  const supabase = createSupabaseServiceRoleClient();

  const { data: existing, error: lookupError } = await supabase
    .from("subscriptions")
    .select("id, active")
    .eq("id", subscriptionId)
    .eq("type", type)
    .maybeSingle();

  if (lookupError) {
    console.error("Unable to lookup subscription for unsubscribe", lookupError);
    return { kind: "error" };
  }

  if (!existing) {
    return { kind: "notFound" };
  }

  if (!existing.active) {
    return { kind: "success", alreadyUnsubscribed: true };
  }

  const { error: updateError } = await supabase
    .from("subscriptions")
    .update({ active: false })
    .eq("id", subscriptionId);

  if (updateError) {
    console.error("Unable to deactivate subscription", updateError);
    return { kind: "error" };
  }

  return { kind: "success", alreadyUnsubscribed: false };
}

function respondWithHtml(status: number, title: string, body: string) {
  const html = `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          body { font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; padding: 32px; background-color: #0f172a; color: #f8fafc; }
          main { max-width: 520px; margin: 0 auto; background: #111827; border-radius: 16px; padding: 32px; box-shadow: 0 20px 50px rgba(15, 23, 42, 0.35); }
          h1 { font-size: 1.75rem; margin-bottom: 1rem; }
          p { line-height: 1.6; }
          a { color: #38bdf8; }
          .status { font-size: 0.875rem; opacity: 0.75; margin-top: 1.5rem; }
        </style>
      </head>
      <body>
        <main>
          <h1>${title}</h1>
          <p>${body}</p>
          <p><a href="/">Return to poke.community</a></p>
          <p class="status">If this wasn't you, you can resubscribe from your profile settings.</p>
        </main>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function respondWithEmpty(status: number) {
  return new NextResponse(null, { status });
}

function parseRequest(req: NextRequest, params: RouteParams) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";
  const type = (url.searchParams.get("type") ?? "") as SubscriptionType | "";
  const subscriptionId = params.subscriptionId;

  return { token, type, subscriptionId };
}

export async function GET(
  req: NextRequest,
  context: RouteContext
) {
  const params = await context.params;
  const { subscriptionId, type, token } = parseRequest(req, params);
  let tokenIsValid = false;

  try {
    tokenIsValid = Boolean(
      subscriptionId &&
        type &&
        token &&
        verifyUnsubscribeToken(subscriptionId, type, token)
    );
  } catch (error) {
    console.error(
      "Unable to validate unsubscribe token",
      error instanceof Error ? error : String(error)
    );
    return respondWithHtml(
      500,
      "Something went wrong",
      "We were unable to verify your unsubscribe link. Please try again later."
    );
  }

  if (!tokenIsValid) {
    return respondWithHtml(
      400,
      "Invalid unsubscribe link",
      "The unsubscribe link appears to be invalid or has expired. Please request a new unsubscribe email or adjust your notification preferences from your profile."
    );
  }

  if (type !== "new" && type !== "trending") {
    return respondWithHtml(
      400,
      "Unknown subscription",
      "We could not determine which subscription you tried to unsubscribe from."
    );
  }

  const result = await unsubscribeSubscription(subscriptionId, type);

  if (result.kind === "error") {
    return respondWithHtml(
      500,
      "Something went wrong",
      "We were unable to process your unsubscribe request. Please try again later or contact support."
    );
  }

  if (result.kind === "notFound") {
    return respondWithHtml(
      404,
      "Subscription not found",
      "We could not find an active subscription linked to this unsubscribe link. It may have already been removed."
    );
  }

  const message = result.alreadyUnsubscribed
    ? "You're already unsubscribed from these updates. No further action is needed."
    : "You're all set. You won't receive these updates anymore.";

  return respondWithHtml(200, "You are unsubscribed", message);
}

export async function POST(
  req: NextRequest,
  context: RouteContext
) {
  const params = await context.params;
  const { subscriptionId, type, token } = parseRequest(req, params);
  let tokenIsValid = false;

  try {
    tokenIsValid = Boolean(
      subscriptionId &&
        type &&
        token &&
        verifyUnsubscribeToken(subscriptionId, type, token)
    );
  } catch (error) {
    console.error(
      "Unable to validate unsubscribe token",
      error instanceof Error ? error : String(error)
    );
    return respondWithEmpty(500);
  }

  if (!tokenIsValid) {
    return respondWithEmpty(400);
  }

  if (type !== "new" && type !== "trending") {
    return respondWithEmpty(400);
  }

  const result = await unsubscribeSubscription(subscriptionId, type);

  if (result.kind === "error") {
    return respondWithEmpty(500);
  }

  if (result.kind === "notFound") {
    return respondWithEmpty(404);
  }

  return respondWithEmpty(200);
}

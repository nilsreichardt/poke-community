import { createHmac, timingSafeEqual } from "node:crypto";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://poke.community";

const UNSUBSCRIBE_SECRET = process.env.UNSUBSCRIBE_SECRET;

function ensureSecretConfigured() {
  if (!UNSUBSCRIBE_SECRET) {
    throw new Error(
      "Unsubscribe secret is not configured. Set the UNSUBSCRIBE_SECRET environment variable."
    );
  }
}

export type SubscriptionType = "new" | "trending";

function normalizeSiteUrl(path: string) {
  return `${SITE_URL.replace(/\/$/, "")}${path}`;
}

export function createUnsubscribeToken(
  subscriptionId: string,
  type: SubscriptionType
) {
  ensureSecretConfigured();

  const payload = `${subscriptionId}:${type}`;

  return createHmac("sha256", UNSUBSCRIBE_SECRET!)
    .update(payload)
    .digest("hex");
}

export function createUnsubscribeUrl(
  subscriptionId: string,
  type: SubscriptionType
) {
  const token = createUnsubscribeToken(subscriptionId, type);
  const unsubscribePath = `/unsubscribe/${subscriptionId}?type=${encodeURIComponent(type)}&token=${token}`;

  return normalizeSiteUrl(unsubscribePath);
}

export function verifyUnsubscribeToken(
  subscriptionId: string,
  type: string,
  token: string
): token is string {
  if (!token || !subscriptionId || !type) {
    return false;
  }

  if (type !== "new" && type !== "trending") {
    return false;
  }

  ensureSecretConfigured();

  const expectedToken = createUnsubscribeToken(
    subscriptionId,
    type as SubscriptionType
  );

  if (token.length !== expectedToken.length) {
    return false;
  }

  try {
    const provided = Buffer.from(token, "hex");
    const expected = Buffer.from(expectedToken, "hex");
    return (
      provided.length === expected.length &&
      timingSafeEqual(provided, expected)
    );
  } catch {
    return false;
  }
}

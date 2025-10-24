import type { Tables } from "./types";

export type AutomationRecord = Tables<"automations">;
export type SubscriptionRecord = Tables<"subscriptions">;
export type SubscriptionType = SubscriptionRecord["type"];
export type VoteRecord = Tables<"votes">;

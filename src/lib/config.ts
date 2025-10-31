export const dataMode =
  process.env.NEXT_PUBLIC_DATA_MODE ?? process.env.DATA_MODE ?? "supabase";

export const isMockMode = dataMode === "mock";

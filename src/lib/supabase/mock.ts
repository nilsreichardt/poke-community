import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

type MockSubscription = {
  unsubscribe(): void;
};

const noop = () => undefined;

const mockSupabaseClient = {
  auth: {
    onAuthStateChange: (_: unknown, callback?: (...args: unknown[]) => void) => {
      if (callback) {
        callback("SIGNED_OUT", null);
      }
      const subscription: MockSubscription = { unsubscribe: noop };
      return { data: { subscription } };
    },
    getSession: async () => ({
      data: { session: null },
      error: null,
    }),
    signOut: async () => ({
      error: null,
    }),
  },
} as unknown as SupabaseClient<Database>;

export function createMockSupabaseClient() {
  return mockSupabaseClient;
}

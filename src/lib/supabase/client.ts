import { createBrowserClient } from "@supabase/ssr";
import { isMockMode } from "@/lib/config";
import { createMockSupabaseClient } from "./mock";
import type { Database } from "./types";

export function createSupabaseBrowserClient() {
  if (isMockMode) {
    return createMockSupabaseClient();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase browser credentials. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

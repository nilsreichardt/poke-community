import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

type CookieMode = "mutate" | "readonly";

export async function createSupabaseServerClient(
  mode: CookieMode = "readonly",
): Promise<SupabaseClient<Database>> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase server credentials. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  const cookieStore = cookies();

  const cookieMethods =
    mode === "mutate"
      ? {
          async getAll() {
            return (await cookieStore)
              .getAll()
              .map(({ name, value }) => ({ name, value }));
          },
          async setAll(
            cookiesToSet: {
              name: string;
              value: string;
              options: CookieOptions | undefined;
            }[],
          ) {
            cookiesToSet.forEach(async ({ name, value, options }) => {
              (await cookieStore).set({
                name,
                value,
                ...(options ?? {}),
              });
            });
          },
        }
      : {
          async getAll() {
            return (await cookieStore)
              .getAll()
              .map(({ name, value }) => ({ name, value }));
          },
        };

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: cookieMethods,
  });
}

export function createSupabaseServiceRoleClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase service role credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
}

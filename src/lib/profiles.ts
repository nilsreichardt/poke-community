import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isMockMode } from "@/lib/config";

export async function upsertProfileFromSession(user: User) {
  if (isMockMode) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const username =
    (user.user_metadata as Record<string, string | undefined>)?.username ??
    user.email?.split("@")[0] ??
    null;

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      email: user.email ?? null,
      username,
    },
    {
      onConflict: "id",
    }
  );

  if (error) {
    console.error("Unable to sync profile information", error);
  }
}

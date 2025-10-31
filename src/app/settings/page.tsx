import { redirect } from "next/navigation";
import {
  getCurrentUser,
  getSubscriptionPreferences,
} from "@/lib/data/automations";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deleteAccountAction } from "@/app/actions/automation-actions";
import { SubscriptionSwitch } from "./subscription-switch";
import { DeleteAccountButton } from "./delete-account-button";
import { NameForm } from "./name-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/sign-in?next=/settings");
  }

  const supabase = await createSupabaseServerClient();

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(`Unable to load your profile: ${profileError.message}`);
  }

  const preferences = (await getSubscriptionPreferences()) ?? new Map();
  const profileName = profile?.name ?? null;

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your notifications and account data for the poke community.
        </p>
      </header>

      <section className="space-y-4 rounded-xl border border-border bg-card/60 p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold">Email notifications</h2>
          <p className="text-sm text-muted-foreground">
            We use Resend to deliver updates. You can opt out at any time.
          </p>
        </div>
        <div className="space-y-3">
          <SubscriptionSwitch
            type="new"
            label="New automation"
            description="Get an email whenever someone shares a new automation."
            defaultChecked={preferences.get("new") ?? false}
          />
          <SubscriptionSwitch
            type="trending"
            label="Trending roundup"
            description="Weekly digest featuring the highest voted automations."
            defaultChecked={preferences.get("trending") ?? false}
          />
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-card/60 p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold">Account</h2>
        </div>
        <div className="space-y-4">
          <NameForm initialName={profileName} />
          <hr className="border-t border-border/20" />
          <p className="text-sm text-muted-foreground">
            Deleting your account removes your automations, votes, and email
            preferences immediately. This cannot be undone.
          </p>
          <form action={deleteAccountAction}>
            <DeleteAccountButton />
          </form>
        </div>
      </section>
    </div>
  );
}

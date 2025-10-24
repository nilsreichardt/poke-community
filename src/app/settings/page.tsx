import { redirect } from "next/navigation";
import { getCurrentUser, getSubscriptionPreferences } from "@/lib/data/automations";
import { deleteAccountAction } from "@/app/actions/automation-actions";
import { SubscriptionSwitch } from "./subscription-switch";
import { DeleteAccountButton } from "./delete-account-button";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/sign-in?next=/settings");
  }

  const preferences = (await getSubscriptionPreferences()) ?? new Map();

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
          <p className="text-sm text-muted-foreground">
            Deleting your account removes your automations, votes, and email preferences immediately. This cannot be undone.
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <form action={deleteAccountAction}>
            <DeleteAccountButton />
          </form>
        </div>
      </section>
    </div>
  );
}

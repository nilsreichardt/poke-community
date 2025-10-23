import Link from "next/link";
import { getCurrentUser } from "@/lib/data/automations";
import { Button } from "@/components/ui/button";
import { AutomationForm } from "./submit-form";

export const dynamic = "force-dynamic";

export default async function SubmitPage() {
  const user = await getCurrentUser();

  if (!user) {
    return <SignInPrompt />;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Share a Poke automation</h1>
        <p className="text-sm text-muted-foreground">
          Tell the community what your automation does, who it helps, and link out to any templates or resources.
          You can always edit or remove your automation later.
        </p>
      </div>
      <AutomationForm />
    </div>
  );
}

function SignInPrompt() {
  const redirectTo = "/submit";
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 rounded-xl border border-border bg-card p-8 text-center">
      <h1 className="text-2xl font-semibold">Join the community</h1>
      <p className="text-sm text-muted-foreground">
        You need to be signed in to publish an automation. We&apos;ll email you a one-click sign-in link.
      </p>
      <Button asChild>
        <Link href={`/auth/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`}>
          Sign in with email
        </Link>
      </Button>
    </div>
  );
}

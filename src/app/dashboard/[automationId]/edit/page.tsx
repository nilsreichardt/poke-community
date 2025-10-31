import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  getAutomationForEditing,
  getCurrentUser,
} from "@/lib/data/automations";
import { EditAutomationForm } from "@/app/dashboard/edit-automation-form";

export const dynamic = "force-dynamic";

type EditAutomationPageProps = {
  params: Promise<{ automationId: string }>;
};

export default async function EditAutomationPage({
  params,
}: EditAutomationPageProps) {
  const { automationId } = await params;

  if (!automationId) {
    notFound();
  }

  const user = await getCurrentUser();

  if (!user) {
    const redirectTo = encodeURIComponent(`/dashboard/${automationId}/edit`);
    redirect(`/auth/sign-in?redirectTo=${redirectTo}`);
  }

  const automation = await getAutomationForEditing(automationId);

  if (!automation) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">
              Edit automation
            </h1>
            <p className="text-sm text-muted-foreground">
              Update the details below and publish your changes when you are
              ready.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/automations/${automation.slug}`}>View live</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="rounded-xl border border-border bg-card/60 p-6 shadow-sm">
        <EditAutomationForm automation={automation} />
      </section>
    </div>
  );
}

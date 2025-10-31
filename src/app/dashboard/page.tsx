import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getAutomationsForCurrentUser,
  getCurrentUser,
} from "@/lib/data/automations";
import { DeleteAutomationButton } from "./delete-automation-button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/sign-in?redirectTo=/dashboard");
  }

  const automations = await getAutomationsForCurrentUser();

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Your automations
        </h1>
        <p className="text-sm text-muted-foreground">
          Review everything you have shared with the community. You can open an
          automation to double-check the prompt or remove anything that is no
          longer relevant.
        </p>
      </header>

      {automations.length === 0 ? (
        <section className="flex flex-col items-start gap-4 rounded-xl border border-border bg-card/60 p-6 text-sm shadow-sm">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold">
              You have not shared an automation yet
            </h2>
            <p className="text-muted-foreground">
              Submit your first automation to make it appear here and help the
              community.
            </p>
          </div>
          <Button asChild>
            <Link href="/submit">Share an automation</Link>
          </Button>
        </section>
      ) : (
        <section className="space-y-4">
          {automations.map((automation) => {
            const createdAt = automation.created_at
              ? new Date(automation.created_at)
              : null;
            const createdLabel = createdAt
              ? formatDistanceToNow(createdAt, { addSuffix: true })
              : "Recently";
            return (
              <Card
                key={automation.id}
                className="border-border/80 bg-card/60 shadow-sm pb-0"
              >
                <CardHeader className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <CardTitle className="text-xl font-semibold">
                        {automation.title}
                      </CardTitle>
                      <CardDescription>
                        Published {createdLabel} · {automation.vote_total}{" "}
                        {automation.vote_total === 1 ? "vote" : "votes"}
                      </CardDescription>
                    </div>
                  </div>
                  {automation.summary ? (
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {automation.summary}
                    </p>
                  ) : null}
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  <p className="line-clamp-3 whitespace-pre-line">
                    {automation.description || "No description provided."}
                  </p>
                </CardContent>
                <CardFooter className="flex items-center justify-between gap-3 border-t border-border/60 bg-muted/40 pb-6">
                  <div className="text-xs text-muted-foreground">
                    Last updated{" "}
                    {automation.updated_at
                      ? formatDistanceToNow(new Date(automation.updated_at), {
                          addSuffix: true,
                        })
                      : createdLabel}
                  </div>
                  <div className="flex items-center gap-3">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/automations/${automation.slug}`}>View</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/dashboard/${automation.id}/edit`}>
                        Edit
                      </Link>
                    </Button>
                    <DeleteAutomationButton
                      automationId={automation.id}
                      automationTitle={automation.title}
                    />
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </section>
      )}
    </div>
  );
}

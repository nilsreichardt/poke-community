import { parseRedirectParam } from "@/lib/auth/redirects";
import { SignInForm } from "./sign-in-form";

export const dynamic = "force-dynamic";

type SignInSearchParams = Record<string, string | string[] | undefined>;

type SignInPageProps = {
  searchParams?: Promise<SignInSearchParams>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const redirectParam =
    resolvedSearchParams.redirectTo ?? resolvedSearchParams.next;
  const sanitizedRedirect = parseRedirectParam(redirectParam);
  const googleErrorMessage = resolveGoogleError(resolvedSearchParams);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-xl border border-border bg-card p-8 shadow-sm">
      <div>
        <h1 className="text-2xl font-semibold">Sign in to poke.community</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Continue with Google to manage automations,
          vote on ideas, and stay in sync with the community.
        </p>
      </div>
      <SignInForm
        redirectTo={sanitizedRedirect}
        googleErrorMessage={googleErrorMessage}
      />
    </div>
  );
}

function resolveGoogleError(params: SignInSearchParams) {
  const description = firstValue(params.error_description);
  if (description) {
    return description;
  }

  const error = firstValue(params.error);

  if (!error) {
    return null;
  }

  switch (error) {
    case "access_denied":
      return "Google sign-in was cancelled. Please try again or use a different account.";
    case "server_error":
      return "Google sign-in failed due to a temporary error. Please try again.";
    default:
      return "Google sign-in failed. Please try again.";
  }
}

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

import { SignInForm } from "./sign-in-form";

export const dynamic = "force-dynamic";

type SignInSearchParams = Record<string, string | string[] | undefined>;

type SignInPageProps = {
  searchParams?: Promise<SignInSearchParams>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const redirectParam =
    resolvedSearchParams.redirectTo ?? resolvedSearchParams.next ?? "/";
  const redirectTo = Array.isArray(redirectParam)
    ? redirectParam[0]
    : redirectParam ?? "/";
  const sanitizedRedirect = sanitizeRedirect(redirectTo);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-xl border border-border bg-card p-8 shadow-sm">
      <div>
        <h1 className="text-2xl font-semibold">Sign in to poke.community</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We will email you a secure sign-in link. No passwords to remember.
        </p>
      </div>
      <SignInForm redirectTo={sanitizedRedirect} />
      <p className="text-xs text-muted-foreground">
        Google sign-in is coming soon. For now we only support email links.
      </p>
    </div>
  );
}

function sanitizeRedirect(value: string) {
  if (typeof value !== "string") {
    return "/";
  }

  try {
    const decoded = decodeURIComponent(value);
    if (decoded.startsWith("/") && !decoded.startsWith("//")) {
      return decoded;
    }
  } catch {
    // ignore decode errors
  }

  return "/";
}

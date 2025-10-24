import { NextResponse } from "next/server";
import {
  parseRedirectParam,
  revalidateAuthPaths,
} from "@/lib/auth/redirects";
import { upsertProfileFromSession } from "@/lib/profiles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const redirectParam = requestUrl.searchParams.get("redirectTo") ?? undefined;
  const redirectTo = parseRedirectParam(redirectParam);
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  if (error) {
    return NextResponse.redirect(
      buildSignInErrorUrl(requestUrl, redirectTo, error, errorDescription)
    );
  }

  const code = requestUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(
      buildSignInErrorUrl(
        requestUrl,
        redirectTo,
        "missing_code",
        "We could not complete Google sign-in. Please try again."
      )
    );
  }

  const supabase = await createSupabaseServerClient("mutate");
  const { data, error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(
      buildSignInErrorUrl(
        requestUrl,
        redirectTo,
        "exchange_error",
        exchangeError.message
      )
    );
  }

  if (data.user) {
    await upsertProfileFromSession(data.user);
  }

  revalidateAuthPaths(redirectTo);

  const destination = new URL(redirectTo, requestUrl.origin);
  return NextResponse.redirect(destination);
}

function buildSignInErrorUrl(
  requestUrl: URL,
  redirectTo: string,
  error: string,
  description?: string | null
) {
  const url = new URL("/auth/sign-in", requestUrl.origin);
  url.searchParams.set("error", error);
  if (description) {
    url.searchParams.set("error_description", description);
  }
  if (redirectTo && redirectTo !== "/") {
    url.searchParams.set("redirectTo", redirectTo);
  }
  return url;
}

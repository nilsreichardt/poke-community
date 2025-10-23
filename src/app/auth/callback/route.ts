import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectTo = searchParams.get("next") ?? "/";

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(redirectTo, request.url).toString(), {
    status: 302,
  });
}

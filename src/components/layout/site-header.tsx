"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSupabase } from "@/components/providers/supabase-provider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { signOutAction } from "@/app/actions/automation-actions";
import { useFormStatus } from "react-dom";

const navigation = [
  { href: "/", label: "Home" },
  { href: "/automations", label: "Discover" },
  { href: "/submit", label: "Share" },
];

const isProduction = process.env.NODE_ENV === "production";

export function SiteHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useSupabase();
  const redirectTarget = buildRedirectTarget(pathname, searchParams);

  if (isProduction) {
    return null;
  }

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
          poke.community
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-medium md:flex">
          {navigation.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`transition hover:text-primary ${isActive ? "text-primary" : "text-muted-foreground"
                  }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <UserMenu redirectTo={redirectTarget} />
          ) : (
            <Button asChild variant="outline">
              <Link
                href={`/auth/sign-in?redirectTo=${encodeURIComponent(redirectTarget)}`}
              >
                Sign in
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

type UserMenuProps = {
  redirectTo: string;
};

function UserMenu({ redirectTo }: UserMenuProps) {
  const { user } = useSupabase();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dropdownRedirect = redirectTo || buildRedirectTarget(pathname, searchParams);
  const email = user?.email ?? "";
  const fallback = email ? email.slice(0, 2).toUpperCase() : "PC";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{fallback}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium sm:inline">
            {email}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem asChild>
          <Link href="/dashboard">My automations</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <form className="w-full" action={signOutAction}>
            <input type="hidden" name="redirectTo" value={dropdownRedirect} />
            <SubmitButton />
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="w-full text-left text-sm text-destructive"
      disabled={pending}
    >
      {pending ? "Signing out..." : "Sign out"}
    </button>
  );
}

function buildRedirectTarget(
  pathname: string,
  searchParams: ReturnType<typeof useSearchParams>
) {
  const searchString = searchParams?.toString?.() ?? "";
  return searchString ? `${pathname}?${searchString}` : pathname || "/";
}

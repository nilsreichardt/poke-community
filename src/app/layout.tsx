import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SupabaseProvider } from "@/components/providers/supabase-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { isMockMode } from "@/lib/config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://poke.community"),
  title: "poke.community — Community-curated Poke automations",
  description:
    "Discover and share Poke automations built by the community. Vote, explore trends, and stay in the loop with the latest workflow inspiration.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let session = null;

  if (!isMockMode) {
    const supabase = await createSupabaseServerClient();
    const {
      data,
    } = await supabase.auth.getSession();
    session = data.session;
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SupabaseProvider initialSession={session}>
          <div className="flex min-h-screen flex-col bg-background text-foreground">
            <SiteHeader />
            <main className="flex-1">
              <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
                {children}
              </div>
            </main>
            <SiteFooter />
          </div>
        </SupabaseProvider>
      </body>
    </html>
  );
}

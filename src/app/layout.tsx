import { Suspense } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { SupabaseProvider } from "@/components/providers/supabase-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { metadataBaseUrl, siteMetadata, absoluteUrl } from "@/lib/seo";
import { getCurrentUser } from "@/lib/data/automations";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: metadataBaseUrl(),
  title: {
    default: `${siteMetadata.name} — Community-curated Poke automations`,
    template: `%s — ${siteMetadata.shortName}`,
  },
  description: siteMetadata.description,
  keywords: siteMetadata.keywords,
  openGraph: {
    type: "website",
    siteName: siteMetadata.name,
    title: `${siteMetadata.name} — Community-curated Poke automations`,
    description: siteMetadata.description,
    locale: siteMetadata.locale,
    url: absoluteUrl(),
    images: [
      {
        url: absoluteUrl(siteMetadata.defaultOgImage),
        width: 1200,
        height: 630,
        alt: `${siteMetadata.name} — Community-curated Poke automations`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteMetadata.name} — Community-curated Poke automations`,
    description: siteMetadata.description,
    images: [absoluteUrl(siteMetadata.defaultOgImage)],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script id="strip-grammarly-attrs" strategy="beforeInteractive">
          {`(function(){if(typeof document==="undefined")return;var target=document.body;if(!target)return;["data-new-gr-c-s-check-loaded","data-gr-ext-installed"].forEach(function(attr){if(target.hasAttribute(attr)){target.removeAttribute(attr);}});}());`}
        </Script>
        <SupabaseProvider key={user?.id ?? "anonymous"} initialUser={user}>
          <div className="flex min-h-screen flex-col bg-background text-foreground">
            <Suspense fallback={null}>
              <SiteHeader />
            </Suspense>
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

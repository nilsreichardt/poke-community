import type { Metadata } from "next";
import { absoluteUrl, siteMetadata } from "@/lib/seo";

const pageTitle = "Privacy Policy";
const pageDescription =
  "Learn how poke.community processes personal data, the partners we rely on, and the rights you have under the GDPR.";

export const metadata: Metadata = {
  title: `${pageTitle} — ${siteMetadata.shortName}`,
  description: pageDescription,
  alternates: {
    canonical: absoluteUrl("/privacy"),
  },
  openGraph: {
    title: `${pageTitle} — ${siteMetadata.shortName}`,
    description: pageDescription,
    url: absoluteUrl("/privacy"),
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${pageTitle} — ${siteMetadata.shortName}`,
    description: pageDescription,
  },
};

export default function PrivacyPolicyPage() {
  return (
    <article className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">
          This notice explains how we process personal data when you visit or use poke.community.
        </p>
      </header>

      <section className="space-y-2 text-sm leading-relaxed">
        <h2 className="text-xl font-semibold">Data Controller</h2>
        <p>Nils Reichardt Agency</p>
        <p>Grimmstr. 33</p>
        <p>40235 Düsseldorf, Germany</p>
        <p>
          Email:{" "}
          <a
            href="mailto:hi@poke.community"
            className="underline hover:no-underline"
          >
            hi@poke.community
          </a>
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-xl font-semibold">Overview</h2>
        <p>
          poke.community is a community hub where registered members can publish, discover, and vote on automations built with Poke. We operate the service in the European Union using Supabase (EU project region) for authentication and data storage and deploy the website on Vercel.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-xl font-semibold">Personal Data We Process</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Account details.</strong> When you register or sign in we process your email address and password credentials through Supabase. We synchronise your Supabase user ID, email address, and optional name, avatar, or bio to the public profile table.
          </li>
          <li>
            <strong>Community submissions.</strong> When you submit or edit an automation we store the content you provide (title, summary, description, prompt, tags) together with your user ID and timestamps.
          </li>
          <li>
            <strong>Interaction data.</strong> We record votes that you cast on automations and the notification preferences you set (e.g. “new automation” or “trending roundup” emails).
          </li>
          <li>
            <strong>Communication data.</strong> If you opt into email notifications, we share your email address with our email provider Resend to deliver announcements and digests. When you contact us by email we process the contents of your message.
          </li>
          <li>
            <strong>Technical logs.</strong> Our hosting provider Vercel automatically collects request metadata such as IP address, browser information, and timestamps for security and performance monitoring. Supabase also records audit logs for authentication events.
          </li>
        </ul>
        <p>
          We do not run analytics or advertising trackers. Cookies are only set when required for Supabase authentication.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-xl font-semibold">Purposes and Legal Bases</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Provide the service.</strong> We process account, submission, and interaction data to operate the community platform, authenticate users, display automation content, and maintain leaderboards (Art. 6(1)(b) GDPR – performance of a contract).
          </li>
          <li>
            <strong>Send community updates.</strong> We deliver opt-in announcement and digest emails via Resend based on your preferences (Art. 6(1)(a) GDPR – consent, which you can withdraw at any time in Settings or by contacting us).
          </li>
          <li>
            <strong>Security and abuse prevention.</strong> We use technical logs to troubleshoot issues, prevent misuse, and secure our infrastructure (Art. 6(1)(f) GDPR – legitimate interests).
          </li>
          <li>
            <strong>Legal obligations.</strong> We may retain data where necessary to comply with statutory retention duties or requests from authorities (Art. 6(1)(c) GDPR).
          </li>
        </ul>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-xl font-semibold">Recipients and International Transfers</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Supabase.</strong> We host our database and authentication with Supabase. The project is configured in an EU data region. Supabase acts as our processor and stores user profiles, automations, votes, and subscription preferences on our behalf.
          </li>
          <li>
            <strong>Vercel.</strong> The web application is deployed on Vercel, which may process request metadata and generated content when serving pages. Vercel relies on Standard Contractual Clauses (SCCs) for any transfers outside the EU/EEA.
          </li>
          <li>
            <strong>Resend.</strong> We use Resend to send community emails. Resend processes recipient email addresses and message content and applies SCCs for transfers to the United States.
          </li>
        </ul>
        <p>
          Where providers transfer data outside the EU/EEA we rely on contractual safeguards such as the European Commission’s Standard Contractual Clauses and, where necessary, additional protective measures.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-xl font-semibold">Data Retention</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Account and profile data remain active until you request deletion of your account.</li>
          <li>Automation submissions, votes, and public profile information stay published until you edit or remove them or until we delete them to enforce our Terms of Service.</li>
          <li>Notification preferences are retained until you unsubscribe or delete your account.</li>
          <li>Support correspondence is kept for as long as required to resolve your request and to comply with statutory obligations.</li>
          <li>Hosting and access logs are typically retained by Vercel for up to 30 days; Supabase authentication logs follow Supabase’s default retention periods.</li>
        </ul>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-xl font-semibold">Security Measures</h2>
        <p>
          We use TLS encryption in transit, restrict access to Supabase with role-based permissions, and apply Supabase row level security policies to ensure that users can only manage their own data. Service secrets are stored in environment variables managed by Vercel.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-xl font-semibold">Your Rights</h2>
        <p>
          Under the GDPR you have the right to access, rectify, erase, or port your data, to restrict or object to certain processing, and to withdraw consent at any time. You can update your subscriptions in Settings and request further changes or deletion by contacting us at{" "}
          <a
            href="mailto:hi@poke.community"
            className="underline hover:no-underline"
          >
            hi@poke.community
          </a>
          .
        </p>
        <p>
          You also have the right to lodge a complaint with the competent supervisory authority. For our establishment in Germany this is the Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein-Westfalen (LDI NRW).
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-xl font-semibold">Automated Decision-Making</h2>
        <p>
          We do not carry out automated decision-making or profiling that produces legal effects concerning you.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-xl font-semibold">Changes to This Policy</h2>
        <p>
          We may update this privacy policy to reflect technical or legal changes. Significant changes will be announced on this page. The most recent version is always available at{" "}
          <code>/privacy</code>.
        </p>
      </section>
    </article>
  );
}

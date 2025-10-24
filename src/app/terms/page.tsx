import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — poke.community",
  description:
    "Terms that govern your use of the poke.community platform and community features.",
};

export default function TermsOfServicePage() {
  return (
    <article className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">
          These terms govern your access to and use of poke.community. By creating an account or using the service you agree to them.
        </p>
      </header>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
        <p>
          poke.community is operated by Nils Reichardt Agency (“we”, “us”). By accessing or using the website you agree to be bound by these Terms of Service (“Terms”) and our Privacy Policy. If you do not agree, you must not use the service.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-xl font-semibold">2. Eligibility and Accounts</h2>
        <p>
          You must be at least 16 years old and capable of entering into a binding agreement to use the service. When you register, you must provide accurate and complete information and keep it up to date. Accounts are provided through Supabase authentication.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-xl font-semibold">3. Account Security</h2>
        <p>
          You are responsible for safeguarding your account credentials and for all activity that occurs under your account. Notify us immediately if you suspect unauthorised use. We may suspend or disable accounts when we detect suspicious activity.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-xl font-semibold">4. User Content</h2>
        <p>
          You retain ownership of the automations, prompts, descriptions, and other materials (“User Content”) you submit. By posting User Content you grant us a worldwide, non-exclusive, royalty-free licence to store, display, reproduce, and share it for the purpose of operating and promoting the community, including via email updates.
        </p>
        <p>
          You represent that you have all rights necessary to submit the User Content and that it does not infringe any third-party rights. You may edit or delete your submissions at any time; removing content will not affect copies already shared in digests or backups created for operational purposes.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-xl font-semibold">5. Community Guidelines</h2>
        <p>
          You agree not to:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Upload content that is unlawful, defamatory, discriminatory, or infringes the intellectual property or privacy rights of others.</li>
          <li>Publish automations that contain malicious code, security exploits, or sensitive personal data.</li>
          <li>Manipulate votes, interfere with other users’ access, or attempt to gain unauthorised access to the service.</li>
          <li>Use the platform for advertising unrelated products, spam, or other unsolicited communications.</li>
        </ul>
        <p>
          We may remove content or suspend accounts that violate these guidelines.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-xl font-semibold">6. Intellectual Property</h2>
        <p>
          The poke.community name, branding, and platform features are owned by us. References to Poke are for descriptive purposes only; the project is not affiliated with or endorsed by Poke or Interaction Company. All third-party trademarks belong to their respective owners.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-xl font-semibold">7. Feedback</h2>
        <p>
          If you provide feedback or suggestions, you grant us permission to use them without obligation to you.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-xl font-semibold">8. Third-Party Services</h2>
        <p>
          We rely on Supabase to authenticate accounts and store community data, on Vercel to host the application, and on Resend to deliver optional email updates. Your use of the service is subject to their availability and performance. We are not responsible for interruptions or data loss caused by third-party providers.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-xl font-semibold">9. Disclaimers</h2>
        <p>
          The service is provided “as is” without warranties of any kind, whether express or implied. We do not guarantee the accuracy, completeness, or reliability of any content shared by community members or the availability of the service at all times.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-xl font-semibold">10. Limitation of Liability</h2>
        <p>
          To the extent permitted by law, we will not be liable for indirect, consequential, or incidental damages, lost profits, or loss of data arising out of or related to your use of the service. Our aggregate liability for direct damages will not exceed EUR 100.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-xl font-semibold">11. Indemnification</h2>
        <p>
          You agree to indemnify and hold us harmless from any claims, damages, losses, or expenses arising from your use of the service, your User Content, or your violation of these Terms.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-xl font-semibold">12. Termination</h2>
        <p>
          You may terminate your use of the service at any time by deleting your account or ceasing to use the site. We may suspend or terminate access at our discretion, including for breaches of these Terms or legal obligations. Termination will not affect provisions that by their nature should survive.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-xl font-semibold">13. Governing Law</h2>
        <p>
          These Terms are governed by the laws of the Federal Republic of Germany. If you are a merchant, legal entity under public law, or public-law special fund, exclusive jurisdiction lies with the courts of Düsseldorf, Germany.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-xl font-semibold">14. Changes to the Terms</h2>
        <p>
          We may update these Terms from time to time. If we make material changes, we will notify you via the site or email. The updated Terms take effect when published. Continued use of the service constitutes acceptance of the revised Terms.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-xl font-semibold">15. Contact</h2>
        <p>
          For questions about these Terms, contact us at{" "}
          <a
            href="mailto:hi@poke.community"
            className="underline hover:no-underline"
          >
            hi@poke.community
          </a>
          .
        </p>
      </section>
    </article>
  );
}

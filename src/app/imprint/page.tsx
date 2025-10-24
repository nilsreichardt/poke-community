import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Imprint — poke.community",
  description:
    "Legal disclosure and provider information for poke.community, operated by Nils Reichardt Agency.",
};

export default function ImprintPage() {
  return (
    <article className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Imprint</h1>
        <p className="text-sm text-muted-foreground">
          Information according to § 5 TMG.
        </p>
      </header>

      <section className="space-y-2 text-sm leading-relaxed">
        <h2 className="text-xl font-semibold">Service Provider</h2>
        <p>Nils Reichardt Agency</p>
        <p>Grimmstr. 33</p>
        <p>40235 Düsseldorf</p>
        <p>Germany</p>
      </section>

      <section className="space-y-2 text-sm leading-relaxed">
        <h2 className="text-xl font-semibold">Represented by</h2>
        <p>Nils Reichardt</p>
      </section>

      <section className="space-y-2 text-sm leading-relaxed">
        <h2 className="text-xl font-semibold">Contact</h2>
        <p>
          Phone:{" "}
          <a href="tel:+4915229504121" className="underline hover:no-underline">
            +49 1522 9504121
          </a>
        </p>
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

      <section className="space-y-2 text-sm leading-relaxed">
        <h2 className="text-xl font-semibold">Sales Tax ID</h2>
        <p>
          Sales tax identification number according to §27a Umsatzsteuergesetz:
          DE353720936
        </p>
      </section>

      <section className="space-y-4 text-sm leading-relaxed">
        <h2 className="text-xl font-semibold">Disclaimer</h2>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Liability for Contents</h3>
          <p>
            The contents of our pages were created with the greatest care.
            However, we cannot guarantee the correctness, completeness, and
            up-to-dateness of the contents. As a service provider, we are
            responsible for our own content on these pages in accordance with
            general legislation pursuant to § 7 Para. 1 TMG. However, according
            to §§ 8 to 10 TMG, we are not obliged as a service provider to
            monitor transmitted or stored third-party information or to
            investigate circumstances that indicate illegal activity. Obligations
            to remove or block the use of information in accordance with general
            laws remain unaffected. However, liability in this respect is only
            possible from the point in time at which a concrete infringement of
            the law becomes known. If we become aware of such infringements, we
            will remove this content immediately.
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Liability for Links</h3>
          <p>
            Our website contains links to external third-party websites over
            whose content we have no influence. Therefore, we cannot assume any
            liability for these external contents. The respective provider or
            operator of the pages is always responsible for the content of the
            linked pages. The linked pages were checked for possible legal
            violations at the time of linking. Illegal contents were not
            recognisable at the time of linking. However, permanent monitoring
            of the content of the linked pages is not reasonable without
            concrete indications of a legal violation. If we become aware of any
            infringements of the law, we will remove such links immediately.
          </p>
        </div>
      </section>
    </article>
  );
}

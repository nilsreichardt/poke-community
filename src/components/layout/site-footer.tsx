import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 md:flex-col md:items-start">
        <div className="flex w-full flex-col gap-1 sm:flex-row">
          <div className="flex flex-col gap-3 sm:flex-1">
            <p>
              <Link href="/imprint" className="hover:underline">
                Imprint
              </Link>
              {" | "}
              <Link href="/terms" className="hover:underline">
                Terms of Service
              </Link>
              {" | "}
              <Link href="/privacy" className="hover:underline">
                Privacy Policy
              </Link>
            </p>
            <Link href="https://github.com/nilsreichardt/poke-community" target="_blank" rel="noopener noreferrer" className="hover:underline">
              GitHub
            </Link>
          </div>
          <div className="flex flex-col gap-1 sm:ml-auto">
            <p className="max-w-[60ch] text-right">
              poke.community is an independent project and is not affiliated with or endorsed by{" "}
              <Link href="https://poke.com" target="_blank" rel="noopener noreferrer" className="hover:underline">
                Poke
              </Link>{" "}
              or{" "}
              <Link href="https://interaction.co/about" target="_blank" rel="noopener noreferrer" className="hover:underline">
                The Interaction Company of California
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

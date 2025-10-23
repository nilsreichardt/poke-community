export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© {new Date().getFullYear()} poke.community. Built by the community for the community.</p>
        <p>
          poke.community is an independent project and is not affiliated with or endorsed by poke or Interaction Company.
        </p>
      </div>
    </footer>
  );
}

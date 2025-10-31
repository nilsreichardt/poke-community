<h1 align="center">poke.community</h1>

<img width="1552" height="981" alt="poke-community-screenshot" src="https://github.com/user-attachments/assets/955c557a-f137-42ee-8afa-73d503e34466" />

Community hub for sharing and discovering automations built with [Poke](https://poke.com). Makers can publish their workflows, the community can vote and discuss, and subscribers get notified whenever something new or trending drops. This project is not affiliated with [Poke](https://poke.com) or [The Interaction Company of California](https://interaction.co/about).

## Features

- Email-based authentication with Supabase (Google sign-in coming later)
- Publish Poke automations with descriptions, prompts, setup notes, and tags
- Upvote / downvote system with trending leaderboard
- Searchable index of every automation
- Subscription preferences for new drops or weekly trending digests, powered by Resend
- Modern interface built with Next.js App Router, Tailwind CSS, and shadcn/ui components

## Tech Stack

- Next.js 15 (App Router, Server Actions)
- TypeScript + ESLint
- Tailwind CSS v4 + shadcn/ui
- Supabase (Postgres, Auth, RLS)
- Resend for transactional email

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the environment template and fill in your keys:

   ```bash
   cp .env.local.example .env.local
   ```

   Required variables:
   - `NEXT_PUBLIC_SITE_URL` – base URL of the deployed site (e.g. http://localhost:3000)
   - `NEXT_PUBLIC_SUPABASE_URL` – Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` – Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY` – service role key (used server-side to refresh vote totals & email subscribers)
   - `RESEND_API_KEY` – API key from Resend

3. Set up Supabase locally (see the next section) or point the environment variables to a hosted project.

4. Start the dev server:

   ```bash
   npm run dev
   ```

5. Visit [http://localhost:3000](http://localhost:3000) and sign in with an email magic link.

Run linting any time with `npm run lint`.

## Local Supabase

This repo ships with Supabase CLI configuration, migrations, and seeds so you can run the full stack locally without manual setup.

1. Install the [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started) and ensure Docker is running.
2. Start the local stack:

   ```bash
   npm run supabase:start
   ```

3. Apply migrations and seed data (can be rerun any time):

   ```bash
   npm run supabase:reset
   ```

   This runs the SQL files from `supabase/migrations` and `supabase/seed.sql`, giving you demo users, three automations, historical votes, and subscription preferences that match the mock data used in tests.

4. Update `.env.local` with the local credentials output by the CLI (typically `http://127.0.0.1:54321` plus the anon and service role keys located in `supabase/.branches/main/.env`).

5. Restart the Next.js dev server so it picks up the new environment variables.

## Email (Resend)

Add your Resend API key to `.env.local`. By default, emails are sent from `updates@poke.community`. Update the sender address in `src/lib/email/subscriptions.ts` if you plan to use a different verified domain. Two helper functions are available:

- `sendAutomationAnnouncement` – called automatically when a new automation is published to announce it to subscribers who opted into "New automation" updates.
- `sendTrendingDigest` – utility you can wire up to a scheduled job to send a weekly digest to users who opted into "Trending" updates.

## Testing

Unit tests run with Jest (using mocked data) and end-to-end flows run with Playwright against a dev server configured in mock data mode.

```bash
npm run test:unit
npm run test:e2e
```

The first time you run Playwright you may need to install browser binaries:

```bash
npx playwright install
```

To execute everything in one shot use `npm run test`. Tests automatically set `NEXT_PUBLIC_DATA_MODE=mock`, so no Supabase instance is required for the suite.

---

poke.community is a community-driven showcase and is not affiliated with [Poke](https://poke.com) or [The Interaction Company of California](https://interaction.co/about).

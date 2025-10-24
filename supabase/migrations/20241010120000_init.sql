create extension if not exists "uuid-ossp";
create extension if not exists moddatetime schema extensions;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz default timezone('utc', now()),
  name text,
  avatar_url text,
  bio text,
  email text,
  unique(email)
);

create table if not exists public.automations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now()),
  title text not null,
  summary text,
  description text not null,
  prompt text not null,
  slug text not null unique,
  tags text[],
  user_id uuid not null references public.profiles (id) on delete cascade,
  vote_total integer not null default 0
);

create trigger set_automations_updated_at
  before update on public.automations
  for each row execute procedure moddatetime (updated_at);

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default timezone('utc', now()),
  automation_id uuid not null references public.automations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  unique (automation_id, user_id)
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default timezone('utc', now()),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('new', 'trending')),
  active boolean not null default true,
  unique (user_id, type)
);

create or replace view public.automations_with_scores as
select
  a.id,
  a.title,
  a.slug,
  a.summary,
  a.description,
  a.prompt,
  a.tags,
  a.created_at,
  a.updated_at,
  a.vote_total,
  coalesce(sum(case when v.created_at >= timezone('utc', now()) - interval '7 days' then v.value end), 0) as recent_votes
from public.automations a
left join public.votes v on v.automation_id = a.id
group by a.id;

alter table public.profiles enable row level security;
alter table public.automations enable row level security;
alter table public.votes enable row level security;
alter table public.subscriptions enable row level security;

create policy "Profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can upsert their profile" on public.profiles
  for all using (auth.uid() = id);

create policy "Automations are public" on public.automations
  for select using (true);

create policy "Users can manage their automations" on public.automations
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Votes are visible" on public.votes
  for select using (true);

create policy "Signed-in users can vote" on public.votes
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Signed-in users manage their subscriptions" on public.subscriptions
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

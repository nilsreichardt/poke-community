-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto schema extensions;
create extension if not exists citext schema extensions;
create extension if not exists moddatetime schema extensions;

-- Tables
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz default timezone('utc', now()),
  name text,
  avatar_url text,
  email citext,
  unique(email)
);

create table if not exists public.automations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default timezone('utc', now()),
  updated_at timestamptz default timezone('utc', now()),
  title text not null,
  summary text,
  description text not null,
  prompt text,
  slug text not null unique,
  tags text[],
  user_id uuid not null references public.profiles (id) on delete cascade,
  constraint slug_format check (slug ~ '^[a-z0-9-]+$'),
  constraint tags_len check (coalesce(array_length(tags, 1), 0) <= 20)
);

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

-- Functions
create function public.get_vote_statistics(target_ids uuid[] default null)
returns table (
  automation_id uuid,
  vote_total bigint,
  recent_votes bigint
)
language sql
security definer
set search_path = public
as $$
  select
    v.automation_id,
    coalesce(sum(v.value), 0) as vote_total,
    coalesce(
      sum(
        case
          when v.created_at >= timezone('utc', now()) - interval '7 days'
            then v.value
        end
      ),
      0
    ) as recent_votes
  from public.votes v
  where target_ids is null
    or array_length(target_ids, 1) is null
    or v.automation_id = any(target_ids)
  group by v.automation_id;
$$;
grant execute on function public.get_vote_statistics(uuid[]) to authenticated, anon, service_role;
comment on function public.get_vote_statistics(uuid[]) is
  'Returns aggregate vote totals (overall and trailing seven days) for the supplied automation IDs.';

create function public.get_user_votes(target_ids uuid[] default null)
returns table (automation_id uuid, value smallint)
language sql
security definer
set search_path = public
as $$
  select automation_id, value
  from public.votes
  where auth.uid() is not null
    and user_id = auth.uid()
    and (
      target_ids is null
      or array_length(target_ids, 1) is null
      or automation_id = any(target_ids)
    );
$$;
grant execute on function public.get_user_votes(uuid[]) to authenticated, anon, service_role;
comment on function public.get_user_votes(uuid[]) is
  'Returns the calling user''s votes for the supplied automation IDs.';

create or replace function prevent_email_update()
returns trigger as $$
begin
  if new.email <> old.email then
    raise exception 'Email cannot be changed manually';
  end if;
  return new;
end;
$$ language plpgsql;

-- Views
create or replace view public.public_profiles as
  select id, name, avatar_url
  from public.profiles p
  where exists (
    select *
    from public.automations a
    where p.id = a.user_id
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
  a.user_id,
  coalesce(stats.vote_total, 0) as vote_total,
  coalesce(stats.recent_votes, 0) as recent_votes
from public.automations a
left join lateral (
  select
    s.vote_total,
    s.recent_votes
  from public.get_vote_statistics(array[a.id]) s
) stats on true;

-- Triggers
create trigger set_automations_updated_at
  before update on public.automations
  for each row execute procedure extensions.moddatetime(updated_at);

create trigger prevent_email_update_trigger
  before update on public.profiles
  for each row
  when (old.email is distinct from new.email)
  execute function prevent_email_update();

-- Indexes
create index if not exists votes_automation_created_idx
  on public.votes (automation_id, created_at);

create index if not exists automations_tags_gin
  on public.automations using gin (tags);

create unique index if not exists automations_slug_lower_uk
  on public.automations (lower(slug));

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.automations enable row level security;
alter table public.votes enable row level security;
alter table public.subscriptions enable row level security;

-- Profile policies
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert their profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Automation policies
create policy "Automations are public"
  on public.automations for select
  using (true);

create policy "Users can insert automations"
  on public.automations for insert
  with check (auth.uid() = user_id);

create policy "Users can update their automations"
  on public.automations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their automations"
  on public.automations for delete
  using (auth.uid() = user_id);

-- Vote policies
create policy "Signed-in users can vote"
  on public.votes
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Subscription policies
create policy "Signed-in users manage their subscriptions"
  on public.subscriptions
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Grants
grant select on public.public_profiles to anon, authenticated, service_role;
grant select on public.automations_with_scores to anon, authenticated, service_role;

-- Limit vote visibility to aggregate-friendly fields
revoke select on public.votes from anon, authenticated;
grant select (id, automation_id, value, created_at) on public.votes to anon, authenticated;
grant select (user_id) on public.votes to authenticated;
grant select on public.votes to service_role;

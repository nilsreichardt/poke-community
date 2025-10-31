-- Restrict exposure of profile PII to public roles
revoke select on public.profiles from anon, authenticated;
grant select (id, created_at, name, avatar_url) on public.profiles to anon, authenticated;
grant select on public.profiles to service_role;

-- Remove the wide-open vote visibility policy
drop policy if exists "Votes are visible" on public.votes;

-- Rebuild vote aggregation helpers with security definer functions
drop view if exists public.automations_with_scores;
drop function if exists public.get_vote_statistics(uuid[]);

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

grant select on public.automations_with_scores to anon, authenticated, service_role;

-- Limit vote visibility to aggregate-friendly fields
revoke select on public.votes from anon, authenticated;
grant select (id, automation_id, value, created_at) on public.votes to anon, authenticated;
grant select (user_id) on public.votes to authenticated;
grant select on public.votes to service_role;

-- Helper RPC to retrieve the current user's votes without exposing user_id broadly
drop function if exists public.get_user_votes(uuid[]);

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

comment on function public.get_vote_statistics(uuid[]) is
  'Returns aggregate vote totals (overall and trailing seven days) for the supplied automation IDs.';

comment on function public.get_user_votes(uuid[]) is
  'Returns the calling user''s votes for the supplied automation IDs.';

grant execute on function public.get_vote_statistics(uuid[]) to authenticated, anon;
grant execute on function public.get_user_votes(uuid[]) to authenticated, anon;

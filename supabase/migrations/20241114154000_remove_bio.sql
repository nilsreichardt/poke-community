alter table public.profiles
  drop column bio cascade;

create or replace view public.public_profiles as
  select id, created_at, name, avatar_url
  from public.profiles;

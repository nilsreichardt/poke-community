alter table public.automations
  alter column prompt drop not null;

update public.automations
set prompt = null
where prompt is not null and btrim(prompt) = '';

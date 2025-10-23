-- Seed users
insert into auth.users (id, email, raw_user_meta_data, raw_app_meta_data, aud, role, email_confirmed_at, encrypted_password, created_at, updated_at)
values
  ('11111111-1111-1111-1111-111111111111', 'ava@poke.community', jsonb_build_object('username', 'ava'), jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')), 'authenticated', 'authenticated', now(), crypt('12345678', gen_salt('bf')), now(), now()),
  ('22222222-2222-2222-2222-222222222222', 'liam@poke.community', jsonb_build_object('username', 'liam'), jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')), 'authenticated', 'authenticated', now(), crypt('12345678', gen_salt('bf')), now(), now()),
  ('33333333-3333-3333-3333-333333333333', 'mia@poke.community', jsonb_build_object('username', 'mia'), jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')), 'authenticated', 'authenticated', now(), crypt('123455678', gen_salt('bf')), now(), now()),
  ('44444444-4444-4444-4444-444444444444', 'noah@poke.community', jsonb_build_object('username', 'noah'), jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')), 'authenticated', 'authenticated', now(), crypt('123455678', gen_salt('bf')), now(), now()),
  ('55555555-5555-5555-5555-555555555555', 'zoe@poke.community', jsonb_build_object('username', 'zoe'), jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')), 'authenticated', 'authenticated', now(), crypt('123455678', gen_salt('bf')), now(), now())
on conflict (id) do nothing;

-- Seed profiles
insert into public.profiles (id, username, email, bio, created_at)
values
  ('11111111-1111-1111-1111-111111111111', 'ava', 'ava@poke.community', 'Growth marketer testing every workflow in poke.', now()),
  ('22222222-2222-2222-2222-222222222222', 'liam', 'liam@poke.community', 'Operations lead building onboarding journeys.', now()),
  ('33333333-3333-3333-3333-333333333333', 'mia', 'mia@poke.community', 'Lifecycle manager experimenting with launch playbooks.', now()),
  ('44444444-4444-4444-4444-444444444444', 'noah', 'noah@poke.community', 'Go-to-market analyst refining conversion funnels.', now()),
  ('55555555-5555-5555-5555-555555555555', 'zoe', 'zoe@poke.community', 'Product marketer validating messaging automations.', now())
on conflict (id) do nothing;

-- Seed automations
insert into public.automations (id, title, summary, description, prompt, setup_details, slug, tags, category, user_id, vote_total, created_at, updated_at)
values
  (
    'aaaa1111-1111-1111-1111-111111111111',
    'Smart Inbox Routing',
    'Route inbound leads based on region, company size, and urgency.',
    '## Highlights\n- Detects company size from CRM\n- Scores urgency using message sentiment\n- Routes to the right owner instantly\n\n### Output\nRecords in CRM are enriched with routing metadata so the inbox stays balanced.\n',
    'Route inbound lead {{company_name}} to {{owner_email}} if score >= 80. Score by combining intent signals from HubSpot and sentiment analysis of the last email. Add a Slack DM to the owner with top 3 context points.',
    '### Pre-reqs\n- Connect the HubSpot and Slack MCPs\n- Enable sentiment analysis MCP\n- Create a shared Slack channel `#lead-routing`\n\n### Notes\nTune the score threshold inline in the prompt to match your territory model.',
    'smart-inbox-routing',
    array['sales', 'routing', 'crm'],
    'automation',
    '11111111-1111-1111-1111-111111111111',
    12,
    timezone('utc', now()) - interval '2 days',
    timezone('utc', now()) - interval '1 days'
  ),
  (
    'bbbb2222-2222-2222-2222-222222222222',
    'Onboarding Pulse Template',
    'Collects customer feedback at key milestones and alerts CSMs.',
    '### Why it matters\nKeep a pulse on onboarding with automated surveys.\n\n### Flow\n1. Trigger surveys after signup, activation, and 14 days\n2. If score < 7, alert the owning CSM in Slack\n3. Aggregate responses weekly into Notion dashboard\n',
    'Send the Onboarding Pulse survey to {{customer_email}} with template `cs-onboarding-pulse`. If the response score is below 7, notify {{csm_email}} in Slack with the open text answer and create a follow-up task in Asana.',
    '### Pre-reqs\n- Enable the SurveyMonkey MCP and connect the pulse template\n- Map `customer_email` and `csm_email` from your CRM sync\n- Connect the Asana MCP with default project `Customer Success > Pulse Follow-up`\n\n### Customisation\nAdjust the scoring threshold in the prompt if your team uses a different health metric.',
    'onboarding-pulse-template',
    array['onboarding', 'cs', 'survey'],
    'template',
    '22222222-2222-2222-2222-222222222222',
    8,
    timezone('utc', now()) - interval '5 days',
    timezone('utc', now()) - interval '2 days'
  ),
  (
    'cccc3333-3333-3333-3333-333333333333',
    'Renewal Risk Radar',
    'Consolidates health signals and flags accounts at risk.',
    'Monitor product usage, support tickets, and NPS to proactively catch churn risk.\n\n- Usage down 20% week-over-week? Tag as watchlist\n- Two high-priority tickets in 48h? Notify success lead\n- Surface signals in Monday dashboard\n',
    'Summarise health for {{account_name}} using product usage trend, open support tickets, and latest NPS comment. If risk is high, post to #renewal-risk with next best action.',
    '### Pre-reqs\n- Connect the product analytics MCP exposing `usage_trend`\n- Connect the Zendesk MCP with ticket priority metadata\n- Sync NPS verbatim comments to poke\n\n### Tips\nAdjust what counts as "high risk" by editing thresholds in the prompt.',
    'renewal-risk-radar',
    array['success', 'renewal', 'alerts'],
    'integration',
    '11111111-1111-1111-1111-111111111111',
    3,
    timezone('utc', now()) - interval '10 days',
    timezone('utc', now()) - interval '9 days'
  )
on conflict (id) do nothing;

-- Seed votes
insert into public.votes (id, automation_id, user_id, value, created_at)
values
  ('dddd4444-4444-4444-4444-444444444444', 'aaaa1111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 1, timezone('utc', now()) - interval '1 days'),
  ('eeee5555-5555-5555-5555-555555555555', 'aaaa1111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 1, timezone('utc', now()) - interval '3 days'),
  ('ffff6666-6666-6666-6666-666666666666', 'bbbb2222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 1, timezone('utc', now()) - interval '2 days'),
  ('aaaa7777-7777-7777-7777-777777777777', 'bbbb2222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 1, timezone('utc', now()) - interval '4 days'),
  ('bbbb8888-8888-8888-8888-888888888888', 'cccc3333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', -1, timezone('utc', now()) - interval '8 days')
on conflict (id) do nothing;

-- Refresh vote totals to match votes table
update public.automations a
set vote_total = coalesce(v.vote_sum, 0)
from (
  select automation_id, sum(value) as vote_sum
  from public.votes
  group by automation_id
) v
where v.automation_id = a.id;

-- Seed subscriptions
insert into public.subscriptions (id, user_id, type, active, created_at)
values
  ('aaaa9999-9999-9999-9999-999999999999', '11111111-1111-1111-1111-111111111111', 'new', true, now()),
  ('bbbb0000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'trending', true, now()),
  ('ccccaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'trending', false, now())
on conflict (id) do nothing;

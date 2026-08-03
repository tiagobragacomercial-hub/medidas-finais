alter table public.floor_plans
  add column if not exists measurements jsonb not null default '[]'::jsonb;

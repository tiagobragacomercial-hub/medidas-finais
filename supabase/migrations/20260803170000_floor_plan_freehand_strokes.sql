alter table public.floor_plans
  add column if not exists strokes jsonb not null default '[]'::jsonb;

comment on column public.floor_plans.strokes is
  'Traços de parede desenhados continuamente à mão livre; podem ser retificados sem substituir o original por medidas inventadas.';

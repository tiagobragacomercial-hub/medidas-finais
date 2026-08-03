alter table public.annotations
  add column if not exists label_point jsonb;

alter table public.floor_plans
  add column if not exists texts jsonb not null default '[]'::jsonb;

comment on column public.annotations.label_point is
  'Posição manual da etiqueta, independente dos pontos reais da medida.';

comment on column public.floor_plans.texts is
  'Textos livres posicionados manualmente na planta; nunca representam medida calculada.';

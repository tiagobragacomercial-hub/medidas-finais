alter table public.annotations
  add column if not exists description_point jsonb;

comment on column public.annotations.description_point is
  'Posição manual e independente da descrição vinculada à medida; não altera os pontos medidos.';

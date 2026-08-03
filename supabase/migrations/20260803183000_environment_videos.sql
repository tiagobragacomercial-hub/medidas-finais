alter table public.photos
  add column if not exists media_type text not null default 'image'
    check (media_type in ('image', 'video')),
  add column if not exists duration_seconds numeric;

comment on column public.photos.media_type is
  'Distingue fotografias editáveis de vídeos anexados ao ambiente.';

comment on column public.photos.duration_seconds is
  'Duração informativa do vídeo; nunca é utilizada para calcular medidas.';

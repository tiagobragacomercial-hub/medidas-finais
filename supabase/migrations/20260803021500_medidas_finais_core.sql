create extension if not exists pgcrypto;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','editor','viewer')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create or replace function public.is_org_member(org_id uuid, allowed_roles text[] default null)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = org_id and m.user_id = auth.uid()
      and (allowed_roles is null or m.role = any(allowed_roles))
  );
$$;

create table public.clients (
  id uuid primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  notes text not null default '',
  status text not null check (status in ('active','archived')),
  version integer not null default 1,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create table public.projects (
  id uuid primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null references public.clients(id),
  name text not null,
  address text not null default '',
  responsible text not null default '',
  unit text not null check (unit in ('mm','cm','m')),
  status text not null check (status in ('draft','published')),
  version integer not null default 1,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create table public.environments (
  id uuid primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  type text not null,
  status text not null check (status in ('active','archived')),
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.photos (
  id uuid primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  environment_id uuid not null references public.environments(id) on delete cascade,
  name text not null,
  object_key text not null unique,
  mime_type text not null,
  byte_size bigint not null check (byte_size >= 0),
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  checksum text not null,
  version integer not null default 1,
  created_at timestamptz not null,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.annotations (
  id uuid primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  photo_id uuid not null references public.photos(id) on delete cascade,
  type text not null check (type in ('linear','l-shape','angle','technical','text','detail')),
  code text not null,
  state text not null check (state in ('protected','editing','hidden')),
  points jsonb not null,
  value text not null default '',
  secondary_value text,
  text_position text not null,
  description text not null default '',
  layer integer not null default 0,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null,
  deleted_at timestamptz
);

create table public.floor_plans (
  id uuid primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  environment_id uuid not null references public.environments(id) on delete cascade,
  points jsonb not null default '[]'::jsonb,
  elements jsonb not null default '[]'::jsonb,
  confirmed boolean not null default false,
  version integer not null default 1,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (environment_id)
);

create table public.sync_receipts (
  operation_id uuid primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity text not null,
  entity_id uuid not null,
  action text not null check (action in ('create','update','delete','upload')),
  checksum text,
  accepted_at timestamptz not null default now()
);

create table public.publications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  version integer not null,
  snapshot jsonb not null,
  pdf_object_key text not null,
  token_hash text not null unique,
  code_hash text not null unique,
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id),
  entity text not null,
  entity_id text not null,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.clients
  add column device_id text not null default 'legacy',
  add column sync_status text not null default 'SINCRONIZADO',
  add column last_sync_at timestamptz;
alter table public.projects
  add column device_id text not null default 'legacy',
  add column sync_status text not null default 'SINCRONIZADO',
  add column last_sync_at timestamptz;
alter table public.environments
  add column device_id text not null default 'legacy',
  add column sync_status text not null default 'SINCRONIZADO',
  add column last_sync_at timestamptz;
alter table public.photos
  add column device_id text not null default 'legacy',
  add column sync_status text not null default 'SINCRONIZADO',
  add column last_sync_at timestamptz;
alter table public.annotations
  add column device_id text not null default 'legacy',
  add column sync_status text not null default 'SINCRONIZADO',
  add column last_sync_at timestamptz;
alter table public.floor_plans
  add column device_id text not null default 'legacy',
  add column sync_status text not null default 'SINCRONIZADO',
  add column last_sync_at timestamptz,
  add column deleted_at timestamptz;

create table public.entity_history (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity text not null,
  entity_id uuid not null,
  version integer not null,
  device_id text not null,
  operation text not null check (operation in ('create','update','delete','restore','conflict_resolution')),
  before_data jsonb,
  after_data jsonb,
  user_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table public.entity_history enable row level security;
create policy entity_history_select on public.entity_history for select
using (public.is_org_member(organization_id));
create policy entity_history_write on public.entity_history for insert
with check (public.is_org_member(organization_id, array['owner','admin','editor']));

alter table public.clients add constraint clients_sync_status_check check (sync_status in ('SALVO_LOCALMENTE','AGUARDANDO_SINCRONIZACAO','SINCRONIZANDO','SINCRONIZADO','ERRO_DE_SINCRONIZACAO','CONFLITO'));
alter table public.projects add constraint projects_sync_status_check check (sync_status in ('SALVO_LOCALMENTE','AGUARDANDO_SINCRONIZACAO','SINCRONIZANDO','SINCRONIZADO','ERRO_DE_SINCRONIZACAO','CONFLITO'));
alter table public.environments add constraint environments_sync_status_check check (sync_status in ('SALVO_LOCALMENTE','AGUARDANDO_SINCRONIZACAO','SINCRONIZANDO','SINCRONIZADO','ERRO_DE_SINCRONIZACAO','CONFLITO'));
alter table public.photos add constraint photos_sync_status_check check (sync_status in ('SALVO_LOCALMENTE','AGUARDANDO_SINCRONIZACAO','SINCRONIZANDO','SINCRONIZADO','ERRO_DE_SINCRONIZACAO','CONFLITO'));
alter table public.annotations add constraint annotations_sync_status_check check (sync_status in ('SALVO_LOCALMENTE','AGUARDANDO_SINCRONIZACAO','SINCRONIZANDO','SINCRONIZADO','ERRO_DE_SINCRONIZACAO','CONFLITO'));
alter table public.floor_plans add constraint floor_plans_sync_status_check check (sync_status in ('SALVO_LOCALMENTE','AGUARDANDO_SINCRONIZACAO','SINCRONIZANDO','SINCRONIZADO','ERRO_DE_SINCRONIZACAO','CONFLITO'));

create index clients_org_idx on public.clients(organization_id, updated_at);
create index projects_org_idx on public.projects(organization_id, updated_at);
create index environments_project_idx on public.environments(project_id, updated_at);
create index photos_environment_idx on public.photos(environment_id, updated_at);
create index annotations_photo_idx on public.annotations(photo_id, updated_at);
create index publications_project_idx on public.publications(project_id, version desc);

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.clients enable row level security;
alter table public.projects enable row level security;
alter table public.environments enable row level security;
alter table public.photos enable row level security;
alter table public.annotations enable row level security;
alter table public.floor_plans enable row level security;
alter table public.sync_receipts enable row level security;
alter table public.publications enable row level security;
alter table public.audit_logs enable row level security;

create policy organizations_select on public.organizations for select using (public.is_org_member(id));
create policy members_select on public.organization_members for select using (public.is_org_member(organization_id));
create policy members_manage on public.organization_members for all using (public.is_org_member(organization_id, array['owner','admin'])) with check (public.is_org_member(organization_id, array['owner','admin']));

do $$
declare table_name text;
begin
  foreach table_name in array array['clients','projects','environments','photos','annotations','floor_plans','sync_receipts','publications','audit_logs']
  loop
    execute format('create policy %I_select on public.%I for select using (public.is_org_member(organization_id))', table_name, table_name);
    execute format('create policy %I_write on public.%I for all using (public.is_org_member(organization_id, array[''owner'',''admin'',''editor''])) with check (public.is_org_member(organization_id, array[''owner'',''admin'',''editor'']))', table_name, table_name);
  end loop;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('project-media', 'project-media', false, 52428800, array['image/jpeg','image/png','image/webp','application/pdf']),
  ('publication-files', 'publication-files', false, 52428800, array['application/pdf'])
on conflict (id) do nothing;

create policy project_media_read on storage.objects for select to authenticated
using (bucket_id = 'project-media' and public.is_org_member((storage.foldername(name))[1]::uuid));
create policy project_media_write on storage.objects for all to authenticated
using (bucket_id = 'project-media' and public.is_org_member((storage.foldername(name))[1]::uuid, array['owner','admin','editor']))
with check (bucket_id = 'project-media' and public.is_org_member((storage.foldername(name))[1]::uuid, array['owner','admin','editor']));
create policy publication_files_team_read on storage.objects for select to authenticated
using (bucket_id = 'publication-files' and public.is_org_member((storage.foldername(name))[1]::uuid));
create policy publication_files_team_write on storage.objects for all to authenticated
using (bucket_id = 'publication-files' and public.is_org_member((storage.foldername(name))[1]::uuid, array['owner','admin','editor']))
with check (bucket_id = 'publication-files' and public.is_org_member((storage.foldername(name))[1]::uuid, array['owner','admin','editor']));

revoke all on public.publications from anon;
revoke all on public.clients, public.projects, public.environments, public.photos, public.annotations, public.floor_plans from anon;

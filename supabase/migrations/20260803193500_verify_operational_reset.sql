do $$
begin
  if exists (
    select 1
    from (
      select 1 from public.clients
      union all select 1 from public.projects
      union all select 1 from public.environments
      union all select 1 from public.photos
      union all select 1 from public.annotations
      union all select 1 from public.floor_plans
      union all select 1 from public.publications
      union all select 1 from public.sync_receipts
      union all select 1 from public.entity_history
      union all select 1 from public.audit_logs
    ) as operational_data
  ) then
    raise exception 'A limpeza operacional não foi concluída';
  end if;

  if not exists (select 1 from public.organizations) then
    raise exception 'A organização proprietária não foi preservada';
  end if;

  if not exists (select 1 from public.organization_members where role = 'owner') then
    raise exception 'A proprietária não foi preservada';
  end if;
end
$$;

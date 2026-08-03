-- Reinício operacional solicitado pela proprietária em 03/08/2026.
-- Preserva auth.users, organizations e organization_members.
begin;

delete from public.sync_receipts;
delete from public.entity_history;
delete from public.audit_logs;
delete from public.publications;
delete from public.annotations;
delete from public.floor_plans;
delete from public.photos;
delete from public.environments;
delete from public.projects;
delete from public.clients;

commit;

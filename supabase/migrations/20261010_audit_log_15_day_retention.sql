-- Retain audit history for 15 days only. This job deletes expired audit rows
-- and does not touch application, event, team, or other content tables.
create extension if not exists pg_cron with schema extensions;

create or replace function public.cleanup_expired_audit_logs()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count bigint;
begin
  delete from public.audit_logs
  where changed_at < now() - interval '15 days';
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

revoke all on function public.cleanup_expired_audit_logs() from public, anon, authenticated;
grant execute on function public.cleanup_expired_audit_logs() to service_role;

-- Replace an existing job with the same name, then run cleanup daily at 03:17 UTC.
select cron.unschedule(jobid)
from cron.job
where jobname = 'cleanup-audit-logs-15-day-retention';

select cron.schedule(
  'cleanup-audit-logs-15-day-retention',
  '17 3 * * *',
  $$select public.cleanup_expired_audit_logs();$$
);

-- Run once at migration time so expired historical rows are not retained until tomorrow.
select public.cleanup_expired_audit_logs();
